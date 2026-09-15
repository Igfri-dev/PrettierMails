import registry from '../blocks/registry.js';
import {
  escapeHtml,
  sanitizeUrl,
  sanitizeColor,
  sanitizeCssValue,
  escapeJsonForHtml,
} from './sanitizer.js';
import { formatTextContent } from '../blocks/blockHelpers.jsx';

export {
  escapeHtml,
  sanitizeUrl,
  sanitizeColor,
  sanitizeCssValue,
  escapeJsonForHtml,
  formatTextContent,
};

/**
 * Compiles a single block into an email HTML table row/cell using the modular registry
 * @param {Object} block
 * @param {Object} [globalSettings]
 * @returns {string}
 */
export function compileBlockToHtml(block, globalSettings = {}) {
  if (!block || !block.type) return '';
  return registry.compileBlock(block, globalSettings);
}

/**
 * Compiles an entire array of blocks and global settings into complete email inner table HTML
 * @param {Array<Object>} blocks
 * @param {Object} [globalSettings]
 * @returns {string}
 */
export function compileEmailToHtml(blocks = [], globalSettings = {}) {
  const {
    contentBackgroundColor = '#ffffff',
    contentWidth = '600px',
    borderRadius = '16px',
    fontFamily = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    textColor = '#1e293b',
    padding = '32px',
  } = globalSettings;

  const rowsHtml = blocks.map((block) => compileBlockToHtml(block, globalSettings)).join('\n');

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

  const safeBgColor = sanitizeColor(backgroundColor, '#f1f5f9');
  const innerTableHtml = compileEmailToHtml(blocks, globalSettings);

  const metadata = {
    prettierMailsVersion: '1.0',
    exportedAt: new Date().toISOString(),
    subject: subject || '',
    globalSettings,
    blocks,
  };

  const metadataJson = JSON.stringify(metadata, null, 2);
  const safeMetadataJson = escapeJsonForHtml(metadataJson);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <title>${escapeHtml(subject || 'PrettierMails Email')}</title>
  <style type="text/css">
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; background-color: ${safeBgColor}; }
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
      .video-thumbnail-container {
        height: 220px !important;
      }
      .mobile-center {
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${safeBgColor}; font-family: ${fontFamily};">
  ${
    previewText
      ? `
    <!-- Hidden preheader text preview -->
    <div style="display: none; font-size: 1px; color: ${safeBgColor}; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
      ${escapeHtml(previewText)}
      &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
    </div>
  `
      : ''
  }
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${safeBgColor}; table-layout: fixed;">
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
${safeMetadataJson}
  PRETTIER_MAILS_METADATA_END -->
  <script type="application/json" id="prettier-mails-template-data">
${safeMetadataJson}
  </script>
  `
      : ''
  }
</body>
</html>`.trim();
}
