import { useState } from 'react';

type IpVersion = 'ipv4' | 'ipv6';

// === IPv4 ===
interface IPv4Result {
  version: 'ipv4';
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  subnetMask: string;
  wildcardMask: string;
  totalHosts: number;
  usableHosts: number;
  cidr: number;
  ipClass: string;
  binary: string;
}

function ipv4ToNum(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function numToIpv4(n: number): string {
  return [(n >>> 24) & 0xFF, (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF].join('.');
}

function numToBinIpv4(n: number): string {
  return [(n >>> 24) & 0xFF, (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF]
    .map((o) => o.toString(2).padStart(8, '0')).join('.');
}

function getIpv4Class(first: number): string {
  if (first < 128) return 'A';
  if (first < 192) return 'B';
  if (first < 224) return 'C';
  if (first < 240) return 'D (Multicast)';
  return 'E (Reserved)';
}

function calcIPv4(ip: string, cidr: number): IPv4Result {
  const ipNum = ipv4ToNum(ip);
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const wildcard = (~mask) >>> 0;
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const totalHosts = Math.pow(2, 32 - cidr);
  const usableHosts = cidr >= 31 ? totalHosts : totalHosts - 2;
  return {
    version: 'ipv4', network: numToIpv4(network), broadcast: numToIpv4(broadcast),
    firstHost: cidr >= 31 ? numToIpv4(network) : numToIpv4(network + 1),
    lastHost: cidr >= 31 ? numToIpv4(broadcast) : numToIpv4(broadcast - 1),
    subnetMask: numToIpv4(mask), wildcardMask: numToIpv4(wildcard),
    totalHosts, usableHosts: Math.max(0, usableHosts), cidr,
    ipClass: getIpv4Class((ipNum >>> 24) & 0xFF), binary: numToBinIpv4(ipNum),
  };
}

// === IPv6 ===
interface IPv6Result {
  version: 'ipv6';
  fullAddress: string;
  network: string;
  firstHost: string;
  lastHost: string;
  cidr: number;
  totalHosts: string;
  scope: string;
}

function expandIPv6(ip: string): string {
  // Handle :: expansion
  let parts = ip.split(':');
  if (ip.includes('::')) {
    const sides = ip.split('::');
    const left = sides[0] ? sides[0].split(':') : [];
    const right = sides[1] ? sides[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    parts = [...left, ...Array(missing).fill('0'), ...right];
  }
  return parts.map((p) => p.padStart(4, '0')).join(':');
}

function ipv6ToBigInt(full: string): bigint {
  const parts = full.split(':');
  let result = 0n;
  for (const p of parts) {
    result = (result << 16n) | BigInt(parseInt(p, 16));
  }
  return result;
}

function bigIntToIPv6(n: bigint): string {
  const parts: string[] = [];
  for (let i = 0; i < 8; i++) {
    parts.unshift(((n >> BigInt(i * 16)) & 0xFFFFn).toString(16));
  }
  return parts.join(':');
}

function compressIPv6(full: string): string {
  // Simple compression: remove leading zeros and find longest :: run
  const parts = full.split(':').map((p) => p.replace(/^0+/, '') || '0');
  // Find longest consecutive '0' sequence
  let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '0') {
      if (curStart === -1) curStart = i;
      curLen++;
      if (curLen > bestLen) { bestStart = curStart; bestLen = curLen; }
    } else {
      curStart = -1; curLen = 0;
    }
  }
  if (bestLen >= 2) {
    const left = parts.slice(0, bestStart).join(':');
    const right = parts.slice(bestStart + bestLen).join(':');
    return (left || '') + '::' + (right || '');
  }
  return parts.join(':');
}

function getIPv6Scope(n: bigint): string {
  const first16 = Number((n >> 112n) & 0xFFFFn);
  if (first16 === 0 && n === 1n) return 'Loopback (::1)';
  if (first16 === 0) return 'Unspecified / Embedded';
  if ((first16 >> 8) === 0xFE && ((first16 >> 6) & 0x3) === 2) return 'Link-Local';
  if ((first16 >> 6) === 0x3FA) return 'Unique Local (ULA)';
  if ((first16 >> 13) === 1) return 'Global Unicast';
  if ((first16 >> 8) === 0xFF) return 'Multicast';
  return 'Global Unicast';
}

function calcIPv6(ip: string, cidr: number): IPv6Result {
  const full = expandIPv6(ip);
  const ipNum = ipv6ToBigInt(full);
  const mask = cidr === 0 ? 0n : ((1n << 128n) - 1n) << BigInt(128 - cidr);
  const network = ipNum & mask;
  const hostBits = 128 - cidr;
  const hostMask = hostBits === 128 ? (1n << 128n) - 1n : (1n << BigInt(hostBits)) - 1n;
  const firstHost = network;
  const lastHost = network | hostMask;
  const totalHosts = hostBits >= 64 ? `2^${hostBits}` : (1n << BigInt(hostBits)).toString();
  return {
    version: 'ipv6', fullAddress: full,
    network: compressIPv6(bigIntToIPv6(network)),
    firstHost: compressIPv6(bigIntToIPv6(firstHost)),
    lastHost: compressIPv6(bigIntToIPv6(lastHost)),
    cidr, totalHosts,
    scope: getIPv6Scope(ipNum),
  };
}

// === UI ===
function ResultRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-mono text-gray-900 dark:text-gray-100 text-right break-all">{value}</span>
    </div>
  );
}

export function NetworkCalculator() {
  const [ipVersion, setIpVersion] = useState<IpVersion>('ipv4');
  const [ip, setIp] = useState('192.168.1.0');
  const [cidr, setCidr] = useState(24);
  const [result, setResult] = useState<IPv4Result | IPv6Result | null>(null);
  const [error, setError] = useState('');

  function handleVersionChange(v: IpVersion) {
    setIpVersion(v);
    setResult(null);
    setError('');
    if (v === 'ipv4') { setIp('192.168.1.0'); setCidr(24); }
    else { setIp('2001:db8::'); setCidr(48); }
  }

  function handleCalculate() {
    setError('');
    if (ipVersion === 'ipv4') {
      const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
      const match = ip.trim().match(ipRegex);
      if (!match) { setError('유효하지 않은 IPv4 주소입니다. (예: 192.168.1.0)'); return; }
      const octets = [1, 2, 3, 4].map((i) => parseInt(match[i]));
      if (octets.some((o) => o > 255)) { setError('각 옥텟은 0~255 범위여야 합니다.'); return; }
      if (cidr < 0 || cidr > 32) { setError('CIDR은 0~32 범위여야 합니다.'); return; }
      setResult(calcIPv4(ip.trim(), cidr));
    } else {
      try {
        const full = expandIPv6(ip.trim());
        if (full.split(':').length !== 8) throw new Error('invalid');
        if (cidr < 0 || cidr > 128) { setError('IPv6 CIDR은 0~128 범위여야 합니다.'); return; }
        setResult(calcIPv6(ip.trim(), cidr));
      } catch {
        setError('유효하지 않은 IPv6 주소입니다. (예: 2001:db8::1)');
      }
    }
  }

  function handleIpInput(text: string) {
    // Auto-parse CIDR notation
    const cidrMatch = text.match(/^(.+?)\/(\d+)$/);
    if (cidrMatch) {
      setIp(cidrMatch[1]);
      setCidr(parseInt(cidrMatch[2]));
    } else {
      setIp(text);
    }
  }

  const maxCidr = ipVersion === 'ipv4' ? 32 : 128;

  return (
    <div className="space-y-6">
      {/* Version toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">Version:</span>
        {(['ipv4', 'ipv6'] as const).map((v) => (
          <button
            key={v}
            onClick={() => handleVersionChange(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              ipVersion === v
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {v.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Address</label>
          <input
            value={ip}
            onChange={(e) => handleIpInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
            placeholder={ipVersion === 'ipv4' ? '192.168.1.0' : '2001:db8::1'}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="w-24">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">/ CIDR</label>
          <input
            type="number"
            min={0}
            max={maxCidr}
            value={cidr}
            onChange={(e) => setCidr(parseInt(e.target.value) || 0)}
            onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleCalculate}
            className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            계산
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      {/* IPv4 Results */}
      {result?.version === 'ipv4' && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">네트워크 정보</h3>
            <ResultRow label="Network" value={result.network} />
            <ResultRow label="Broadcast" value={result.broadcast} />
            <ResultRow label="First Host" value={result.firstHost} />
            <ResultRow label="Last Host" value={result.lastHost} />
            <ResultRow label="IP Class" value={result.ipClass} />
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">서브넷 정보</h3>
            <ResultRow label="Subnet Mask" value={result.subnetMask} />
            <ResultRow label="Wildcard Mask" value={result.wildcardMask} />
            <ResultRow label="CIDR" value={`/${result.cidr}`} />
            <ResultRow label="Total Addresses" value={result.totalHosts.toLocaleString()} />
            <ResultRow label="Usable Hosts" value={result.usableHosts.toLocaleString()} />
          </div>
          <div className="sm:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Binary</h3>
            <ResultRow label="IP Address" value={result.binary} />
            <ResultRow label="Subnet Mask" value={numToBinIpv4(ipv4ToNum(result.subnetMask))} />
            <ResultRow label="Network" value={numToBinIpv4(ipv4ToNum(result.network))} />
          </div>
        </div>
      )}

      {/* IPv6 Results */}
      {result?.version === 'ipv6' && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">IPv6 네트워크 정보</h3>
            <ResultRow label="Full Address" value={result.fullAddress} />
            <ResultRow label="Network" value={result.network} />
            <ResultRow label="First Address" value={result.firstHost} />
            <ResultRow label="Last Address" value={result.lastHost} />
            <ResultRow label="CIDR" value={`/${result.cidr}`} />
            <ResultRow label="Total Addresses" value={result.totalHosts} />
            <ResultRow label="Scope" value={result.scope} />
          </div>
        </div>
      )}
    </div>
  );
}
