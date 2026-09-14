import juice from 'juice';

/**
 * Wraps inner email content with bulletproof email boilerplate, meta tags, and MSO resets.
 * Inlines CSS styles using juice for maximum compatibility across email clients.
 */
export function renderEmailHtml(contentHtml, options = {}) {
  const {
    title = 'PrettierMails',
    previewText = '',
    backgroundColor = '#f1f5f9',
  } = options;

  // If already a full HTML document, inline styles directly
  if (contentHtml && (/<!DOCTYPE/i.test(contentHtml) || /<html/i.test(contentHtml))) {
    return juice(contentHtml, {
      preserveMediaQueries: true,
      removeStyleTags: false,
      applyAttributesTableElements: true,
    });
  }

  const baseTemplate = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  <style type="text/css">
    /* Reset styles */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; background-color: ${backgroundColor}; }
    
    /* iOS Blue Links */
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    
    /* Responsive styles */
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
<body style="margin: 0; padding: 0; background-color: ${backgroundColor}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  ${previewText ? `
    <!-- Hidden preheader text preview -->
    <div style="display: none; font-size: 1px; color: ${backgroundColor}; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
      ${previewText}
      &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
    </div>
  ` : ''}

  <!-- Main outer container table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: ${backgroundColor}; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <!-- Email Content wrapper -->
        ${contentHtml}
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  // Use juice to inline styles
  return juice(baseTemplate, {
    preserveMediaQueries: true,
    removeStyleTags: false,
    applyAttributesTableElements: true,
  });
}
