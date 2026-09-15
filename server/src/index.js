import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { sendEmail, verifyConnection } from './emailService.js';
import { renderEmailHtml } from './htmlRenderer.js';
import { generateEmailWithAi } from './aiService.js';
import authRouter from './routes/auth.js';
import workspacesRouter from './routes/workspaces.js';
import templatesRouter from './routes/templates.js';
import smtpRouter from './routes/smtp.js';
import auditRouter from './routes/audit.js';
import contactsRouter from './routes/contacts.js';
import campaignsRouter from './routes/campaigns.js';
import trackingRouter from './routes/tracking.js';
import automationsRouter from './routes/automations.js';
import webhooksRouter from './routes/webhooks.js';
import { listContacts } from './db/contactRepository.js';
import { authenticateToken } from './middlewares/auth.js';
import { runMigrations } from './db/migrations.js';
import { runSeeders } from './db/seeders.js';
import { getActiveEngine } from './db/connection.js';
import {
  validateRequestBody,
  GenerateAiEmailSchema,
  SendEmailSchema,
  VerifySmtpSchema,
  RenderHtmlSchema,
} from './schemas/apiSchemas.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Allowed CORS origins
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error('Bloqueado por política CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id'],
  })
);

// Payload limit: 2mb to mitigate memory exhaustion DoS
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Handle invalid JSON syntax in request bodies gracefully as JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'El cuerpo de la solicitud no es un JSON válido.',
    });
  }
  next(err);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dbEngine: getActiveEngine(),
  });
});

// Rate limiter for sending emails
const sendEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Has alcanzado el límite de envíos de correo permitidos por seguridad. Por favor, intenta de nuevo en 15 minutos.',
  },
});

// Rate limiter for SMTP verification
const verifySmtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de verificación SMTP. Por favor, espera unos minutos.',
  },
});

// Rate limiter for AI generation
const aiGenerationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Has alcanzado el límite de generaciones con IA permitidas temporalmente. Por favor, espera unos minutos.',
  },
});

// Mount Routers (Auth, Workspaces, Templates, SMTP Accounts, Audit Logs, Contacts, Campaigns, Tracking)
app.use('/api/auth', authRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/smtp-accounts', smtpRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/track', trackingRouter);
app.use('/api/automations', automationsRouter);
app.use('/api/webhooks', webhooksRouter);

// AI Configuration status (checks if server has active keys configured without exposing them)
app.get('/api/ai-config-status', (req, res) => {
  res.json({
    success: true,
    serverHasGemini: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()),
    serverHasOpenAi: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()),
  });
});

// AI Email Generation endpoint
app.post(
  '/api/generate-ai-email',
  aiGenerationLimiter,
  validateRequestBody(GenerateAiEmailSchema),
  async (req, res) => {
    try {
      const {
        prompt,
        videoLinks,
        imageLinks,
        additionalText,
        apiKey,
        provider,
        model,
      } = req.validatedBody;

      const generatedResult = await generateEmailWithAi({
        prompt,
        videoLinks,
        imageLinks,
        additionalText,
        apiKey,
        provider,
        model,
      });

      res.json({
        success: true,
        ...generatedResult,
      });
    } catch (error) {
      console.error('Error en generación con IA:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error interno al generar el correo.',
      });
    }
  }
);

// Preview/Render HTML with inlined CSS (Juice)
app.post(
  '/api/render-html',
  validateRequestBody(RenderHtmlSchema),
  (req, res) => {
    try {
      const { html, subject, previewText, backgroundColor } = req.validatedBody;
      const fullHtml = renderEmailHtml(html, {
        title: subject,
        previewText,
        backgroundColor,
      });
      res.json({ success: true, html: fullHtml });
    } catch (error) {
      console.error('Error renderizando HTML:', error);
      res.status(500).json({
        success: false,
        error: 'Error al procesar el HTML del correo.',
      });
    }
  }
);

// Verify SMTP connection
app.post(
  '/api/verify-smtp',
  verifySmtpLimiter,
  validateRequestBody(VerifySmtpSchema),
  async (req, res) => {
    try {
      const { host, port, secure, auth } = req.validatedBody;
      const result = await verifyConnection({ host, port, secure, auth });
      res.json(result);
    } catch (error) {
      console.error('Error verificando conexión SMTP:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Send email endpoint (with rate limiter and auth context)
app.post(
  '/api/send-email',
  sendEmailLimiter,
  authenticateToken,
  validateRequestBody(SendEmailSchema),
  async (req, res) => {
    try {
      const {
        recipients,
        contactListId,
        subject,
        html,
        fromName,
        replyTo,
        smtpConfig,
        smtpAccountId,
        previewText,
        backgroundColor,
      } = req.validatedBody;

      // If contactListId was provided, resolve subscribed contacts from that list
      let contacts = null;
      if (contactListId) {
        contacts = await listContacts(req.workspaceId, {
          listId: contactListId,
          isSubscribed: true,
        });

        if (!contacts || contacts.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'La lista de contactos seleccionada no tiene contactos suscritos.',
          });
        }
      }

      // Process & inline HTML using Juice
      const fullHtml = renderEmailHtml(html, {
        title: subject,
        previewText,
        backgroundColor,
      });

      // Send through emailService
      const result = await sendEmail({
        recipients,
        contacts,
        subject,
        html: fullHtml,
        fromName: fromName || 'PrettierMails',
        replyTo,
        smtpConfig,
        smtpAccountId,
        workspaceId: req.workspaceId,
        userId: req.user?.id,
        ipAddress: req.ip,
        sendIndividually: true,
      });

      res.json(result);
    } catch (error) {
      console.error('Error enviando correo:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error interno al enviar el correo.',
      });
    }
  }
);

// 404 handler for API routes (always returns structured JSON instead of default HTML)
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta de API no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler for all unhandled errors (ensures server NEVER emits HTML error pages)
app.use((err, req, res, next) => {
  console.error('Error no controlado en el servidor:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor.',
  });
});

// Initialize DB and start server
async function startServer() {
  try {
    await runMigrations();
    await runSeeders();
    console.log(`📦 Base de datos inicializada (Motor activo: ${getActiveEngine()})`);
  } catch (err) {
    console.error('Aviso inicializando DB:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor PrettierMails corriendo en http://localhost:${PORT}`);
  });
}

startServer();
