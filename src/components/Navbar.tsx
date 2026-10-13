'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Globe, Search, MapPin, Activity, Terminal } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Activity },
    { href: '/dns', label: 'DNS Lookup', icon: Search },
    { href: '/ip', label: 'IP Tracker', icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#f2f0eb]/85 backdrop-blur-md border-b border-[#e3e3e2] transition-colors">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#421d24] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Globe className="w-4 h-4 text-[#d4c7ff]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[17px] font-semibold text-[#292827] tracking-tight flex items-center gap-1.5">
              NetScope
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-[#d4c7ff] text-[#292827]">
                Live
              </span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#ffffff] text-[#421d24] shadow-sm border border-[#e3e3e2]'
                    : 'text-[#292827]/80 hover:text-[#292827] hover:bg-[#ffffff]/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#714cb6]' : 'text-[#666666]'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Live resolver pill tag */}
        <div className="hidden md:flex items-center gap-2 text-xs text-[#666666] bg-[#ffffff] px-3 py-1.5 rounded-full border border-[#e3e3e2]">
          <Terminal className="w-3.5 h-3.5 text-[#714cb6]" />
          <span>Node.js Engine</span>
        </div>
      </div>
    </header>
  );
}
