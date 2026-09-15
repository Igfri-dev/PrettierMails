import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeUrl,
  sanitizeColor,
  sanitizeCssValue,
  escapeJsonForHtml,
  compileBlockToHtml,
  compileEmailToHtml,
  compileFullEmailHtml,
} from '../client/src/utils/emailCompiler.js';
import { parseTemplateFromHtml } from '../client/src/utils/templateStorage.js';

describe('emailCompiler Security & Sanitization Utilities', () => {
  describe('escapeHtml', () => {
    it('escapes &, <, >, ", and single quotes', () => {
      const dangerous = '<script>alert("XSS & fun\'s")</script>';
      const escaped = escapeHtml(dangerous);
      expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS &amp; fun&#039;s&quot;)&lt;/script&gt;');
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
    });

    it('handles empty or null input gracefully', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    it('allows safe http and https protocols', () => {
      expect(sanitizeUrl('https://example.com/page?test=1')).toBe('https://example.com/page?test=1');
      expect(sanitizeUrl('http://insecure.test')).toBe('http://insecure.test');
    });

    it('allows mailto and tel protocols', () => {
      expect(sanitizeUrl('mailto:user@example.com')).toBe('mailto:user@example.com');
      expect(sanitizeUrl('tel:+1234567890')).toBe('tel:+1234567890');
    });

    it('allows relative paths and fragment anchors', () => {
      expect(sanitizeUrl('#section-1')).toBe('#section-1');
      expect(sanitizeUrl('/portal/login')).toBe('/portal/login');
    });

    it('blocks dangerous protocols like javascript: and data:', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('#');
      expect(sanitizeUrl('JAVASCRIPT:alert(document.cookie)')).toBe('#');
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
      expect(sanitizeUrl('vbscript:msgbox(1)', 'https://fallback.com')).toBe('https://fallback.com');
    });
  });

  describe('sanitizeColor', () => {
    it('accepts valid hex colors', () => {
      expect(sanitizeColor('#fff')).toBe('#fff');
      expect(sanitizeColor('#1e293b')).toBe('#1e293b');
      expect(sanitizeColor('#1e293b80')).toBe('#1e293b80');
    });

    it('accepts rgb, rgba, and named CSS colors', () => {
      expect(sanitizeColor('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)');
      expect(sanitizeColor('rgba(0, 0, 0, 0.5)')).toBe('rgba(0, 0, 0, 0.5)');
      expect(sanitizeColor('transparent')).toBe('transparent');
      expect(sanitizeColor('inherit')).toBe('inherit');
      expect(sanitizeColor('white')).toBe('white');
    });

    it('rejects invalid or injection colors and falls back safely', () => {
      expect(sanitizeColor('red; background: url(evil.com)', '#000000')).toBe('#000000');
      expect(sanitizeColor('"><script>alert(1)</script>', '#f1f5f9')).toBe('#f1f5f9');
      expect(sanitizeColor('', '#default')).toBe('#default');
    });
  });

  describe('sanitizeCssValue', () => {
    it('allows valid units and identifiers', () => {
      expect(sanitizeCssValue('16px')).toBe('16px');
      expect(sanitizeCssValue('1.5rem')).toBe('1.5rem');
      expect(sanitizeCssValue('center')).toBe('center');
      expect(sanitizeCssValue('700')).toBe('700');
    });

    it('strips quotes, angle brackets, semicolons, and javascript expressions', () => {
      expect(sanitizeCssValue('16px; color: red', '14px')).toBe('14px');
      expect(sanitizeCssValue('expression(alert(1))', '14px')).toBe('14px');
      expect(sanitizeCssValue('<svg onload=alert(1)>', '14px')).toBe('14px');
      expect(sanitizeCssValue('" onfocus="alert(1)', '14px')).toBe('14px');
    });
  });

  describe('escapeJsonForHtml and Metadata Round-Trip', () => {
    it('escapes < as \\u003c, > as \\u003e, and & as \\u0026', () => {
      const json = JSON.stringify({ attack: '</script><script>alert(1)</script> & --> comment' });
      const safe = escapeJsonForHtml(json);
      expect(safe).not.toContain('</script>');
      expect(safe).not.toContain('-->');
      expect(safe).toContain('\\u003c/script\\u003e');
      expect(safe).toContain('\\u003e');
      expect(safe).toContain('\\u0026');

      // Native JSON.parse safely reconstructs the original string
      const parsed = JSON.parse(safe);
      expect(parsed.attack).toBe('</script><script>alert(1)</script> & --> comment');
    });

    it('safely serializes and roundtrip-imports templates containing XSS payloads', () => {
      const maliciousPayload = '</script><script>alert("XSS")</script> and <!-- breakout -->';
      const blocks = [
        {
          id: 'test-heading-1',
          type: 'heading',
          data: {
            content: maliciousPayload,
            color: '#1e293b',
          },
        },
      ];

      const fullHtml = compileFullEmailHtml({
        blocks,
        globalSettings: { backgroundColor: '#f8fafc' },
        subject: 'Security Verification Test',
        previewText: 'Testing preheader & preview',
        includeMetadata: true,
      });

      // The raw HTML script tag must NEVER contain unescaped </script>
      const scriptBodyMatch = fullHtml.match(/<script[^>]*id="prettier-mails-template-data"[^>]*>([\s\S]*?)<\/script>/i);
      expect(scriptBodyMatch).toBeTruthy();
      const scriptBody = scriptBodyMatch[1];
      expect(scriptBody).not.toContain('</script><script>');

      // Parsing the template back must succeed and recover exact content
      const restored = parseTemplateFromHtml(fullHtml);
      expect(restored.success).toBe(true);
      expect(restored.template.blocks[0].data.content).toBe(maliciousPayload);
    });
  });
});
