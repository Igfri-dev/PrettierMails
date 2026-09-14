import nodemailer from 'nodemailer';

/**
 * Strips carriage returns, line feeds and control characters to prevent header injection (CRLF)
 */
export function sanitizeHeader(value) {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/[\r\n\x00-\x1f\x7f]/g, ' ').trim();
}

/**
 * Validates that an SMTP host is not targeting private, localhost, or link-local/cloud metadata networks (SSRF defense)
 */
export function validateSmtpHost(host) {
  if (!host || typeof host !== 'string') {
    throw new Error('Host SMTP inválido.');
  }

  const trimmed = host.trim().toLowerCase();

  // Prohibit loopback, internal names, and metadata IP
  const blockedPatterns = [
    /^localhost$/,
    /^127\./,
    /^0\./,
    /^::1$/,
    /^0:0:0:0:0:0:0:1$/,
    /^169\.254\./, // AWS / GCP / Azure Instance Metadata Service
    /^10\./, // RFC 1918 Class A
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // RFC 1918 Class B
    /^192\.168\./, // RFC 1918 Class C
    /^fc00:/, // IPv6 Unique Local
    /^fe80:/, // IPv6 Link-Local
    /\.local$/,
    /\.internal$/,
    /\.intranet$/,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(trimmed)) {
      throw new Error('Por razones de seguridad, no se permiten conexiones SMTP a hosts locales o de red privada (SSRF).');
    }
  }

  // Validate hostname or domain structure
  const hostnameRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  const ipRegex = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/;

  if (!hostnameRegex.test(trimmed) && !ipRegex.test(trimmed)) {
    throw new Error('El nombre de host SMTP debe ser un dominio válido (ej. smtp.gmail.com).');
  }

  return trimmed;
}

/**
 * Validates basic email address syntax
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // Maximum length check (RFC 5321 specifies 254 octets)
  if (email.length > 254) return false;
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(email.trim());
}

/**
 * Normalizes recipients list from array or comma/newline-separated string
 */
export function normalizeRecipients(recipients) {
  let list = [];
  if (Array.isArray(recipients)) {
    list = recipients.map(r => String(r).trim()).filter(isValidEmail);
  } else if (typeof recipients === 'string') {
    list = recipients
      .split(/[\n,;]+/)
      .map(r => r.trim())
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
 * Creates a Nodemailer transporter based on custom credentials, env vars, or test Ethereal account
 */
export async function getTransporter(customConfig = null) {
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

  // Check if environment variables are set
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

  // Fallback: Create ephemeral Ethereal test account
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
 * Verify custom SMTP credentials
 */
export async function verifyConnection(config) {
  try {
    const { transporter } = await getTransporter(config);
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
  subject,
  html,
  fromName,
  replyTo,
  smtpConfig = null,
  sendIndividually = true,
}) {
  const validRecipients = normalizeRecipients(recipients);

  if (validRecipients.length === 0) {
    throw new Error('No se especificaron correos destinatarios válidos.');
  }

  const cleanSubject = sanitizeHeader(subject);
  if (!cleanSubject) {
    throw new Error('El asunto (subject) no puede estar vacío.');
  }

  if (!html || html.trim() === '') {
    throw new Error('El contenido del correo (html) no puede estar vacío.');
  }

  const { transporter, isTest, fromDefault } = await getTransporter(smtpConfig);

  const cleanFromName = sanitizeHeader(fromName);
  const cleanReplyTo = replyTo ? sanitizeHeader(replyTo) : null;

  const senderAddress = cleanFromName 
    ? `"${cleanFromName}" <${fromDefault.includes('<') ? fromDefault.split('<')[1].replace('>', '') : fromDefault}>`
    : fromDefault;

  // Individual sends to keep recipients private and track per-email status
  if (sendIndividually) {
    const results = [];
    for (const recipient of validRecipients) {
      try {
        const mailOptions = {
          from: senderAddress,
          to: recipient,
          subject: cleanSubject,
          html,
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

    const successful = results.filter(r => r.status === 'sent');
    const failed = results.filter(r => r.status === 'failed');

    return {
      success: successful.length > 0,
      total: validRecipients.length,
      sentCount: successful.length,
      failedCount: failed.length,
      isTest,
      results,
      samplePreviewUrl: successful.find(r => r.previewUrl)?.previewUrl || null,
    };
  } else {
    // Send as batch
    const mailOptions = {
      from: senderAddress,
      to: validRecipients.join(', '),
      subject: cleanSubject,
      html,
      ...(cleanReplyTo && isValidEmail(cleanReplyTo) ? { replyTo: cleanReplyTo } : {}),
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) : null;

    return {
      success: true,
      total: validRecipients.length,
      sentCount: validRecipients.length,
      failedCount: 0,
      isTest,
      messageId: info.messageId,
      samplePreviewUrl: previewUrl,
    };
  }
}
