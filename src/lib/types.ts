export type DnsRecordType = 'A' | 'AAAA' | 'MX' | 'NS' | 'TXT' | 'CNAME' | 'SOA' | 'CAA' | 'SRV' | 'ALL';

export interface DnsRecordItem {
  type: string;
  name: string;
  value: string;
  ttl?: number;
  priority?: number; // for MX
  exchange?: string; // for MX
  nsname?: string;   // for SOA
  hostmaster?: string; // for SOA
  serial?: number;   // for SOA
  refresh?: number;  // for SOA
  retry?: number;    // for SOA
  expire?: number;   // for SOA
  minttl?: number;   // for SOA
  tag?: string;      // for CAA
  weight?: number;   // for SRV
  port?: number;     // for SRV
  target?: string;   // for SRV
}

export interface DnsLookupResponse {
  domain: string;
  queryType: DnsRecordType;
  timestamp: string;
  durationMs: number;
  resolvedIPs: string[];
  records: DnsRecordItem[];
  summary: {
    totalRecords: number;
    recordTypesFound: string[];
  };
  nameserversUsed?: string[];
}

export interface IpGeolocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  postal?: string;
  latitude: number | null;
  longitude: number | null;
  timezone?: string;
}

export interface IpNetwork {
  isp?: string;
  org?: string;
  asn?: string;
  asName?: string;
}

export interface IpTrackerResponse {
  ip: string;
  version: 'IPv4' | 'IPv6';
  isPrivate: boolean;
  isReserved: boolean;
  hostname?: string | null;
  resolvedFromDomain?: string;
  geolocation: IpGeolocation | null;
  network: IpNetwork | null;
  disclaimer: string;
  explanation?: string;
  timestamp: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  type: 'dns' | 'ip';
  timestamp: number;
  summary?: string;
}
