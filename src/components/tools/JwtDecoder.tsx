import { useState, useMemo } from 'react';

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) base64 += '='.repeat(4 - pad);
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''),
  );
}

function base64UrlToHex(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) base64 += '='.repeat(4 - pad);
  const raw = atob(base64);
  return Array.from(raw, (c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signatureHex: string;
  parts: [string, string, string];
}

function decodeJwt(token: string): DecodedJwt {
  const parts = token.trim().split('.') as [string, string, string];
  if (parts.length !== 3) throw new Error('JWT must have exactly 3 parts separated by dots.');
  const header = JSON.parse(base64UrlDecode(parts[0]));
  const payload = JSON.parse(base64UrlDecode(parts[1]));
  const signatureHex = base64UrlToHex(parts[2]);
  return { header, payload, signatureHex, parts };
}

// Simple JSON syntax coloring
function syntaxHighlight(json: string): string {
  return json.replace(
    /("(\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let cls = 'text-amber-600 dark:text-amber-400'; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'text-blue-600 dark:text-blue-400'; // key
        } else {
          cls = 'text-emerald-600 dark:text-emerald-400'; // string
        }
      } else if (/true|false/.test(match)) {
        cls = 'text-purple-600 dark:text-purple-400'; // bool
      } else if (/null/.test(match)) {
        cls = 'text-gray-400'; // null
      }
      return `<span class="${cls}">${match}</span>`;
    },
  );
}

function formatExp(exp: number): { text: string; expired: boolean } {
  const date = new Date(exp * 1000);
  const now = Date.now();
  const expired = date.getTime() < now;
  const diff = date.getTime() - now;
  let relative = '';
  if (expired) {
    const ago = Math.abs(diff);
    if (ago < 60000) relative = `${Math.floor(ago / 1000)}s ago`;
    else if (ago < 3600000) relative = `${Math.floor(ago / 60000)}m ago`;
    else if (ago < 86400000) relative = `${Math.floor(ago / 3600000)}h ago`;
    else relative = `${Math.floor(ago / 86400000)}d ago`;
  } else {
    if (diff < 60000) relative = `in ${Math.floor(diff / 1000)}s`;
    else if (diff < 3600000) relative = `in ${Math.floor(diff / 60000)}m`;
    else if (diff < 86400000) relative = `in ${Math.floor(diff / 3600000)}h`;
    else relative = `in ${Math.floor(diff / 86400000)}d`;
  }
  return { text: `${date.toISOString()} (${relative})`, expired };
}

const SAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Inlvb3Nlb25nYyIsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjoxODkzNDU2MDAwLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

export function JwtDecoder() {
  const [input, setInput] = useState('');
  const [toast, setToast] = useState(false);

  const result = useMemo(() => {
    if (!input.trim()) return null;
    try {
      return { ok: true as const, data: decodeJwt(input) };
    } catch (e: any) {
      return { ok: false as const, error: e.message || 'Failed to decode JWT' };
    }
  }, [input]);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  }

  // Color-code the 3 parts in the input display
  const coloredParts = useMemo(() => {
    if (!result || !result.ok) return null;
    const { parts } = result.data;
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 font-mono text-sm break-all leading-relaxed">
        <span className="text-red-500 dark:text-red-400">{parts[0]}</span>
        <span className="text-gray-400">.</span>
        <span className="text-purple-600 dark:text-purple-400">{parts[1]}</span>
        <span className="text-gray-400">.</span>
        <span className="text-cyan-600 dark:text-cyan-400">{parts[2]}</span>
      </div>
    );
  }, [result]);

  const expInfo = useMemo(() => {
    if (!result || !result.ok) return null;
    const exp = result.data.payload.exp;
    if (typeof exp !== 'number') return null;
    return formatExp(exp);
  }, [result]);

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">JWT Token</label>
          <button
            onClick={() => setInput(SAMPLE_JWT)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Sample
          </button>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
        />
      </div>

      {result && !result.ok && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
        </div>
      )}

      {result && result.ok && (
        <>
          {/* Color-coded raw JWT */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Encoded</h3>
              <div className="flex gap-3 text-xs">
                <span className="text-red-500 dark:text-red-400">Header</span>
                <span className="text-purple-600 dark:text-purple-400">Payload</span>
                <span className="text-cyan-600 dark:text-cyan-400">Signature</span>
              </div>
            </div>
            {coloredParts}
          </div>

          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-red-500 dark:text-red-400">Header</h3>
              <button
                onClick={() => handleCopy(JSON.stringify(result.data.header, null, 2))}
                className="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Copy
              </button>
            </div>
            <pre
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-mono overflow-x-auto"
              dangerouslySetInnerHTML={{
                __html: syntaxHighlight(JSON.stringify(result.data.header, null, 2)),
              }}
            />
          </div>

          {/* Payload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Payload</h3>
              <button
                onClick={() => handleCopy(JSON.stringify(result.data.payload, null, 2))}
                className="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Copy
              </button>
            </div>
            <pre
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-mono overflow-x-auto"
              dangerouslySetInnerHTML={{
                __html: syntaxHighlight(JSON.stringify(result.data.payload, null, 2)),
              }}
            />
          </div>

          {/* Expiration highlight */}
          {expInfo && (
            <div
              className={`rounded-lg border px-4 py-3 ${
                expInfo.expired
                  ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                  : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    expInfo.expired ? 'bg-red-500' : 'bg-green-500'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    expInfo.expired
                      ? 'text-red-700 dark:text-red-400'
                      : 'text-green-700 dark:text-green-400'
                  }`}
                >
                  {expInfo.expired ? 'Expired' : 'Valid'}
                </span>
              </div>
              <p className="mt-1 text-sm font-mono text-gray-700 dark:text-gray-300">{expInfo.text}</p>
            </div>
          )}

          {/* Signature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-cyan-600 dark:text-cyan-400">Signature (hex)</h3>
              <button
                onClick={() => handleCopy(result.data.signatureHex)}
                className="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Copy
              </button>
            </div>
            <code className="block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-mono text-gray-700 dark:text-gray-300 break-all">
              {result.data.signatureHex}
            </code>
          </div>
        </>
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
