'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  RefreshCw,
  Copy,
  Check,
  ArrowLeft,
  Search,
  Globe,
  ShieldAlert,
  Wifi,
  Info,
  AlertCircle,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { IpTrackerResponse } from '@/lib/types';
import { saveSearchHistory } from '@/lib/history';
import MapWrapper from '@/components/MapWrapper';

function IpTrackerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [ipInput, setIpInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IpTrackerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchIpData = useCallback(async (addressToQuery: string) => {
    const cleaned = addressToQuery.trim().replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
    if (!cleaned) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/ip?address=${encodeURIComponent(cleaned)}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || json.error || 'Failed to track IP address');
      }

      setData(json);

      const locationSummary = json.geolocation
        ? `${json.geolocation.city}, ${json.geolocation.country}`
        : json.isPrivate
        ? 'Private Network'
        : 'Public Address';
      saveSearchHistory(cleaned, 'ip', locationSummary);
    } catch (err: unknown) {
      setData(null);
      setError(err instanceof Error ? err.message : 'An error occurred during IP tracking');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const addressFromUrl = searchParams.get('address');
    if (addressFromUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIpInput(addressFromUrl);
      fetchIpData(addressFromUrl);
    }
  }, [searchParams, fetchIpData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput.trim()) {
      setError('Please enter a valid IP address.');
      return;
    }
    const cleaned = ipInput.trim();
    router.replace(`/ip?address=${encodeURIComponent(cleaned)}`);
    fetchIpData(cleaned);
  };

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopySummary = () => {
    if (!data) return;
    const summaryText = `[NetScope IP Investigation]
IP: ${data.ip} (${data.version})
Hostname: ${data.hostname || 'None'}
Status: ${data.isPrivate ? 'Private / Reserved Network' : 'Public IP'}
Location: ${data.geolocation ? `${data.geolocation.city}, ${data.geolocation.region}, ${data.geolocation.country}` : 'N/A'}
Coordinates: ${data.geolocation?.latitude && data.geolocation?.longitude ? `${data.geolocation.latitude}, ${data.geolocation.longitude}` : 'N/A'}
Network ISP: ${data.network?.isp || 'N/A'}
ASN: ${data.network?.asn || 'N/A'}
Timestamp: ${data.timestamp}
Disclaimer: ${data.disclaimer}`;

    handleCopy(summaryText, 'summary');
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-8">
      {/* Header and Back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#666666] hover:text-[#421d24] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-normal text-[#292827] tracking-tight">IP Address Intelligence</h1>
          <p className="text-sm text-[#666666]">
            Inspect routing topology, autonomous systems, and approximate geolocation coordinates.
          </p>
        </div>

        {data && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ffffff] border border-[#e3e3e2] text-xs font-medium text-[#292827] hover:bg-[#f2f0eb] transition-all shadow-xs cursor-pointer"
            >
              {copiedField === 'summary' ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <FileText className="w-3.5 h-3.5 text-[#714cb6]" />
              )}
              <span>{copiedField === 'summary' ? 'Report Copied' : 'Copy Report'}</span>
            </button>

            <button
              type="button"
              onClick={() => fetchIpData(data.ip)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ffffff] border border-[#e3e3e2] text-xs font-medium text-[#292827] hover:bg-[#f2f0eb] transition-all disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#714cb6] ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        )}
      </div>

      {/* Query Bar */}
      <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-4 sm:p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <input
              id="ip-address-input"
              type="text"
              aria-label="IP address or domain to track"
              value={ipInput}
              onChange={(e) => {
                setIpInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter IPv4 (e.g. 8.8.8.8) or IPv6 (e.g. 2606:4700:4700::1111)..."
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#f2f0eb]/60 border border-[#e3e3e2] text-sm text-[#292827] placeholder:text-[#666666]/60 focus:bg-[#ffffff] transition-all font-mono"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]">
              <MapPin className="w-4 h-4 text-[#714cb6]" />
            </div>
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
            <span>{loading ? 'Tracking...' : 'Track IP'}</span>
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="bg-[#421d24]/5 border border-[#421d24]/20 rounded-2xl p-5 flex items-start gap-3.5 text-[#421d24]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <h3 className="font-semibold">Tracking Failed</h3>
            <p className="text-[#292827] leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-6 space-y-6 animate-pulse">
          <div className="h-7 bg-[#e3e3e2]/60 rounded-md w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-[#e3e3e2]/40 rounded-xl" />
            <div className="h-64 bg-[#e3e3e2]/40 rounded-xl" />
          </div>
          <div className="h-72 bg-[#e3e3e2]/30 rounded-xl" />
        </div>
      )}

      {/* Results View */}
      {data && !loading && (
        <div className="space-y-6">
          {/* Domain-to-IP Notice */}
          {data.resolvedFromDomain && (
            <div className="bg-[#d4c7ff]/30 border border-[#714cb6]/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#292827]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#ffffff] flex items-center justify-center text-[#714cb6] border border-[#e3e3e2] shrink-0">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <span>
                  Query &quot;<strong className="font-semibold">{data.resolvedFromDomain}</strong>&quot; was automatically resolved to IP <strong className="font-mono">{data.ip}</strong> for network intelligence analysis.
                </span>
              </div>
              <Link
                href={`/dns?domain=${encodeURIComponent(data.resolvedFromDomain)}`}
                className="inline-flex items-center gap-1 font-semibold text-[#714cb6] hover:underline shrink-0"
              >
                <span>Inspect full DNS records</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* IP Overview Banner */}
          <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#421d24] flex items-center justify-center text-white">
                <Globe className="w-5 h-5 text-[#d4c7ff]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-mono font-medium text-[#292827]">{data.ip}</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#d4c7ff] text-[#292827]">
                    {data.version}
                  </span>
                  {data.isPrivate && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-900">
                      Private / Bogon
                    </span>
                  )}
                </div>
                {data.hostname && (
                  <p className="text-xs font-mono text-[#666666] mt-0.5">
                    Reverse PTR Host: <span className="text-[#292827]">{data.hostname}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(data.ip, 'ip')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f2f0eb] hover:bg-[#e3e3e2] text-xs font-mono text-[#292827] transition-colors"
              >
                {copiedField === 'ip' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#666666]" />
                )}
                <span>Copy IP</span>
              </button>
            </div>
          </div>

          {/* Private / Bogon Notice Box */}
          {data.isPrivate && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-semibold text-base">
                <ShieldAlert className="w-5 h-5 text-amber-700" />
                <h3>Non-Routable Private Network Space</h3>
              </div>
              <p className="text-sm text-amber-900/90 leading-relaxed">
                {data.explanation}
              </p>
              <div className="text-xs text-amber-800 bg-amber-100/60 p-3 rounded-xl space-y-1">
                <strong>Why is geolocation not available?</strong>
                <p>
                  RFC 1918 (IPv4) and RFC 4193 (IPv6) reserve these blocks strictly for internal devices (such as Wi-Fi routers, local virtual machines, and intranet hosts). Because these packets are never routed across the global public internet backbone, no public ISP or BGP geographic registry exists for them.
                </p>
              </div>
            </div>
          )}

          {/* Public Data View: Geolocation + Network Info */}
          {!data.isPrivate && data.geolocation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Geolocation Card */}
              <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-[#e3e3e2]">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#666666]">
                    <MapPin className="w-4 h-4 text-[#714cb6]" />
                    <span>Geolocation</span>
                  </div>
                  <span className="text-xs text-[#666666]">Approximate</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-0.5">
                    <span className="text-xs text-[#666666]">Country</span>
                    <p className="font-medium text-[#292827] flex items-center gap-1.5">
                      {data.geolocation.country}
                      {data.geolocation.countryCode && (
                        <span className="text-xs font-mono text-[#666666]">
                          ({data.geolocation.countryCode})
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-xs text-[#666666]">Region / State</span>
                    <p className="font-medium text-[#292827]">{data.geolocation.region}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-xs text-[#666666]">City</span>
                    <p className="font-medium text-[#292827]">{data.geolocation.city}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-xs text-[#666666]">Postal Code</span>
                    <p className="font-medium text-[#292827]">{data.geolocation.postal || 'N/A'}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-xs text-[#666666]">Coordinates (Lat, Lon)</span>
                    <p className="font-mono text-xs font-medium text-[#292827]">
                      {data.geolocation.latitude !== null && data.geolocation.longitude !== null
                        ? `${data.geolocation.latitude.toFixed(4)}, ${data.geolocation.longitude.toFixed(4)}`
                        : 'Unavailable'}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-xs text-[#666666]">Timezone</span>
                    <p className="font-medium text-[#292827]">{data.geolocation.timezone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Network / ASN Card */}
              <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-[#e3e3e2]">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#666666]">
                    <Wifi className="w-4 h-4 text-[#714cb6]" />
                    <span>Autonomous System (ASN)</span>
                  </div>
                  <span className="text-xs text-[#666666]">BGP Routing</span>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="space-y-0.5">
                    <span className="text-xs text-[#666666]">Internet Service Provider (ISP)</span>
                    <p className="font-medium text-[#292827]">{data.network?.isp || 'Unspecified'}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-xs text-[#666666]">Organization</span>
                    <p className="font-medium text-[#292827]">{data.network?.org || 'Unspecified'}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-xs text-[#666666]">Autonomous System Number</span>
                    <p className="font-mono text-xs font-medium text-[#714cb6]">
                      {data.network?.asn || 'Unavailable'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#e3e3e2]/60">
                    <span className="text-xs text-[#666666]">Reverse DNS (PTR)</span>
                    <p className="font-mono text-xs font-medium text-[#292827] truncate mt-0.5">
                      {data.hostname || 'No PTR record configured by carrier'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Map View (Only if valid coordinates exist) */}
          {!data.isPrivate &&
            data.geolocation &&
            data.geolocation.latitude !== null &&
            data.geolocation.longitude !== null && (
              <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-base font-medium text-[#292827]">
                      Metropolitan Map Representation
                    </h3>
                    <p className="text-xs text-[#666666]">
                      OpenStreetMap rendering for {data.geolocation.city}, {data.geolocation.country}
                    </p>
                  </div>

                  <span className="text-xs font-mono text-[#666666]">
                    [{data.geolocation.latitude.toFixed(4)}, {data.geolocation.longitude.toFixed(4)}]
                  </span>
                </div>

                {/* Leaflet Map */}
                <MapWrapper
                  latitude={data.geolocation.latitude}
                  longitude={data.geolocation.longitude}
                  label={`${data.geolocation.city}, ${data.geolocation.country}`}
                  ip={data.ip}
                />

                {/* Clear Disclaimer */}
                <div className="flex items-start gap-2 text-xs text-[#666666] pt-1">
                  <Info className="w-3.5 h-3.5 shrink-0 text-[#714cb6] mt-0.5" />
                  <p>
                    <strong>Academic & Privacy Notice:</strong> {data.disclaimer} IP mapping pins indicate upstream telecom point-of-presence (PoP) exchange buildings or regional routing centers, not personal residences or exact physical coordinates.
                  </p>
                </div>
              </div>
            )}

          {/* Unavailable Data fallback if provider was down */}
          {!data.isPrivate && !data.geolocation && (
            <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#f2f0eb] flex items-center justify-center mx-auto text-[#666666]">
                <AlertCircle className="w-5 h-5 text-[#714cb6]" />
              </div>
              <h3 className="text-base font-medium text-[#292827]">Geolocation Data Unavailable</h3>
              <p className="text-xs text-[#666666] max-w-md mx-auto">
                {data.explanation || 'External routing registry returned no geographic coordinates for this IP.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Initial Empty State before querying */}
      {!data && !loading && !error && (
        <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#f2f0eb] flex items-center justify-center mx-auto text-[#666666]">
            <Globe className="w-6 h-6 text-[#714cb6]" />
          </div>
          <h3 className="text-base font-medium text-[#292827]">Enter an IP address to investigate</h3>
          <p className="text-xs text-[#666666] max-w-md mx-auto leading-relaxed">
            NetScope validates IPv4 and IPv6 syntax, inspects RFC private/reserved subnets, queries Autonomous System (ASN) routes, and renders interactive OpenStreetMap representations.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIpInput('8.8.8.8');
                fetchIpData('8.8.8.8');
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#f2f0eb] hover:bg-[#e3e3e2] text-[#292827] font-mono transition-colors"
            >
              Test with 8.8.8.8 (Google DNS)
            </button>
            <button
              type="button"
              onClick={() => {
                setIpInput('1.1.1.1');
                fetchIpData('1.1.1.1');
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#f2f0eb] hover:bg-[#e3e3e2] text-[#292827] font-mono transition-colors"
            >
              Test with 1.1.1.1 (Cloudflare)
            </button>
            <button
              type="button"
              onClick={() => {
                setIpInput('192.168.1.1');
                fetchIpData('192.168.1.1');
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#f2f0eb] hover:bg-[#e3e3e2] text-[#292827] font-mono transition-colors"
            >
              Test Private 192.168.1.1
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function IpTrackerPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 text-center text-sm text-[#666666]">
          Loading IP Intelligence...
        </div>
      }
    >
      <IpTrackerContent />
    </Suspense>
  );
}
