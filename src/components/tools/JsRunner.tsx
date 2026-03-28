import { useState, useRef, useCallback } from 'react';

interface ConsoleEntry {
  type: 'log' | 'error' | 'warn' | 'info';
  args: string;
  timestamp: number;
}

const SAMPLE_CODE = `// JavaScript Runner
// 코드를 작성하고 실행해보세요.

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

for (let i = 0; i < 10; i++) {
  console.log(\`fibonacci(\${i}) = \${fibonacci(i)}\`);
}

console.warn('이것은 경고 메시지입니다.');
console.info('실행 완료!');
`;

export function JsRunner() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const [running, setRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRun = useCallback(() => {
    setEntries([]);
    setRunning(true);

    const iframe = iframeRef.current;
    if (!iframe) { setRunning(false); return; }

    const doc = iframe.contentDocument;
    if (!doc) { setRunning(false); return; }

    // Build a sandboxed HTML that captures console output
    const html = `<!DOCTYPE html><html><head><script>
      const results = [];
      function serialize(args) {
        return Array.from(args).map(a => {
          if (a === null) return 'null';
          if (a === undefined) return 'undefined';
          if (typeof a === 'object') {
            try { return JSON.stringify(a, null, 2); } catch { return String(a); }
          }
          return String(a);
        }).join(' ');
      }
      ['log','error','warn','info'].forEach(m => {
        console[m] = function() {
          results.push({ type: m, args: serialize(arguments), timestamp: Date.now() });
          parent.postMessage({ type: 'console', entries: results }, '*');
        };
      });
      window.onerror = function(msg, src, line, col, err) {
        results.push({ type: 'error', args: String(msg) + (line ? ' (line ' + line + ')' : ''), timestamp: Date.now() });
        parent.postMessage({ type: 'console', entries: results }, '*');
      };
    <\/script></head><body><script>
      try {
        ${code.replace(/<\/script>/gi, '<\\/script>')}
      } catch(e) {
        console.error(e.toString());
      }
      parent.postMessage({ type: 'done', entries: results }, '*');
    <\/script></body></html>`;

    const handler = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow) return;
      const data = e.data;
      if (data?.type === 'console' || data?.type === 'done') {
        setEntries(data.entries || []);
      }
      if (data?.type === 'done') {
        setRunning(false);
        window.removeEventListener('message', handler);
      }
    };

    window.addEventListener('message', handler);

    // Timeout fallback
    setTimeout(() => {
      setRunning(false);
      window.removeEventListener('message', handler);
    }, 5000);

    doc.open();
    doc.write(html);
    doc.close();
  }, [code]);

  function handleClear() {
    setEntries([]);
  }

  const typeColor: Record<string, string> = {
    log: 'text-gray-800 dark:text-gray-200',
    error: 'text-red-500 dark:text-red-400',
    warn: 'text-amber-600 dark:text-amber-400',
    info: 'text-blue-500 dark:text-blue-400',
  };

  const typeLabel: Record<string, string> = {
    log: 'LOG',
    error: 'ERR',
    warn: 'WRN',
    info: 'INF',
  };

  return (
    <div className="space-y-4">
      {/* Editor */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">JavaScript</label>
          <div className="flex gap-2">
            <button
              onClick={handleRun}
              disabled={running}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {running ? '실행 중...' : '실행 (Run)'}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          className="w-full h-64 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent tab-size-2"
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const target = e.target as HTMLTextAreaElement;
              const start = target.selectionStart;
              const end = target.selectionEnd;
              setCode(code.slice(0, start) + '  ' + code.slice(end));
              setTimeout(() => { target.selectionStart = target.selectionEnd = start + 2; }, 0);
            }
          }}
        />
      </div>

      {/* Console output */}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Console</label>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-950 min-h-[200px] max-h-[400px] overflow-auto">
          {entries.length === 0 ? (
            <p className="text-gray-500 text-xs p-4 font-mono">코드를 실행하면 결과가 여기에 표시됩니다.</p>
          ) : (
            <div className="divide-y divide-gray-800">
              {entries.map((entry, i) => (
                <div key={i} className="flex gap-2 px-4 py-1.5 font-mono text-xs">
                  <span className={`shrink-0 w-8 ${typeColor[entry.type]} opacity-60`}>
                    {typeLabel[entry.type]}
                  </span>
                  <span className={`whitespace-pre-wrap ${typeColor[entry.type]}`}>
                    {entry.args}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hidden iframe for execution */}
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts"
        className="hidden"
        title="JS Runner Sandbox"
      />
    </div>
  );
}
