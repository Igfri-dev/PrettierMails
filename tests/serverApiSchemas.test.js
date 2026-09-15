import { describe, it, expect } from 'vitest';
import {
  GenerateAiEmailSchema,
  SendEmailSchema,
  VerifySmtpSchema,
  RenderHtmlSchema,
  CreateSmtpAccountSchema,
  UpdateSmtpAccountSchema,
} from '../server/src/schemas/apiSchemas.js';

describe('Server API Zod Schemas', () => {
  describe('GenerateAiEmailSchema', () => {
    it('accepts valid AI prompt requests', () => {
      const valid = {
        prompt: 'Diseña un correo de bienvenida',
        videoLinks: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
        imageLinks: ['https://example.com/logo.png'],
        provider: 'gemini',
      };
      const res = GenerateAiEmailSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('rejects empty prompts', () => {
      const res = GenerateAiEmailSchema.safeParse({ prompt: '' });
      expect(res.success).toBe(false);
    });
  });

  describe('SendEmailSchema', () => {
    it('accepts valid email dispatch requests', () => {
      const valid = {
        recipients: ['alice@test.com', 'bob@test.com'],
        subject: 'Prueba de envío',
        html: '<p>Hola</p>',
      };
      const res = SendEmailSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('rejects requests with invalid recipient email formats', () => {
      const invalid = {
        recipients: ['not-an-email'],
        subject: 'Prueba',
        html: '<p>Hola</p>',
      };
      const res = SendEmailSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it('rejects empty recipients list', () => {
      const res = SendEmailSchema.safeParse({
        recipients: [],
        subject: 'Prueba',
        html: '<p>Hola</p>',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('VerifySmtpSchema', () => {
    it('validates SMTP host and user', () => {
      const valid = {
        smtpConfig: {
          host: 'smtp.gmail.com',
          port: 587,
          user: 'test@gmail.com',
          pass: 'secret',
        },
      };
      expect(VerifySmtpSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects missing host or user', () => {
      const invalid = {
        smtpConfig: {
          host: '',
          user: '',
        },
      };
      expect(VerifySmtpSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('RenderHtmlSchema', () => {
    it('requires html content', () => {
      expect(RenderHtmlSchema.safeParse({ html: '<div>test</div>' }).success).toBe(true);
      expect(RenderHtmlSchema.safeParse({ html: '' }).success).toBe(false);
    });
  });

  describe('CreateSmtpAccountSchema', () => {
    it('validates a complete valid SMTP account payload', () => {
      const valid = {
        label: 'Gmail Corporativo',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        authUser: 'admin@company.com',
        password: 'app-password-123',
        fromName: 'Notificaciones',
        fromEmail: 'noreply@company.com',
        isDefault: true,
        dailyLimit: 1000,
      };
      expect(CreateSmtpAccountSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects missing label or host', () => {
      expect(CreateSmtpAccountSchema.safeParse({ label: '', host: 'smtp.test.com' }).success).toBe(false);
      expect(CreateSmtpAccountSchema.safeParse({ label: 'Test', host: '' }).success).toBe(false);
    });

    it('rejects invalid fromEmail format', () => {
      const invalid = {
        label: 'Test',
        host: 'smtp.test.com',
        fromEmail: 'not-an-email',
      };
      expect(CreateSmtpAccountSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('UpdateSmtpAccountSchema', () => {
    it('allows partial updates with valid data', () => {
      expect(UpdateSmtpAccountSchema.safeParse({ port: 2525 }).success).toBe(true);
      expect(UpdateSmtpAccountSchema.safeParse({ label: 'Nuevo Nombre' }).success).toBe(true);
    });
  });

  describe('SendEmailSchema with smtpAccountId', () => {
    it('accepts optional smtpAccountId for workspace account dispatch', () => {
      const valid = {
        recipients: ['recipient@test.com'],
        subject: 'Hola',
        html: '<p>Contenido</p>',
        smtpAccountId: 'smtp-12345-uuid',
      };
      const res = SendEmailSchema.safeParse(valid);
      expect(res.success).toBe(true);
      expect(res.data.smtpAccountId).toBe('smtp-12345-uuid');
    });
  });
});
