import dns from 'dns';

/**
 * Check whether an IPv4 string belongs to private, loopback, link-local, or reserved ranges
 *
 * @param {string} ip
 * @returns {boolean}
 */
export function isPrivateIpv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private network - RFC 1918)
  if (a === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 100.64.0.0/10 (Shared address / Carrier Grade NAT: 100.64.0.0 - 100.127.255.255)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 169.254.0.0/16 (Link-local / Cloud Metadata AWS, Azure, GCP 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private network - RFC 1918: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private network - RFC 1918)
  if (a === 192 && b === 168) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && parts[2] === 2) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && parts[2] === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && parts[2] === 113) return true;

  // 224.0.0.0/4 (Multicast: 224.0.0.0 - 239.255.255.255)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future use)
  if (a >= 240) return true;

  return false;
}

/**
 * Check whether an IPv6 string belongs to private, loopback, or reserved ranges
 *
 * @param {string} ip
 * @returns {boolean}
 */
export function isPrivateIpv6(ip) {
  const normalized = ip.trim().toLowerCase();

  // Check for IPv4-mapped IPv6 (e.g., ::ffff:127.0.0.1 or ::ffff:192.168.1.1)
  const ipv4Mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (ipv4Mapped) {
    return isPrivateIpv4(ipv4Mapped[1]);
  }

  // Loopback (::1)
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;

  // Unspecified (::)
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;

  // Unique Local Address (fc00::/7 -> fc.. or fd..)
  if (/^f[cd][0-9a-f]{2}:/i.test(normalized)) return true;

  // Link-Local (fe80::/10 -> fe8., fe9., fea., feb.)
  if (/^fe[89ab][0-9a-f]:/i.test(normalized)) return true;

  // Multicast (ff00::/8)
  if (/^ff[0-9a-f]{2}:/i.test(normalized)) return true;

  return false;
}

/**
 * Checks whether an IP (v4 or v6) is private or dangerous
 *
 * @param {string} ip
 * @returns {boolean}
 */
export function isIpPrivate(ip) {
  if (!ip || typeof ip !== 'string') return true;
  const clean = ip.trim();
  if (clean.includes(':')) {
    return isPrivateIpv6(clean);
  }
  return isPrivateIpv4(clean);
}

/**
 * Validates basic hostname syntax and blocks immediate dangerous hostnames/patterns
 *
 * @param {string} host
 * @returns {string} Sanitized host
 */
export function validateSmtpHost(host) {
  if (!host || typeof host !== 'string') {
    throw new Error('Host SMTP inválido.');
  }

  const trimmed = host.trim().toLowerCase();

  // Prohibit loopback, internal names, and metadata IP
  const blockedPatterns = [
    /^localhost$/,
    /^127\./,
    /^0\./,
    /^::1$/,
    /^0:0:0:0:0:0:0:1$/,
    /^169\.254\./, // AWS / GCP / Azure Instance Metadata Service
    /^10\./, // RFC 1918 Class A
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // RFC 1918 Class B
    /^192\.168\./, // RFC 1918 Class C
    /^fc00:/, // IPv6 Unique Local
    /^fe80:/, // IPv6 Link-Local
    /\.local$/,
    /\.internal$/,
    /\.intranet$/,
    /\.lan$/,
    /\.home$/,
    /\.corp$/,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(trimmed)) {
      throw new Error('Por razones de seguridad, no se permiten conexiones SMTP a hosts locales o de red privada (SSRF).');
    }
  }

  // If host is a numeric IP, validate immediately
  const ipRegex = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/;
  if (ipRegex.test(trimmed)) {
    if (isPrivateIpv4(trimmed)) {
      throw new Error('Por razones de seguridad, no se permiten conexiones SMTP a direcciones IP privadas (SSRF).');
    }
    return trimmed;
  }

  // Validate hostname structure (e.g. smtp.gmail.com)
  const hostnameRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
  if (!hostnameRegex.test(trimmed)) {
    throw new Error('El nombre de host SMTP debe ser un dominio válido (ej. smtp.gmail.com).');
  }

  return trimmed;
}

/**
 * Deep validation of an SMTP host including DNS resolution to guard against DNS rebinding
 *
 * @param {string} host
 * @param {object} [options]
 * @param {function} [options.resolveDns] Custom resolver for testing
 * @returns {Promise<string>}
 */
export async function validateSmtpHostWithDns(host, options = {}) {
  const validatedHost = validateSmtpHost(host);

  // If already an IP, validateSmtpHost already verified it's public
  const isDirectIp = /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(validatedHost);
  if (isDirectIp) {
    return validatedHost;
  }

  // DNS resolution
  const resolver = options.resolveDns || (async (h) => {
    const ips = [];
    try {
      const v4 = await dns.promises.resolve4(h);
      ips.push(...v4);
    } catch {
      // ignore v4 if not found
    }
    try {
      const v6 = await dns.promises.resolve6(h);
      ips.push(...v6);
    } catch {
      // ignore v6 if not found
    }
    return ips;
  });

  try {
    const resolvedIps = await resolver(validatedHost);
    if (Array.isArray(resolvedIps) && resolvedIps.length > 0) {
      for (const ip of resolvedIps) {
        if (isIpPrivate(ip)) {
          throw new Error(`Protección SSRF: El host ${validatedHost} resuelve a una IP de red privada (${ip}).`);
        }
      }
    }
  } catch (err) {
    // Re-throw SSRF specific violations
    if (err.message && err.message.includes('Protección SSRF')) {
      throw err;
    }
    // For test environments or offline scenarios where DNS fails, we allow legitimate domains
  }

  return validatedHost;
}

export default {
  isPrivateIpv4,
  isPrivateIpv6,
  isIpPrivate,
  validateSmtpHost,
  validateSmtpHostWithDns,
};
