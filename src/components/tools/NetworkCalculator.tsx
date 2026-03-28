import { useState } from 'react';

interface SubnetResult {
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

function ipToNum(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function numToIp(n: number): string {
  return [
    (n >>> 24) & 0xFF,
    (n >>> 16) & 0xFF,
    (n >>> 8) & 0xFF,
    n & 0xFF,
  ].join('.');
}

function numToBin(n: number): string {
  return [
    ((n >>> 24) & 0xFF).toString(2).padStart(8, '0'),
    ((n >>> 16) & 0xFF).toString(2).padStart(8, '0'),
    ((n >>> 8) & 0xFF).toString(2).padStart(8, '0'),
    (n & 0xFF).toString(2).padStart(8, '0'),
  ].join('.');
}

function getClass(firstOctet: number): string {
  if (firstOctet < 128) return 'A';
  if (firstOctet < 192) return 'B';
  if (firstOctet < 224) return 'C';
  if (firstOctet < 240) return 'D (Multicast)';
  return 'E (Reserved)';
}

function calculate(ip: string, cidr: number): SubnetResult {
  const ipNum = ipToNum(ip);
  const mask = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  const wildcard = (~mask) >>> 0;
  const network = (ipNum & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const totalHosts = Math.pow(2, 32 - cidr);
  const usableHosts = cidr >= 31 ? totalHosts : totalHosts - 2;

  return {
    network: numToIp(network),
    broadcast: numToIp(broadcast),
    firstHost: cidr >= 31 ? numToIp(network) : numToIp(network + 1),
    lastHost: cidr >= 31 ? numToIp(broadcast) : numToIp(broadcast - 1),
    subnetMask: numToIp(mask),
    wildcardMask: numToIp(wildcard),
    totalHosts,
    usableHosts: Math.max(0, usableHosts),
    cidr,
    ipClass: getClass((ipNum >>> 24) & 0xFF),
    binary: numToBin(ipNum),
  };
}

function ResultRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-mono text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}

export function NetworkCalculator() {
  const [ip, setIp] = useState('192.168.1.0');
  const [cidr, setCidr] = useState(24);
  const [result, setResult] = useState<SubnetResult | null>(null);
  const [error, setError] = useState('');

  function handleCalculate() {
    setError('');
    const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.trim().match(ipRegex);
    if (!match) {
      setError('유효하지 않은 IP 주소입니다. (예: 192.168.1.0)');
      return;
    }
    const octets = [1, 2, 3, 4].map((i) => parseInt(match[i]));
    if (octets.some((o) => o > 255)) {
      setError('각 옥텟은 0~255 범위여야 합니다.');
      return;
    }
    if (cidr < 0 || cidr > 32) {
      setError('CIDR은 0~32 범위여야 합니다.');
      return;
    }
    setResult(calculate(ip.trim(), cidr));
  }

  function handleIpInput(text: string) {
    setIp(text);
    // Auto-parse CIDR notation
    const cidrMatch = text.match(/^(.+?)\/(\d+)$/);
    if (cidrMatch) {
      setIp(cidrMatch[1]);
      setCidr(parseInt(cidrMatch[2]));
    }
  }

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Address</label>
          <input
            value={ip}
            onChange={(e) => handleIpInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCalculate()}
            placeholder="192.168.1.0 or 192.168.1.0/24"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="w-24">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">/ CIDR</label>
          <input
            type="number"
            min={0}
            max={32}
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

      {/* Results */}
      {result && (
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
            <ResultRow label="Subnet Mask" value={numToBin(ipToNum(result.subnetMask))} />
            <ResultRow label="Network" value={numToBin(ipToNum(result.network))} />
          </div>
        </div>
      )}
    </div>
  );
}
