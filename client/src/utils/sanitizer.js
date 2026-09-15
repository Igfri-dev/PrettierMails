/**
 * PrettierMails Security & Sanitization Utilities
 */

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function sanitizeUrl(url, fallback = '#') {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  return fallback;
}

export function sanitizeColor(color, fallback = '#000000') {
  if (!color || typeof color !== 'string') return fallback;
  const trimmed = color.trim();
  if (/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return trimmed;
  }
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/i.test(trimmed)) {
    return trimmed;
  }
  if (/^[a-zA-Z]+$/.test(trimmed)) {
    return trimmed;
  }
  return fallback;
}

export function sanitizeCssValue(val, fallback = '0px') {
  if (!val || typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (/^[0-9a-zA-Z\s.,%#_-]+$/.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  return fallback;
}

export function escapeJsonForHtml(jsonStr) {
  if (typeof jsonStr !== 'string') return '';
  return jsonStr
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
