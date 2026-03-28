import { useState } from 'react';

type Base = 'dec' | 'hex' | 'oct' | 'bin';

const bases: { key: Base; label: string; radix: number }[] = [
  { key: 'dec', label: 'DEC', radix: 10 },
  { key: 'hex', label: 'HEX', radix: 16 },
  { key: 'oct', label: 'OCT', radix: 8 },
  { key: 'bin', label: 'BIN', radix: 2 },
];

function formatBin(n: number): string {
  if (n < 0) {
    return (n >>> 0).toString(2);
  }
  const bin = n.toString(2);
  const padLen = Math.ceil(bin.length / 8) * 8;
  return bin.padStart(padLen, '0').replace(/(.{4})/g, '$1 ').trim();
}

export function ProgrammerCalculator() {
  const [value, setValue] = useState(0);
  const [inputBase, setInputBase] = useState<Base>('dec');
  const [inputText, setInputText] = useState('0');
  const [error, setError] = useState('');
  const [bits, setBits] = useState<8 | 16 | 32>(32);

  function handleInput(text: string, base: Base) {
    setInputText(text);
    setInputBase(base);
    setError('');
    if (!text.trim()) { setValue(0); return; }
    const radix = bases.find((b) => b.key === base)!.radix;
    const parsed = parseInt(text.replace(/\s/g, ''), radix);
    if (isNaN(parsed)) {
      setError('유효하지 않은 숫자입니다.');
      return;
    }
    // Clamp to bit width
    const mask = bits === 32 ? 0xFFFFFFFF : (1 << bits) - 1;
    setValue(parsed & mask);
  }

  function handleBitsChange(b: 8 | 16 | 32) {
    setBits(b);
    const mask = b === 32 ? 0xFFFFFFFF : (1 << b) - 1;
    const clamped = value & mask;
    setValue(clamped);
    const radix = bases.find((bs) => bs.key === inputBase)!.radix;
    setInputText(clamped.toString(radix).toUpperCase());
  }

  function getDisplay(base: Base): string {
    const radix = bases.find((b) => b.key === base)!.radix;
    if (base === 'bin') return formatBin(value);
    const str = (value >>> 0).toString(radix).toUpperCase();
    if (base === 'dec') return value.toString();
    return str;
  }

  // Bitwise operations
  function applyOp(op: string) {
    switch (op) {
      case 'NOT': setValue(~value & (bits === 32 ? 0xFFFFFFFF : (1 << bits) - 1)); break;
      case 'SHL': setValue((value << 1) & (bits === 32 ? 0xFFFFFFFF : (1 << bits) - 1)); break;
      case 'SHR': setValue(value >>> 1); break;
    }
    const radix = bases.find((b) => b.key === inputBase)!.radix;
    setInputText(value.toString(radix).toUpperCase());
  }

  return (
    <div className="space-y-6">
      {/* Bit width */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">Bit Width:</span>
        {([8, 16, 32] as const).map((b) => (
          <button
            key={b}
            onClick={() => handleBitsChange(b)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              bits === b
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {b}-bit
          </button>
        ))}
      </div>

      {/* Base displays */}
      <div className="space-y-3">
        {bases.map(({ key, label, radix }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="w-10 text-xs font-semibold text-gray-500 dark:text-gray-400 text-right">{label}</span>
            <input
              value={inputBase === key ? inputText : getDisplay(key)}
              onChange={(e) => handleInput(e.target.value, key)}
              onFocus={() => {
                setInputBase(key);
                setInputText(getDisplay(key).replace(/\s/g, ''));
              }}
              className={`flex-1 px-4 py-2.5 rounded-lg border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                inputBase === key
                  ? 'border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50'
              } text-gray-900 dark:text-gray-100`}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

      {/* Bitwise ops */}
      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">Bitwise Operations</span>
        <div className="flex gap-2">
          {['NOT', 'SHL', 'SHR'].map((op) => (
            <button
              key={op}
              onClick={() => applyOp(op)}
              className="px-4 py-2 rounded-lg text-sm font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Bit visualization */}
      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">Bit Pattern</span>
        <div className="flex flex-wrap gap-0.5 font-mono text-xs">
          {Array.from({ length: bits }, (_, i) => {
            const bitIndex = bits - 1 - i;
            const bitValue = (value >>> bitIndex) & 1;
            return (
              <div key={i} className="flex flex-col items-center">
                {i % 8 === 0 && (
                  <span className="text-[10px] text-gray-400 mb-0.5">{bitIndex}</span>
                )}
                {i % 8 !== 0 && <span className="text-[10px] text-transparent mb-0.5">0</span>}
                <div
                  className={`w-6 h-7 flex items-center justify-center rounded ${
                    bitValue
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {bitValue}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
