import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../server/src/utils/crypto.js';

describe('Crypto & Auth Utilities', () => {
  it('hashes a password with unique random salt', async () => {
    const password = 'SuperSecretPassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).toContain(':');
    expect(hash2).toContain(':');
    // Different salts mean different hashes
    expect(hash1).not.toBe(hash2);

    const [salt1] = hash1.split(':');
    const [salt2] = hash2.split(':');
    expect(salt1).not.toBe(salt2);
  });

  it('verifies correct passwords and rejects incorrect ones', async () => {
    const password = 'MySecurePassphrase$2026';
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isWrong = await verifyPassword('WrongPassword', hash);
    expect(isWrong).toBe(false);

    const isGarbage = await verifyPassword(password, 'invalid-hash-format');
    expect(isGarbage).toBe(false);
  });

  it('signs and verifies HMAC-SHA256 JWT tokens', () => {
    const payload = { userId: 'usr-123', email: 'test@example.com', role: 'owner' };
    const token = signToken(payload);

    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = verifyToken(token);
    expect(decoded.userId).toBe('usr-123');
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.role).toBe('owner');
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  it('rejects tampered tokens', () => {
    const payload = { userId: 'usr-123', role: 'viewer' };
    const token = signToken(payload);

    const parts = token.split('.');
    // Tamper with payload
    const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'usr-123', role: 'owner' })).toString('base64');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    expect(() => verifyToken(tamperedToken)).toThrow();
  });

  it('rejects expired tokens', () => {
    const payload = { userId: 'usr-expired' };
    // Set negative expiry
    const token = signToken(payload, undefined, -10000);

    expect(() => verifyToken(token)).toThrow(/expirado/i);
  });
});
