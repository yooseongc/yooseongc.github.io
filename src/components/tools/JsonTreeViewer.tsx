import { useState, useMemo } from 'react';

const SAMPLE_JSON = `{
  "name": "yooseongc",
  "role": "Backend Developer",
  "skills": ["C++", "Rust", "Python", "JavaScript"],
  "experience": {
    "current": {
      "company": "Network Security",
      "since": 2023
    },
    "previous": [
      { "role": "MLOps Engineer", "year": 2022 },
      { "role": "Weather Data Analyst", "years": "2017-2021" }
    ]
  },
  "interests": ["Linux", "Network", "Security", "DevOps"],
  "isActive": true,
  "homepage": null
}`;

interface TreeNodeProps {
  keyName: string;
  value: unknown;
  depth: number;
}

function TreeNode({ keyName, value, depth }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (value === null) {
    return (
      <div className="flex items-center gap-1 leading-6" style={{ paddingLeft: depth * 16 }}>
        <span className="text-emerald-600 dark:text-emerald-400">{keyName}</span>
        <span className="text-gray-400">:</span>
        <span className="text-gray-500 italic">null</span>
      </div>
    );
  }

  if (typeof value === 'object') {
    const isArray = Array.isArray(value);
    const entries = Object.entries(value as Record<string, unknown>);
    const bracket = isArray ? ['[', ']'] : ['{', '}'];

    return (
      <div style={{ paddingLeft: depth * 16 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1.5 py-0.5 -ml-1.5 transition-colors leading-6"
        >
          <svg
            className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6 4l8 6-8 6V4z" />
          </svg>
          <span className="text-emerald-600 dark:text-emerald-400">{keyName}</span>
          <span className="text-gray-400">: {bracket[0]}</span>
          {!expanded && (
            <span className="text-gray-400 text-xs ml-1">
              {entries.length} {isArray ? 'items' : 'keys'} {bracket[1]}
            </span>
          )}
        </button>
        {expanded && (
          <>
            {entries.map(([k, v]) => (
              <TreeNode key={k} keyName={isArray ? `[${k}]` : k} value={v} depth={depth + 1} />
            ))}
            <div className="text-gray-400 leading-6" style={{ paddingLeft: 16 }}>{bracket[1]}</div>
          </>
        )}
      </div>
    );
  }

  const color =
    typeof value === 'string' ? 'text-amber-600 dark:text-amber-400' :
    typeof value === 'number' ? 'text-blue-600 dark:text-blue-400' :
    typeof value === 'boolean' ? 'text-purple-600 dark:text-purple-400' :
    'text-gray-600 dark:text-gray-400';

  const display = typeof value === 'string' ? `"${value}"` : String(value);

  return (
    <div className="flex items-center gap-1 leading-6" style={{ paddingLeft: depth * 16 }}>
      <span className="text-emerald-600 dark:text-emerald-400">{keyName}</span>
      <span className="text-gray-400">:</span>
      <span className={color}>{display}</span>
    </div>
  );
}

function LineNumberedCode({ code }: { code: string }) {
  const lines = code.split('\n');
  return (
    <div className="flex">
      <div className="select-none pr-4 text-right text-gray-400 dark:text-gray-600 border-r border-gray-200 dark:border-gray-700 mr-4">
        {lines.map((_, i) => (
          <div key={i} className="leading-6">{i + 1}</div>
        ))}
      </div>
      <pre className="text-gray-800 dark:text-gray-200 whitespace-pre overflow-x-auto flex-1">
        {lines.map((line, i) => (
          <div key={i} className="leading-6">{line || ' '}</div>
        ))}
      </pre>
    </div>
  );
}

export function JsonTreeViewer() {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<unknown>(null);
  const [error, setError] = useState('');
  const [view, setView] = useState<'tree' | 'raw'>('tree');

  const lineCount = useMemo(() => input.split('\n').length, [input]);

  function handleParse(text: string) {
    setInput(text);
    setError('');
    setParsed(null);
    if (!text.trim()) return;
    try {
      setParsed(JSON.parse(text));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON 파싱 실패');
    }
  }

  function handleFormat() {
    if (!parsed) return;
    setInput(JSON.stringify(parsed, null, 2));
  }

  function handleMinify() {
    if (!parsed) return;
    setInput(JSON.stringify(parsed));
  }

  function handleSample() {
    handleParse(SAMPLE_JSON);
  }

  return (
    <div className="space-y-4">
      {/* Input */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">JSON Input</label>
          <div className="flex gap-2">
            <button onClick={handleSample} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
              Sample
            </button>
            <button onClick={handleFormat} disabled={!parsed} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-30">
              Format
            </button>
            <button onClick={handleMinify} disabled={!parsed} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-30">
              Minify
            </button>
          </div>
        </div>
        {/* Textarea with line numbers */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent">
          <div className="select-none px-3 py-3 text-right text-xs text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 font-mono leading-5">
            {Array.from({ length: Math.max(lineCount, 10) }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            value={input}
            onChange={(e) => handleParse(e.target.value)}
            placeholder='{"key": "value"}'
            className="flex-1 h-48 px-4 py-3 bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm resize-y focus:outline-none leading-5"
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>}
      </div>

      {/* Output */}
      {parsed !== null && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setView('tree')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'tree'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Tree
            </button>
            <button
              onClick={() => setView('raw')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'raw'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Raw
            </button>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 overflow-auto max-h-[500px] font-mono text-sm">
            {view === 'tree' ? (
              <TreeNode keyName="root" value={parsed} depth={0} />
            ) : (
              <LineNumberedCode code={JSON.stringify(parsed, null, 2)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
