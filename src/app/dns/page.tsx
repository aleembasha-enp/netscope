'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  RefreshCw,
  Copy,
  Check,
  ArrowLeft,
  MapPin,
  AlertCircle,
  Clock,
  Server,
  Layers,
  Filter,
} from 'lucide-react';
import { DnsLookupResponse, DnsRecordType } from '@/lib/types';
import { saveSearchHistory } from '@/lib/history';

function DnsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [domainInput, setDomainInput] = useState('');
  const [selectedType, setSelectedType] = useState<DnsRecordType>('ALL');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DnsLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const fetchDns = useCallback(async (domainToQuery: string, typeToQuery: DnsRecordType = 'ALL') => {
    const cleaned = domainToQuery.trim().replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
    if (!cleaned) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/dns?domain=${encodeURIComponent(cleaned)}&type=${encodeURIComponent(typeToQuery)}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to resolve DNS records');
      }

      setData(json);
      saveSearchHistory(cleaned, 'dns', `${json.records.length} records found`);
    } catch (err: unknown) {
      setData(null);
      setError(err instanceof Error ? err.message : 'An error occurred during DNS lookup');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle initial query param from URL
  useEffect(() => {
    const domainFromUrl = searchParams.get('domain');
    const typeFromUrl = (searchParams.get('type') as DnsRecordType) || 'ALL';

    if (domainFromUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDomainInput(domainFromUrl);
      setSelectedType(typeFromUrl);
      fetchDns(domainFromUrl, typeFromUrl);
    }
  }, [searchParams, fetchDns]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) {
      setError('Please enter a valid domain name.');
      return;
    }
    const cleaned = domainInput.trim().replace(/^https?:\/\//i, '').split('/')[0];
    router.replace(`/dns?domain=${encodeURIComponent(cleaned)}&type=${encodeURIComponent(selectedType)}`);
    fetchDns(cleaned, selectedType);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const filterTabs = ['ALL', 'A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA'];

  // Filter records based on activeFilter
  const displayedRecords = data?.records.filter((rec) => {
    if (activeFilter === 'ALL') return true;
    return rec.type === activeFilter;
  }) || [];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#666666] hover:text-[#421d24] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-normal text-[#292827] tracking-tight">DNS Record Inspector</h1>
          <p className="text-sm text-[#666666]">
            Query live nameservers and inspect verified DNS zone records.
          </p>
        </div>

        {data && (
          <button
            type="button"
            onClick={() => fetchDns(data.domain, selectedType)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ffffff] border border-[#e3e3e2] text-xs font-medium text-[#292827] hover:bg-[#f2f0eb] transition-all disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#714cb6] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Query</span>
          </button>
        )}
      </div>

      {/* Query Bar */}
      <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-4 sm:p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <input
              id="dns-domain-input"
              type="text"
              aria-label="Domain name to look up"
              value={domainInput}
              onChange={(e) => {
                setDomainInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. cloudflare.com, wikipedia.org, github.com"
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#f2f0eb]/60 border border-[#e3e3e2] text-sm text-[#292827] placeholder:text-[#666666]/60 focus:bg-[#ffffff] transition-all"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]">
              <Search className="w-4 h-4 text-[#714cb6]" />
            </div>
          </div>

          <div className="w-full sm:w-44">
            <select
              id="dns-record-type-select"
              aria-label="DNS record type to query"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DnsRecordType)}
              className="w-full h-12 px-3.5 rounded-xl bg-[#f2f0eb]/60 border border-[#e3e3e2] text-sm text-[#292827] font-medium focus:bg-[#ffffff] transition-all cursor-pointer"
            >
              <option value="ALL">All Records</option>
              <option value="A">A (IPv4)</option>
              <option value="AAAA">AAAA (IPv6)</option>
              <option value="MX">MX (Mail Exchange)</option>
              <option value="NS">NS (Name Server)</option>
              <option value="TXT">TXT (Text)</option>
              <option value="CNAME">CNAME (Alias)</option>
              <option value="SOA">SOA (Authority)</option>
              <option value="CAA">CAA (Cert Auth)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 px-6 rounded-xl bg-[#421d24] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#421d24]/90 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 text-[#d4c7ff] animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-[#d4c7ff]" />
            )}
            <span>{loading ? 'Resolving...' : 'Lookup'}</span>
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="bg-[#421d24]/5 border border-[#421d24]/20 rounded-2xl p-5 flex items-start gap-3.5 text-[#421d24]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <h3 className="font-semibold">Lookup Failed</h3>
            <p className="text-[#292827] leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-6 space-y-6 animate-pulse">
          <div className="h-6 bg-[#e3e3e2]/60 rounded-md w-1/3" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="h-16 bg-[#e3e3e2]/40 rounded-xl" />
            <div className="h-16 bg-[#e3e3e2]/40 rounded-xl" />
            <div className="h-16 bg-[#e3e3e2]/40 rounded-xl" />
            <div className="h-16 bg-[#e3e3e2]/40 rounded-xl" />
          </div>
          <div className="space-y-3 pt-4">
            <div className="h-10 bg-[#e3e3e2]/50 rounded-lg" />
            <div className="h-12 bg-[#e3e3e2]/30 rounded-lg" />
            <div className="h-12 bg-[#e3e3e2]/30 rounded-lg" />
            <div className="h-12 bg-[#e3e3e2]/30 rounded-lg" />
          </div>
        </div>
      )}

      {/* Results View */}
      {data && !loading && (
        <div className="space-y-6">
          {/* Metadata & Quick Overview Strip */}
          <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#e3e3e2] gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#d4c7ff]/50 flex items-center justify-center text-[#421d24]">
                  <Server className="w-4 h-4 text-[#714cb6]" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-[#292827] font-mono">{data.domain}</h2>
                  <p className="text-xs text-[#666666]">
                    Query completed in <span className="font-semibold text-[#292827]">{data.durationMs}ms</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#666666]">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(data.timestamp).toLocaleString()}</span>
              </div>
            </div>

            {/* Resolved IPs Section */}
            {data.resolvedIPs.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
                  Resolved IP Addresses ({data.resolvedIPs.length})
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {data.resolvedIPs.map((ip) => (
                    <div
                      key={ip}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f2f0eb] border border-[#e3e3e2] text-xs font-mono text-[#292827] group"
                    >
                      <span>{ip}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyIp(ip)}
                        title="Copy IP"
                        className="text-[#666666] hover:text-[#421d24] transition-colors p-0.5"
                      >
                        {copiedIp === ip ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <Link
                        href={`/ip?address=${encodeURIComponent(ip)}`}
                        className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-[#714cb6] hover:underline pl-1 border-l border-[#e3e3e2]"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Track IP</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Record Filter Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="inline-flex bg-[#ffffff] p-1 rounded-xl border border-[#e3e3e2] shadow-xs flex-wrap">
              {filterTabs.map((type) => {
                const count =
                  type === 'ALL'
                    ? data.records.length
                    : data.records.filter((r) => r.type === type).length;
                const isActive = activeFilter === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActiveFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#421d24] text-white shadow-xs'
                        : 'text-[#666666] hover:text-[#292827] hover:bg-[#f2f0eb]'
                    }`}
                  >
                    <span>{type}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[#f2f0eb] text-[#666666]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <span className="text-xs text-[#666666]">
              Showing {displayedRecords.length} of {data.records.length} records
            </span>
          </div>

          {/* Records Table */}
          {displayedRecords.length === 0 ? (
            <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#f2f0eb] flex items-center justify-center mx-auto text-[#666666]">
                <Filter className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-medium text-[#292827]">
                No {activeFilter !== 'ALL' ? activeFilter : ''} records returned
              </h3>
              <p className="text-xs text-[#666666] max-w-sm mx-auto">
                The authoritative nameservers did not publish records of this type for this domain.
              </p>
            </div>
          ) : (
            <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#f2f0eb]/70 border-b border-[#e3e3e2] text-xs font-semibold uppercase tracking-wider text-[#666666]">
                      <th className="py-3 px-4 w-24">Type</th>
                      <th className="py-3 px-4 w-48">Host / Name</th>
                      <th className="py-3 px-4">Value / Target</th>
                      <th className="py-3 px-4 w-28 text-right">TTL</th>
                      <th className="py-3 px-4 w-20 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e3e3e2]/60 font-mono text-xs">
                    {displayedRecords.map((record, idx) => (
                      <tr
                        key={`${record.type}-${record.value}-${idx}`}
                        className="hover:bg-[#f2f0eb]/40 transition-colors group"
                      >
                        {/* Type badge */}
                        <td className="py-3.5 px-4 font-sans font-semibold">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                              record.type === 'A'
                                ? 'bg-[#d4c7ff] text-[#292827]'
                                : record.type === 'AAAA'
                                ? 'bg-[#421d24] text-white'
                                : record.type === 'MX'
                                ? 'bg-amber-100 text-amber-900'
                                : record.type === 'NS'
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-[#e3e3e2] text-[#292827]'
                            }`}
                          >
                            {record.type}
                          </span>
                        </td>

                        {/* Host / Name */}
                        <td className="py-3.5 px-4 text-[#666666] truncate max-w-[180px]">
                          {record.name}
                        </td>

                        {/* Value / Target */}
                        <td className="py-3.5 px-4 text-[#292827] break-all select-all font-medium">
                          {record.value}
                          {record.type === 'SOA' && record.serial && (
                            <div className="text-[11px] font-sans text-[#666666] mt-1 space-x-2">
                              <span>Serial: {record.serial}</span>
                              <span>• Refresh: {record.refresh}s</span>
                              <span>• Expire: {record.expire}s</span>
                            </div>
                          )}
                        </td>

                        {/* TTL */}
                        <td className="py-3.5 px-4 text-right text-[#666666]">
                          {record.ttl ? `${record.ttl}s` : '—'}
                        </td>

                        {/* Copy Action */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleCopy(record.value, idx)}
                            title="Copy record value"
                            className="p-1.5 rounded-lg text-[#666666] hover:text-[#421d24] hover:bg-[#e3e3e2]/50 transition-colors"
                          >
                            {copiedIndex === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial Empty State before searching */}
      {!data && !loading && !error && (
        <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#f2f0eb] flex items-center justify-center mx-auto text-[#666666]">
            <Layers className="w-6 h-6 text-[#714cb6]" />
          </div>
          <h3 className="text-base font-medium text-[#292827]">Enter a domain to begin inspection</h3>
          <p className="text-xs text-[#666666] max-w-md mx-auto leading-relaxed">
            NetScope will execute queries against upstream DNS servers to fetch all A, AAAA, MX, NS, TXT, CNAME, SOA, and CAA records.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDomainInput('cloudflare.com');
                fetchDns('cloudflare.com', 'ALL');
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#f2f0eb] hover:bg-[#e3e3e2] text-[#292827] font-mono transition-colors"
            >
              Test with cloudflare.com
            </button>
            <button
              type="button"
              onClick={() => {
                setDomainInput('google.com');
                fetchDns('google.com', 'ALL');
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#f2f0eb] hover:bg-[#e3e3e2] text-[#292827] font-mono transition-colors"
            >
              Test with google.com
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DnsLookupPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 text-center text-sm text-[#666666]">
          Loading DNS Inspector...
        </div>
      }
    >
      <DnsContent />
    </Suspense>
  );
}
