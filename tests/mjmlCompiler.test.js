import { describe, it, expect } from 'vitest';
import { compileBlockToMjml, compileEmailToMjml } from '../client/src/utils/mjmlCompiler.js';

describe('MJML Compiler for PrettierMails Blocks', () => {
  it('compiles heading block to <mj-text> with typography styles', () => {
    const block = {
      type: 'heading',
      data: {
        text: '¡Gran Lanzamiento!',
        fontSize: '28px',
        fontWeight: '800',
        textColor: '#1e293b',
        alignment: 'center',
      },
    };

    const mjml = compileBlockToMjml(block);
    expect(mjml).toContain('<mj-text');
    expect(mjml).toContain('align="center"');
    expect(mjml).toContain('color="#1e293b"');
    expect(mjml).toContain('font-size="28px"');
    expect(mjml).toContain('font-weight="800"');
    expect(mjml).toContain('¡Gran Lanzamiento!');
  });

  it('compiles text block with markdown formatting and newlines', () => {
    const block = {
      type: 'text',
      data: {
        text: 'Hola **Mundo**,\nesto es un *email genial*.',
        fontSize: '16px',
        textColor: '#334155',
        alignment: 'left',
      },
    };

    const mjml = compileBlockToMjml(block);
    expect(mjml).toContain('<mj-text');
    expect(mjml).toContain('<strong>Mundo</strong>');
    expect(mjml).toContain('<em>email genial</em>');
    expect(mjml).toContain('<br />');
    expect(mjml).toContain('font-size="16px"');
  });

  it('compiles button CTA block to <mj-button>', () => {
    const block = {
      type: 'button',
      data: {
        text: 'Comprar Ahora',
        url: 'https://myshop.com/checkout',
        backgroundColor: '#10b981',
        textColor: '#ffffff',
        borderRadius: '8px',
        alignment: 'center',
        fullWidth: false,
      },
    };

    const mjml = compileBlockToMjml(block);
    expect(mjml).toContain('<mj-button');
    expect(mjml).toContain('background-color="#10b981"');
    expect(mjml).toContain('color="#ffffff"');
    expect(mjml).toContain('href="https://myshop.com/checkout"');
    expect(mjml).toContain('border-radius="8px"');
    expect(mjml).toContain('Comprar Ahora');
  });

  it('compiles responsive image to <mj-image>', () => {
    const block = {
      type: 'image',
      data: {
        url: 'https://images.unsplash.com/hero.jpg',
        alt: 'Hero Banner',
        linkUrl: 'https://example.com/promo',
        width: '600px',
        borderRadius: '16px',
      },
    };

    const mjml = compileBlockToMjml(block);
    expect(mjml).toContain('<mj-image');
    expect(mjml).toContain('src="https://images.unsplash.com/hero.jpg"');
    expect(mjml).toContain('alt="Hero Banner"');
    expect(mjml).toContain('href="https://example.com/promo"');
    expect(mjml).toContain('border-radius="16px"');
  });

  it('compiles youtube showcase block with thumbnail and video link', () => {
    const block = {
      type: 'youtube',
      data: {
        videoId: 'dQw4w9WgXcQ',
        title: 'Ver Tutorial Exclusivo',
        borderRadius: '12px',
      },
    };

    const mjml = compileBlockToMjml(block);
    expect(mjml).toContain('<mj-image');
    expect(mjml).toContain('src="https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"');
    expect(mjml).toContain('href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"');
    expect(mjml).toContain('Ver Tutorial Exclusivo');
  });

  it('compiles divider and spacer blocks', () => {
    const dividerBlock = {
      type: 'divider',
      data: { thickness: '2px', style: 'dashed', color: '#cbd5e1' },
    };
    const spacerBlock = {
      type: 'spacer',
      data: { height: '32px' },
    };

    expect(compileBlockToMjml(dividerBlock)).toContain('<mj-divider border-width="2px" border-style="dashed" border-color="#cbd5e1"');
    expect(compileBlockToMjml(spacerBlock)).toContain('<mj-spacer height="32px" />');
  });

  it('compiles social icons to <mj-social> with elements', () => {
    const block = {
      type: 'social',
      data: {
        alignment: 'center',
        networks: [
          { network: 'twitter', url: 'https://twitter.com/example', label: 'Twitter' },
          { network: 'youtube', url: 'https://youtube.com/example', label: 'YouTube' },
        ],
      },
    };

    const mjml = compileBlockToMjml(block);
    expect(mjml).toContain('<mj-social');
    expect(mjml).toContain('<mj-social-element name="twitter-noshare" href="https://twitter.com/example">Twitter</mj-social-element>');
    expect(mjml).toContain('<mj-social-element name="youtube" href="https://youtube.com/example">YouTube</mj-social-element>');
  });

  it('compiles 2-column grid layout to <mj-section> with columns', () => {
    const block = {
      type: 'grid',
      data: {
        layout: '70-30',
        col1Blocks: [{ type: 'heading', data: { text: 'Columna Principal' } }],
        col2Blocks: [{ type: 'button', data: { text: 'Botón Lateral' } }],
      },
    };

    const mjml = compileBlockToMjml(block);
    expect(mjml).toContain('<mj-section');
    expect(mjml).toContain('<mj-column width="70%">');
    expect(mjml).toContain('Columna Principal');
    expect(mjml).toContain('<mj-column width="30%">');
    expect(mjml).toContain('Botón Lateral');
  });

  it('compiles nested box container to <mj-section>', () => {
    const block = {
      type: 'box',
      data: {
        backgroundColor: '#eff6ff',
        borderRadius: '16px',
        padding: '24px',
        blocks: [{ type: 'text', data: { text: 'Contenido dentro de la caja' } }],
      },
    };

    const mjml = compileBlockToMjml(block);
    expect(mjml).toContain('<mj-section background-color="#eff6ff"');
    expect(mjml).toContain('border-radius="16px"');
    expect(mjml).toContain('padding="24px"');
    expect(mjml).toContain('Contenido dentro de la caja');
  });

  it('compiles table block to <mj-table>', () => {
    const block = {
      type: 'table',
      data: {
        headers: ['Producto', 'Precio'],
        rows: [['PrettierMails Pro', '$19/mes']],
        showHeaders: true,
        zebra: true,
      },
    };

    const mjml = compileBlockToMjml(block);
    expect(mjml).toContain('<mj-table');
    expect(mjml).toContain('Producto');
    expect(mjml).toContain('Precio');
    expect(mjml).toContain('PrettierMails Pro');
    expect(mjml).toContain('$19/mes');
  });

  it('compiles complete document to full valid MJML document tree', () => {
    const doc = {
      subject: 'Novedades de la Semana',
      previewText: 'No te pierdas los nuevos lanzamientos',
      globalSettings: {
        backgroundColor: '#0f172a',
        contentBackgroundColor: '#ffffff',
        contentWidth: '640px',
        borderRadius: '20px',
        fontFamily: "'Inter', sans-serif",
      },
      blocks: [
        { type: 'heading', data: { text: 'Titular' } },
        { type: 'text', data: { text: 'Párrafo explicativo' } },
        {
          type: 'box',
          data: {
            backgroundColor: '#f8fafc',
            blocks: [{ type: 'button', data: { text: 'Click' } }],
          },
        },
      ],
    };

    const mjml = compileEmailToMjml(doc);
    expect(mjml).toMatch(/^<mjml>/);
    expect(mjml).toMatch(/<\/mjml>$/);
    expect(mjml).toContain('<mj-head>');
    expect(mjml).toContain('<mj-title>Novedades de la Semana</mj-title>');
    expect(mjml).toContain('<mj-preview>No te pierdas los nuevos lanzamientos</mj-preview>');
    expect(mjml).toContain('<mj-body background-color="#0f172a" width="640px">');
    expect(mjml).toContain('<mj-wrapper background-color="#ffffff" border-radius="20px"');
    expect(mjml).toContain('Titular');
    expect(mjml).toContain('Párrafo explicativo');
    expect(mjml).toContain('Click');
  });
});
