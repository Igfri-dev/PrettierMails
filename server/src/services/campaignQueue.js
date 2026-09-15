import { getCampaignById, updateCampaign, createCampaignLog, updateCampaignLog } from '../db/campaignRepository.js';
import { listContacts } from '../db/contactRepository.js';
import { getSmtpAccountById } from '../db/smtpRepository.js';
import { getTransporter, sanitizeHeader, isValidEmail } from '../emailService.js';
import { interpolateTemplate } from '../utils/templateInterpolator.js';
import { injectTrackingPixel, rewriteLinksForTracking } from '../utils/tracking.js';
import { recordAuditEvent } from '../db/auditRepository.js';

// In-memory active campaign controllers to support pausing / cancellation
const activeJobs = new Map();

/**
 * Sleeps for specified milliseconds (with early break check)
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Dispatches a campaign asynchronously
 *
 * @param {string} campaignId
 * @param {string} workspaceId
 * @param {object} [options]
 * @param {string} [options.baseUrl='']
 * @param {number} [options.rateLimitMs=100] Delay between recipient dispatches
 * @param {number} [options.maxRetries=2]
 * @returns {Promise<object>}
 */
export async function dispatchCampaign(campaignId, workspaceId, options = {}) {
  const campaign = await getCampaignById(campaignId, workspaceId);
  if (!campaign) {
    throw new Error('Campaña no encontrada.');
  }

  if (campaign.status === 'sending') {
    throw new Error('La campaña ya se encuentra en proceso de envío.');
  }

  if (campaign.status === 'completed') {
    throw new Error('La campaña ya fue completada.');
  }

  // 1. Resolve contacts
  let contacts = [];
  if (campaign.contact_list_id) {
    contacts = await listContacts(workspaceId, {
      listId: campaign.contact_list_id,
      isSubscribed: true,
    });
  } else {
    // If no specific list, query all subscribed contacts of the workspace
    contacts = await listContacts(workspaceId, { isSubscribed: true });
  }

  const validContacts = (contacts || []).filter((c) => c && c.email && isValidEmail(c.email));

  if (validContacts.length === 0) {
    throw new Error('No hay contactos suscritos para esta campaña.');
  }

  // Deduplicate by email
  const seenEmails = new Set();
  const targetContacts = validContacts.filter((c) => {
    const norm = c.email.trim().toLowerCase();
    if (seenEmails.has(norm)) return false;
    seenEmails.add(norm);
    return true;
  });

  // 2. Resolve SMTP account
  let transporter = options.transporter;
  let isTest = false;
  let fromDefault = 'no-reply@prettiermails.com';
  let smtpAccount = null;

  if (!transporter) {
    if (campaign.smtp_account_id) {
      smtpAccount = await getSmtpAccountById(campaign.smtp_account_id, workspaceId, { includeDecryptedPass: true });
    }

    const tRes = await getTransporter(null, smtpAccount);
    transporter = tRes.transporter;
    isTest = tRes.isTest;
    fromDefault = tRes.fromDefault;
  }

  const cleanFromName = sanitizeHeader(campaign.from_name || (smtpAccount?.from_name || 'PrettierMails'));
  const cleanReplyTo = campaign.reply_to ? sanitizeHeader(campaign.reply_to) : null;
  const senderAddress = cleanFromName
    ? `"${cleanFromName}" <${fromDefault.includes('<') ? fromDefault.split('<')[1].replace('>', '') : fromDefault}>`
    : fromDefault;

  // 3. Mark campaign as sending
  await updateCampaign(campaignId, workspaceId, {
    status: 'sending',
    startedAt: new Date().toISOString(),
    totalRecipients: targetContacts.length,
    sentCount: 0,
    deliveredCount: 0,
    failedCount: 0,
  });

  // 4. Initialize queued logs
  const logRecords = [];
  for (const contact of targetContacts) {
    const log = await createCampaignLog({
      campaignId,
      contactId: contact.id,
      recipientEmail: contact.email,
      status: 'queued',
      maxRetries: options.maxRetries || 2,
    });
    logRecords.push({ contact, logId: log.id });
  }

  // Setup abort controller
  const controller = { aborted: false };
  activeJobs.set(campaignId, controller);

  const baseUrl = options.baseUrl || '';
  const delayMs = Math.max(Number(options.rateLimitMs) || 50, 10);
  const maxRetries = options.maxRetries || 2;

  // Run async queue execution in background
  const processQueuePromise = (async () => {
    let sentCount = 0;
    let deliveredCount = 0;
    let failedCount = 0;

    for (const { contact, logId } of logRecords) {
      if (controller.aborted) {
        await updateCampaign(campaignId, workspaceId, {
          status: 'paused',
          sentCount,
          deliveredCount,
          failedCount,
        });
        activeJobs.delete(campaignId);
        return;
      }

      // Personalize subject & HTML
      const personalizedSubject = interpolateTemplate(campaign.subject, contact, { escapeHtmlValues: false });
      let personalizedHtml = interpolateTemplate(campaign.html_content, contact, { escapeHtmlValues: true });

      // Apply tracking
      personalizedHtml = injectTrackingPixel(personalizedHtml, {
        campaignId,
        contactId: contact.id,
        baseUrl,
      });

      personalizedHtml = rewriteLinksForTracking(personalizedHtml, {
        campaignId,
        contactId: contact.id,
        baseUrl,
      });

      let attempt = 0;
      let sendSuccess = false;
      let lastErrorMessage = null;
      let messageId = null;

      while (attempt <= maxRetries && !sendSuccess) {
        attempt++;
        try {
          const mailOptions = {
            from: senderAddress,
            to: contact.email,
            subject: personalizedSubject,
            html: personalizedHtml,
            ...(cleanReplyTo && isValidEmail(cleanReplyTo) ? { replyTo: cleanReplyTo } : {}),
          };

          const info = await transporter.sendMail(mailOptions);
          messageId = info?.messageId || `msg-${Date.now()}`;
          sendSuccess = true;
        } catch (err) {
          lastErrorMessage = err.message;
          if (attempt <= maxRetries) {
            // Exponential backoff
            await sleep(100 * Math.pow(2, attempt));
          }
        }
      }

      if (sendSuccess) {
        sentCount++;
        deliveredCount++;
        await updateCampaignLog(logId, {
          status: 'sent',
          messageId,
          sentAt: new Date().toISOString(),
          retryCount: attempt - 1,
        });
      } else {
        failedCount++;
        await updateCampaignLog(logId, {
          status: 'failed',
          errorMessage: lastErrorMessage,
          retryCount: attempt - 1,
        });
      }

      // Rate limit pause between emails
      if (delayMs > 0) {
        await sleep(delayMs);
      }
    }

    const finalStatus = deliveredCount > 0 ? 'completed' : 'failed';
    await updateCampaign(campaignId, workspaceId, {
      status: finalStatus,
      completedAt: new Date().toISOString(),
      sentCount,
      deliveredCount,
      failedCount,
    });

    activeJobs.delete(campaignId);

    // Record audit event
    await recordAuditEvent({
      workspaceId,
      action: 'campaign.dispatched',
      resourceType: 'campaign',
      resourceId: campaignId,
      metadata: {
        total: targetContacts.length,
        delivered: deliveredCount,
        failed: failedCount,
        isTest,
      },
    }).catch(() => {});
  })();

  return {
    success: true,
    campaignId,
    status: 'sending',
    totalRecipients: targetContacts.length,
    processQueuePromise,
  };
}

/**
 * Pauses an ongoing campaign dispatch
 */
export async function pauseCampaign(campaignId, workspaceId) {
  const controller = activeJobs.get(campaignId);
  if (controller) {
    controller.aborted = true;
  }

  await updateCampaign(campaignId, workspaceId, { status: 'paused' });
  return { success: true, message: 'Campaña pausada.' };
}

/**
 * Resumes a paused campaign
 */
export async function resumeCampaign(campaignId, workspaceId, options = {}) {
  const campaign = await getCampaignById(campaignId, workspaceId);
  if (!campaign) throw new Error('Campaña no encontrada.');
  if (campaign.status !== 'paused') {
    throw new Error('Solo se pueden reanudar campañas en estado pausado.');
  }

  return dispatchCampaign(campaignId, workspaceId, options);
}

export default {
  dispatchCampaign,
  pauseCampaign,
  resumeCampaign,
};
