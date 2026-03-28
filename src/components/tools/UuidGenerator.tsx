import { useState, useCallback } from 'react';

// ── UUID v4: random ──
function uuidV4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  return formatUuidBytes(bytes);
}

function formatUuidBytes(b: Uint8Array): string {
  const h = Array.from(b, (v) => v.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// ── UUID v5: SHA-1 namespace + name ──
const NAMESPACES: Record<string, string> = {
  DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
};

function uuidToBytes(uuid: string): Uint8Array {
  const hex = uuid.replace(/-/g, '');
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

async function uuidV5(namespace: string, name: string): Promise<string> {
  const nsBytes = uuidToBytes(namespace);
  const nameBytes = new TextEncoder().encode(name);
  const data = new Uint8Array(nsBytes.length + nameBytes.length);
  data.set(nsBytes);
  data.set(nameBytes, nsBytes.length);
  const hashBuf = await crypto.subtle.digest('SHA-1', data);
  const hash = new Uint8Array(hashBuf).slice(0, 16);
  hash[6] = (hash[6] & 0x0f) | 0x50; // version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // variant 10
  return formatUuidBytes(hash);
}

// ── UUID v7: timestamp-based ──
function uuidV7(): string {
  const now = Date.now();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // 48-bit timestamp (ms since epoch) in big-endian
  bytes[0] = (now / 2 ** 40) & 0xff;
  bytes[1] = (now / 2 ** 32) & 0xff;
  bytes[2] = (now / 2 ** 24) & 0xff;
  bytes[3] = (now / 2 ** 16) & 0xff;
  bytes[4] = (now / 2 ** 8) & 0xff;
  bytes[5] = now & 0xff;
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  return formatUuidBytes(bytes);
}

// ── Parse UUID ──
interface UuidInfo {
  version: number;
  variant: string;
  timestamp?: string;
  valid: boolean;
}

function parseUuid(uuid: string): UuidInfo | null {
  const clean = uuid.trim();
  const re = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!re.test(clean)) return null;
  const hex = clean.replace(/-/g, '');
  const versionNibble = parseInt(hex[12], 16);
  const variantByte = parseInt(hex[16], 16);
  let variant = 'Unknown';
  if ((variantByte & 0x8) === 0) variant = 'NCS (reserved)';
  else if ((variantByte & 0xc) === 0x8) variant = 'RFC 4122 / RFC 9562';
  else if ((variantByte & 0xe) === 0xc) variant = 'Microsoft (reserved)';
  else variant = 'Future (reserved)';

  const info: UuidInfo = { version: versionNibble, variant, valid: true };

  if (versionNibble === 7) {
    // extract 48-bit timestamp
    const tsHex = hex.slice(0, 12);
    const ts = parseInt(tsHex, 16);
    info.timestamp = new Date(ts).toISOString();
  }

  return info;
}

type Tab = 'v4' | 'v5' | 'v7' | 'parse';

export function UuidGenerator() {
  const [tab, setTab] = useState<Tab>('v4');
  const [results, setResults] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [toast, setToast] = useState(false);

  // v5 state
  const [nsOption, setNsOption] = useState<'DNS' | 'URL' | 'OID' | 'X500' | 'custom'>('DNS');
  const [customNs, setCustomNs] = useState('');
  const [v5Name, setV5Name] = useState('');

  // parse state
  const [parseInput, setParseInput] = useState('');
  const [parseResult, setParseResult] = useState<UuidInfo | null>(null);
  const [parseError, setParseError] = useState('');

  function showToast() {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    showToast();
  }

  function handleCopyAll() {
    navigator.clipboard.writeText(results.join('\n'));
    showToast();
  }

  const generateV4 = useCallback(() => {
    const out: string[] = [];
    for (let i = 0; i < count; i++) out.push(uuidV4());
    setResults(out);
  }, [count]);

  const generateV5 = useCallback(async () => {
    const ns = nsOption === 'custom' ? customNs : NAMESPACES[nsOption];
    if (!ns || !v5Name) return;
    try {
      const out: string[] = [];
      // v5 is deterministic, so bulk just gives same result; generate once
      const id = await uuidV5(ns, v5Name);
      out.push(id);
      setResults(out);
    } catch {
      setResults(['Error generating UUID v5']);
    }
  }, [nsOption, customNs, v5Name]);

  const generateV7 = useCallback(() => {
    const out: string[] = [];
    for (let i = 0; i < count; i++) out.push(uuidV7());
    setResults(out);
  }, [count]);

  function handleParse(val: string) {
    setParseInput(val);
    setParseError('');
    setParseResult(null);
    if (!val.trim()) return;
    const info = parseUuid(val);
    if (!info) {
      setParseError('유효한 UUID 형식이 아닙니다.');
      return;
    }
    setParseResult(info);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'v4', label: 'UUID v4' },
    { key: 'v5', label: 'UUID v5' },
    { key: 'v7', label: 'UUID v7' },
    { key: 'parse', label: 'Parse' },
  ];

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setResults([]);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* v4 */}
      {tab === 'v4' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 dark:text-gray-300">Count:</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
              className="w-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={generateV4}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Generate
            </button>
            {results.length > 1 && (
              <button
                onClick={handleCopyAll}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Copy All
              </button>
            )}
          </div>
        </div>
      )}

      {/* v5 */}
      {tab === 'v5' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">Namespace</label>
              <div className="flex flex-wrap gap-2">
                {(['DNS', 'URL', 'OID', 'X500', 'custom'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setNsOption(opt)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      nsOption === opt
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {opt === 'custom' ? 'Custom' : opt}
                  </button>
                ))}
              </div>
              {nsOption === 'custom' && (
                <input
                  type="text"
                  value={customNs}
                  onChange={(e) => setCustomNs(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">Name</label>
              <input
                type="text"
                value={v5Name}
                onChange={(e) => setV5Name(e.target.value)}
                placeholder="예: example.com"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={generateV5}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Generate
            </button>
          </div>
        </div>
      )}

      {/* v7 */}
      {tab === 'v7' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-700 dark:text-gray-300">Count:</label>
            <input
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
              className="w-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={generateV7}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Generate
            </button>
            {results.length > 1 && (
              <button
                onClick={handleCopyAll}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Copy All
              </button>
            )}
          </div>
        </div>
      )}

      {/* parse */}
      {tab === 'parse' && (
        <div className="space-y-4">
          <input
            type="text"
            value={parseInput}
            onChange={(e) => handleParse(e.target.value)}
            placeholder="UUID를 입력하세요"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {parseError && <p className="text-xs text-red-500">{parseError}</p>}
          {parseResult && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 pr-4 font-medium text-gray-600 dark:text-gray-400">Version</td>
                    <td className="py-1 font-mono text-gray-900 dark:text-gray-100">{parseResult.version}</td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4 font-medium text-gray-600 dark:text-gray-400">Variant</td>
                    <td className="py-1 font-mono text-gray-900 dark:text-gray-100">{parseResult.variant}</td>
                  </tr>
                  {parseResult.timestamp && (
                    <tr>
                      <td className="py-1 pr-4 font-medium text-gray-600 dark:text-gray-400">Timestamp</td>
                      <td className="py-1 font-mono text-gray-900 dark:text-gray-100">{parseResult.timestamp}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Results list (for v4, v5, v7) */}
      {tab !== 'parse' && results.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
          {results.map((id, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-2 group">
              <code className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">{id}</code>
              <button
                onClick={() => handleCopy(id)}
                className="ml-3 shrink-0 px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50">
          Copied!
        </div>
      )}
    </div>
  );
}
