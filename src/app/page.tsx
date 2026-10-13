'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Globe,
  ArrowRight,
  ShieldCheck,
  Server,
  Layers,
  History,
  Trash2,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import { getSearchHistory, deleteHistoryItem, clearSearchHistory } from '@/lib/history';
import { SearchHistoryItem } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'auto' | 'dns' | 'ip'>('auto');
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(getSearchHistory());
  }, []);

  // Intelligent detection: derived dynamically from input
  const trimmed = query.trim().replace(/^https?:\/\//i, '').split('/')[0];
  const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(trimmed) || /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(trimmed);
  const detectedType: 'dns' | 'ip' = isIp ? 'ip' : 'dns';

  const handleSubmit = (actionType?: 'dns' | 'ip') => {
    const raw = query.trim().replace(/^https?:\/\//i, '').split('/')[0];
    if (!raw) {
      setValidationError('Please enter a domain name or IP address to investigate.');
      return;
    }

    setValidationError(null);

    const targetMode = actionType || (mode === 'auto' ? detectedType : mode);

    if (targetMode === 'dns') {
      router.push(`/dns?domain=${encodeURIComponent(raw)}`);
    } else {
      router.push(`/ip?address=${encodeURIComponent(raw)}`);
    }
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteHistoryItem(id);
    setHistory(updated);
  };

  const sampleTargets = [
    { label: 'cloudflare.com', type: 'dns' },
    { label: '8.8.8.8', type: 'ip' },
    { label: 'github.com', type: 'dns' },
    { label: '1.1.1.1', type: 'ip' },
    { label: '192.168.1.1 (Private)', type: 'ip' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 md:py-16 space-y-16">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#d4c7ff]/60 border border-[#e3e3e2] text-xs font-medium text-[#292827]">
          <Sparkles className="w-3.5 h-3.5 text-[#714cb6]" />
          <span>Real-Time Network Forensics & IP Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-normal text-[#292827] tracking-tight leading-[1.1]">
          Investigate DNS records and IP geolocation with clarity.
        </h1>

        <p className="text-base sm:text-lg text-[#666666] leading-relaxed max-w-2xl mx-auto">
          NetScope queries live authoritative nameservers and autonomous systems to deliver accurate DNS records, routing data, and approximate geographic intelligence.
        </p>
      </section>

      {/* Prominent Unified Search Bar */}
      <section className="max-w-3xl mx-auto">
        <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-4 sm:p-6 shadow-sm transition-shadow hover:shadow-md">
          {/* Mode Selector Tabs */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#e3e3e2]/60">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#666666]">
              Target Selector
            </span>
            <div className="inline-flex bg-[#f2f0eb] p-1 rounded-lg border border-[#e3e3e2]/70 text-xs">
              <button
                type="button"
                onClick={() => setMode('auto')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  mode === 'auto'
                    ? 'bg-[#ffffff] text-[#421d24] shadow-xs'
                    : 'text-[#666666] hover:text-[#292827]'
                }`}
              >
                Auto Detect
              </button>
              <button
                type="button"
                onClick={() => setMode('dns')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  mode === 'dns'
                    ? 'bg-[#ffffff] text-[#421d24] shadow-xs'
                    : 'text-[#666666] hover:text-[#292827]'
                }`}
              >
                DNS Only
              </button>
              <button
                type="button"
                onClick={() => setMode('ip')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  mode === 'ip'
                    ? 'bg-[#ffffff] text-[#421d24] shadow-xs'
                    : 'text-[#666666] hover:text-[#292827]'
                }`}
              >
                IP Only
              </button>
            </div>
          </div>

          {/* Unified Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="relative">
              <input
                id="unified-search-input"
                type="text"
                aria-label="Domain name or IP address to investigate"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Enter domain name (e.g. google.com) or IP address (e.g. 8.8.8.8)..."
                className="w-full h-14 pl-12 pr-28 rounded-xl bg-[#f2f0eb]/50 border border-[#e3e3e2] text-base text-[#292827] placeholder:text-[#666666]/60 focus:bg-[#ffffff] transition-all"
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666666]">
                {detectedType === 'ip' && mode === 'auto' ? (
                  <MapPin className="w-5 h-5 text-[#714cb6]" />
                ) : (
                  <Globe className="w-5 h-5 text-[#714cb6]" />
                )}
              </div>

              {/* Detected Badge */}
              {query.trim() && mode === 'auto' && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-[#d4c7ff] text-[#292827]">
                    {detectedType === 'ip' ? 'IP Detected' : 'Domain Detected'}
                  </span>
                </div>
              )}
            </div>

            {/* Validation Error Message */}
            {validationError && (
              <p className="text-xs text-[#421d24] font-medium flex items-center gap-1.5 px-1">
                <Info className="w-3.5 h-3.5" />
                {validationError}
              </p>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSubmit('dns')}
                className="h-12 rounded-xl bg-[#421d24] text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#421d24]/90 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
              >
                <Search className="w-4 h-4 text-[#d4c7ff]" />
                <span>Run DNS Lookup</span>
                <ArrowRight className="w-4 h-4 text-white/70 ml-1" />
              </button>

              <button
                type="button"
                onClick={() => handleSubmit('ip')}
                className="h-12 rounded-xl bg-[#d4c7ff] border border-[#292827]/15 text-[#292827] font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#d4c7ff]/80 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
              >
                <MapPin className="w-4 h-4 text-[#714cb6]" />
                <span>Track IP Address</span>
                <ArrowRight className="w-4 h-4 text-[#292827]/70 ml-1" />
              </button>
            </div>
          </form>

          {/* Quick Sample Links */}
          <div className="mt-5 pt-4 border-t border-[#e3e3e2]/60 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[#666666] font-medium">Quick examples:</span>
            {sampleTargets.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  const val = item.label.split(' ')[0];
                  setQuery(val);
                  if (item.type === 'ip') {
                    router.push(`/ip?address=${encodeURIComponent(val)}`);
                  } else {
                    router.push(`/dns?domain=${encodeURIComponent(val)}`);
                  }
                }}
                className="px-2.5 py-1 rounded-md bg-[#f2f0eb] hover:bg-[#e3e3e2] text-[#292827] font-mono transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Overview Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-normal text-[#292827] tracking-tight">System Capabilities</h2>
            <p className="text-sm text-[#666666]">Engineered for deep network inspection and verification.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-6 space-y-4 hover:border-[#714cb6]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#f2f0eb] flex items-center justify-center text-[#421d24]">
              <Server className="w-5 h-5 text-[#714cb6]" />
            </div>
            <h3 className="text-lg font-medium text-[#292827]">Authoritative DNS Records</h3>
            <p className="text-sm text-[#666666] leading-relaxed">
              Resolve A, AAAA, MX, NS, TXT, CNAME, SOA, and CAA records directly through Node.js socket resolvers with exact TTL and exchange priorities.
            </p>
            <Link
              href="/dns"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#714cb6] hover:underline"
            >
              Explore DNS resolver <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2 */}
          <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-6 space-y-4 hover:border-[#714cb6]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#f2f0eb] flex items-center justify-center text-[#421d24]">
              <MapPin className="w-5 h-5 text-[#714cb6]" />
            </div>
            <h3 className="text-lg font-medium text-[#292827]">IP Geolocation & Mapping</h3>
            <p className="text-sm text-[#666666] leading-relaxed">
              Analyze IPv4 and IPv6 coordinates, metropolitan regions, postal bounds, and render responsive OpenStreetMap geographic representations.
            </p>
            <Link
              href="/ip"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#714cb6] hover:underline"
            >
              Explore IP tracker <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3 */}
          <div className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-6 space-y-4 hover:border-[#714cb6]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#f2f0eb] flex items-center justify-center text-[#421d24]">
              <ShieldCheck className="w-5 h-5 text-[#714cb6]" />
            </div>
            <h3 className="text-lg font-medium text-[#292827]">ASN & Bogon Verification</h3>
            <p className="text-sm text-[#666666] leading-relaxed">
              Detect private RFC 1918 subnets, RFC 4193 unique local IPv6, carrier-grade NAT, and identify Autonomous System Organizations (ASNs).
            </p>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#666666]">
              RFC 1918 & 4193 compliant
            </span>
          </div>
        </div>
      </section>

      {/* Recent Search History Section (stored in localStorage) */}
      <section className="bg-[#ffffff] rounded-2xl border border-[#e3e3e2] p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#e3e3e2]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#714cb6]" />
            <h2 className="text-lg font-medium text-[#292827]">Recent Investigations</h2>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-xs text-[#666666] hover:text-[#421d24] flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          /* Helpful Empty State */
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#f2f0eb] flex items-center justify-center mx-auto text-[#666666]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-[#292827]">No search history yet</h3>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              Your recent domain and IP queries are cached locally in your browser session for quick re-investigation.
            </p>
          </div>
        ) : (
          /* History Items List */
          <div className="divide-y divide-[#e3e3e2]/60">
            {history.map((item) => {
              const targetUrl = item.type === 'dns' ? `/dns?domain=${encodeURIComponent(item.query)}` : `/ip?address=${encodeURIComponent(item.query)}`;
              const dateStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div
                  key={item.id}
                  onClick={() => router.push(targetUrl)}
                  className="py-3 px-2 flex items-center justify-between rounded-lg hover:bg-[#f2f0eb]/60 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                        item.type === 'dns'
                          ? 'bg-[#d4c7ff] text-[#292827]'
                          : 'bg-[#421d24] text-white'
                      }`}
                    >
                      {item.type.toUpperCase()}
                    </span>
                    <span className="font-mono text-sm text-[#292827] group-hover:text-[#714cb6] transition-colors">
                      {item.query}
                    </span>
                    {item.summary && (
                      <span className="hidden sm:inline text-xs text-[#666666]">
                        • {item.summary}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#666666]">{dateStr}</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item.id, e)}
                      title="Delete entry"
                      className="text-[#666666] hover:text-[#421d24] p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ExternalLink className="w-4 h-4 text-[#666666] group-hover:text-[#714cb6] transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
