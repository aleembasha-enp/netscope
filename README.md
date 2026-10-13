# NetScope — DNS Lookup & IP Address Tracker

**NetScope** is a full-stack network intelligence web application developed as a college capstone project. It provides real-time authoritative DNS record exploration, IP address tracking, reverse DNS (PTR) host resolution, Autonomous System (ASN) analysis, and approximate geographic mapping using interactive OpenStreetMap tiles.

The application is built around editorial UI design tokens inspired by modern typography and structured data interfaces, with zero fabricated or hardcoded simulation data: all DNS queries are resolved live via Node.js native sockets, and IP lookups query live internet routing tables.

---

## 🌟 Key Features

### 1. Unified Network Dashboard (`/`)
- **Intelligent Input Detection**: Automatically distinguishes between IPv4, IPv6, and domain names.
- **Single-Click Actions**: Directly invoke either DNS inspection or IP geolocation tracking.
- **Recent Search History**: Persisted in browser `localStorage` for immediate recall without requiring a backend database.
- **Capabilities Matrix**: Clear breakdown of supported RFCs, resolver mechanisms, and network security utilities.
- **Quick Test Targets**: One-click exploration presets (e.g., `cloudflare.com`, `8.8.8.8`, `1.1.1.1`, `192.168.1.1`).

### 2. Deep DNS Record Inspector (`/dns`)
- **Authoritative Resolution**: Leverages Node.js `node:dns/promises` to directly query upstream recursive resolvers.
- **Comprehensive Record Types**:
  - `A` (IPv4 host addresses with TTL)
  - `AAAA` (IPv6 host addresses with TTL)
  - `MX` (Mail Exchangers with priority ratings and RFC 7505 Null MX detection)
  - `NS` (Authoritative Name Servers)
  - `TXT` (SPF, DKIM, site verification tokens)
  - `CNAME` (Canonical Name aliases)
  - `SOA` (Start of Authority: serial numbers, primary nameservers, refresh/expire intervals)
  - `CAA` (Certification Authority Authorization records)
- **Record Filtering Tabs**: Filter visible records by type (`ALL`, `A`, `AAAA`, `MX`, `NS`, `TXT`, `CNAME`, `SOA`).
- **Resolved IP Addressing**: Displays extracted A/AAAA IPs with a 1-click **"Track IP"** bridge to the IP Tracker.
- **Interactive Copy & Refresh**: Instant clipboard copy with visual feedback and live query refresh.

### 3. IP Intelligence & Geographic Tracker (`/ip`)
- **Intelligent Domain-to-IP Bridge**: Entering a company or domain name (e.g., `spotify`, `spotify.com`) automatically resolves the host to its live IP address for immediate geolocation and ASN tracking, with a shortcut link to inspect full DNS records.
- **Dual-Stack Validation**: Full support for IPv4 and IPv6 syntax verification.
- **RFC Bogon & Private IP Handling**: Accurately recognizes and explains non-routable address ranges:
  - RFC 1918 Private IPv4 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
  - Loopback (`127.0.0.1`, `::1`)
  - Link-Local (`169.254.0.0/16`, `fe80::/10`)
  - Carrier-Grade NAT (`100.64.0.0/10`)
  - Unique Local IPv6 (RFC 4193 `fc00::/7`)
- **Autonomous System (ASN) Forensics**: ISP names, AS numbers, and routing carrier metadata.
- **Reverse DNS (PTR)**: Hostname reverse resolution via socket resolvers.
- **Interactive Leaflet Map**: Renders client-side OpenStreetMap tiles with custom animated pulse markers at approximate coordinates.
- **Academic Privacy Disclaimer**: Explicit notice explaining that IP geolocation reflects telecom PoP exchanges and ISP routing centers, not personal physical residences.
- **Investigation Report Export**: One-click copy of formatted investigation logs.

---

## 🛠️ Technology Stack

| Layer | Technology | Role |
|---|---|---|
| **Frontend Framework** | [Next.js](https://nextjs.org/) (App Router, React 19) | Server-side rendering, routing, client state |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | End-to-end type safety |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Design token implementation, responsive layout |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent iconography |
| **Mapping** | [Leaflet](https://leafletjs.com/) & OpenStreetMap | Approximate geospatial map rendering |
| **DNS Engine** | Node.js `node:dns/promises` | Native asynchronous socket DNS resolution |
| **Validation** | [Zod](https://zod.dev/) | Server-side schema and input sanitization |

---

## 📐 Architecture & Design System

```
                         Browser Client
          [ Dashboard (/) | DNS (/dns) | IP Tracker (/ip) ]
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
   GET /api/dns?domain=...                     GET /api/ip?address=...
           │                                           │
   [Input Normalization]                       [IP & Bogon Check]
   [RFC Hostname Regex]                        [RFC 1918 / 4193]
           │                                           │
   node:dns/promises                           node:dns (reverse PTR)
   (Parallel A/AAAA/MX/NS/SOA)                 + Upstream Geolocation
           │                                           │
           └─────────────────────┬─────────────────────┘
                                 ▼
                      Normalized JSON Response
```

### Design Token Integration
NetScope implements the palette and typography tokens from the project design specification:
- **Midnight Wine (`#421d24`)**: Primary actions, grounding headers, and footer.
- **Royal Violet (`#714cb6`)**: Accent links, status badges, and active state highlights.
- **Lilac Mist (`#d4c7ff`)**: Subtle button fills, secondary tags, and active badge backgrounds.
- **Warm Parchment (`#f2f0eb`)**: Page canvas base replacing harsh stark white with editorial warmth.
- **Soft Mist (`#e3e3e2`)**: Hairline borders, dividers, and card outlines.
- **Ink Charcoal (`#292827`)**: High-contrast, warm text hierarchy.
- **Paper White (`#ffffff`)**: Elevated card surfaces.

---

## 📁 Project Folder Structure

```
.
├── design-tokens/            # Original design system references & tokens
│   ├── DESIGN.md             # Typography & UI guidelines
│   ├── theme.css             # Tailwind @theme definitions
│   ├── tokens.json           # Design token definitions
│   └── variables.css         # CSS custom properties
├── public/                   # Static public assets
├── scripts/
│   └── test-suite.mjs        # Automated integration test runner (12 test cases)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dns/route.ts  # GET /api/dns route handler
│   │   │   └── ip/route.ts   # GET /api/ip route handler
│   │   ├── dns/
│   │   │   └── page.tsx      # Page 2: DNS Record Inspector
│   │   ├── ip/
│   │   │   └── page.tsx      # Page 3: IP Address Intelligence
│   │   ├── globals.css       # Tailwind v4 import & design system variables
│   │   ├── layout.tsx        # Root layout with Inter font, Navbar, and Footer
│   │   └── page.tsx          # Page 1: Dashboard & Unified Search
│   ├── components/
│   │   ├── Footer.tsx        # Site-wide Midnight Wine footer
│   │   ├── MapComponent.tsx  # Client-side Leaflet OpenStreetMap implementation
│   │   ├── MapWrapper.tsx    # SSR-safe dynamic import wrapper
│   │   └── Navbar.tsx        # Sticky navigation bar with live status indicator
│   └── lib/
│       ├── dns-service.ts    # Node.js DNS resolution & record parser
│       ├── history.ts        # Browser localStorage history manager
│       ├── ip-service.ts     # IP parser, bogon classifier & geo provider
│       └── types.ts          # Shared TypeScript interfaces
├── .env.example              # Template for environment configuration
├── package.json              # Dependencies and project scripts
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started (Mac / Local Setup)

### Prerequisites
- **Node.js**: version `18.x` or newer (Recommended: Node `20+` or `24+`)
- **npm**: version `9.x` or newer

Check your versions by running in Terminal:
```bash
node -v
npm -v
```

### Installation

1. Open Terminal and navigate to the project directory:
   ```bash
   cd "/Users/janshafin/Desktop/untitled folder"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   > *Note: NetScope works out of the box without any API keys. If you have an IPinfo token, you can add it to `.env.local`.*

---

## 💻 Commands to Run the Project

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser. Any code changes will hot-reload automatically.

### Build and Start for Production
```bash
npm run build
npm run start
```
Starts the pre-compiled, optimized production server on [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testing Instructions

Run the automated test suite to verify all backend API endpoints, validation logic, and frontend routes:

```bash
npm test
```

The test suite validates 12 distinct test cases:
1. `example.com` full DNS record resolution (`A`, `AAAA`, `MX`, `NS`, `TXT`, `SOA`).
2. Specific record filtering (`cloudflare.com` for `NS`).
3. Rejection of malformed domain names with HTTP 400.
4. Handling of non-existent domains with HTTP 404 (NXDOMAIN).
5. Public IPv4 resolution, reverse PTR (`8.8.8.8` -> `dns.google`), and coordinates.
6. Public IPv6 resolution (`2606:4700:4700::1111` -> `one.one.one.one`).
7. Private RFC 1918 classification (`192.168.1.1`).
8. Loopback identification (`127.0.0.1`).
9. Rejection of invalid IP formats with HTTP 400.
10. Dashboard route (`/`) HTTP 200.
11. DNS Lookup route (`/dns`) HTTP 200.
12. IP Tracker route (`/ip`) HTTP 200.

---

## 📡 API Endpoint Reference

### 1. DNS Resolution Endpoint
`GET /api/dns?domain={domain}&type={type}`

#### Parameters:
- `domain` *(string, required)*: Domain name (e.g., `github.com`).
- `type` *(string, optional, default: `ALL`)*: Record type (`A`, `AAAA`, `MX`, `NS`, `TXT`, `CNAME`, `SOA`, `CAA`, `SRV`, `ALL`).

#### Sample Request:
```bash
curl -s "http://localhost:3000/api/dns?domain=github.com&type=A"
```

#### Sample Response:
```json
{
  "domain": "github.com",
  "queryType": "A",
  "timestamp": "2026-10-13T14:35:00.000Z",
  "durationMs": 18,
  "resolvedIPs": ["20.205.243.166"],
  "records": [
    {
      "type": "A",
      "name": "github.com",
      "value": "20.205.243.166",
      "ttl": 60
    }
  ],
  "summary": {
    "totalRecords": 1,
    "recordTypesFound": ["A"]
  },
  "nameserversUsed": ["192.168.1.1"]
}
```

---

### 2. IP Intelligence Endpoint
`GET /api/ip?address={address}`

#### Parameters:
- `address` *(string, required)*: IPv4 or IPv6 address (e.g., `8.8.8.8`).

#### Sample Request:
```bash
curl -s "http://localhost:3000/api/ip?address=8.8.8.8"
```

#### Sample Response:
```json
{
  "ip": "8.8.8.8",
  "version": "IPv4",
  "isPrivate": false,
  "isReserved": false,
  "hostname": "dns.google",
  "geolocation": {
    "country": "United States",
    "countryCode": "US",
    "region": "Virginia",
    "city": "Ashburn",
    "postal": "20149",
    "latitude": 39.03,
    "longitude": -77.5,
    "timezone": "America/New_York"
  },
  "network": {
    "isp": "Google LLC",
    "org": "Google Public DNS",
    "asn": "AS15169 Google LLC"
  },
  "disclaimer": "Approximate geolocation based on public routing and ISP network assignment. Never indicative of exact individual location.",
  "timestamp": "2026-10-13T14:35:00.000Z"
}
```

---

## 🔒 Security & Reliability

- **No Shell Execution**: Queries use native Node.js APIs (`node:dns/promises`, `node:net`), preventing command-injection attacks.
- **Server-Side Credentials**: External provider tokens remain strictly on the server and are never exposed to the client.
- **Input Sanitization**: Domains and IPs are validated against RFC standards and length bounds using Zod before query dispatch.
- **Private Network Protection**: Private, loopback, and broadcast ranges are evaluated before external requests, preventing unnecessary external traffic.

---

## ⚠️ Known Limitations & Future Improvements

### Known Limitations
1. **Local DNS Cache vs. Global Propagation**: Lookups reflect the local system resolver's upstream view. True global propagation checking requires deploying agent workers in diverse geographical regions (e.g., AWS multi-region edge lambdas).
2. **City-Level Geolocation**: IP geolocation data is inherently approximate and dependent on telecom registration databases.

### Future Improvements
- **DNSSEC Validation**: Display cryptographic DNSSEC chain of trust verification status.
- **Multi-Resolver Comparison**: Compare responses between Cloudflare (`1.1.1.1`), Google (`8.8.8.8`), and Quad9 (`9.9.9.9`).
- **Whois Domain Registration Inspection**: Add RDAP/Whois expiry and registrar lookup.
