import { useState, useEffect, useCallback } from 'react';

function formatDate(date: Date, format: string): string {
  if (format === 'iso') return date.toISOString();
  if (format === 'locale') return date.toLocaleString();
  if (format === 'utc') return date.toUTCString();
  if (format === 'date') return date.toDateString();
  return date.toISOString();
}

function parseLocalDatetime(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function UnixTimestamp() {
  const [now, setNow] = useState(() => Date.now());
  const [epochInput, setEpochInput] = useState('');
  const [dateOutput, setDateOutput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [epochOutput, setEpochOutput] = useState('');
  const [format, setFormat] = useState<'iso' | 'locale' | 'utc' | 'date'>('iso');
  const [useMs, setUseMs] = useState(false);
  const [error1, setError1] = useState('');
  const [error2, setError2] = useState('');
  const [toast, setToast] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const convertEpochToDate = useCallback(
    (val: string) => {
      setEpochInput(val);
      setError1('');
      if (!val.trim()) {
        setDateOutput('');
        return;
      }
      const num = Number(val.trim());
      if (isNaN(num)) {
        setError1('유효한 숫자를 입력하세요.');
        setDateOutput('');
        return;
      }
      const ms = useMs ? num : num * 1000;
      const d = new Date(ms);
      if (isNaN(d.getTime())) {
        setError1('유효하지 않은 타임스탬프입니다.');
        setDateOutput('');
        return;
      }
      setDateOutput(formatDate(d, format));
    },
    [useMs, format],
  );

  const convertDateToEpoch = useCallback(
    (val: string) => {
      setDateInput(val);
      setError2('');
      if (!val) {
        setEpochOutput('');
        return;
      }
      const d = parseLocalDatetime(val);
      if (!d) {
        setError2('유효하지 않은 날짜입니다.');
        setEpochOutput('');
        return;
      }
      setEpochOutput(useMs ? String(d.getTime()) : String(Math.floor(d.getTime() / 1000)));
    },
    [useMs],
  );

  // Re-convert when format/useMs changes
  useEffect(() => {
    if (epochInput) convertEpochToDate(epochInput);
  }, [format, useMs]);

  useEffect(() => {
    if (dateInput) convertDateToEpoch(dateInput);
  }, [useMs]);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  }

  const currentSeconds = Math.floor(now / 1000);
  const currentMs = now;

  return (
    <div className="space-y-6">
      {/* Live clock */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Current Time</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Seconds</p>
            <div className="flex items-center gap-2">
              <code className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {currentSeconds}
              </code>
              <button
                onClick={() => handleCopy(String(currentSeconds))}
                className="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Milliseconds</p>
            <div className="flex items-center gap-2">
              <code className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {currentMs}
              </code>
              <button
                onClick={() => handleCopy(String(currentMs))}
                className="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Human-readable</p>
            <code className="text-sm font-mono text-gray-800 dark:text-gray-200">
              {new Date(now).toISOString()}
            </code>
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={useMs}
            onChange={(e) => setUseMs(e.target.checked)}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          Milliseconds
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">Format:</span>
          {(['iso', 'locale', 'utc', 'date'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                format === f
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f === 'iso' ? 'ISO 8601' : f === 'locale' ? 'Locale' : f === 'utc' ? 'UTC' : 'Date'}
            </button>
          ))}
        </div>
      </div>

      {/* Epoch → Date */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Epoch → Date
        </h2>
        <div className="space-y-3">
          <input
            type="text"
            value={epochInput}
            onChange={(e) => convertEpochToDate(e.target.value)}
            placeholder={useMs ? '예: 1711612800000' : '예: 1711612800'}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {error1 && <p className="text-xs text-red-500">{error1}</p>}
          {dateOutput && (
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100">
                {dateOutput}
              </code>
              <button
                onClick={() => handleCopy(dateOutput)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Date → Epoch */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Date → Epoch
        </h2>
        <div className="space-y-3">
          <input
            type="datetime-local"
            value={dateInput}
            onChange={(e) => convertDateToEpoch(e.target.value)}
            step="1"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {error2 && <p className="text-xs text-red-500">{error2}</p>}
          {epochOutput && (
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100">
                {epochOutput}
              </code>
              <button
                onClick={() => handleCopy(epochOutput)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Copy
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg animate-fade-in z-50">
          Copied!
        </div>
      )}
    </div>
  );
}
