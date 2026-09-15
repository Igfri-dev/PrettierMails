/**
 * Escapes unsafe HTML characters to prevent XSS injection in interpolated templates
 *
 * @param {string} str
 * @returns {string}
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

/**
 * Resolves the value of a merge tag from a contact data object
 *
 * @param {string} variable Variable path (e.g. 'first_name', 'email', 'custom.company')
 * @param {object} contact Contact data object
 * @returns {string|null}
 */
function resolveVariable(variable, contact = {}) {
  const normVar = variable.trim().toLowerCase();

  // 1. Direct standard attributes
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

  // 2. Custom fields (e.g. 'custom.company' or 'company')
  const customPrefix = 'custom.';
  let customKey = normVar;
  if (normVar.startsWith(customPrefix)) {
    customKey = normVar.slice(customPrefix.length);
  }

  const customFields = contact.custom_fields || contact.customFields || {};
  if (typeof customFields === 'object' && customFields !== null) {
    // Check case-insensitive key
    const matchedKey = Object.keys(customFields).find(
      (k) => k.toLowerCase() === customKey
    );
    if (matchedKey && customFields[matchedKey] !== undefined && customFields[matchedKey] !== null) {
      return String(customFields[matchedKey]);
    }
  }

  // 3. Root property fallback
  if (contact[customKey] !== undefined && contact[customKey] !== null) {
    return String(contact[customKey]);
  }

  return null;
}

/**
 * Replaces merge tags with contact specific values
 * Supports fallback syntax: `{{first_name|Estimado/a cliente}}`
 *
 * @param {string} content Template HTML or text
 * @param {object} contact Contact details
 * @param {object} [options]
 * @param {boolean} [options.escapeHtmlValues=true] Whether to HTML-escape the inserted value
 * @returns {string} Interpolated content
 */
export function interpolateTemplate(content, contact = {}, options = {}) {
  if (!content || typeof content !== 'string') {
    return '';
  }

  const escapeValues = options.escapeHtmlValues !== false;
  // Regex to match {{ variable | fallback }}
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

    // If no value and no fallback, replace with empty string
    return '';
  });
}

/**
 * Extracts all unique merge tag variables used in a template
 *
 * @param {string} content
 * @returns {Array<{ tag: string, variable: string, fallback: string|null }>}
 */
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
