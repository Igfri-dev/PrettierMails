import { describe, it, expect } from 'vitest';
import { renderEmailHtml, escapeHtml, sanitizeColor } from '../server/src/htmlRenderer.js';

describe('Server htmlRenderer Security & Inlining', () => {
  it('escapes title and previewText in rendered HTML', () => {
    const maliciousTitle = '<script>alert("title-xss")</script>';
    const maliciousPreview = '"><img src=x onerror=alert("preview-xss")>';

    const rendered = renderEmailHtml('<tr><td>Contenido seguro</td></tr>', {
      title: maliciousTitle,
      previewText: maliciousPreview,
      backgroundColor: '#f8fafc',
    });

    expect(rendered).not.toContain('<title><script>');
    expect(rendered).toContain('&lt;script&gt;alert(&quot;title-xss&quot;)&lt;/script&gt;');
    expect(rendered).toContain('&quot;&gt;&lt;img src=x onerror=alert(&quot;preview-xss&quot;)&gt;');
  });

  it('sanitizes backgroundColor against injection', () => {
    const safeRendered = renderEmailHtml('<tr><td>Contenido</td></tr>', {
      backgroundColor: '"><script>alert(1)</script>',
    });

    expect(safeRendered).not.toContain('"><script>');
    expect(safeRendered).toContain('background-color: #f1f5f9');
  });

  it('inlines CSS styles using Juice', () => {
    const htmlWithClasses = `
      <html>
        <head>
          <style>.hero { color: #2563eb; font-size: 20px; }</style>
        </head>
        <body>
          <div class="hero">Hola Mundo</div>
        </body>
      </html>
    `;

    const inlined = renderEmailHtml(htmlWithClasses);
    expect(inlined).toContain('style="color: #2563eb; font-size: 20px;"');
  });

  it('includes VML namespaces, OfficeDocumentSettings, and .video-thumbnail-container media query', () => {
    const rendered = renderEmailHtml('<tr><td>Prueba</td></tr>', {
      title: 'Compatibilidad Outlook & Gmail',
    });

    expect(rendered).toContain('xmlns:v="urn:schemas-microsoft-com:vml"');
    expect(rendered).toContain('xmlns:o="urn:schemas-microsoft-com:office:office"');
    expect(rendered).toContain('<o:OfficeDocumentSettings>');
    expect(rendered).toContain('.video-thumbnail-container');
  });
});
