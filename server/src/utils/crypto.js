import crypto from 'crypto';

const DEFAULT_SECRET = process.env.JWT_SECRET || 'prettier-mails-secret-key-production-2026';
const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash a plain password using crypto.scrypt with a random salt
 * @param {string} password
 * @returns {Promise<string>} Format: `${saltHex}:${derivedKeyHex}`
 */
export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

/**
 * Verify a plain password against a stored scrypt hash
 * @param {string} password
 * @param {string} storedHash Format: `${saltHex}:${derivedKeyHex}`
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== 'string') {
    return false;
  }

  const parts = storedHash.split(':');
  if (parts.length !== 2) {
    return false;
  }

  const [salt, originalKeyHex] = parts;
  const originalKeyBuffer = Buffer.from(originalKeyHex, 'hex');

  return new Promise((resolve) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        const match = crypto.timingSafeEqual(originalKeyBuffer, derivedKey);
        resolve(match);
      } catch {
        resolve(false);
      }
    });
  });
}

/**
 * Base64 URL encode helper
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Base64 URL decode helper
 */
function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

/**
 * Generate a signed JWT-compatible token using HMAC-SHA256
 * @param {object} payload
 * @param {string} [secret]
 * @param {number} [expiresInMs]
 * @returns {string} token
 */
export function signToken(payload, secret = DEFAULT_SECRET, expiresInMs = TOKEN_EXPIRY_MS) {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Date.now();
  const tokenPayload = {
    ...payload,
    iat: Math.floor(now / 1000),
    exp: Math.floor((now + expiresInMs) / 1000),
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dataToSign}.${signature}`;
}

/**
 * Verify and decode an HMAC-SHA256 JWT token
 * @param {string} token
 * @param {string} [secret]
 * @returns {object} payload
 */
export function verifyToken(token, secret = DEFAULT_SECRET) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token no proporcionado o inválido');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Estructura de token inválida');
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sigBuffer = Buffer.from(signature);
  const expectedSigBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
    throw new Error('Firma de token inválida');
  }

  const payloadJson = base64UrlDecode(encodedPayload);
  const payload = JSON.parse(payloadJson);

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('El token ha expirado');
  }

  return payload;
}

export default {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
};
