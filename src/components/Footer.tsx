'use client';

import Link from 'next/link';
import { Globe, ShieldCheck, Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#421d24] text-white pt-16 pb-12 mt-20 border-t border-[#421d24]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <Globe className="w-4 h-4 text-[#d4c7ff]" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">NetScope</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              Precision DNS resolution and IP address intelligence suite. Designed for network diagnostic clarity and college demonstration.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#d4c7ff]">
              <Cpu className="w-3.5 h-3.5" />
              <span>Real Node.js Resolver</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-white/50">Core Tools</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Dashboard Overview
                </Link>
              </li>
              <li>
                <Link href="/dns" className="hover:text-white transition-colors">
                  DNS Record Lookup
                </Link>
              </li>
              <li>
                <Link href="/ip" className="hover:text-white transition-colors">
                  IP Geolocation & ASN
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & RFCs */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-white/50">Supported RFCs</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>RFC 1035 — Domain Implementation</li>
              <li>RFC 1918 — Private IPv4 Networks</li>
              <li>RFC 4193 — Unique Local IPv6</li>
              <li>RFC 8482 — Minimal ANY Answers</li>
            </ul>
          </div>

          {/* Verification & Academic Context */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-white/50">Integrity & Policy</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              Queries are executed live against upstream recursive resolvers. IP geolocations represent ISP-allocated network ranges and are strictly approximate.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-[#d4c7ff] pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Live Backend</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-4">
          <p>© 2026 NetScope — College Capstone Project. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Vanilla Architecture</span>
            <span>No Hardcoded Mock Data</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
