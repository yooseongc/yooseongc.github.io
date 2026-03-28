import { useState, useMemo } from 'react';

interface MatchInfo {
  index: number;
  match: string;
  groups: Record<string, string | undefined>;
  captures: (string | undefined)[];
}

const COMMON_PATTERNS: { label: string; pattern: string; flags: string }[] = [
  { label: 'Email', pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}', flags: 'g' },
  { label: 'URL', pattern: 'https?://[^\\s/$.?#].[^\\s]*', flags: 'gi' },
  { label: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  { label: 'IPv6', pattern: '(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}', flags: 'g' },
  { label: 'Phone (KR)', pattern: '0\\d{1,2}-\\d{3,4}-\\d{4}', flags: 'g' },
  { label: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])', flags: 'g' },
  { label: 'Hex Color', pattern: '#(?:[0-9a-fA-F]{3}){1,2}\\b', flags: 'gi' },
  { label: 'HTML Tag', pattern: '<([a-zA-Z][a-zA-Z0-9]*)\\b[^>]*>(.*?)</\\1>', flags: 'gs' },
  { label: 'Integer', pattern: '-?\\d+', flags: 'g' },
  { label: 'Floating Point', pattern: '-?\\d+\\.\\d+', flags: 'g' },
];

const FLAG_OPTIONS: { flag: string; label: string; desc: string }[] = [
  { flag: 'g', label: 'g', desc: 'global' },
  { flag: 'i', label: 'i', desc: 'case-insensitive' },
  { flag: 'm', label: 'm', desc: 'multiline' },
  { flag: 's', label: 's', desc: 'dotAll' },
  { flag: 'u', label: 'u', desc: 'unicode' },
];

export function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testStr, setTestStr] = useState('');
  const [error, setError] = useState('');

  function toggleFlag(f: string) {
    setFlags((prev) => (prev.includes(f) ? prev.replace(f, '') : prev + f));
  }

  const { matches, highlightedHtml } = useMemo(() => {
    if (!pattern || !testStr) return { matches: [] as MatchInfo[], highlightedHtml: '' };
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
      setError('');
      const result: MatchInfo[] = [];
      let m: RegExpExecArray | null;
      const seen = new Set<number>();
      // Collect matches
      while ((m = re.exec(testStr)) !== null) {
        if (seen.has(m.index)) break; // safety: prevent infinite loop
        seen.add(m.index);
        result.push({
          index: m.index,
          match: m[0],
          groups: m.groups ? { ...m.groups } : {},
          captures: m.slice(1),
        });
        if (m[0].length === 0) re.lastIndex++;
      }

      // Build highlighted HTML
      let html = '';
      let last = 0;
      for (const mi of result) {
        if (mi.index > last) {
          html += escapeHtml(testStr.slice(last, mi.index));
        }
        html += `<mark class="bg-emerald-200 dark:bg-emerald-700/60 text-emerald-900 dark:text-emerald-100 rounded px-0.5">${escapeHtml(mi.match)}</mark>`;
        last = mi.index + mi.match.length;
      }
      if (last < testStr.length) html += escapeHtml(testStr.slice(last));

      return { matches: result, highlightedHtml: html };
    } catch (e: any) {
      setError(e.message || 'Invalid regex');
      return { matches: [] as MatchInfo[], highlightedHtml: '' };
    }
  }, [pattern, flags, testStr]);

  function applyPreset(p: (typeof COMMON_PATTERNS)[0]) {
    setPattern(p.pattern);
    setFlags(p.flags);
  }

  return (
    <div className="space-y-6">
      {/* Pattern input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pattern</label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500">
            <span className="pl-3 text-gray-400 font-mono text-sm">/</span>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="regex pattern"
              className="flex-1 bg-transparent px-1 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none"
            />
            <span className="pr-3 text-gray-400 font-mono text-sm">/{flags}</span>
          </div>
        </div>
        {error && <p className="text-xs text-red-500 font-mono">{error}</p>}
      </div>

      {/* Flags */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Flags:</span>
        {FLAG_OPTIONS.map((f) => (
          <button
            key={f.flag}
            onClick={() => toggleFlag(f.flag)}
            title={f.desc}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
              flags.includes(f.flag)
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Common patterns */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Quick patterns:</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_PATTERNS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Test string */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Test String</label>
        <textarea
          value={testStr}
          onChange={(e) => setTestStr(e.target.value)}
          rows={6}
          placeholder="여기에 테스트할 문자열을 입력하세요..."
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
        />
      </div>

      {/* Highlighted output */}
      {highlightedHtml && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Matches ({matches.length})
          </h3>
          <div
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-mono whitespace-pre-wrap break-all text-gray-900 dark:text-gray-100 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </div>
      )}

      {/* Match table */}
      {matches.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Match Details</h3>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-400">#</th>
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-400">Match</th>
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-400">Index</th>
                  <th className="px-4 py-2 font-medium text-gray-600 dark:text-gray-400">Groups</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {matches.map((m, i) => (
                  <tr key={i} className="bg-white dark:bg-gray-900">
                    <td className="px-4 py-2 font-mono text-gray-500 dark:text-gray-400">{i + 1}</td>
                    <td className="px-4 py-2 font-mono text-emerald-700 dark:text-emerald-400 break-all">
                      {m.match || '(empty)'}
                    </td>
                    <td className="px-4 py-2 font-mono text-gray-700 dark:text-gray-300">{m.index}</td>
                    <td className="px-4 py-2 font-mono text-gray-700 dark:text-gray-300">
                      {m.captures.length > 0 ? (
                        <span className="space-x-2">
                          {m.captures.map((c, ci) => (
                            <span key={ci} className="inline-block bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 text-xs">
                              ${ci + 1}: {c ?? 'undefined'}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      {Object.keys(m.groups).length > 0 && (
                        <span className="ml-2 space-x-2">
                          {Object.entries(m.groups).map(([k, v]) => (
                            <span key={k} className="inline-block bg-blue-50 dark:bg-blue-900/30 rounded px-1.5 py-0.5 text-xs text-blue-700 dark:text-blue-300">
                              {k}: {v ?? 'undefined'}
                            </span>
                          ))}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Language compatibility reference */}
      <details className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
        <summary className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
          언어별 Regex 호환성 참고
        </summary>
        <div className="px-4 pb-4 text-xs text-gray-600 dark:text-gray-400 space-y-2">
          <p className="text-gray-500 dark:text-gray-500">이 테스터는 JavaScript(ECMAScript) regex 엔진을 사용합니다. 다른 언어와의 주요 차이점:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-1.5 pr-3 font-semibold">기능</th>
                  <th className="text-center py-1.5 px-2 font-semibold">JS</th>
                  <th className="text-center py-1.5 px-2 font-semibold">Python</th>
                  <th className="text-center py-1.5 px-2 font-semibold">C++ (std)</th>
                  <th className="text-center py-1.5 px-2 font-semibold">PCRE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                <tr><td className="py-1 pr-3">Named groups <code className="text-emerald-600 dark:text-emerald-400">{`(?<name>)`}</code></td><td className="text-center">O</td><td className="text-center">O <code>(?P&lt;name&gt;)</code></td><td className="text-center">X</td><td className="text-center">O</td></tr>
                <tr><td className="py-1 pr-3">Lookbehind <code className="text-emerald-600 dark:text-emerald-400">{`(?<=)`}</code></td><td className="text-center">O</td><td className="text-center">O</td><td className="text-center">X</td><td className="text-center">O</td></tr>
                <tr><td className="py-1 pr-3">Unicode property <code className="text-emerald-600 dark:text-emerald-400">{`\\p{L}`}</code></td><td className="text-center">O (u flag)</td><td className="text-center">X</td><td className="text-center">X</td><td className="text-center">O</td></tr>
                <tr><td className="py-1 pr-3">Atomic groups <code className="text-emerald-600 dark:text-emerald-400">{`(?>)`}</code></td><td className="text-center">X</td><td className="text-center">X</td><td className="text-center">X</td><td className="text-center">O</td></tr>
                <tr><td className="py-1 pr-3">Possessive quantifier <code className="text-emerald-600 dark:text-emerald-400">++</code></td><td className="text-center">X</td><td className="text-center">X</td><td className="text-center">X</td><td className="text-center">O</td></tr>
                <tr><td className="py-1 pr-3">Conditional <code className="text-emerald-600 dark:text-emerald-400">{`(?(1)a|b)`}</code></td><td className="text-center">X</td><td className="text-center">O</td><td className="text-center">X</td><td className="text-center">O</td></tr>
                <tr><td className="py-1 pr-3">dotAll (s flag)</td><td className="text-center">O</td><td className="text-center">O (re.S)</td><td className="text-center">X</td><td className="text-center">O (s flag)</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-500 dark:text-gray-500 mt-2">* C++ std::regex는 ECMAScript 모드(기본) 기준. Boost.Regex는 PCRE와 유사.</p>
        </div>
      </details>
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
