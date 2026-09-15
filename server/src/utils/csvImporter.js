import { isValidEmail } from '../emailService.js';

/**
 * Auto-detects the most probable delimiter in a CSV text (comma, semicolon, or tab)
 *
 * @param {string} text
 * @returns {string} Delimiter (',', ';', or '\t')
 */
export function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (semicolonCount > commaCount && semicolonCount > tabCount) {
    return ';';
  }
  if (tabCount > commaCount && tabCount > semicolonCount) {
    return '\t';
  }
  return ',';
}

/**
 * Parses a single CSV line into an array of values, respecting quotes and escaped quotes
 *
 * @param {string} line
 * @param {string} delimiter
 * @returns {string[]}
 */
export function parseCsvLine(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Normalizes header string to an alphanumeric identifier
 */
function normalizeHeader(header) {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Maps CSV headers to contact properties
 */
export function mapHeaders(headers) {
  const emailAliases = ['email', 'correo', 'e_mail', 'mail', 'direccion_de_correo', 'correo_electronico'];
  const firstNameAliases = ['first_name', 'firstname', 'nombre', 'name', 'full_name', 'first', 'nombres'];
  const lastNameAliases = ['last_name', 'lastname', 'apellido', 'last', 'apellidos'];
  const subscribedAliases = ['subscribed', 'subscrito', 'suscrito', 'activo', 'optin'];

  const mapping = {
    emailIndex: -1,
    firstNameIndex: -1,
    lastNameIndex: -1,
    subscribedIndex: -1,
    customFieldIndices: [],
  };

  headers.forEach((rawHeader, idx) => {
    const norm = normalizeHeader(rawHeader);

    if (mapping.emailIndex === -1 && emailAliases.includes(norm)) {
      mapping.emailIndex = idx;
    } else if (mapping.firstNameIndex === -1 && firstNameAliases.includes(norm)) {
      mapping.firstNameIndex = idx;
    } else if (mapping.lastNameIndex === -1 && lastNameAliases.includes(norm)) {
      mapping.lastNameIndex = idx;
    } else if (mapping.subscribedIndex === -1 && subscribedAliases.includes(norm)) {
      mapping.subscribedIndex = idx;
    } else if (norm) {
      mapping.customFieldIndices.push({ index: idx, key: norm, rawHeader: rawHeader.trim() });
    }
  });

  return mapping;
}

/**
 * Parses raw CSV string into a structured contacts list
 *
 * @param {string} csvText
 * @param {object} [options]
 * @param {string} [options.delimiter]
 * @returns {{
 *   totalRows: number,
 *   validCount: number,
 *   invalidCount: number,
 *   contacts: Array<object>,
 *   errors: Array<{ row: number, reason: string }>
 * }}
 */
export function parseCsvContacts(csvText, options = {}) {
  if (!csvText || typeof csvText !== 'string') {
    return { totalRows: 0, validCount: 0, invalidCount: 0, contacts: [], errors: [] };
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { totalRows: 0, validCount: 0, invalidCount: 0, contacts: [], errors: [] };
  }

  const delimiter = options.delimiter || detectDelimiter(csvText);
  const headerLine = lines[0];
  const rawHeaders = parseCsvLine(headerLine, delimiter);
  const mapping = mapHeaders(rawHeaders);

  if (mapping.emailIndex === -1) {
    throw new Error(
      'No se encontró una columna de correo electrónico en la cabecera del archivo. Asegúrate de incluir una columna llamada "email" o "correo".'
    );
  }

  const contacts = [];
  const errors = [];
  const seenEmails = new Set();

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1;
    const values = parseCsvLine(lines[i], delimiter);
    const rawEmail = values[mapping.emailIndex] ? values[mapping.emailIndex].trim() : '';

    if (!rawEmail) {
      errors.push({ row: rowNumber, reason: 'Línea sin dirección de correo' });
      continue;
    }

    const cleanEmail = rawEmail.toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      errors.push({ row: rowNumber, email: cleanEmail, reason: 'Formato de correo no válido' });
      continue;
    }

    if (seenEmails.has(cleanEmail)) {
      // Deduplicate within the file
      continue;
    }
    seenEmails.add(cleanEmail);

    const firstName = mapping.firstNameIndex !== -1 ? values[mapping.firstNameIndex] || '' : '';
    const lastName = mapping.lastNameIndex !== -1 ? values[mapping.lastNameIndex] || '' : '';

    let isSubscribed = true;
    if (mapping.subscribedIndex !== -1 && values[mapping.subscribedIndex]) {
      const subVal = values[mapping.subscribedIndex].toLowerCase();
      if (['false', '0', 'no', 'desuscrito', 'inactivo'].includes(subVal)) {
        isSubscribed = false;
      }
    }

    const customFields = {};
    mapping.customFieldIndices.forEach(({ index, key }) => {
      if (values[index] !== undefined && values[index] !== '') {
        customFields[key] = values[index];
      }
    });

    contacts.push({
      email: cleanEmail,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      custom_fields: customFields,
      is_subscribed: isSubscribed,
    });
  }

  return {
    totalRows: lines.length - 1,
    validCount: contacts.length,
    invalidCount: errors.length,
    contacts,
    errors,
  };
}

export default {
  detectDelimiter,
  parseCsvLine,
  mapHeaders,
  parseCsvContacts,
};
