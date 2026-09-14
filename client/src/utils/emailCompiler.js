import { extractYouTubeId, getYouTubeThumbnail, getYouTubeWatchUrl } from './youtubeHelper.js';

/**
 * Escapes HTML characters
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Converts newlines to <br/> tags while escaping other characters
 */
function formatTextContent(text) {
  if (!text) return '';
  // Convert markdown bold **text** to <strong>
  let formatted = escapeHtml(text);
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return formatted.replace(/\n/g, '<br/>');
}

/**
 * Ensures URLs use only safe protocols (http, https, mailto, tel) to prevent javascript: or data: XSS injection
 */
export function sanitizeUrl(url, fallback = '#') {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  // Strictly allow only safe schemes or anchors/relative paths
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  return fallback;
}

/**
 * Compiles a single block into HTML table row/cell
 */
export function compileBlockToHtml(block) {
  if (!block) return '';

  switch (block.type) {
    case 'heading': {
      const {
        content = 'Encabezado',
        fontSize = '26px',
        fontWeight = '700',
        color = '#0f172a',
        textAlign = 'left',
        paddingTop = '12px',
        paddingBottom = '12px',
      } = block.data || {};

      return `
        <tr>
          <td align="${textAlign}" style="padding-top: ${paddingTop}; padding-bottom: ${paddingBottom}; padding-left: 0; padding-right: 0;">
            <h2 style="margin: 0; font-size: ${fontSize}; font-weight: ${fontWeight}; color: ${color}; text-align: ${textAlign}; line-height: 1.3; font-family: inherit;">
              ${formatTextContent(content)}
            </h2>
          </td>
        </tr>
      `;
    }

    case 'text': {
      const {
        content = 'Escribe aquí tu texto...',
        fontSize = '15px',
        fontWeight = '400',
        color = '#334155',
        textAlign = 'left',
        lineHeight = '1.6',
        paddingTop = '8px',
        paddingBottom = '8px',
      } = block.data || {};

      return `
        <tr>
          <td align="${textAlign}" style="padding-top: ${paddingTop}; padding-bottom: ${paddingBottom};">
            <p style="margin: 0; font-size: ${fontSize}; font-weight: ${fontWeight}; color: ${color}; text-align: ${textAlign}; line-height: ${lineHeight}; font-family: inherit;">
              ${formatTextContent(content)}
            </p>
          </td>
        </tr>
      `;
    }

    case 'box': {
      const {
        backgroundColor = '#f8fafc',
        borderRadius = '14px',
        borderWidth = '1px',
        borderColor = '#e2e8f0',
        borderStyle = 'solid',
        borderLeftColor,
        borderLeftWidth = '4px',
        boxShadow,
        paddingTop = '20px',
        paddingBottom = '20px',
        paddingLeft = '24px',
        paddingRight = '24px',
        children = [],
      } = block.data || {};

      const childrenHtml = children.map(child => compileBlockToHtml(child)).join('');
      const borderLeftCss = borderLeftColor ? `border-left: ${borderLeftWidth} solid ${borderLeftColor} !important;` : '';
      const shadowCss = boxShadow ? `box-shadow: ${boxShadow};` : (borderLeftColor ? 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);' : '');

      return `
        <tr>
          <td style="padding: 12px 0;">
            <!-- Outer Box Table with separate border-collapse and border-radius -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: separate !important; border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: ${borderRadius}; -webkit-border-radius: ${borderRadius}; -moz-border-radius: ${borderRadius}; ${shadowCss}">
              <tr>
                <td style="background-color: ${backgroundColor}; border: ${borderWidth} ${borderStyle} ${borderColor}; ${borderLeftCss} border-radius: ${borderRadius}; -webkit-border-radius: ${borderRadius}; -moz-border-radius: ${borderRadius}; overflow: hidden; padding: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft}; ${shadowCss}" bgcolor="${backgroundColor}">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border-spacing: 0;">
                    ${childrenHtml}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }

    case 'image': {
      const {
        url = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&auto=format&fit=crop&q=80',
        alt = 'Imagen',
        width = '100%',
        maxWidth = '100%',
        alignment = 'center',
        borderRadius = '8px',
        linkUrl = '',
        paddingTop = '12px',
        paddingBottom = '12px',
      } = block.data || {};

      const safeImgUrl = sanitizeUrl(url, 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&auto=format&fit=crop&q=80');
      const safeLinkUrl = linkUrl ? sanitizeUrl(linkUrl, '') : '';
      const marginCss = alignment === 'center' ? 'margin: 0 auto;' : alignment === 'right' ? 'margin-left: auto; margin-right: 0;' : 'margin-right: auto; margin-left: 0;';

      const imgHtml = `
        <img src="${safeImgUrl}" alt="${escapeHtml(alt)}" width="${width.replace('%', '')}" style="display: block; ${marginCss} max-width: ${maxWidth}; width: ${width}; height: auto; border-radius: ${borderRadius}; border: 0; outline: none; text-decoration: none;" />
      `;

      return `
        <tr>
          <td align="${alignment}" style="padding-top: ${paddingTop}; padding-bottom: ${paddingBottom};">
            ${safeLinkUrl ? `<a href="${safeLinkUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">${imgHtml}</a>` : imgHtml}
          </td>
        </tr>
      `;
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
        boxShadow = '0 4px 14px 0 rgba(37, 99, 235, 0.35)',
        letterSpacing = '0.015em',
      } = block.data || {};

      const safeUrl = sanitizeUrl(url, '#');

      return `
        <tr>
          <td align="${alignment}" style="padding: 16px 0;">
            <table border="0" cellpadding="0" cellspacing="0" ${fullWidth ? 'width="100%"' : ''} style="margin: ${alignment === 'center' ? '0 auto' : alignment === 'right' ? '0 0 0 auto' : '0 auto 0 0'};">
              <tr>
                <td align="center" style="background-color: ${backgroundColor}; border-radius: ${borderRadius};">
                  <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: ${paddingY} ${paddingX}; font-family: inherit; font-size: ${fontSize}; font-weight: ${fontWeight}; color: ${textColor}; text-decoration: none; border-radius: ${borderRadius}; background-color: ${backgroundColor}; text-align: center; border: 1px solid ${backgroundColor}; box-shadow: ${boxShadow}; letter-spacing: ${letterSpacing}; ${fullWidth ? 'width: 100%; box-sizing: border-box;' : ''}">
                    ${escapeHtml(text)}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }

    case 'youtube': {
      const {
        url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title = 'Mira nuestro último video',
        caption = 'Haz clic para reproducir el video en YouTube.',
        buttonText = 'Ver en YouTube ▶',
        cardBackground = '#0f172a',
        textColor = '#f8fafc',
        borderRadius = '12px',
        paddingTop = '16px',
        paddingBottom = '16px',
      } = block.data || {};

      const videoId = extractYouTubeId(url);
      const thumbnail = getYouTubeThumbnail(videoId, 'max');
      const watchUrl = getYouTubeWatchUrl(videoId);

      return `
        <tr>
          <td style="padding-top: ${paddingTop}; padding-bottom: ${paddingBottom};">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${cardBackground}; border-radius: ${borderRadius}; overflow: hidden; border-collapse: separate; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <!-- Video Thumbnail & Play Button Overlay -->
              <tr>
                <td align="center" style="padding: 0; position: relative;">
                  <a href="${watchUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: block; position: relative;">
                    <!-- Thumbnail with play button overlay banner -->
                    <div style="position: relative; width: 100%; max-height: 340px; overflow: hidden; background-color: #000000; border-top-left-radius: ${borderRadius}; border-top-right-radius: ${borderRadius};">
                      <img src="${thumbnail}" alt="${escapeHtml(title)}" width="600" style="display: block; width: 100%; height: auto; max-height: 340px; object-fit: cover; opacity: 0.9;" />
                      <!-- Play overlay table -->
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; text-align: center;">
                        <tr>
                          <td align="center" valign="middle">
                            <table border="0" cellpadding="0" cellspacing="0" style="background: rgba(255, 0, 0, 0.95); border-radius: 16px; padding: 14px 28px; box-shadow: 0 8px 16px rgba(0,0,0,0.5);">
                              <tr>
                                <td style="color: #ffffff; font-size: 20px; font-weight: bold; font-family: sans-serif; text-decoration: none;">
                                  ▶ REPRODUCIR
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </a>
                </td>
              </tr>
              <!-- Video Info / CTA -->
              <tr>
                <td style="padding: 18px 24px 22px 24px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    ${title ? `
                      <tr>
                        <td>
                          <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: ${textColor}; font-family: inherit;">
                            ${escapeHtml(title)}
                          </h3>
                        </td>
                      </tr>
                    ` : ''}
                    ${caption ? `
                      <tr>
                        <td style="padding-bottom: 14px;">
                          <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.5; font-family: inherit;">
                            ${escapeHtml(caption)}
                          </p>
                        </td>
                      </tr>
                    ` : ''}
                    <tr>
                      <td align="left">
                        <table border="0" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="background-color: #ef4444; border-radius: 8px;">
                              <a href="${watchUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 20px; font-family: inherit; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 8px; background-color: #ef4444;">
                                ${escapeHtml(buttonText)}
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }

    case 'divider': {
      const {
        color = '#e2e8f0',
        thickness = '1px',
        style = 'solid',
        paddingTop = '16px',
        paddingBottom = '16px',
        width = '100%',
      } = block.data || {};

      return `
        <tr>
          <td align="center" style="padding-top: ${paddingTop}; padding-bottom: ${paddingBottom};">
            <hr style="border: 0; border-top: ${thickness} ${style} ${color}; margin: 0; width: ${width};" />
          </td>
        </tr>
      `;
    }

    case 'spacer': {
      const { height = '24px' } = block.data || {};
      return `
        <tr>
          <td height="${parseInt(height, 10)}" style="font-size: 0px; line-height: 0px; height: ${height};">
            &nbsp;
          </td>
        </tr>
      `;
    }

    case 'social': {
      const {
        alignment = 'center',
        facebook = '',
        twitter = '',
        instagram = '',
        linkedin = '',
        youtube = '',
        github = '',
        paddingTop = '16px',
        paddingBottom = '16px',
      } = block.data || {};

      const socialIcons = [
        { name: 'YouTube', url: youtube, icon: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' },
        { name: 'Instagram', url: instagram, icon: 'https://cdn-icons-png.flaticon.com/512/1384/1384063.png' },
        { name: 'Twitter / X', url: twitter, icon: 'https://cdn-icons-png.flaticon.com/512/733/733579.png' },
        { name: 'LinkedIn', url: linkedin, icon: 'https://cdn-icons-png.flaticon.com/512/145/145807.png' },
        { name: 'Facebook', url: facebook, icon: 'https://cdn-icons-png.flaticon.com/512/145/145802.png' },
        { name: 'GitHub', url: github, icon: 'https://cdn-icons-png.flaticon.com/512/733/733553.png' },
      ].filter(item => Boolean(item.url));

      if (socialIcons.length === 0) return '';

      const iconsHtml = socialIcons
        .map(
          item => `
          <td style="padding: 0 8px;">
            <a href="${sanitizeUrl(item.url, '#')}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
              <img src="${sanitizeUrl(item.icon, '')}" alt="${escapeHtml(item.name)}" width="28" height="28" style="display: block; border: 0; outline: none; border-radius: 6px;" />
            </a>
          </td>
        `
        )
        .join('');

      return `
        <tr>
          <td align="${alignment}" style="padding-top: ${paddingTop}; padding-bottom: ${paddingBottom};">
            <table border="0" cellpadding="0" cellspacing="0" style="margin: ${alignment === 'center' ? '0 auto' : alignment === 'right' ? '0 0 0 auto' : '0 auto 0 0'};">
              <tr>
                ${iconsHtml}
              </tr>
            </table>
          </td>
        </tr>
      `;
    }

    case 'grid': {
      const {
        layout = '30-70',
        verticalAlign = 'middle',
        gap = '16px',
        backgroundColor = 'transparent',
        borderRadius = '0px',
        borderWidth = '0px',
        borderColor = 'transparent',
        borderStyle = 'solid',
        paddingTop = '12px',
        paddingBottom = '12px',
        paddingLeft = '0px',
        paddingRight = '0px',
        leftType = 'image',
        leftImage = {
          url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
          alt: 'Logo NovaTech',
          width: '90px',
          maxWidth: '110px',
          borderRadius: '8px',
          alignment: 'center',
          linkUrl: '',
        },
        leftText = {
          heading: '',
          content: '',
          color: '#334155',
          fontSize: '14px',
          alignment: 'left',
        },
        rightType = 'text',
        rightText = {
          heading: 'NovaTech Solutions',
          headingSize: '20px',
          headingColor: '#0f172a',
          content: 'Estimado colaborador, te damos una cordial bienvenida a nuestro equipo de trabajo.',
          textColor: '#475569',
          fontSize: '14px',
          lineHeight: '1.5',
          buttonText: '',
          buttonUrl: '',
          buttonBgColor: '#2563eb',
          buttonTextColor: '#ffffff',
          alignment: 'left',
        },
        rightImage = {
          url: '',
          alt: 'Imagen',
          width: '100%',
          maxWidth: '100%',
          borderRadius: '8px',
          alignment: 'center',
          linkUrl: '',
        },
      } = block.data || {};

      let leftWidthPercent = 30;
      let rightWidthPercent = 70;
      if (layout === '50-50') {
        leftWidthPercent = 50;
        rightWidthPercent = 50;
      } else if (layout === '70-30') {
        leftWidthPercent = 70;
        rightWidthPercent = 30;
      } else if (layout === '25-75') {
        leftWidthPercent = 25;
        rightWidthPercent = 75;
      } else if (layout === '40-60') {
        leftWidthPercent = 40;
        rightWidthPercent = 60;
      }

      const gapVal = parseInt(gap, 10) || 16;
      const halfGap = `${Math.round(gapVal / 2)}px`;

      let leftColHtml = '';
      if (leftType === 'image') {
        const imgUrl = sanitizeUrl(leftImage?.url, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80');
        const safeLink = leftImage?.linkUrl ? sanitizeUrl(leftImage.linkUrl, '') : '';
        const align = leftImage?.alignment || 'center';
        const marginCss = align === 'center' ? 'margin: 0 auto;' : align === 'right' ? 'margin-left: auto; margin-right: 0;' : 'margin-right: auto; margin-left: 0;';
        const imgTag = `<img src="${imgUrl}" alt="${escapeHtml(leftImage?.alt || 'Logo')}" width="${(leftImage?.width || '100px').replace('%', '')}" style="display: block; ${marginCss} max-width: ${leftImage?.maxWidth || '120px'}; width: ${leftImage?.width || '100px'}; height: auto; border-radius: ${leftImage?.borderRadius || '8px'}; border: 0; outline: none; text-decoration: none;" />`;
        leftColHtml = safeLink ? `<a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">${imgTag}</a>` : imgTag;
      } else {
        leftColHtml = `
          ${leftText?.heading ? `<h4 style="margin: 0 0 4px 0; font-size: ${leftText.headingSize || '18px'}; font-weight: 700; color: ${leftText.headingColor || '#0f172a'}; font-family: inherit; text-align: ${leftText.alignment || 'left'};">${formatTextContent(leftText.heading)}</h4>` : ''}
          ${leftText?.content ? `<p style="margin: 0; font-size: ${leftText.fontSize || '14px'}; color: ${leftText.color || '#475569'}; line-height: 1.5; font-family: inherit; text-align: ${leftText.alignment || 'left'};">${formatTextContent(leftText.content)}</p>` : ''}
        `;
      }

      let rightColHtml = '';
      if (rightType === 'image') {
        const imgUrl = sanitizeUrl(rightImage?.url, 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80');
        const safeLink = rightImage?.linkUrl ? sanitizeUrl(rightImage.linkUrl, '') : '';
        const align = rightImage?.alignment || 'center';
        const marginCss = align === 'center' ? 'margin: 0 auto;' : align === 'right' ? 'margin-left: auto; margin-right: 0;' : 'margin-right: auto; margin-left: 0;';
        const imgTag = `<img src="${imgUrl}" alt="${escapeHtml(rightImage?.alt || 'Imagen')}" width="${(rightImage?.width || '100%').replace('%', '')}" style="display: block; ${marginCss} max-width: ${rightImage?.maxWidth || '100%'}; width: ${rightImage?.width || '100%'}; height: auto; border-radius: ${rightImage?.borderRadius || '8px'}; border: 0; outline: none; text-decoration: none;" />`;
        rightColHtml = safeLink ? `<a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">${imgTag}</a>` : imgTag;
      } else {
        const btnHtml = rightText?.buttonText ? `
          <div style="margin-top: 10px; text-align: ${rightText.alignment || 'left'};">
            <a href="${sanitizeUrl(rightText.buttonUrl, '#')}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 8px 18px; font-size: 13px; font-weight: 700; color: ${rightText.buttonTextColor || '#ffffff'}; background-color: ${rightText.buttonBgColor || '#2563eb'}; border-radius: 8px; text-decoration: none; font-family: inherit;">
              ${escapeHtml(rightText.buttonText)}
            </a>
          </div>
        ` : '';
        rightColHtml = `
          ${rightText?.heading ? `<h3 style="margin: 0 0 6px 0; font-size: ${rightText.headingSize || '20px'}; font-weight: 700; color: ${rightText.headingColor || '#0f172a'}; font-family: inherit; text-align: ${rightText.alignment || 'left'}; line-height: 1.3;">${formatTextContent(rightText.heading)}</h3>` : ''}
          ${rightText?.content ? `<p style="margin: 0; font-size: ${rightText.fontSize || '14px'}; color: ${rightText.textColor || '#475569'}; line-height: ${rightText.lineHeight || '1.5'}; font-family: inherit; text-align: ${rightText.alignment || 'left'};">${formatTextContent(rightText.content)}</p>` : ''}
          ${btnHtml}
        `;
      }

      const borderCss = borderWidth && borderWidth !== '0px' && borderColor !== 'transparent' ? `border: ${borderWidth} ${borderStyle} ${borderColor};` : '';

      return `
        <tr>
          <td style="padding-top: ${paddingTop}; padding-bottom: ${paddingBottom};">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${backgroundColor}; border-radius: ${borderRadius}; -webkit-border-radius: ${borderRadius}; ${borderCss} border-collapse: separate !important; border-spacing: 0;">
              <tr>
                <td style="padding: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft};">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td class="responsive-cell mobile-center" width="${leftWidthPercent}%" valign="${verticalAlign}" align="${leftImage?.alignment || 'left'}" style="padding-right: ${halfGap};">
                        ${leftColHtml}
                      </td>
                      <td class="responsive-cell mobile-center" width="${rightWidthPercent}%" valign="${verticalAlign}" align="${rightText?.alignment || 'left'}" style="padding-left: ${halfGap};">
                        ${rightColHtml}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }

    case 'table': {
      const {
        headers = ['Servicio / Recurso', 'Usuario / Identificador', 'Clave / Contraseña'],
        rows = [
          ['Red Wi-Fi Oficinas', 'NovaTech_Team', 'Segura2026*'],
          ['Correo Corporativo', 'usuario@novatech.io', 'Temporal#2026'],
          ['Portal de Empleados', 'novatech.io/portal', 'password'],
        ],
        headerBgColor = '#0f172a',
        headerTextColor = '#ffffff',
        rowBgColor = '#ffffff',
        altRowBgColor = '#f8fafc',
        textColor = '#334155',
        borderColor = '#e2e8f0',
        borderWidth = '1px',
        borderRadius = '12px',
        cellPadding = '12px 16px',
        textAlign = 'left',
        fontSize = '13px',
        headerFontSize = '13px',
        headerFontWeight = '700',
        paddingTop = '14px',
        paddingBottom = '14px',
        striped = true,
      } = block.data || {};

      const tableHeadersHtml = headers.map(h => `
        <th align="${textAlign}" style="padding: ${cellPadding}; color: ${headerTextColor}; font-size: ${headerFontSize}; font-weight: ${headerFontWeight}; border-bottom: ${borderWidth} solid ${borderColor}; font-family: inherit; text-align: ${textAlign};">
          ${escapeHtml(h)}
        </th>
      `).join('');

      const tableRowsHtml = rows.map((row, rIdx) => {
        const bg = (striped && rIdx % 2 === 1) ? altRowBgColor : rowBgColor;
        const isLast = rIdx === rows.length - 1;
        const borderBottomCss = isLast ? '' : `border-bottom: ${borderWidth} solid ${borderColor};`;

        const cellsHtml = row.map(cell => `
          <td align="${textAlign}" style="padding: ${cellPadding}; color: ${textColor}; ${borderBottomCss} font-family: inherit; font-size: ${fontSize}; line-height: 1.5; text-align: ${textAlign};">
            ${formatTextContent(cell)}
          </td>
        `).join('');

        return `
          <tr style="background-color: ${bg};" bgcolor="${bg}">
            ${cellsHtml}
          </tr>
        `;
      }).join('');

      return `
        <tr>
          <td style="padding-top: ${paddingTop}; padding-bottom: ${paddingBottom};">
            <!-- Styled Email Data Table -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%" class="responsive-table" style="border-collapse: separate !important; border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; border: ${borderWidth} solid ${borderColor}; border-radius: ${borderRadius}; -webkit-border-radius: ${borderRadius}; overflow: hidden; background-color: ${rowBgColor}; font-size: ${fontSize}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);">
              <thead>
                <tr style="background-color: ${headerBgColor};" bgcolor="${headerBgColor}">
                  ${tableHeadersHtml}
                </tr>
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          </td>
        </tr>
      `;
    }

    default:
      return '';
  }
}

/**
 * Compiles an entire array of blocks and global settings into complete email HTML
 */
export function compileEmailToHtml(blocks, globalSettings = {}) {
  const {
    backgroundColor = '#f1f5f9',
    contentBackgroundColor = '#ffffff',
    contentWidth = '600px',
    borderRadius = '16px',
    fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    textColor = '#1e293b',
    padding = '32px',
  } = globalSettings;

  const rowsHtml = blocks.map(block => compileBlockToHtml(block)).join('\n');

  return `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="responsive-table" style="max-width: ${contentWidth}; margin: 0 auto; border-collapse: separate !important; border-spacing: 0; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: ${contentBackgroundColor}; border-radius: ${borderRadius}; -webkit-border-radius: ${borderRadius}; -moz-border-radius: ${borderRadius}; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02); font-family: ${fontFamily}; color: ${textColor};" bgcolor="${contentBackgroundColor}">
      <tr>
        <td style="padding: ${padding}; background-color: ${contentBackgroundColor}; border-radius: ${borderRadius}; -webkit-border-radius: ${borderRadius}; -moz-border-radius: ${borderRadius};" bgcolor="${contentBackgroundColor}">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border-spacing: 0;">
            ${rowsHtml}
          </table>
        </td>
      </tr>
    </table>
  `.trim();
}

/**
 * Compiles an entire standalone HTML email document including DOCTYPE, head styles,
 * and embedded PrettierMails template metadata for 100% roundtrip fidelity.
 */
export function compileFullEmailHtml({
  blocks = [],
  globalSettings = {},
  subject = 'PrettierMails Email',
  previewText = '',
  includeMetadata = true,
}) {
  const {
    backgroundColor = '#f1f5f9',
    fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } = globalSettings;

  const innerTableHtml = compileEmailToHtml(blocks, globalSettings);

  const metadata = {
    prettierMailsVersion: '1.0',
    exportedAt: new Date().toISOString(),
    subject: subject || '',
    globalSettings,
    blocks,
  };

  const metadataJson = JSON.stringify(metadata, null, 2);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(subject || 'PrettierMails Email')}</title>
  <style type="text/css">
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; background-color: ${backgroundColor}; }
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    @media only screen and (max-width: 620px) {
      .responsive-table {
        width: 100% !important;
        max-width: 100% !important;
      }
      .responsive-cell {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .responsive-img {
        width: 100% !important;
        height: auto !important;
      }
      .mobile-center {
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${backgroundColor}; font-family: ${fontFamily};">
  ${
    previewText
      ? `
    <!-- Hidden preheader text preview -->
    <div style="display: none; font-size: 1px; color: ${backgroundColor}; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
      ${escapeHtml(previewText)}
      &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
    </div>
  `
      : ''
  }
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${backgroundColor}; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        ${innerTableHtml}
      </td>
    </tr>
  </table>

  ${
    includeMetadata
      ? `
  <!-- PRETTIER_MAILS_METADATA_START
${metadataJson}
  PRETTIER_MAILS_METADATA_END -->
  <script type="application/json" id="prettier-mails-template-data">
${metadataJson}
  </script>
  `
      : ''
  }
</body>
</html>`.trim();
}

