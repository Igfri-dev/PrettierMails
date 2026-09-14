import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { sendEmail, verifyConnection } from './emailService.js';
import { renderEmailHtml } from './htmlRenderer.js';
import { generateEmailWithAi } from './aiService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Allowed CORS origins
const allowedOrigins = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error('Bloqueado por política CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Payload limit: Reduced from 15mb to 2mb to mitigate memory exhaustion DoS
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Rate limiter for sending emails (protect against spam and resource exhaustion)
const sendEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 send requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Has alcanzado el límite de envíos de correo permitidos por seguridad. Por favor, intenta de nuevo en 15 minutos.',
  },
});

// Rate limiter for SMTP verification
const verifySmtpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 generations per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Has alcanzado el límite de generaciones con IA permitidas temporalmente. Por favor, espera unos minutos.',
  },
});

// AI Email Generation endpoint
app.post('/api/generate-ai-email', aiGenerationLimiter, async (req, res) => {
  try {
    const {
      prompt,
      videoLinks = [],
      imageLinks = [],
      additionalText = '',
      apiKey = null,
      provider = 'gemini',
      model = 'auto',
    } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ error: 'Debes proporcionar una descripción o instrucción para el correo.' });
    }

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
    console.error('Error generando correo con IA:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al generar el correo con IA.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PrettierMails API (Secured)',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Render / inline HTML email endpoint
app.post('/api/render-html', (req, res) => {
  try {
    const { html, title, previewText, backgroundColor } = req.body;
    if (!html) {
      return res.status(400).json({ error: 'Falta el contenido HTML a procesar.' });
    }

    const compiledHtml = renderEmailHtml(html, {
      title,
      previewText,
      backgroundColor,
    });

    res.json({ compiledHtml });
  } catch (error) {
    console.error('Error rendering HTML:', error);
    res.status(500).json({ error: error.message || 'Error al compilar HTML' });
  }
});

// Verify SMTP connection (with rate limiter)
app.post('/api/verify-smtp', verifySmtpLimiter, async (req, res) => {
  try {
    const { smtpConfig } = req.body;
    if (!smtpConfig || !smtpConfig.host || !smtpConfig.user) {
      return res.status(400).json({ error: 'Configuración SMTP incompleta.' });
    }

    const result = await verifyConnection(smtpConfig);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send email endpoint (with rate limiter)
app.post('/api/send-email', sendEmailLimiter, async (req, res) => {
  try {
    const {
      recipients,
      subject,
      html,
      fromName,
      replyTo,
      smtpConfig,
      previewText,
      backgroundColor,
    } = req.body;

    if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
      return res.status(400).json({ error: 'Debes proporcionar al menos un correo destinatario.' });
    }

    if (!subject || subject.trim() === '') {
      return res.status(400).json({ error: 'El asunto del correo es obligatorio.' });
    }

    if (!html || html.trim() === '') {
      return res.status(400).json({ error: 'El contenido del correo no puede estar vacío.' });
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
      subject,
      html: fullHtml,
      fromName: fromName || 'PrettierMails',
      replyTo,
      smtpConfig,
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
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Servidor PrettierMails seguro corriendo en http://localhost:${PORT}`);
});
