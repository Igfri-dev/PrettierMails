/**
 * Email Tracking Engine: Open Pixels & Click Rewriting
 */

// 1x1 transparent GIF buffer (43 bytes)
export const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * Validates that a redirection URL is a safe external HTTP or HTTPS URL to prevent Open Redirect vulnerabilities
 *
 * @param {string} targetUrl
 * @returns {boolean}
 */
export function isValidRedirectUrl(targetUrl) {
  if (!targetUrl || typeof targetUrl !== 'string') return false;

  const trimmed = targetUrl.trim();
  // Must begin with http:// or https://
  if (!/^https?:\/\//i.test(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Injects a 1x1 invisible tracking pixel image tag into the email HTML
 *
 * @param {string} html
 * @param {object} options
 * @param {string} options.campaignId
 * @param {string} [options.contactId='anon']
 * @param {string} [options.baseUrl='']
 * @returns {string}
 */
export function injectTrackingPixel(html, { campaignId, contactId = 'anon', baseUrl = '' }) {
  if (!html || typeof html !== 'string') return '';
  if (!campaignId) return html;

  const cleanBase = (baseUrl || '').replace(/\/+$/, '');
  const pixelUrl = `${cleanBase}/api/track/open/${encodeURIComponent(campaignId)}/${encodeURIComponent(contactId)}`;
  const pixelTag = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none!important;width:1px!important;height:1px!important;max-height:0!important;max-width:0!important;opacity:0!important;overflow:hidden!important;mso-hide:all;" />`;

  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixelTag}\n</body>`);
  }

  return `${html}\n${pixelTag}`;
}

/**
 * Rewrites hyperlinks inside email HTML to route through the tracking endpoint
 *
 * @param {string} html
 * @param {object} options
 * @param {string} options.campaignId
 * @param {string} [options.contactId='anon']
 * @param {string} [options.baseUrl='']
 * @returns {string}
 */
export function rewriteLinksForTracking(html, { campaignId, contactId = 'anon', baseUrl = '' }) {
  if (!html || typeof html !== 'string') return '';
  if (!campaignId) return html;

  const cleanBase = (baseUrl || '').replace(/\/+$/, '');
  const clickEndpoint = `${cleanBase}/api/track/click/${encodeURIComponent(campaignId)}/${encodeURIComponent(contactId)}`;

  // Matches <a ... href="..." ...>
  return html.replace(/<a\s+([^>]*?)href=(["'])(.*?)\2([^>]*?)>/gi, (match, beforeHref, quote, originalUrl, afterHref) => {
    const trimmed = originalUrl.trim();

    // Skip mailto, tel, anchors (#), or already tracked URLs
    if (
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.toLowerCase().startsWith('mailto:') ||
      trimmed.toLowerCase().startsWith('tel:') ||
      trimmed.includes('/api/track/click/')
    ) {
      return match;
    }

    const trackedHref = `${clickEndpoint}?url=${encodeURIComponent(trimmed)}`;
    return `<a ${beforeHref}href=${quote}${trackedHref}${quote}${afterHref}>`;
  });
}

export default {
  TRANSPARENT_GIF,
  isValidRedirectUrl,
  injectTrackingPixel,
  rewriteLinksForTracking,
};
