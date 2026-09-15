import crypto from 'crypto';
import { executeQuery } from './connection.js';

/**
 * Creates a new email campaign
 */
export async function createCampaign({
  workspaceId,
  templateId = null,
  smtpAccountId = null,
  contactListId = null,
  name,
  subject,
  fromName = 'PrettierMails',
  replyTo = null,
  previewText = '',
  htmlContent = '',
  status = 'draft',
  scheduledAt = null,
}) {
  if (!workspaceId) throw new Error('workspaceId es obligatorio para crear una campaña.');
  if (!name || !name.trim()) throw new Error('El nombre de la campaña es obligatorio.');
  if (!subject || !subject.trim()) throw new Error('El asunto (subject) de la campaña es obligatorio.');

  const id = `cmp-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const sql = `
    INSERT INTO campaigns (
      id, workspace_id, template_id, smtp_account_id, contact_list_id,
      name, subject, from_name, reply_to, preview_text, html_content,
      status, total_recipients, sent_count, delivered_count, opened_count,
      clicked_count, failed_count, scheduled_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeQuery(sql, [
    id,
    workspaceId,
    templateId || null,
    smtpAccountId || null,
    contactListId || null,
    name.trim(),
    subject.trim(),
    fromName ? fromName.trim() : 'PrettierMails',
    replyTo ? replyTo.trim() : null,
    previewText || '',
    htmlContent || '',
    status || 'draft',
    0, // total_recipients
    0, // sent_count
    0, // delivered_count
    0, // opened_count
    0, // clicked_count
    0, // failed_count
    scheduledAt || null,
    now,
    now,
  ]);

  return getCampaignById(id, workspaceId);
}

/**
 * Retrieves a campaign by ID within a workspace
 */
export async function getCampaignById(id, workspaceId) {
  if (!id || !workspaceId) return null;

  const sql = 'SELECT * FROM campaigns WHERE id = ? AND workspace_id = ?';
  const res = await executeQuery(sql, [id, workspaceId]);

  if (!res.rows || res.rows.length === 0) {
    return null;
  }

  return res.rows[0];
}

/**
 * Lists campaigns for a workspace with optional status filter and pagination
 */
export async function listCampaigns(workspaceId, options = {}) {
  if (!workspaceId) return [];

  const { status = null, limit = 50, offset = 0 } = options;

  let sql = 'SELECT * FROM campaigns WHERE workspace_id = ?';
  const params = [workspaceId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  const res = await executeQuery(sql, params);
  const rows = res.rows || [];

  const parsedLimit = Math.min(Number(limit) || 50, 100);
  const parsedOffset = Number(offset) || 0;
  return rows.slice(parsedOffset, parsedOffset + parsedLimit);
}

/**
 * Updates an existing campaign
 */
export async function updateCampaign(id, workspaceId, updates = {}) {
  const existing = await getCampaignById(id, workspaceId);
  if (!existing) {
    throw new Error('Campaña no encontrada en este espacio de trabajo.');
  }

  const name = updates.name !== undefined ? String(updates.name).trim() : existing.name;
  const subject = updates.subject !== undefined ? String(updates.subject).trim() : existing.subject;
  const templateId = updates.templateId !== undefined ? updates.templateId : existing.template_id;
  const smtpAccountId = updates.smtpAccountId !== undefined ? updates.smtpAccountId : existing.smtp_account_id;
  const contactListId = updates.contactListId !== undefined ? updates.contactListId : existing.contact_list_id;
  const fromName = updates.fromName !== undefined ? updates.fromName : existing.from_name;
  const replyTo = updates.replyTo !== undefined ? updates.replyTo : existing.reply_to;
  const previewText = updates.previewText !== undefined ? updates.previewText : existing.preview_text;
  const htmlContent = updates.htmlContent !== undefined ? updates.htmlContent : existing.html_content;
  const status = updates.status !== undefined ? updates.status : existing.status;
  const totalRecipients = updates.totalRecipients !== undefined ? Number(updates.totalRecipients) : existing.total_recipients;
  const sentCount = updates.sentCount !== undefined ? Number(updates.sentCount) : existing.sent_count;
  const deliveredCount = updates.deliveredCount !== undefined ? Number(updates.deliveredCount) : existing.delivered_count;
  const openedCount = updates.openedCount !== undefined ? Number(updates.openedCount) : existing.opened_count;
  const clickedCount = updates.clickedCount !== undefined ? Number(updates.clickedCount) : existing.clicked_count;
  const failedCount = updates.failedCount !== undefined ? Number(updates.failedCount) : existing.failed_count;
  const scheduledAt = updates.scheduledAt !== undefined ? updates.scheduledAt : existing.scheduled_at;
  const startedAt = updates.startedAt !== undefined ? updates.startedAt : existing.started_at;
  const completedAt = updates.completedAt !== undefined ? updates.completedAt : existing.completed_at;

  const sql = `
    UPDATE campaigns SET
      name = ?,
      subject = ?,
      template_id = ?,
      smtp_account_id = ?,
      contact_list_id = ?,
      from_name = ?,
      reply_to = ?,
      preview_text = ?,
      html_content = ?,
      status = ?,
      total_recipients = ?,
      sent_count = ?,
      delivered_count = ?,
      opened_count = ?,
      clicked_count = ?,
      failed_count = ?,
      scheduled_at = ?,
      started_at = ?,
      completed_at = ?
    WHERE id = ? AND workspace_id = ?
  `;

  await executeQuery(sql, [
    name,
    subject,
    templateId,
    smtpAccountId,
    contactListId,
    fromName,
    replyTo,
    previewText,
    htmlContent,
    status,
    totalRecipients,
    sentCount,
    deliveredCount,
    openedCount,
    clickedCount,
    failedCount,
    scheduledAt,
    startedAt,
    completedAt,
    id,
    workspaceId,
  ]);

  return getCampaignById(id, workspaceId);
}

/**
 * Deletes a campaign and cascades its logs and analytic events
 */
export async function deleteCampaign(id, workspaceId) {
  await executeQuery('DELETE FROM campaign_events WHERE campaign_id = ?', [id]);
  await executeQuery('DELETE FROM campaign_logs WHERE campaign_id = ?', [id]);
  const res = await executeQuery('DELETE FROM campaigns WHERE id = ? AND workspace_id = ?', [id, workspaceId]);
  return { success: true, deletedCount: res.rowCount || 0 };
}

/**
 * Creates a log entry for a recipient delivery attempt
 */
export async function createCampaignLog({
  campaignId,
  contactId = null,
  recipientEmail,
  status = 'queued',
  retryCount = 0,
  maxRetries = 3,
  errorMessage = null,
  messageId = null,
}) {
  const id = `log-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const sql = `
    INSERT INTO campaign_logs (
      id, campaign_id, contact_id, recipient_email, status,
      retry_count, max_retries, error_message, message_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await executeQuery(sql, [
    id,
    campaignId,
    contactId,
    recipientEmail.trim().toLowerCase(),
    status,
    retryCount,
    maxRetries,
    errorMessage,
    messageId,
    now,
  ]);

  const res = await executeQuery('SELECT * FROM campaign_logs WHERE id = ?', [id]);
  return res.rows?.[0] || null;
}

/**
 * Updates a delivery log entry
 */
export async function updateCampaignLog(id, updates = {}) {
  const res = await executeQuery('SELECT * FROM campaign_logs WHERE id = ?', [id]);
  const existing = res.rows?.[0];
  if (!existing) return null;

  const status = updates.status !== undefined ? updates.status : existing.status;
  const retryCount = updates.retryCount !== undefined ? Number(updates.retryCount) : existing.retry_count;
  const errorMessage = updates.errorMessage !== undefined ? updates.errorMessage : existing.error_message;
  const messageId = updates.messageId !== undefined ? updates.messageId : existing.message_id;
  const sentAt = updates.sentAt !== undefined ? updates.sentAt : existing.sent_at;
  const openedAt = updates.openedAt !== undefined ? updates.openedAt : existing.opened_at;
  const clickedAt = updates.clickedAt !== undefined ? updates.clickedAt : existing.clicked_at;

  const sql = `
    UPDATE campaign_logs SET
      status = ?,
      retry_count = ?,
      error_message = ?,
      message_id = ?,
      sent_at = ?,
      opened_at = ?,
      clicked_at = ?
    WHERE id = ?
  `;

  await executeQuery(sql, [
    status,
    retryCount,
    errorMessage,
    messageId,
    sentAt,
    openedAt,
    clickedAt,
    id,
  ]);

  const updatedRes = await executeQuery('SELECT * FROM campaign_logs WHERE id = ?', [id]);
  return updatedRes.rows?.[0] || null;
}

/**
 * Lists delivery logs for a given campaign
 */
export async function getCampaignLogs(campaignId, options = {}) {
  if (!campaignId) return [];

  const { status = null, limit = 100, offset = 0 } = options;

  let sql = 'SELECT * FROM campaign_logs WHERE campaign_id = ?';
  const params = [campaignId];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  const res = await executeQuery(sql, params);
  const rows = res.rows || [];

  const parsedLimit = Math.min(Number(limit) || 100, 500);
  const parsedOffset = Number(offset) || 0;
  return rows.slice(parsedOffset, parsedOffset + parsedLimit);
}

/**
 * Records an email open event and updates analytics
 */
export async function recordCampaignOpen(campaignId, contactId, { ipAddress = null, userAgent = null } = {}) {
  const eventId = `evt-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  // 1. Insert open event
  const sqlEvent = `
    INSERT INTO campaign_events (
      id, campaign_id, contact_id, event_type, ip_address, user_agent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  await executeQuery(sqlEvent, [eventId, campaignId, contactId, 'open', ipAddress, userAgent, now]);

  // 2. Mark campaign_log if contactId is known and not already opened
  if (contactId && contactId !== 'anon') {
    const logRes = await executeQuery(
      'SELECT id, opened_at FROM campaign_logs WHERE campaign_id = ? AND contact_id = ?',
      [campaignId, contactId]
    );
    if (logRes.rows && logRes.rows.length > 0) {
      const log = logRes.rows[0];
      if (!log.opened_at) {
        await executeQuery(
          'UPDATE campaign_logs SET opened_at = ?, status = ? WHERE id = ?',
          [now, 'opened', log.id]
        );
      }
    }
  }

  // 3. Increment opened_count on campaign
  const cmpRes = await executeQuery('SELECT id, workspace_id, opened_count FROM campaigns WHERE id = ?', [campaignId]);
  if (cmpRes.rows && cmpRes.rows.length > 0) {
    const cmp = cmpRes.rows[0];
    const newCount = (cmp.opened_count || 0) + 1;
    await executeQuery('UPDATE campaigns SET opened_count = ? WHERE id = ?', [newCount, campaignId]);
  }

  return { success: true, eventId };
}

/**
 * Records a link click event and updates analytics
 */
export async function recordCampaignClick(campaignId, contactId, targetUrl, { ipAddress = null, userAgent = null } = {}) {
  const eventId = `evt-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  // 1. Insert click event
  const sqlEvent = `
    INSERT INTO campaign_events (
      id, campaign_id, contact_id, event_type, target_url, ip_address, user_agent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  await executeQuery(sqlEvent, [eventId, campaignId, contactId, 'click', targetUrl, ipAddress, userAgent, now]);

  // 2. Update campaign_log if contactId is known
  if (contactId && contactId !== 'anon') {
    const logRes = await executeQuery(
      'SELECT id, clicked_at FROM campaign_logs WHERE campaign_id = ? AND contact_id = ?',
      [campaignId, contactId]
    );
    if (logRes.rows && logRes.rows.length > 0) {
      const log = logRes.rows[0];
      if (!log.clicked_at) {
        await executeQuery(
          'UPDATE campaign_logs SET clicked_at = ?, status = ? WHERE id = ?',
          [now, 'clicked', log.id]
        );
      }
    }
  }

  // 3. Increment clicked_count on campaign
  const cmpRes = await executeQuery('SELECT id, clicked_count FROM campaigns WHERE id = ?', [campaignId]);
  if (cmpRes.rows && cmpRes.rows.length > 0) {
    const cmp = cmpRes.rows[0];
    const newCount = (cmp.clicked_count || 0) + 1;
    await executeQuery('UPDATE campaigns SET clicked_count = ? WHERE id = ?', [newCount, campaignId]);
  }

  return { success: true, eventId };
}

/**
 * Calculates high-level metrics and aggregated performance statistics for a campaign
 */
export async function getCampaignStats(campaignId, workspaceId) {
  const campaign = await getCampaignById(campaignId, workspaceId);
  if (!campaign) {
    throw new Error('Campaña no encontrada.');
  }

  // Fetch all delivery logs
  const logsRes = await executeQuery('SELECT * FROM campaign_logs WHERE campaign_id = ?', [campaignId]);
  const logs = logsRes.rows || [];

  // Fetch all events
  const eventsRes = await executeQuery('SELECT * FROM campaign_events WHERE campaign_id = ?', [campaignId]);
  const events = eventsRes.rows || [];

  const total = logs.length || campaign.total_recipients || 0;
  const sent = logs.filter((l) => ['sent', 'delivered', 'opened', 'clicked'].includes(l.status)).length;
  const delivered = logs.filter((l) => ['delivered', 'opened', 'clicked', 'sent'].includes(l.status)).length;
  const opened = logs.filter((l) => Boolean(l.opened_at) || l.status === 'opened' || l.status === 'clicked').length || campaign.opened_count || 0;
  const clicked = logs.filter((l) => Boolean(l.clicked_at) || l.status === 'clicked').length || campaign.clicked_count || 0;
  const failed = logs.filter((l) => l.status === 'failed' || l.status === 'bounced').length;

  const openRate = delivered > 0 ? Number(((opened / delivered) * 100).toFixed(1)) : 0;
  const clickRate = delivered > 0 ? Number(((clicked / delivered) * 100).toFixed(1)) : 0;
  const clickToOpenRate = opened > 0 ? Number(((clicked / opened) * 100).toFixed(1)) : 0;

  // Aggregate top clicked URLs
  const urlMap = {};
  events
    .filter((e) => e.event_type === 'click' && e.target_url)
    .forEach((e) => {
      urlMap[e.target_url] = (urlMap[e.target_url] || 0) + 1;
    });

  const topUrls = Object.entries(urlMap)
    .map(([url, count]) => ({ url, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    campaignId,
    name: campaign.name,
    subject: campaign.subject,
    status: campaign.status,
    createdAt: campaign.created_at,
    completedAt: campaign.completed_at,
    metrics: {
      total,
      sent,
      delivered,
      opened,
      clicked,
      failed,
      openRate,
      clickRate,
      clickToOpenRate,
    },
    topUrls,
    recentLogs: logs.slice(0, 20),
  };
}

export default {
  createCampaign,
  getCampaignById,
  listCampaigns,
  updateCampaign,
  deleteCampaign,
  createCampaignLog,
  updateCampaignLog,
  getCampaignLogs,
  recordCampaignOpen,
  recordCampaignClick,
  getCampaignStats,
};
