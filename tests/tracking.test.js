import { describe, it, expect } from 'vitest';
import {
  TRANSPARENT_GIF,
  isValidRedirectUrl,
  injectTrackingPixel,
  rewriteLinksForTracking,
} from '../server/src/utils/tracking.js';

describe('Tracking Engine: Pixel & Link Rewriter', () => {
  it('provides a valid 1x1 transparent GIF buffer', () => {
    expect(Buffer.isBuffer(TRANSPARENT_GIF)).toBe(true);
    expect(TRANSPARENT_GIF.length).toBe(42);
    expect(TRANSPARENT_GIF.toString('ascii', 0, 6)).toBe('GIF89a');
  });

  it('validates safe redirection URLs and rejects open redirect attempts', () => {
    expect(isValidRedirectUrl('https://prettiermails.com')).toBe(true);
    expect(isValidRedirectUrl('http://example.com/promo?id=123')).toBe(true);

    expect(isValidRedirectUrl('javascript:alert(1)')).toBe(false);
    expect(isValidRedirectUrl('data:text/html,<script>')).toBe(false);
    expect(isValidRedirectUrl('/relative/path')).toBe(false);
    expect(isValidRedirectUrl('ftp://ftp.example.com')).toBe(false);
    expect(isValidRedirectUrl('')).toBe(false);
    expect(isValidRedirectUrl(null)).toBe(false);
  });

  it('injects tracking pixel before </body> tag when present', () => {
    const html = '<html><body><h1>Hola</h1><p>Contenido</p></body></html>';
    const res = injectTrackingPixel(html, {
      campaignId: 'cmp-100',
      contactId: 'ct-200',
      baseUrl: 'https://mail.app',
    });

    expect(res).toContain('<img src="https://mail.app/api/track/open/cmp-100/ct-200"');
    expect(res).toContain('</body>');
    expect(res.indexOf('/api/track/open/')).toBeLessThan(res.indexOf('</body>'));
  });

  it('appends tracking pixel when </body> tag is not present', () => {
    const html = '<div>Fragmento sin body</div>';
    const res = injectTrackingPixel(html, {
      campaignId: 'cmp-abc',
      contactId: 'ct-xyz',
      baseUrl: 'http://localhost:3001',
    });

    expect(res).toContain('Fragmento sin body');
    expect(res).toContain('<img src="http://localhost:3001/api/track/open/cmp-abc/ct-xyz"');
  });

  it('rewrites external links for tracking while preserving anchors, mailto, and tel', () => {
    const html = `
      <div>
        <a href="https://myshop.com/deal" class="btn" target="_blank">Ver Oferta</a>
        <a href="#section2">Ir a Sección 2</a>
        <a href="mailto:support@shop.com">Escríbenos</a>
        <a href="tel:+123456789">Llamar</a>
      </div>
    `;

    const res = rewriteLinksForTracking(html, {
      campaignId: 'cmp-123',
      contactId: 'ct-456',
      baseUrl: 'https://track.app',
    });

    expect(res).toContain('href="https://track.app/api/track/click/cmp-123/ct-456?url=https%3A%2F%2Fmyshop.com%2Fdeal"');
    expect(res).toContain('class="btn"');
    expect(res).toContain('target="_blank"');
    expect(res).toContain('href="#section2"');
    expect(res).toContain('href="mailto:support@shop.com"');
    expect(res).toContain('href="tel:+123456789"');
  });
});
