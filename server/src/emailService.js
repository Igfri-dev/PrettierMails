import nodemailer from 'nodemailer';
import { validateSmtpHost, validateSmtpHostWithDns } from './utils/ssrfProtection.js';
import { getSmtpAccountById } from './db/smtpRepository.js';
import { recordAuditEvent } from './db/auditRepository.js';
import { interpolateTemplate } from './utils/templateInterpolator.js';

// Re-export SSRF validation functions for backward compatibility
export { validateSmtpHost, validateSmtpHostWithDns };

/**
 * Strips carriage returns, line feeds and control characters to prevent header injection (CRLF)
 */
export function sanitizeHeader(value) {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/[\r\n\x00-\x1f\x7f]/g, ' ').trim();
}

/**
 * Validates basic email address syntax
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email.trim());
}

/**
 * Normalizes recipients list from array or comma/newline-separated string
 */
export function normalizeRecipients(recipients) {
  let list = [];
  if (Array.isArray(recipients)) {
    list = recipients.map((r) => String(r).trim()).filter(isValidEmail);
  } else if (typeof recipients === 'string') {
    list = recipients
      .split(/[\n,;]+/)
      .map((r) => r.trim())
      .filter(isValidEmail);
  }

  // Deduplicate
  const unique = Array.from(new Set(list));

  // Cap at 50 recipients per request to prevent resource exhaustion / mass spam
  if (unique.length > 50) {
    throw new Error('Límite de seguridad: máximo 50 destinatarios por envío.');
  }

  return unique;
}

/**
 * Creates a Nodemailer transporter based on custom credentials, saved workspace SMTP account, env vars, or test Ethereal account
 */
export async function getTransporter(customConfig = null, smtpAccount = null) {
  // 1. If a saved database SMTP account is provided
  if (smtpAccount) {
    const validatedHost = validateSmtpHost(smtpAccount.host);
    const portNum = Number(smtpAccount.port) || 587;
    const isSecure = smtpAccount.secure ?? (portNum === 465);

    if (portNum < 1 || portNum > 65535) {
      throw new Error('Puerto SMTP inválido (debe estar entre 1 y 65535).');
    }

    const authConfig = smtpAccount.auth_user && smtpAccount.password ? {
      user: sanitizeHeader(smtpAccount.auth_user),
      pass: smtpAccount.password,
    } : undefined;

    return {
      transporter: nodemailer.createTransport({
        host: validatedHost,
        port: portNum,
        secure: isSecure,
        ...(authConfig ? { auth: authConfig } : {}),
        tls: {
          minVersion: 'TLSv1.2',
        },
      }),
      isTest: false,
      fromDefault: smtpAccount.from_email
        ? (smtpAccount.from_name
          ? `"${sanitizeHeader(smtpAccount.from_name)}" <${sanitizeHeader(smtpAccount.from_email)}>`
          : sanitizeHeader(smtpAccount.from_email))
        : (smtpAccount.auth_user ? sanitizeHeader(smtpAccount.auth_user) : 'no-reply@prettiermails.com'),
    };
  }

  // 2. If ad-hoc custom credentials are provided
  if (customConfig && customConfig.host && customConfig.user && customConfig.pass) {
    const validatedHost = validateSmtpHost(customConfig.host);
    const portNum = Number(customConfig.port) || 587;

    if (portNum < 1 || portNum > 65535) {
      throw new Error('Puerto SMTP inválido (debe estar entre 1 y 65535).');
    }

    return {
      transporter: nodemailer.createTransport({
        host: validatedHost,
        port: portNum,
        secure: customConfig.secure ?? (portNum === 465),
        auth: {
          user: sanitizeHeader(customConfig.user),
          pass: customConfig.pass,
        },
        tls: {
          minVersion: 'TLSv1.2',
        },
      }),
      isTest: false,
      fromDefault: sanitizeHeader(customConfig.from || customConfig.user),
    };
  }

  // 3. Check if environment variables are set
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const validatedHost = validateSmtpHost(process.env.SMTP_HOST);
    const portNum = Number(process.env.SMTP_PORT) || 587;

    return {
      transporter: nodemailer.createTransport({
        host: validatedHost,
        port: portNum,
        secure: process.env.SMTP_SECURE === 'true' || portNum === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          minVersion: 'TLSv1.2',
        },
      }),
      isTest: false,
      fromDefault: process.env.SMTP_FROM || process.env.SMTP_USER,
    };
  }

  // 4. Fallback: Create ephemeral Ethereal test account (or fast mock in test env)
  if (process.env.NODE_ENV === 'test' && !process.env.USE_REAL_ETHEREAL) {
    return {
      transporter: {
        verify: async () => true,
        sendMail: async (mailOptions) => ({
          messageId: `<mock-${Date.now()}@prettiermails.local>`,
          response: '250 OK: Mock queued',
          envelope: { from: mailOptions.from, to: mailOptions.to },
        }),
      },
      isTest: true,
      fromDefault: '"PrettierMails Test" <test@prettiermails.local>',
      testAccount: { user: 'test@prettiermails.local' },
    };
  }

  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return {
    transporter,
    isTest: true,
    fromDefault: `"PrettierMails Test" <${testAccount.user}>`,
    testAccount,
  };
}

/**
 * Verify custom SMTP credentials or saved account
 */
export async function verifyConnection(config, smtpAccount = null) {
  try {
    const { transporter } = await getTransporter(config, smtpAccount);
    await transporter.verify();
    return { success: true, message: 'Conexión SMTP exitosa.' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Send an email to one or multiple recipients
 */
export async function sendEmail({
  recipients,
  contacts = null,
  subject,
  html,
  fromName,
  replyTo,
  smtpConfig = null,
  smtpAccountId = null,
  workspaceId = null,
  userId = null,
  ipAddress = null,
  sendIndividually = true,
}) {
  let contactList = [];
  if (Array.isArray(contacts) && contacts.length > 0) {
    contactList = contacts
      .filter((c) => c && c.email && isValidEmail(c.email))
      .map((c) => ({
        ...c,
        email: c.email.trim().toLowerCase(),
      }));
  } else if (recipients) {
    const validRecipients = normalizeRecipients(recipients);
    contactList = validRecipients.map((r) => ({ email: r }));
  }

  if (contactList.length === 0) {
    throw new Error('No se especificaron destinatarios válidos.');
  }

  // Deduplicate by email
  const seen = new Set();
  contactList = contactList.filter((c) => {
    if (seen.has(c.email)) return false;
    seen.add(c.email);
    return true;
  });

  if (contactList.length > 50) {
    throw new Error('Límite de seguridad: máximo 50 destinatarios por envío.');
  }

  const cleanSubject = sanitizeHeader(subject);
  if (!cleanSubject) {
    throw new Error('El asunto (subject) no puede estar vacío.');
  }

  if (!html || html.trim() === '') {
    throw new Error('El contenido del correo (html) no puede estar vacío.');
  }

  let resolvedAccount = null;
  if (smtpAccountId && workspaceId) {
    resolvedAccount = await getSmtpAccountById(smtpAccountId, workspaceId, { includeDecryptedPass: true });
    if (!resolvedAccount) {
      throw new Error('La cuenta SMTP seleccionada no existe en este espacio de trabajo.');
    }
  }

  const { transporter, isTest, fromDefault } = await getTransporter(smtpConfig, resolvedAccount);

  const cleanFromName = sanitizeHeader(fromName || (resolvedAccount?.from_name || ''));
  const cleanReplyTo = replyTo ? sanitizeHeader(replyTo) : null;

  const senderAddress = cleanFromName
    ? `"${cleanFromName}" <${fromDefault.includes('<') ? fromDefault.split('<')[1].replace('>', '') : fromDefault}>`
    : fromDefault;

  let finalResult = null;

  // Individual sends to keep recipients private, track per-email status, and apply personalization
  if (sendIndividually) {
    const results = [];
    for (const contact of contactList) {
      const recipient = contact.email;
      const personalizedSubject = interpolateTemplate(cleanSubject, contact, { escapeHtmlValues: false });
      const personalizedHtml = interpolateTemplate(html, contact, { escapeHtmlValues: true });

      try {
        const mailOptions = {
          from: senderAddress,
          to: recipient,
          subject: personalizedSubject,
          html: personalizedHtml,
          ...(cleanReplyTo && isValidEmail(cleanReplyTo) ? { replyTo: cleanReplyTo } : {}),
        };

        const info = await transporter.sendMail(mailOptions);
        const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) : null;

        results.push({
          recipient,
          status: 'sent',
          messageId: info.messageId,
          previewUrl,
        });
      } catch (err) {
        results.push({
          recipient,
          status: 'failed',
          error: err.message,
        });
      }
    }

    const successful = results.filter((r) => r.status === 'sent');
    const failed = results.filter((r) => r.status === 'failed');

    finalResult = {
      success: successful.length > 0,
      total: contactList.length,
      sentCount: successful.length,
      failedCount: failed.length,
      isTest,
      results,
      samplePreviewUrl: successful.find((r) => r.previewUrl)?.previewUrl || null,
    };
  } else {
    // Send as batch
    const allEmails = contactList.map((c) => c.email);
    const mailOptions = {
      from: senderAddress,
      to: allEmails.join(', '),
      subject: cleanSubject,
      html,
      ...(cleanReplyTo && isValidEmail(cleanReplyTo) ? { replyTo: cleanReplyTo } : {}),
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) : null;

    finalResult = {
      success: true,
      total: contactList.length,
      sentCount: contactList.length,
      failedCount: 0,
      isTest,
      messageId: info.messageId,
      samplePreviewUrl: previewUrl,
    };
  }

  // Audit logging if workspaceId is present
  try {
    const auditWorkspace = workspaceId || 'ws-default';
    await recordAuditEvent({
      workspaceId: auditWorkspace,
      userId,
      action: finalResult.success ? 'email.sent' : 'email.failed',
      resourceType: 'email',
      resourceId: finalResult.results?.[0]?.messageId || finalResult.messageId || null,
      metadata: {
        subject: cleanSubject,
        totalRecipients: contactList.length,
        sentCount: finalResult.sentCount,
        failedCount: finalResult.failedCount,
        isTest,
        smtpAccountId: smtpAccountId || null,
      },
      ipAddress,
    });
  } catch (auditErr) {
    console.warn('Aviso: no se pudo registrar log de auditoría para el envío:', auditErr.message);
  }

  return finalResult;
}

export default {
  sanitizeHeader,
  validateSmtpHost,
  validateSmtpHostWithDns,
  isValidEmail,
  normalizeRecipients,
  getTransporter,
  verifyConnection,
  sendEmail,
};
