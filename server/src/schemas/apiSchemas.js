import { z } from 'zod';

const COLOR_REGEX = /^(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)|transparent|inherit|[a-zA-Z]+)$/;

export const ColorSchema = z.string().trim().refine(
  (val) => !val || COLOR_REGEX.test(val),
  { message: 'Color no válido' }
);

export const SafeUrlSchema = z.string().trim().refine(
  (val) => !val || /^(https?:|mailto:|tel:|\/|#)/i.test(val),
  { message: 'URL insegura o protocolo no permitido' }
);

export const SmtpConfigSchema = z.object({
  host: z.string().min(1, 'Host SMTP requerido'),
  port: z.union([z.string(), z.number()]).default('587'),
  user: z.string().min(1, 'Usuario SMTP requerido'),
  pass: z.string().default(''),
  secure: z.boolean().optional().default(false),
}).passthrough();

export const GenerateAiEmailSchema = z.object({
  prompt: z.string().min(1, 'La instrucción para generar el correo es obligatoria').max(5000),
  videoLinks: z.array(SafeUrlSchema).optional().default([]),
  imageLinks: z.array(SafeUrlSchema).optional().default([]),
  additionalText: z.string().max(10000).optional().default(''),
  apiKey: z.string().max(300).optional().nullable(),
  provider: z.enum(['gemini', 'openai']).default('gemini'),
  model: z.string().max(100).optional().default('auto'),
});

export const CreateSmtpAccountSchema = z.object({
  label: z.string().min(1, 'El nombre o etiqueta de la cuenta es obligatorio').max(100),
  host: z.string().min(1, 'El host SMTP es obligatorio').max(255),
  port: z.union([z.number(), z.string()]).default(587),
  secure: z.boolean().optional().default(false),
  authUser: z.string().max(255).optional().default(''),
  password: z.string().max(500).optional().default(''),
  fromName: z.string().max(100).optional().default(''),
  fromEmail: z.union([z.string().email('Correo de remitente no válido'), z.literal('')]).optional().default(''),
  isDefault: z.boolean().optional().default(false),
  dailyLimit: z.number().int().min(1).max(100000).optional().default(500),
});

export const UpdateSmtpAccountSchema = z.object({
  label: z.string().min(1).max(100).optional(),
  host: z.string().min(1).max(255).optional(),
  port: z.union([z.number(), z.string()]).optional(),
  secure: z.boolean().optional(),
  authUser: z.string().max(255).optional(),
  password: z.string().max(500).optional(),
  fromName: z.string().max(100).optional(),
  fromEmail: z.union([z.string().email('Correo de remitente no válido'), z.literal('')]).optional(),
  isDefault: z.boolean().optional(),
  dailyLimit: z.number().int().min(1).max(100000).optional(),
});

export const SendEmailSchema = z
  .object({
    recipients: z.array(z.string().email('Dirección de correo no válida')).max(500).optional().default([]),
    contactListId: z.string().max(64).optional().nullable(),
    subject: z.string().min(1, 'El asunto es obligatorio').max(300),
    html: z.string().min(1, 'El contenido HTML es obligatorio').max(2000000),
    fromName: z.string().max(100).optional().default('PrettierMails'),
    replyTo: z.union([z.string().email(), z.literal('')]).optional(),
    smtpConfig: SmtpConfigSchema.optional().nullable(),
    smtpAccountId: z.string().max(64).optional().nullable(),
    previewText: z.string().max(300).optional().default(''),
    backgroundColor: ColorSchema.optional().default('#f1f5f9'),
  })
  .refine(
    (data) => (data.recipients && data.recipients.length > 0) || data.contactListId,
    {
      message: 'Debes proporcionar al menos un destinatario o seleccionar una lista de contactos.',
      path: ['recipients'],
    }
  );

export const VerifySmtpSchema = z.object({
  smtpConfig: SmtpConfigSchema,
});

export const RenderHtmlSchema = z.object({
  html: z.string().min(1, 'Falta el contenido HTML a procesar').max(2000000),
  title: z.string().max(300).optional().default('PrettierMails'),
  previewText: z.string().max(300).optional().default(''),
  backgroundColor: ColorSchema.optional().default('#f1f5f9'),
});

/**
 * Express middleware helper for schema validation
 */
export function validateRequestBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errorMessages = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return res.status(400).json({
        success: false,
        error: errorMessages,
        details: result.error.flatten(),
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
