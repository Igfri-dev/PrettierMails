import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, maskSecret } from '../server/src/utils/encryption.js';

describe('AES-256-GCM Encryption Utility', () => {
  it('encrypts plaintext into iv:authTag:ciphertext format', () => {
    const plain = 'super_secret_smtp_password_123';
    const encrypted = encrypt(plain);

    expect(encrypted).toBeTypeOf('string');
    const parts = encrypted.split(':');
    expect(parts).toHaveLength(3);

    const [iv, authTag, data] = parts;
    expect(iv).toHaveLength(24); // 12 bytes in hex = 24 chars
    expect(authTag).toHaveLength(32); // 16 bytes in hex = 32 chars
    expect(data.length).toBeGreaterThan(0);
  });

  it('generates different ciphertexts for the same plaintext due to random IV', () => {
    const plain = 'my_password';
    const enc1 = encrypt(plain);
    const enc2 = encrypt(plain);

    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1)).toBe(plain);
    expect(decrypt(enc2)).toBe(plain);
  });

  it('decrypts correctly back to original text', () => {
    const phrases = [
      'simple',
      'Complex P@$$w0rd!#%^&*()_+=~`',
      'UTF-8: ñandú, español, 🚀, 日本語',
      'A very long secret text that spans multiple AES blocks '.repeat(10),
    ];

    for (const phrase of phrases) {
      const encrypted = encrypt(phrase);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(phrase);
    }
  });

  it('rejects tampered ciphertext with an authentication tag failure', () => {
    const encrypted = encrypt('sensitive_data');
    const parts = encrypted.split(':');

    // Alter one character in the ciphertext data
    const lastChar = parts[2].slice(-1);
    const alteredChar = lastChar === 'a' ? 'b' : 'a';
    const tamperedData = parts[2].slice(0, -1) + alteredChar;
    const tamperedEncrypted = `${parts[0]}:${parts[1]}:${tamperedData}`;

    expect(() => decrypt(tamperedEncrypted)).toThrow(/integridad comprometida/i);
  });

  it('rejects tampered auth tag', () => {
    const encrypted = encrypt('sensitive_data');
    const parts = encrypted.split(':');

    // Corrupt auth tag
    const corruptedTag = '00'.repeat(16);
    const tamperedEncrypted = `${parts[0]}:${corruptedTag}:${parts[2]}`;

    expect(() => decrypt(tamperedEncrypted)).toThrow(/integridad comprometida/i);
  });

  it('handles empty and null inputs safely', () => {
    expect(encrypt('')).toBe('');
    expect(encrypt(null)).toBeNull();
    expect(decrypt('')).toBe('');
    expect(decrypt(null)).toBe('');
  });

  it('masks secrets securely', () => {
    expect(maskSecret('secret123')).toBe('••••••••');
    expect(maskSecret('')).toBe('');
    expect(maskSecret(null)).toBe('');
  });
});
