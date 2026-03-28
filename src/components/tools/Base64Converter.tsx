import { useState } from 'react';

export function Base64Converter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState('');

  function handleConvert(text: string, m: 'encode' | 'decode') {
    setInput(text);
    setError('');
    if (!text) { setOutput(''); return; }
    try {
      if (m === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(text))));
      } else {
        setOutput(decodeURIComponent(escape(atob(text.trim()))));
      }
    } catch {
      setError(m === 'encode' ? '인코딩에 실패했습니다.' : '유효하지 않은 Base64 문자열입니다.');
      setOutput('');
    }
  }

  function handleModeChange(m: 'encode' | 'decode') {
    setMode(m);
    setInput('');
    setOutput('');
    setError('');
  }

  function handleCopy() {
    navigator.clipboard.writeText(output);
  }

  function handleSwap() {
    const newMode = mode === 'encode' ? 'decode' : 'encode';
    const newInput = output;
    setMode(newMode);
    setInput(newInput);
    handleConvert(newInput, newMode);
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => handleModeChange('encode')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'encode'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Encode
        </button>
        <button
          onClick={() => handleModeChange('decode')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'decode'
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Decode
        </button>
      </div>

      {/* Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {mode === 'encode' ? 'Text' : 'Base64'}
        </label>
        <textarea
          value={input}
          onChange={(e) => handleConvert(e.target.value, mode)}
          placeholder={mode === 'encode' ? '변환할 텍스트를 입력하세요...' : 'Base64 문자열을 입력하세요...'}
          className="w-full h-40 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Swap button */}
      <div className="flex justify-center">
        <button
          onClick={handleSwap}
          disabled={!output}
          className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="입출력 교환"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Output */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {mode === 'encode' ? 'Base64' : 'Text'}
          </label>
          {output && (
            <button
              onClick={handleCopy}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              복사
            </button>
          )}
        </div>
        <textarea
          value={output}
          readOnly
          className="w-full h-40 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 font-mono text-sm resize-y focus:outline-none"
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
