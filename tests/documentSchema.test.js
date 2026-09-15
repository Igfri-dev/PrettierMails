import { describe, it, expect } from 'vitest';
import {
  PrettierMailsDocumentSchema,
  BlockSchema,
  GlobalSettingsSchema,
  ColorSchema,
  SafeUrlSchema,
  validateEmailDocument,
} from '../client/src/schemas/documentSchema.js';

describe('PrettierMails Document Zod Schemas', () => {
  it('validates a complete standard email document', () => {
    const doc = {
      subject: 'Boletín Semanal #42',
      previewText: 'Resumen de lanzamientos',
      globalSettings: {
        backgroundColor: '#f1f5f9',
        contentBackgroundColor: '#ffffff',
        contentWidth: '600px',
      },
      blocks: [
        {
          id: 'b-1',
          type: 'heading',
          data: { content: '¡Hola Mundo!', fontSize: '24px', color: '#0f172a' },
        },
        {
          id: 'b-2',
          type: 'button',
          data: { text: 'Ver detalles', url: 'https://example.com' },
        },
      ],
    };

    const result = validateEmailDocument(doc);
    expect(result.success).toBe(true);
    expect(result.data.blocks).toHaveLength(2);
    expect(result.data.subject).toBe('Boletín Semanal #42');
  });

  it('rejects blocks with invalid or unknown types', () => {
    const invalidBlock = {
      id: 'bad-block',
      type: 'malicious_exec',
      data: {},
    };

    const res = BlockSchema.safeParse(invalidBlock);
    expect(res.success).toBe(false);
  });

  it('validates and rejects invalid colors', () => {
    expect(ColorSchema.safeParse('#1e293b').success).toBe(true);
    expect(ColorSchema.safeParse('rgba(255, 0, 0, 0.8)').success).toBe(true);
    expect(ColorSchema.safeParse('blue').success).toBe(true);
    expect(ColorSchema.safeParse('invalid-color-injection;').success).toBe(false);
  });

  it('validates safe URLs and rejects dangerous protocols', () => {
    expect(SafeUrlSchema.safeParse('https://google.com').success).toBe(true);
    expect(SafeUrlSchema.safeParse('mailto:test@test.com').success).toBe(true);
    expect(SafeUrlSchema.safeParse('#anchor').success).toBe(true);
    expect(SafeUrlSchema.safeParse('javascript:evil()').success).toBe(false);
  });

  it('safely applies default values when optional fields are omitted', () => {
    const minimalDoc = {
      blocks: [],
    };

    const parsed = PrettierMailsDocumentSchema.parse(minimalDoc);
    expect(parsed.subject).toBe('');
    expect(parsed.globalSettings.backgroundColor).toBe('#f1f5f9');
    expect(parsed.globalSettings.contentBackgroundColor).toBe('#ffffff');
    expect(parsed.prettierMailsVersion).toBe('1.0');
  });
});
