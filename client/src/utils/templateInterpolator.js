/**
 * Client-side Template Interpolator for live previewing merge tags in Studio
 */

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveVariable(variable, contact = {}) {
  const normVar = variable.trim().toLowerCase();

  if (normVar === 'email') {
    return contact.email || '';
  }

  if (normVar === 'first_name' || normVar === 'firstname') {
    return contact.first_name || contact.firstName || '';
  }

  if (normVar === 'last_name' || normVar === 'lastname') {
    return contact.last_name || contact.lastName || '';
  }

  if (normVar === 'name') {
    const fn = contact.first_name || contact.firstName || '';
    const ln = contact.last_name || contact.lastName || '';
    if (fn && ln) return `${fn} ${ln}`;
    if (fn) return fn;
    if (contact.name) return contact.name;
    return '';
  }

  const customPrefix = 'custom.';
  let customKey = normVar;
  if (normVar.startsWith(customPrefix)) {
    customKey = normVar.slice(customPrefix.length);
  }

  const customFields = contact.custom_fields || contact.customFields || {};
  if (typeof customFields === 'object' && customFields !== null) {
    const matchedKey = Object.keys(customFields).find(
      (k) => k.toLowerCase() === customKey
    );
    if (matchedKey && customFields[matchedKey] !== undefined && customFields[matchedKey] !== null) {
      return String(customFields[matchedKey]);
    }
  }

  if (contact[customKey] !== undefined && contact[customKey] !== null) {
    return String(contact[customKey]);
  }

  return null;
}

export function interpolateTemplate(content, contact = {}, options = {}) {
  if (!content || typeof content !== 'string') {
    return '';
  }

  const escapeValues = options.escapeHtmlValues !== false;
  const MERGE_TAG_REGEX = /\{\{\s*([a-zA-Z0-9_.]+)(?:\|([^}]+))?\s*\}\}/g;

  return content.replace(MERGE_TAG_REGEX, (match, variable, fallback) => {
    const value = resolveVariable(variable, contact);

    if (value !== null && value !== '') {
      return escapeValues ? escapeHtml(value) : value;
    }

    if (fallback !== undefined && fallback !== null) {
      const trimmedFallback = fallback.trim();
      return escapeValues ? escapeHtml(trimmedFallback) : trimmedFallback;
    }

    return '';
  });
}

export function extractMergeTags(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const MERGE_TAG_REGEX = /\{\{\s*([a-zA-Z0-9_.]+)(?:\|([^}]+))?\s*\}\}/g;
  const tagsMap = new Map();

  let match;
  while ((match = MERGE_TAG_REGEX.exec(content)) !== null) {
    const [raw, variable, fallback] = match;
    const cleanVar = variable.trim();
    if (!tagsMap.has(cleanVar)) {
      tagsMap.set(cleanVar, {
        tag: raw,
        variable: cleanVar,
        fallback: fallback ? fallback.trim() : null,
      });
    }
  }

  return Array.from(tagsMap.values());
}

export default {
  escapeHtml,
  interpolateTemplate,
  extractMergeTags,
};
