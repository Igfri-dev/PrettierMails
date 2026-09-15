import {
  escapeHtml,
  sanitizeUrl,
  sanitizeColor,
  sanitizeCssValue,
} from './sanitizer.js';

/**
 * Format markdown formatting into HTML inline tags for text blocks
 */
function formatMarkdown(text = '') {
  if (!text) return '';
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
}

/**
 * Maps social network identifier to standard MJML social element name
 */
function mapSocialName(network) {
  const norm = (network || '').toLowerCase().trim();
  switch (norm) {
    case 'twitter':
    case 'x':
      return 'twitter-noshare';
    case 'facebook':
      return 'facebook-noshare';
    case 'instagram':
      return 'instagram';
    case 'linkedin':
      return 'linkedin-noshare';
    case 'youtube':
      return 'youtube';
    case 'github':
      return 'github';
    default:
      return 'web';
  }
}

/**
 * Compiles a single PrettierMails block into an MJML component string
 *
 * @param {Object} block
 * @param {Object} [globalSettings]
 * @returns {string}
 */
export function compileBlockToMjml(block, globalSettings = {}) {
  if (!block || !block.type) return '';

  const { type, data = {} } = block;
  const defaultFontFamily = globalSettings.fontFamily || "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  switch (type) {
    case 'heading': {
      const {
        text = 'Título',
        fontSize = '24px',
        fontWeight = '700',
        textColor = '#0f172a',
        alignment = 'left',
        letterSpacing = '-0.025em',
      } = data;

      const safeText = escapeHtml(text);
      const safeColor = sanitizeColor(textColor, '#0f172a');
      const safeAlign = sanitizeCssValue(alignment, 'left');
      const safeSize = sanitizeCssValue(fontSize, '24px');
      const safeWeight = sanitizeCssValue(fontWeight, '700');
      const safeLetterSpacing = sanitizeCssValue(letterSpacing, '-0.025em');

      return `<mj-text align="${safeAlign}" color="${safeColor}" font-size="${safeSize}" font-weight="${safeWeight}" letter-spacing="${safeLetterSpacing}" padding="8px 0">
  ${safeText}
</mj-text>`;
    }

    case 'text': {
      const {
        text = '',
        fontSize = '15px',
        fontWeight = '400',
        textColor = '#475569',
        lineHeight = '1.6',
        alignment = 'left',
      } = data;

      const formatted = formatMarkdown(text);
      const safeColor = sanitizeColor(textColor, '#475569');
      const safeAlign = sanitizeCssValue(alignment, 'left');
      const safeSize = sanitizeCssValue(fontSize, '15px');
      const safeWeight = sanitizeCssValue(fontWeight, '400');
      const safeLineHeight = sanitizeCssValue(lineHeight, '1.6');

      return `<mj-text align="${safeAlign}" color="${safeColor}" font-size="${safeSize}" font-weight="${safeWeight}" line-height="${safeLineHeight}" padding="6px 0">
  ${formatted}
</mj-text>`;
    }

    case 'button': {
      const {
        text = 'Hacer clic aquí',
        url = 'https://example.com',
        backgroundColor = '#2563eb',
        textColor = '#ffffff',
        borderRadius = '12px',
        fontSize = '15px',
        fontWeight = '700',
        paddingX = '32px',
        paddingY = '14px',
        alignment = 'center',
        fullWidth = false,
      } = data;

      const safeUrl = sanitizeUrl(url, 'https://example.com');
      const safeBg = sanitizeColor(backgroundColor, '#2563eb');
      const safeTextColor = sanitizeColor(textColor, '#ffffff');
      const safeRadius = sanitizeCssValue(borderRadius, '12px');
      const safeSize = sanitizeCssValue(fontSize, '15px');
      const safeWeight = sanitizeCssValue(fontWeight, '700');
      const safeAlign = sanitizeCssValue(alignment, 'center');
      const innerPadding = `${sanitizeCssValue(paddingY, '14px')} ${sanitizeCssValue(paddingX, '32px')}`;

      return `<mj-button background-color="${safeBg}" color="${safeTextColor}" href="${safeUrl}" align="${safeAlign}" border-radius="${safeRadius}" font-size="${safeSize}" font-weight="${safeWeight}" inner-padding="${innerPadding}" width="${fullWidth ? '100%' : 'auto'}" padding="14px 0">
  ${escapeHtml(text)}
</mj-button>`;
    }

    case 'image': {
      const {
        url = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&q=80',
        alt = 'Imagen',
        linkUrl = '',
        width = '100%',
        borderRadius = '12px',
        alignment = 'center',
      } = data;

      const safeSrc = sanitizeUrl(url, '');
      const safeAlt = escapeHtml(alt);
      const safeRadius = sanitizeCssValue(borderRadius, '12px');
      const safeAlign = sanitizeCssValue(alignment, 'center');
      const linkAttr = linkUrl ? ` href="${sanitizeUrl(linkUrl, '#')}"` : '';

      return `<mj-image src="${safeSrc}" alt="${safeAlt}" align="${safeAlign}" border-radius="${safeRadius}" width="${width}"${linkAttr} padding="10px 0" />`;
    }

    case 'youtube': {
      const {
        videoId = 'dQw4w9WgXcQ',
        title = 'Video de YouTube',
        customThumbnail = '',
        borderRadius = '12px',
      } = data;

      const safeVideoId = escapeHtml(videoId);
      const thumbUrl = customThumbnail
        ? sanitizeUrl(customThumbnail)
        : `https://img.youtube.com/vi/${safeVideoId}/hqdefault.jpg`;
      const videoUrl = `https://www.youtube.com/watch?v=${safeVideoId}`;
      const safeRadius = sanitizeCssValue(borderRadius, '12px');

      return `<mj-image src="${thumbUrl}" href="${videoUrl}" alt="${escapeHtml(title)}" border-radius="${safeRadius}" width="100%" padding="12px 0" />
<mj-text align="center" font-size="13px" font-weight="600" color="#64748b" padding="2px 0 10px 0">
  <a href="${videoUrl}" style="color: inherit; text-decoration: none;">▶ ${escapeHtml(title || 'Ver en YouTube')}</a>
</mj-text>`;
    }

    case 'divider': {
      const {
        style = 'solid',
        thickness = '1px',
        color = '#e2e8f0',
        width = '100%',
      } = data;

      const safeStyle = ['solid', 'dashed', 'dotted'].includes(style) ? style : 'solid';
      const safeThickness = sanitizeCssValue(thickness, '1px');
      const safeColor = sanitizeColor(color, '#e2e8f0');

      return `<mj-divider border-width="${safeThickness}" border-style="${safeStyle}" border-color="${safeColor}" width="${width}" padding="14px 0" />`;
    }

    case 'spacer': {
      const { height = '24px' } = data;
      const safeHeight = sanitizeCssValue(height, '24px');
      return `<mj-spacer height="${safeHeight}" />`;
    }

    case 'social': {
      const {
        networks = [],
        alignment = 'center',
        iconSize = '24px',
      } = data;

      const safeAlign = sanitizeCssValue(alignment, 'center');
      const safeSize = sanitizeCssValue(iconSize, '24px');

      const elements = (networks || []).map((n) => {
        const netName = mapSocialName(n.network);
        const safeUrl = sanitizeUrl(n.url || 'https://example.com');
        return `  <mj-social-element name="${netName}" href="${safeUrl}">${escapeHtml(n.label || '')}</mj-social-element>`;
      }).join('\n');

      return `<mj-social mode="horizontal" align="${safeAlign}" icon-size="${safeSize}" padding="12px 0">
${elements}
</mj-social>`;
    }

    case 'grid': {
      const {
        layout = '50-50',
        col1Blocks = [],
        col2Blocks = [],
      } = data;

      const layoutRatios = {
        '50-50': [50, 50],
        '70-30': [70, 30],
        '30-70': [30, 70],
        '25-75': [25, 75],
        '40-60': [40, 60],
      };

      const [w1, w2] = layoutRatios[layout] || [50, 50];

      const col1Mjml = (col1Blocks || []).map((b) => compileBlockToMjml(b, globalSettings)).join('\n');
      const col2Mjml = (col2Blocks || []).map((b) => compileBlockToMjml(b, globalSettings)).join('\n');

      return `<!-- Grid 2 Columnas (${layout}) -->
<mj-section padding="10px 0">
  <mj-column width="${w1}%">
    ${col1Mjml || '<mj-text font-size="13px" color="#94a3b8">Columna 1</mj-text>'}
  </mj-column>
  <mj-column width="${w2}%">
    ${col2Mjml || '<mj-text font-size="13px" color="#94a3b8">Columna 2</mj-text>'}
  </mj-column>
</mj-section>`;
    }

    case 'box': {
      const {
        backgroundColor = '#f8fafc',
        borderRadius = '12px',
        borderColor = '#e2e8f0',
        borderWidth = '1px',
        padding = '20px',
        blocks: childBlocks = [],
      } = data;

      const safeBg = sanitizeColor(backgroundColor, '#f8fafc');
      const safeRadius = sanitizeCssValue(borderRadius, '12px');
      const safeBorderColor = sanitizeColor(borderColor, '#e2e8f0');
      const safeBorderWidth = sanitizeCssValue(borderWidth, '1px');
      const safePadding = sanitizeCssValue(padding, '20px');

      const innerContent = (childBlocks || [])
        .map((b) => compileBlockToMjml(b, globalSettings))
        .join('\n');

      return `<!-- Contenedor Box -->
<mj-section background-color="${safeBg}" border-radius="${safeRadius}" border="${safeBorderWidth} solid ${safeBorderColor}" padding="${safePadding}">
  <mj-column width="100%">
    ${innerContent || '<mj-text font-size="13px" color="#94a3b8">Contenedor vacío</mj-text>'}
  </mj-column>
</mj-section>`;
    }

    case 'table': {
      const {
        headers = ['Columna 1', 'Columna 2'],
        rows = [['Dato 1', 'Dato 2']],
        showHeaders = true,
        headerBgColor = '#f1f5f9',
        headerTextColor = '#1e293b',
        cellPadding = '10px 14px',
        zebra = true,
        zebraColor = '#f8fafc',
      } = data;

      const safeHeaderBg = sanitizeColor(headerBgColor, '#f1f5f9');
      const safeHeaderTextColor = sanitizeColor(headerTextColor, '#1e293b');
      const safeCellPad = sanitizeCssValue(cellPadding, '10px 14px');
      const safeZebra = sanitizeColor(zebraColor, '#f8fafc');

      const theadHtml = showHeaders
        ? `    <tr style="background-color: ${safeHeaderBg}; color: ${safeHeaderTextColor}; font-weight: 700;">\n` +
          (headers || []).map((h) => `      <th style="padding: ${safeCellPad}; text-align: left; border-bottom: 1px solid #e2e8f0;">${escapeHtml(h)}</th>`).join('\n') +
          '\n    </tr>'
        : '';

      const tbodyHtml = (rows || []).map((row, rIndex) => {
        const rowBg = zebra && rIndex % 2 === 1 ? `background-color: ${safeZebra};` : '';
        const cells = (row || []).map((c) => `      <td style="padding: ${safeCellPad}; border-bottom: 1px solid #f1f5f9;">${escapeHtml(c)}</td>`).join('\n');
        return `    <tr style="${rowBg}">\n${cells}\n    </tr>`;
      }).join('\n');

      return `<mj-table font-family="${defaultFontFamily}" color="#334155" padding="10px 0">
${theadHtml}
${tbodyHtml}
</mj-table>`;
    }

    default:
      return '';
  }
}

/**
 * Compiles a full PrettierMails document into valid, production-ready MJML code
 *
 * @param {Object} options
 * @param {Array<Object>} [options.blocks=[]]
 * @param {Object} [options.globalSettings={}]
 * @param {string} [options.subject='PrettierMails Email']
 * @param {string} [options.previewText='']
 * @returns {string}
 */
export function compileEmailToMjml({
  blocks = [],
  globalSettings = {},
  subject = 'PrettierMails Email',
  previewText = '',
}) {
  const {
    backgroundColor = '#f1f5f9',
    contentBackgroundColor = '#ffffff',
    contentWidth = '600px',
    borderRadius = '16px',
    fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    textColor = '#1e293b',
    padding = '32px',
  } = globalSettings;

  const safeBgColor = sanitizeColor(backgroundColor, '#f1f5f9');
  const safeContentBg = sanitizeColor(contentBackgroundColor, '#ffffff');
  const safeWidth = sanitizeCssValue(contentWidth, '600px');
  const safeRadius = sanitizeCssValue(borderRadius, '16px');
  const safePadding = sanitizeCssValue(padding, '32px');
  const safeTextColor = sanitizeColor(textColor, '#1e293b');

  // Categorize blocks:
  // Layout containers (`box`, `grid`) generate their own <mj-section>.
  // Flow content blocks (`heading`, `text`, `button`, etc.) are wrapped in an inner <mj-column>.
  const sections = [];
  let currentFlowBlocks = [];

  const flushFlowBlocks = () => {
    if (currentFlowBlocks.length > 0) {
      const innerMjml = currentFlowBlocks
        .map((b) => compileBlockToMjml(b, globalSettings))
        .join('\n');

      sections.push(`<mj-section background-color="${safeContentBg}" padding="0px">
  <mj-column width="100%">
${innerMjml}
  </mj-column>
</mj-section>`);
      currentFlowBlocks = [];
    }
  };

  for (const block of blocks) {
    if (block.type === 'box' || block.type === 'grid') {
      flushFlowBlocks();
      sections.push(compileBlockToMjml(block, globalSettings));
    } else {
      currentFlowBlocks.push(block);
    }
  }
  flushFlowBlocks();

  const sectionsMarkup = sections.join('\n\n');

  return `<mjml>
  <mj-head>
    <mj-title>${escapeHtml(subject || 'PrettierMails Email')}</mj-title>
    ${previewText ? `<mj-preview>${escapeHtml(previewText)}</mj-preview>` : ''}
    <mj-attributes>
      <mj-all font-family="${fontFamily}" />
      <mj-text font-size="15px" color="${safeTextColor}" line-height="1.6" />
      <mj-section padding="0px" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="${safeBgColor}" width="${safeWidth}">
    <mj-wrapper background-color="${safeContentBg}" border-radius="${safeRadius}" padding="${safePadding}">
${sectionsMarkup}
    </mj-wrapper>
  </mj-body>
</mjml>`.trim();
}

export default {
  compileBlockToMjml,
  compileEmailToMjml,
};
