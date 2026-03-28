import { useState } from 'react';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface HeaderEntry {
  key: string;
  value: string;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  requestHeaders: Record<string, string>;
}

interface ErrorInfo {
  message: string;
  details: string;
  time: number;
  requestHeaders: Record<string, string>;
}

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-emerald-600',
  POST: 'bg-blue-600',
  PUT: 'bg-amber-600',
  PATCH: 'bg-purple-600',
  DELETE: 'bg-red-600',
};

export function ApiTester() {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [headers, setHeaders] = useState<HeaderEntry[]>([{ key: 'Content-Type', value: 'application/json' }]);
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');

  function addHeader() {
    setHeaders([...headers, { key: '', value: '' }]);
  }

  function updateHeader(index: number, field: 'key' | 'value', val: string) {
    const updated = [...headers];
    updated[index][field] = val;
    setHeaders(updated);
  }

  function removeHeader(index: number) {
    setHeaders(headers.filter((_, i) => i !== index));
  }

  async function handleSend() {
    setErrorInfo(null);
    setResponse(null);
    if (!url.trim()) { setErrorInfo({ message: 'URL을 입력하세요.', details: '', time: 0, requestHeaders: {} }); return; }

    setLoading(true);
    const start = performance.now();

    const reqHeaders: Record<string, string> = {};
    headers.forEach((h) => { if (h.key.trim()) reqHeaders[h.key.trim()] = h.value; });

    try {
      const options: RequestInit = { method, headers: reqHeaders };
      if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
        options.body = body;
      }

      const res = await fetch(url, options);
      const time = Math.round(performance.now() - start);
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => { resHeaders[k] = v; });

      let resBody: string;
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('json')) {
        const json = await res.json();
        resBody = JSON.stringify(json, null, 2);
      } else {
        resBody = await res.text();
      }

      setResponse({ status: res.status, statusText: res.statusText, headers: resHeaders, body: resBody, time, requestHeaders: reqHeaders });
    } catch (e) {
      const time = Math.round(performance.now() - start);
      const message = e instanceof TypeError
        ? 'CORS 정책에 의해 차단되었거나 네트워크 오류가 발생했습니다.'
        : 'Request failed';
      const details = e instanceof Error
        ? `${e.name}: ${e.message}${e.stack ? '\n\nStack trace:\n' + e.stack : ''}`
        : String(e);
      setErrorInfo({ message, details, time, requestHeaders: reqHeaders });
    } finally {
      setLoading(false);
    }
  }

  const statusColor = response
    ? response.status < 300 ? 'text-emerald-500' : response.status < 400 ? 'text-amber-500' : 'text-red-500'
    : '';

  return (
    <div className="space-y-4">
      {/* URL bar */}
      <div className="flex gap-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
          className={`${METHOD_COLORS[method]} text-white text-sm font-semibold px-3 py-2.5 rounded-lg focus:outline-none cursor-pointer`}
        >
          {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="https://api.example.com/endpoint"
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 shrink-0"
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>

      {/* Request config */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('headers')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'headers'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Headers ({headers.length})
          </button>
          <button
            onClick={() => setActiveTab('body')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'body'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Body
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'headers' ? (
            <div className="space-y-2">
              {headers.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={h.key}
                    onChange={(e) => updateHeader(i, 'key', e.target.value)}
                    placeholder="Header"
                    className="flex-1 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    value={h.value}
                    onChange={(e) => updateHeader(i, 'value', e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => removeHeader(i)}
                    className="px-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                onClick={addHeader}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                + Header 추가
              </button>
            </div>
          ) : (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder='{"key": "value"}'
              className="w-full h-32 px-3 py-2 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm resize-y focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          )}
        </div>
      </div>

      {/* CORS notice */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        * 브라우저의 CORS 정책으로 인해 일부 API는 요청이 차단될 수 있습니다.
      </p>

      {/* Error with details */}
      {errorInfo && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-red-200 dark:border-red-800">
            <span className="text-sm font-semibold text-red-600 dark:text-red-400">Error</span>
            {errorInfo.time > 0 && <span className="text-xs text-gray-400">{errorInfo.time}ms</span>}
          </div>
          <div className="p-4">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{errorInfo.message}</p>
            {errorInfo.details && (
              <pre className="mt-3 p-3 rounded bg-red-100 dark:bg-red-900/30 text-xs font-mono text-red-700 dark:text-red-300 overflow-auto max-h-[200px] whitespace-pre-wrap">
                {errorInfo.details}
              </pre>
            )}
          </div>
          {/* Request headers on error */}
          {Object.keys(errorInfo.requestHeaders).length > 0 && (
            <details className="border-t border-red-200 dark:border-red-800">
              <summary className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-red-100/50 dark:hover:bg-red-900/10">
                Request Headers ({Object.keys(errorInfo.requestHeaders).length})
              </summary>
              <div className="px-4 pb-3 space-y-1">
                {Object.entries(errorInfo.requestHeaders).map(([k, v]) => (
                  <div key={k} className="flex gap-2 font-mono text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400">{k}:</span>
                    <span className="text-gray-600 dark:text-gray-400">{v}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <span className={`text-sm font-semibold ${statusColor}`}>
              {response.status} {response.statusText}
            </span>
            <span className="text-xs text-gray-400">{response.time}ms</span>
            <span className="text-xs text-gray-400">{new TextEncoder().encode(response.body).length} bytes</span>
          </div>

          {/* Request headers */}
          {Object.keys(response.requestHeaders).length > 0 && (
            <details className="border-b border-gray-200 dark:border-gray-700">
              <summary className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                Request Headers ({Object.keys(response.requestHeaders).length})
              </summary>
              <div className="px-4 pb-3 space-y-1">
                {Object.entries(response.requestHeaders).map(([k, v]) => (
                  <div key={k} className="flex gap-2 font-mono text-xs">
                    <span className="text-blue-600 dark:text-blue-400">{k}:</span>
                    <span className="text-gray-600 dark:text-gray-400">{v}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Response headers */}
          {Object.keys(response.headers).length > 0 && (
            <details className="border-b border-gray-200 dark:border-gray-700">
              <summary className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                Response Headers ({Object.keys(response.headers).length})
              </summary>
              <div className="px-4 pb-3 space-y-1">
                {Object.entries(response.headers).map(([k, v]) => (
                  <div key={k} className="flex gap-2 font-mono text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400">{k}:</span>
                    <span className="text-gray-600 dark:text-gray-400">{v}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Response body */}
          <pre className="p-4 text-sm font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-[500px] whitespace-pre-wrap">
            {response.body}
          </pre>
        </div>
      )}
    </div>
  );
}
