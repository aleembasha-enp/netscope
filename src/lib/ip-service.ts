import net from 'node:net';
import dns from 'node:dns/promises';
import { IpTrackerResponse } from './types';

export function getIpType(address: string): 'IPv4' | 'IPv6' | null {
  const version = net.isIP(address.trim());
  if (version === 4) return 'IPv4';
  if (version === 6) return 'IPv6';
  return null;
}

export async function resolveDomainToIp(domainOrName: string): Promise<{ ip: string; resolvedDomain: string } | null> {
  let cleaned = domainOrName.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split(':')[0];
  if (!cleaned) return null;

  // If input doesn't have a dot (e.g., "spotify"), check both as-is and with .com
  const candidates = [cleaned];
  if (!cleaned.includes('.')) {
    candidates.push(`${cleaned}.com`);
  }

  for (const candidate of candidates) {
    try {
      const lookup = await dns.lookup(candidate);
      if (lookup && lookup.address) {
        return { ip: lookup.address, resolvedDomain: candidate };
      }
    } catch {
      // Try next candidate
    }
  }

  return null;
}

export function isPrivateOrReservedIp(ip: string): { isPrivate: boolean; isReserved: boolean; reason?: string } {
  const version = getIpType(ip);
  if (!version) return { isPrivate: false, isReserved: false };

  if (version === 'IPv4') {
    const parts = ip.split('.').map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return { isPrivate: false, isReserved: false };
    }

    const [b0, b1] = parts;

    // Loopback 127.0.0.0/8
    if (b0 === 127) {
      return {
        isPrivate: true,
        isReserved: true,
        reason: 'Loopback address (127.0.0.0/8). Points directly to the local host machine.',
      };
    }

    // 0.0.0.0/8
    if (b0 === 0) {
      return {
        isPrivate: false,
        isReserved: true,
        reason: 'Current local network source address (RFC 1122).',
      };
    }

    // RFC 1918 Private: 10.0.0.0/8
    if (b0 === 10) {
      return {
        isPrivate: true,
        isReserved: false,
        reason: 'Private network address (RFC 1918: 10.0.0.0/8). Used within private corporate and home networks.',
      };
    }

    // RFC 1918 Private: 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
    if (b0 === 172 && b1 >= 16 && b1 <= 31) {
      return {
        isPrivate: true,
        isReserved: false,
        reason: 'Private network address (RFC 1918: 172.16.0.0/12). Used within private local networks.',
      };
    }

    // RFC 1918 Private: 192.168.0.0/16
    if (b0 === 192 && b1 === 168) {
      return {
        isPrivate: true,
        isReserved: false,
        reason: 'Private network address (RFC 1918: 192.168.0.0/16). Standard address range for home and office routers.',
      };
    }

    // Link-local: 169.254.0.0/16
    if (b0 === 169 && b1 === 254) {
      return {
        isPrivate: true,
        isReserved: true,
        reason: 'Link-local address (RFC 3927: 169.254.0.0/16). Auto-assigned when DHCP server is not accessible.',
      };
    }

    // Carrier-Grade NAT (RFC 6598: 100.64.0.0/10)
    if (b0 === 100 && b1 >= 64 && b1 <= 127) {
      return {
        isPrivate: true,
        isReserved: true,
        reason: 'Shared Address Space / CGNAT (RFC 6598: 100.64.0.0/10). Used by ISPs for subscriber-side NAT.',
      };
    }

    // Multicast 224.0.0.0/4
    if (b0 >= 224 && b0 <= 239) {
      return {
        isPrivate: false,
        isReserved: true,
        reason: 'Multicast address space (RFC 5771).',
      };
    }

    // Reserved / Future use 240.0.0.0/4
    if (b0 >= 240) {
      return {
        isPrivate: false,
        isReserved: true,
        reason: 'Reserved for future addressing or limited broadcast (RFC 1112).',
      };
    }
  }

  if (version === 'IPv6') {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '0000:0000:0000:0000:0000:0000:0000:0001') {
      return {
        isPrivate: true,
        isReserved: true,
        reason: 'IPv6 loopback address (::1).',
      };
    }

    if (lower === '::' || lower === '0000:0000:0000:0000:0000:0000:0000:0000') {
      return {
        isPrivate: false,
        isReserved: true,
        reason: 'IPv6 unspecified address (::).',
      };
    }

    // Unique Local (fc00::/7, starts with fc or fd)
    if (/^f[cd][0-9a-f]{2}:/i.test(lower)) {
      return {
        isPrivate: true,
        isReserved: false,
        reason: 'IPv6 Unique Local Address (ULA - RFC 4193). Equivalent to IPv4 private addressing.',
      };
    }

    // Link-local (fe80::/10)
    if (/^fe[89ab][0-9a-f]:/i.test(lower)) {
      return {
        isPrivate: true,
        isReserved: true,
        reason: 'IPv6 Link-Local Address (RFC 4291). Non-routable on the public internet.',
      };
    }

    // Multicast (ff00::/8)
    if (/^ff[0-9a-f]{2}:/i.test(lower)) {
      return {
        isPrivate: false,
        isReserved: true,
        reason: 'IPv6 Multicast Address (RFC 4291).',
      };
    }
  }

  return { isPrivate: false, isReserved: false };
}

export async function lookupIp(ipInput: string): Promise<IpTrackerResponse> {
  const ip = ipInput.trim();
  const version = getIpType(ip);

  if (!version) {
    throw new Error(`"${ipInput}" is not a valid IPv4 or IPv6 address.`);
  }

  const { isPrivate, isReserved, reason } = isPrivateOrReservedIp(ip);

  // Attempt reverse DNS PTR lookup
  let hostname: string | null = null;
  try {
    const hostnames = await dns.reverse(ip);
    if (hostnames && hostnames.length > 0) {
      hostname = hostnames[0];
    }
  } catch {
    // Reverse DNS resolution failure is very common and normal for many IPs
    hostname = null;
  }

  const disclaimer = 'Approximate geolocation based on public routing and ISP network assignment. Never indicative of exact individual location.';

  // If private or reserved, do not query external geolocation
  if (isPrivate || isReserved) {
    return {
      ip,
      version,
      isPrivate,
      isReserved,
      hostname,
      geolocation: null,
      network: null,
      disclaimer,
      explanation: reason || 'Private or reserved network address. Public internet geolocation and BGP routing data are not applicable.',
      timestamp: new Date().toISOString(),
    };
  }

  // Check if an external provider token is configured (e.g., IPinfo)
  const ipinfoToken = process.env.IPINFO_TOKEN;

  if (ipinfoToken) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${encodeURIComponent(ipinfoToken)}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const [latStr, lonStr] = (data.loc || '').split(',');
        const lat = latStr ? parseFloat(latStr) : null;
        const lon = lonStr ? parseFloat(lonStr) : null;

        return {
          ip,
          version,
          isPrivate: false,
          isReserved: false,
          hostname: hostname || data.hostname || null,
          geolocation: {
            country: data.country || 'Unknown',
            countryCode: data.country || '',
            region: data.region || 'Unknown',
            city: data.city || 'Unknown',
            postal: data.postal || undefined,
            latitude: isNaN(lat!) ? null : lat,
            longitude: isNaN(lon!) ? null : lon,
            timezone: data.timezone || undefined,
          },
          network: {
            isp: data.org || undefined,
            org: data.org || undefined,
            asn: data.org?.split(' ')[0] || undefined,
          },
          disclaimer,
          timestamp: new Date().toISOString(),
        };
      }
    } catch {
      // Fallback to primary open geolocation service
    }
  }

  // Standard provider fallback: ip-api.com (reliable, standard, non-commercial educational use)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return {
          ip,
          version,
          isPrivate: false,
          isReserved: false,
          hostname,
          geolocation: {
            country: data.country || 'Unknown',
            countryCode: data.countryCode || '',
            region: data.regionName || data.region || 'Unknown',
            city: data.city || 'Unknown',
            postal: data.zip || undefined,
            latitude: typeof data.lat === 'number' ? data.lat : null,
            longitude: typeof data.lon === 'number' ? data.lon : null,
            timezone: data.timezone || undefined,
          },
          network: {
            isp: data.isp || undefined,
            org: data.org || undefined,
            asn: data.as || undefined,
          },
          disclaimer,
          timestamp: new Date().toISOString(),
        };
      } else if (data.message === 'reserved range' || data.message === 'private range') {
        return {
          ip,
          version,
          isPrivate: true,
          isReserved: true,
          hostname,
          geolocation: null,
          network: null,
          disclaimer,
          explanation: 'Address is in a reserved or private routing range. No public geolocation data exists.',
          timestamp: new Date().toISOString(),
        };
      }
    }
  } catch {
    // If request fails
  }

  // Secondary fallback provider: ipapi.co
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NetScope-DNS-Tracker/1.0',
        Accept: 'application/json',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (!data.error) {
        return {
          ip,
          version,
          isPrivate: false,
          isReserved: false,
          hostname: hostname || null,
          geolocation: {
            country: data.country_name || 'Unknown',
            countryCode: data.country_code || '',
            region: data.region || 'Unknown',
            city: data.city || 'Unknown',
            postal: data.postal || undefined,
            latitude: typeof data.latitude === 'number' ? data.latitude : null,
            longitude: typeof data.longitude === 'number' ? data.longitude : null,
            timezone: data.timezone || undefined,
          },
          network: {
            isp: data.org || undefined,
            org: data.org || undefined,
            asn: data.asn || undefined,
          },
          disclaimer,
          timestamp: new Date().toISOString(),
        };
      }
    }
  } catch {
    // Fallback if all providers unavailable
  }

  // Graceful return if providers are unreachable or rate-limited
  return {
    ip,
    version,
    isPrivate: false,
    isReserved: false,
    hostname,
    geolocation: null,
    network: null,
    disclaimer,
    explanation: 'External geolocation provider is currently unreachable or rate limited. Basic IP validation and reverse DNS succeeded.',
    timestamp: new Date().toISOString(),
  };
}
