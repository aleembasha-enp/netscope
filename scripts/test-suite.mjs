// NetScope Automated Test Suite
const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('=====================================================');
  console.log('🚀 Running NetScope Automated Test Suite');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message}\n`);
      failed++;
    }
  }

  // 1. DNS: example.com (ALL)
  await test('DNS: Query example.com for ALL records', async () => {
    const res = await fetch(`${BASE_URL}/api/dns?domain=example.com&type=ALL`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.domain !== 'example.com') throw new Error(`Unexpected domain: ${json.domain}`);
    if (!Array.isArray(json.records) || json.records.length === 0) throw new Error('No records returned');
    if (!Array.isArray(json.resolvedIPs) || json.resolvedIPs.length === 0) throw new Error('No resolved IPs');
  });

  // 2. DNS: Specific record filter
  await test('DNS: Query cloudflare.com for NS records', async () => {
    const res = await fetch(`${BASE_URL}/api/dns?domain=cloudflare.com&type=NS`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.records.some((r) => r.type === 'NS')) throw new Error('Missing NS records');
  });

  // 3. DNS: Invalid domain rejection
  await test('DNS: Reject malformed domain name with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/dns?domain=invalid..domain`);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const json = await res.json();
    if (!json.error) throw new Error('Expected error message');
  });

  // 4. DNS: Non-existent domain NXDOMAIN
  await test('DNS: Return 404 for non-existent domain', async () => {
    const res = await fetch(`${BASE_URL}/api/dns?domain=thisdomainsurelydoesnotexist123456789.org`);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    const json = await res.json();
    if (!json.message.includes('NXDOMAIN') && !json.message.includes('could not be resolved')) {
      throw new Error(`Unexpected message: ${json.message}`);
    }
  });

  // 5. IP: Public IPv4 (8.8.8.8)
  await test('IP: Track public IPv4 8.8.8.8 with reverse PTR and geolocation', async () => {
    const res = await fetch(`${BASE_URL}/api/ip?address=8.8.8.8`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.version !== 'IPv4') throw new Error(`Expected IPv4, got ${json.version}`);
    if (json.isPrivate) throw new Error('Expected public IP');
    if (json.hostname !== 'dns.google') throw new Error(`Expected hostname dns.google, got ${json.hostname}`);
    if (!json.geolocation || !json.geolocation.country) throw new Error('Missing geolocation');
    if (typeof json.geolocation.latitude !== 'number') throw new Error('Missing coordinates');
  });

  // 6. IP: Public IPv6
  await test('IP: Track public IPv6 2606:4700:4700::1111', async () => {
    const res = await fetch(`${BASE_URL}/api/ip?address=2606:4700:4700::1111`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json.version !== 'IPv6') throw new Error(`Expected IPv6, got ${json.version}`);
    if (json.isPrivate) throw new Error('Expected public IPv6');
    if (json.hostname !== 'one.one.one.one') throw new Error(`Expected hostname one.one.one.one, got ${json.hostname}`);
  });

  // 7. IP: Private RFC 1918
  await test('IP: Correctly identify private RFC 1918 IP (192.168.1.1)', async () => {
    const res = await fetch(`${BASE_URL}/api/ip?address=192.168.1.1`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.isPrivate) throw new Error('Expected isPrivate to be true');
    if (json.geolocation !== null) throw new Error('Private IP should have null geolocation');
    if (!json.explanation) throw new Error('Expected explanation for private IP');
  });

  // 8. IP: Loopback IP
  await test('IP: Correctly identify loopback address (127.0.0.1)', async () => {
    const res = await fetch(`${BASE_URL}/api/ip?address=127.0.0.1`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.isPrivate || !json.isReserved) throw new Error('Expected loopback to be private and reserved');
  });

  // 9. IP: Domain-to-IP automatic resolution (e.g., spotify)
  await test('IP: Automatically resolve domain/company name (spotify) to IP', async () => {
    const res = await fetch(`${BASE_URL}/api/ip?address=spotify`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.ip) throw new Error('Expected resolved IP address');
    if (json.resolvedFromDomain !== 'spotify.com') throw new Error(`Expected resolvedFromDomain to be spotify.com, got ${json.resolvedFromDomain}`);
    if (!json.geolocation || !json.geolocation.country) throw new Error('Expected geolocation for resolved IP');
  });

  // 10. IP: Invalid IP and unresolvable domain rejection
  await test('IP: Reject invalid IP and unresolvable domain with 400', async () => {
    const res = await fetch(`${BASE_URL}/api/ip?address=999.999.999.999`);
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    const json = await res.json();
    if (!json.error) throw new Error('Expected error response');
  });

  // 10. Frontend: Verify 3 Core Pages are served
  await test('Pages: Verify Dashboard (/) serves HTTP 200', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await test('Pages: Verify DNS Lookup (/dns) serves HTTP 200', async () => {
    const res = await fetch(`${BASE_URL}/dns`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  await test('Pages: Verify IP Tracker (/ip) serves HTTP 200', async () => {
    const res = await fetch(`${BASE_URL}/ip`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  });

  console.log('\n=====================================================');
  console.log(`🎯 Test Results: ${passed} passed, ${failed} failed`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
