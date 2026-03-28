import { useState } from 'react';

type Base = 'dec' | 'hex' | 'oct' | 'bin';
type Signedness = 'unsigned' | 'signed';
type BitWidth = 8 | 16 | 32 | 64;

const bases: { key: Base; label: string; radix: number }[] = [
  { key: 'dec', label: 'DEC', radix: 10 },
  { key: 'hex', label: 'HEX', radix: 16 },
  { key: 'oct', label: 'OCT', radix: 8 },
  { key: 'bin', label: 'BIN', radix: 2 },
];

function getMask(bits: BitWidth): bigint {
  return (1n << BigInt(bits)) - 1n;
}

function getRange(bits: BitWidth, sign: Signedness) {
  if (sign === 'unsigned') {
    return { min: 0n, max: getMask(bits) };
  }
  const half = 1n << BigInt(bits - 1);
  return { min: -half, max: half - 1n };
}

function toSigned(val: bigint, bits: BitWidth): bigint {
  const mask = getMask(bits);
  const unsigned = val & mask;
  const signBit = 1n << BigInt(bits - 1);
  if (unsigned & signBit) {
    return unsigned - (1n << BigInt(bits));
  }
  return unsigned;
}

function toUnsigned(val: bigint, bits: BitWidth): bigint {
  return val & getMask(bits);
}

function formatBin(n: bigint, bits: BitWidth): string {
  const unsigned = toUnsigned(n, bits);
  return unsigned.toString(2).padStart(bits, '0').replace(/(.{4})/g, '$1 ').trim();
}

function formatNum(n: bigint): string {
  return n.toLocaleString();
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-xs font-mono text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );
}

export function ProgrammerCalculator() {
  const [value, setValue] = useState(0n); // stored as unsigned
  const [inputBase, setInputBase] = useState<Base>('dec');
  const [inputText, setInputText] = useState('0');
  const [error, setError] = useState('');
  const [bits, setBits] = useState<BitWidth>(32);
  const [sign, setSign] = useState<Signedness>('signed');

  const mask = getMask(bits);
  const range = getRange(bits, sign);
  const signedValue = toSigned(value, bits);
  const unsignedValue = toUnsigned(value, bits);

  function handleInput(text: string, base: Base) {
    setInputText(text);
    setInputBase(base);
    setError('');
    if (!text.trim()) { setValue(0n); return; }
    const cleaned = text.replace(/\s/g, '');

    let parsed: bigint;
    try {
      if (base === 'dec') {
        parsed = BigInt(cleaned);
      } else if (base === 'hex') {
        parsed = BigInt('0x' + cleaned);
      } else if (base === 'oct') {
        parsed = BigInt('0o' + cleaned);
      } else {
        parsed = BigInt('0b' + cleaned);
      }
    } catch {
      setError('유효하지 않은 숫자입니다.');
      return;
    }

    if (sign === 'signed') {
      if (parsed < range.min || parsed > range.max) {
        const clamped = parsed < range.min ? range.min : range.max;
        setValue(toUnsigned(clamped, bits));
        setError(`범위 초과: ${bits}-bit signed 범위는 ${range.min} ~ ${range.max}`);
        return;
      }
      setValue(toUnsigned(parsed, bits));
    } else {
      if (parsed < 0n || parsed > range.max) {
        const clamped = parsed < 0n ? 0n : range.max;
        setValue(clamped);
        setError(`범위 초과: ${bits}-bit unsigned 범위는 0 ~ ${range.max}`);
        return;
      }
      setValue(parsed & mask);
    }
  }

  function handleBitsChange(b: BitWidth) {
    setBits(b);
    const newMask = getMask(b);
    const clamped = value & newMask;
    setValue(clamped);
    updateInputText(clamped, inputBase, b, sign);
  }

  function handleReset() {
    setValue(0n);
    setInputText('0');
    setInputBase('dec');
    setError('');
  }

  function handleSignChange(s: Signedness) {
    setSign(s);
    updateInputText(value, inputBase, bits, s);
  }

  function updateInputText(val: bigint, base: Base, b: BitWidth, s: Signedness) {
    if (base === 'dec') {
      setInputText(s === 'signed' ? toSigned(val, b).toString() : toUnsigned(val, b).toString());
    } else {
      setInputText(toUnsigned(val, b).toString(bases.find((bs) => bs.key === base)!.radix).toUpperCase());
    }
    setError('');
  }

  function getDisplay(base: Base): string {
    if (base === 'bin') return formatBin(value, bits);
    if (base === 'dec') {
      return sign === 'signed' ? signedValue.toString() : unsignedValue.toString();
    }
    return unsignedValue.toString(bases.find((b) => b.key === base)!.radix).toUpperCase();
  }

  function applyOp(op: string) {
    let newVal = value;
    switch (op) {
      case 'NOT': newVal = (~value) & mask; break;
      case 'SHL': newVal = (value << 1n) & mask; break;
      case 'SHR':
        if (sign === 'signed') {
          const sv = toSigned(value, bits);
          newVal = toUnsigned(sv >> 1n, bits);
        } else {
          newVal = value >> 1n;
        }
        break;
    }
    setValue(newVal);
    updateInputText(newVal, inputBase, bits, sign);
  }

  // For bit visualization, limit to 64 bits max
  const vizBits = bits;

  return (
    <div className="space-y-6">
      {/* Bit width + Signedness */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Bit Width:</span>
          {([8, 16, 32, 64] as const).map((b) => (
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

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Type:</span>
          {(['signed', 'unsigned'] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleSignChange(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                sign === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Range info */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6">
          <InfoRow label="Min (signed)" value={formatNum(getRange(bits, 'signed').min)} />
          <InfoRow label="Max (signed)" value={formatNum(getRange(bits, 'signed').max)} />
          <InfoRow label="Min (unsigned)" value="0" />
          <InfoRow label="Max (unsigned)" value={formatNum(getRange(bits, 'unsigned').max)} />
        </div>
        <div className="grid grid-cols-2 gap-x-6 mt-1 pt-1 border-t border-gray-100 dark:border-gray-800">
          <InfoRow label="Signed 값" value={formatNum(signedValue)} />
          <InfoRow label="Unsigned 값" value={formatNum(unsignedValue)} />
        </div>
      </div>

      {/* Base displays */}
      <div className="space-y-3">
        {bases.map(({ key, label }) => (
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
        <span className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
          Bitwise Operations {sign === 'signed' && <span className="text-xs">(SHR = arithmetic shift)</span>}
        </span>
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
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg text-sm font-mono bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors ml-2"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Bit visualization */}
      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">
          Bit Pattern
          {sign === 'signed' && (
            <span className="text-xs ml-2">
              (MSB = sign bit: {Number((value >> BigInt(bits - 1)) & 1n) ? '1 (음수)' : '0 (양수)'})
            </span>
          )}
        </span>
        <div className="flex flex-wrap gap-0.5 font-mono text-xs">
          {Array.from({ length: vizBits }, (_, i) => {
            const bitIndex = vizBits - 1 - i;
            const bitValue = Number((value >> BigInt(bitIndex)) & 1n);
            const isSignBit = sign === 'signed' && i === 0;
            return (
              <div key={i} className="flex flex-col items-center">
                {i % 8 === 0 && (
                  <span className="text-[10px] text-gray-400 mb-0.5">{bitIndex}</span>
                )}
                {i % 8 !== 0 && <span className="text-[10px] text-transparent mb-0.5">0</span>}
                <div
                  className={`w-6 h-7 flex items-center justify-center rounded ${
                    isSignBit
                      ? bitValue
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold ring-1 ring-red-300 dark:ring-red-700'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold ring-1 ring-blue-300 dark:ring-blue-700'
                      : bitValue
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
