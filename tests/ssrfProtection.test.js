import { describe, it, expect } from 'vitest';
import {
  isPrivateIpv4,
  isPrivateIpv6,
  isIpPrivate,
  validateSmtpHost,
  validateSmtpHostWithDns,
} from '../server/src/utils/ssrfProtection.js';

describe('SSRF Protection & Host Validation Utility', () => {
  it('identifies RFC 1918 and loopback IPv4 addresses as private', () => {
    expect(isPrivateIpv4('127.0.0.1')).toBe(true);
    expect(isPrivateIpv4('127.255.255.255')).toBe(true);
    expect(isPrivateIpv4('10.0.0.1')).toBe(true);
    expect(isPrivateIpv4('10.254.12.3')).toBe(true);
    expect(isPrivateIpv4('172.16.0.1')).toBe(true);
    expect(isPrivateIpv4('172.31.255.255')).toBe(true);
    expect(isPrivateIpv4('192.168.1.100')).toBe(true);
    expect(isPrivateIpv4('169.254.169.254')).toBe(true); // AWS/GCP cloud metadata
    expect(isPrivateIpv4('100.64.0.1')).toBe(true); // Carrier Grade NAT
    expect(isPrivateIpv4('0.0.0.0')).toBe(true);
  });

  it('allows public IPv4 addresses', () => {
    expect(isPrivateIpv4('8.8.8.8')).toBe(false);
    expect(isPrivateIpv4('1.1.1.1')).toBe(false);
    expect(isPrivateIpv4('142.250.190.46')).toBe(false);
    expect(isPrivateIpv4('172.32.0.1')).toBe(false); // Outside 172.16-31
    expect(isPrivateIpv4('192.169.1.1')).toBe(false); // Outside 192.168
  });

  it('identifies IPv6 loopback, link-local, and ULA as private', () => {
    expect(isPrivateIpv6('::1')).toBe(true);
    expect(isPrivateIpv6('0:0:0:0:0:0:0:1')).toBe(true);
    expect(isPrivateIpv6('fe80::1')).toBe(true);
    expect(isPrivateIpv6('fc00::1')).toBe(true);
    expect(isPrivateIpv6('fd12:3456:789a::1')).toBe(true);
    expect(isPrivateIpv6('::ffff:127.0.0.1')).toBe(true); // IPv4-mapped loopback
    expect(isPrivateIpv6('::ffff:192.168.1.1')).toBe(true); // IPv4-mapped private
  });

  it('validates public domain names and rejects dangerous hosts in validateSmtpHost', () => {
    expect(validateSmtpHost('smtp.gmail.com')).toBe('smtp.gmail.com');
    expect(validateSmtpHost('mail.example.org')).toBe('mail.example.org');
    expect(validateSmtpHost('email-smtp.us-east-1.amazonaws.com')).toBe('email-smtp.us-east-1.amazonaws.com');

    // Blocked host patterns
    expect(() => validateSmtpHost('localhost')).toThrow(/red privada/i);
    expect(() => validateSmtpHost('127.0.0.1')).toThrow(/red privada/i);
    expect(() => validateSmtpHost('169.254.169.254')).toThrow(/red privada/i);
    expect(() => validateSmtpHost('service.local')).toThrow(/red privada/i);
    expect(() => validateSmtpHost('server.internal')).toThrow(/red privada/i);
  });

  it('detects DNS rebinding / private resolution via validateSmtpHostWithDns', async () => {
    // Custom resolver simulating DNS resolution to a private internal IP
    const mockMaliciousResolver = async () => ['192.168.1.50'];

    await expect(
      validateSmtpHostWithDns('malicious-domain.com', { resolveDns: mockMaliciousResolver })
    ).rejects.toThrow(/Protección SSRF.*192\.168\.1\.50/i);

    // Custom resolver simulating DNS resolution to a public IP
    const mockSafeResolver = async () => ['142.250.190.46'];
    const result = await validateSmtpHostWithDns('safe-domain.com', { resolveDns: mockSafeResolver });
    expect(result).toBe('safe-domain.com');
  });
});
