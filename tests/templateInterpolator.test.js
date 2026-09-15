import { describe, it, expect } from 'vitest';
import {
  interpolateTemplate,
  extractMergeTags,
  escapeHtml,
} from '../server/src/utils/templateInterpolator.js';

describe('Personalization & Merge Tags Interpolator', () => {
  it('replaces standard variables (first_name, last_name, name, email)', () => {
    const contact = {
      first_name: 'Elena',
      last_name: 'Vázquez',
      email: 'elena@empresa.com',
    };

    const template = 'Hola {{first_name}} {{last_name}}, enviamos esto a {{email}}. Atte: {{name}}';
    const result = interpolateTemplate(template, contact);

    expect(result).toBe('Hola Elena Vázquez, enviamos esto a elena@empresa.com. Atte: Elena Vázquez');
  });

  it('handles fallback syntax when variable is missing or empty', () => {
    const contact1 = { email: 'anon@example.com' };
    const template = 'Estimado/a {{first_name|cliente}}, gracias por tu compra.';
    expect(interpolateTemplate(template, contact1)).toBe('Estimado/a cliente, gracias por tu compra.');

    const contact2 = { first_name: '', email: 'empty@example.com' };
    expect(interpolateTemplate(template, contact2)).toBe('Estimado/a cliente, gracias por tu compra.');

    const contact3 = { first_name: 'Carlos' };
    expect(interpolateTemplate(template, contact3)).toBe('Estimado/a Carlos, gracias por tu compra.');
  });

  it('interpolates nested custom_fields via custom.KEY or direct key', () => {
    const contact = {
      email: 'roberto@acme.com',
      custom_fields: {
        empresa: 'Acme Corporation',
        plan: 'Enterprise',
      },
    };

    const template = 'Bienvenido a {{custom.empresa}} con plan {{custom.plan|Standard}}!';
    const result = interpolateTemplate(template, contact);

    expect(result).toBe('Bienvenido a Acme Corporation con plan Enterprise!');
  });

  it('sanitizes and escapes HTML characters to prevent XSS by default', () => {
    const contact = {
      first_name: '<script>alert("xss")</script>',
      last_name: '<b>Negrita</b>',
      email: 'hacker@safe.com',
      custom_fields: {
        bio: '<img src=x onerror=alert(1)>',
      },
    };

    const template = '<h1>Hola {{first_name}} {{last_name}}</h1><p>{{custom.bio}}</p>';
    const result = interpolateTemplate(template, contact);

    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(result).toContain('&lt;b&gt;Negrita&lt;/b&gt;');
    expect(result).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('allows unescaped values when escapeHtmlValues is false (e.g. for plain subjects)', () => {
    const contact = {
      first_name: 'Tom & Jerry',
    };

    const subjectTemplate = 'Oferta especial para {{first_name}}';
    const result = interpolateTemplate(subjectTemplate, contact, { escapeHtmlValues: false });

    expect(result).toBe('Oferta especial para Tom & Jerry');
  });

  it('extracts all unique merge tags used in a template', () => {
    const content = 'Hola {{first_name|amigo}}, tu código en {{custom.company}} es {{code}}. Contacto: {{first_name}}';
    const tags = extractMergeTags(content);
    const variables = tags.map((t) => t.variable);

    expect(variables).toContain('first_name');
    expect(variables).toContain('custom.company');
    expect(variables).toContain('code');
    expect(tags.length).toBe(3);
  });
});
