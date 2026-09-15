import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const DEFAULT_KEY_SALT = 'prettier-mails-smtp-encryption-key-2026';

/**
 * Derives a 32-byte (256-bit) encryption key from the environment secret
 */
function getMasterKey() {
  const secret = process.env.APP_ENCRYPTION_KEY || DEFAULT_KEY_SALT;
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts plaintext string using AES-256-GCM.
 * Output format: `${ivHex}:${authTagHex}:${encryptedHex}`
 *
 * @param {string} text Plaintext to encrypt
 * @returns {string} Serialized encrypted ciphertext
 */
export function encrypt(text) {
  if (text === null || text === undefined) {
    return null;
  }

  const plainString = String(text);
  if (plainString === '') {
    return '';
  }

  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encryptedBuffer = Buffer.concat([
    cipher.update(plainString, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encryptedBuffer.toString('hex')}`;
}

/**
 * Decrypts AES-256-GCM ciphertext in `${ivHex}:${authTagHex}:${encryptedHex}` format.
 * Throws an error if data is corrupted or authentication tag fails.
 *
 * @param {string} cipherText Serialized encrypted ciphertext
 * @returns {string} Decrypted plaintext
 */
export function decrypt(cipherText) {
  if (!cipherText || typeof cipherText !== 'string') {
    return '';
  }

  const parts = cipherText.split(':');
  if (parts.length !== 3) {
    throw new Error('Formato de cifrado no válido. Se esperaban 3 partes (iv:tag:data).');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getMasterKey();

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encryptedData = Buffer.from(encryptedHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decryptedBuffer = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);

    return decryptedBuffer.toString('utf8');
  } catch (err) {
    throw new Error(`Fallo de descifrado o integridad comprometida: ${err.message}`);
  }
}

/**
 * Masks a secret string for safe display in UI or logs
 *
 * @param {string} secret Plaintext or encrypted secret
 * @returns {string} Masked string
 */
export function maskSecret(secret) {
  if (!secret) return '';
  return '••••••••';
}

export default {
  encrypt,
  decrypt,
  maskSecret,
};
