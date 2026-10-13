import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NetScope — DNS Lookup & IP Address Tracker',
  description: 'Precision network intelligence tool for real-time DNS record inspection, IP geolocation, ASN tracking, and autonomous system forensics.',
  authors: [{ name: 'NetScope Team' }],
  keywords: ['DNS lookup', 'IP tracker', 'IP geolocation', 'ASN', 'Node.js DNS', 'Network diagnostics'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col bg-[#f2f0eb] text-[#292827] antialiased selection:bg-[#d4c7ff] selection:text-[#292827]">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
