import dns from 'node:dns/promises';
import { DnsLookupResponse, DnsRecordItem, DnsRecordType } from './types';

export function normalizeDomain(input: string): string {
  let cleaned = input.trim().toLowerCase();
  // Strip protocol
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  // Strip path and query parameters
  cleaned = cleaned.split('/')[0];
  // Strip port
  cleaned = cleaned.split(':')[0];
  // Strip trailing dot
  cleaned = cleaned.replace(/\.$/, '');
  return cleaned;
}

export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  // RFC 1035 / RFC 1123 compliant domain regex
  const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]{1,63}\.)+[a-zA-Z]{2,63}$/;
  return domainRegex.test(domain);
}

export async function lookupDns(domainInput: string, recordType: DnsRecordType = 'ALL'): Promise<DnsLookupResponse> {
  const startTime = Date.now();
  const domain = normalizeDomain(domainInput);

  if (!isValidDomain(domain)) {
    throw new Error(`Invalid domain format: "${domainInput}". Please enter a valid domain like "example.com".`);
  }

  const records: DnsRecordItem[] = [];
  const resolvedIPs: string[] = [];

  const typesToQuery: Array<Exclude<DnsRecordType, 'ALL'>> = 
    recordType === 'ALL'
      ? ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'CAA']
      : [recordType as Exclude<DnsRecordType, 'ALL'>];

  const queryPromises = typesToQuery.map(async (type) => {
    try {
      switch (type) {
        case 'A': {
          const res = await dns.resolve4(domain, { ttl: true });
          res.forEach((item) => {
            records.push({
              type: 'A',
              name: domain,
              value: item.address,
              ttl: item.ttl,
            });
            resolvedIPs.push(item.address);
          });
          break;
        }

        case 'AAAA': {
          const res = await dns.resolve6(domain, { ttl: true });
          res.forEach((item) => {
            records.push({
              type: 'AAAA',
              name: domain,
              value: item.address,
              ttl: item.ttl,
            });
            resolvedIPs.push(item.address);
          });
          break;
        }

        case 'MX': {
          const res = await dns.resolveMx(domain);
          res.forEach((item) => {
            const hostDisplay = item.exchange && item.exchange.trim() ? item.exchange : 'Null MX (RFC 7505)';
            records.push({
              type: 'MX',
              name: domain,
              value: `${hostDisplay} (Priority: ${item.priority})`,
              priority: item.priority,
              exchange: item.exchange,
            });
          });
          break;
        }

        case 'NS': {
          const res = await dns.resolveNs(domain);
          res.forEach((ns) => {
            records.push({
              type: 'NS',
              name: domain,
              value: ns,
            });
          });
          break;
        }

        case 'TXT': {
          const res = await dns.resolveTxt(domain);
          res.forEach((txtChunks) => {
            records.push({
              type: 'TXT',
              name: domain,
              value: txtChunks.join(''),
            });
          });
          break;
        }

        case 'CNAME': {
          const res = await dns.resolveCname(domain);
          res.forEach((cname) => {
            records.push({
              type: 'CNAME',
              name: domain,
              value: cname,
            });
          });
          break;
        }

        case 'SOA': {
          const res = await dns.resolveSoa(domain);
          if (res) {
            records.push({
              type: 'SOA',
              name: domain,
              value: `Primary NS: ${res.nsname}, Admin: ${res.hostmaster}, Serial: ${res.serial}`,
              nsname: res.nsname,
              hostmaster: res.hostmaster,
              serial: res.serial,
              refresh: res.refresh,
              retry: res.retry,
              expire: res.expire,
              minttl: res.minttl,
            });
          }
          break;
        }

        case 'CAA': {
          const res = await dns.resolveCaa(domain);
          res.forEach((caa) => {
            records.push({
              type: 'CAA',
              name: domain,
              value: `${caa.critical ? 'critical ' : ''}${caa.issue || caa.issuewild || caa.iodef || ''}`,
            });
          });
          break;
        }

        case 'SRV': {
          const res = await dns.resolveSrv(domain);
          res.forEach((srv) => {
            records.push({
              type: 'SRV',
              name: domain,
              value: `${srv.name}:${srv.port} (Priority: ${srv.priority}, Weight: ${srv.weight})`,
              priority: srv.priority,
              weight: srv.weight,
              port: srv.port,
              target: srv.name,
            });
          });
          break;
        }
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      // Normal expected codes when a domain does not have that specific record type
      if (code === 'ENODATA' || code === 'ENOTFOUND' || code === 'ENOENT') {
        return;
      }
      // If querying single specific type and it errors, let the caller know
      if (recordType !== 'ALL') {
        throw err;
      }
    }
  });

  // Ensure bounded execution with 8000ms timeout guard
  const timeoutPromise = new Promise((_, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`DNS resolution timed out after 8000ms. Nameservers for "${domain}" did not respond in time.`));
    }, 8000);
    if (typeof timer.unref === 'function') timer.unref();
  });

  await Promise.race([Promise.allSettled(queryPromises), timeoutPromise]);

  // If specific single type was requested and produced 0 records, verify if domain exists at all
  if (recordType !== 'ALL' && records.length === 0) {
    try {
      // Check if domain resolves to anything
      await dns.lookup(domain);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'ENOTFOUND') {
        throw new Error(`Domain "${domain}" could not be resolved (NXDOMAIN). The domain does not exist or has no active DNS zone.`);
      }
    }
  } else if (recordType === 'ALL' && records.length === 0) {
    // Check if domain exists
    try {
      await dns.lookup(domain);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'ENOTFOUND') {
        throw new Error(`Domain "${domain}" could not be resolved (NXDOMAIN). Please check spelling and domain registration.`);
      }
      throw new Error(`DNS resolution failed for "${domain}": ${code || 'Unknown DNS error'}`);
    }
  }

  // Deduplicate resolved IPs
  const uniqueResolvedIPs = Array.from(new Set(resolvedIPs));

  // Determine found types
  const typesFound = Array.from(new Set(records.map((r) => r.type)));

  // If we didn't get A/AAAA in records but domain resolved via dns.lookup fallback
  if (uniqueResolvedIPs.length === 0) {
    try {
      const fallback = await dns.lookup(domain, { all: true });
      fallback.forEach((item) => {
        if (!uniqueResolvedIPs.includes(item.address)) {
          uniqueResolvedIPs.push(item.address);
        }
      });
    } catch {
      // Ignore fallback error
    }
  }

  const durationMs = Date.now() - startTime;

  return {
    domain,
    queryType: recordType,
    timestamp: new Date().toISOString(),
    durationMs,
    resolvedIPs: uniqueResolvedIPs,
    records,
    summary: {
      totalRecords: records.length,
      recordTypesFound: typesFound,
    },
    nameserversUsed: dns.getServers(),
  };
}
