import { useState, useCallback, useRef } from 'react';

function toHex(n: number, pad: number): string {
  return n.toString(16).toUpperCase().padStart(pad, '0');
}

function isPrintableAscii(b: number): boolean {
  return b >= 0x20 && b <= 0x7e;
}

function byteClass(b: number): string {
  if (b === 0x00) return 'text-gray-300 dark:text-gray-600';
  if (isPrintableAscii(b)) return 'text-emerald-600 dark:text-emerald-400';
  if (b < 0x20 || b === 0x7f) return 'text-red-400 dark:text-red-500';
  return 'text-blue-500 dark:text-blue-400';
}

const BYTES_PER_ROW = 16;

export function HexViewer() {
  const [data, setData] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [textInput, setTextInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadText = useCallback((text: string) => {
    setTextInput(text);
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    setData(bytes);
    setFileName('');
  }, []);

  const loadFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const buf = new Uint8Array(reader.result as ArrayBuffer);
      setData(buf);
      setTextInput('');
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setInputMode('file');
      loadFile(file);
    }
  }, [loadFile]);

  const rows = data ? Math.ceil(data.length / BYTES_PER_ROW) : 0;
  const offsetWidth = data ? Math.max(4, toHex(data.length, 1).length) : 4;

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['text', 'file'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setInputMode(m)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                inputMode === m
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {m === 'text' ? 'Text Input' : 'File Upload'}
            </button>
          ))}
        </div>

        {data && (
          <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>Size: <span className="font-mono">{data.length.toLocaleString()}</span> bytes</span>
            {fileName && <span>File: <span className="font-mono">{fileName}</span></span>}
            <span>Encoding: {inputMode === 'text' ? 'UTF-8' : 'Raw binary'}</span>
          </div>
        )}
      </div>

      {/* Input */}
      {inputMode === 'text' ? (
        <textarea
          value={textInput}
          onChange={(e) => loadText(e.target.value)}
          placeholder="Type or paste text here to view as hex..."
          className="w-full h-24 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm p-3 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <input ref={fileRef} type="file" className="hidden" onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])} />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Drop a file here or <span className="text-emerald-600 dark:text-emerald-400 font-medium">click to browse</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">Any file type supported</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/40 inline-block"></span> Printable ASCII (20-7E)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/40 inline-block"></span> Control chars (00-1F, 7F)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/40 inline-block"></span> High bytes (80-FF)</span>
      </div>

      {/* Hex dump */}
      {data && data.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-x-auto">
          <div className="font-mono text-xs leading-relaxed p-4 select-none" style={{ minWidth: '720px' }}>
            {/* Header */}
            <div className="flex text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-1">
              <span style={{ width: `${offsetWidth + 2}ch` }} className="text-center">Offset</span>
              <span className="flex-shrink-0" style={{ width: `${BYTES_PER_ROW * 3}ch` }}>
                {Array.from({ length: BYTES_PER_ROW }, (_, i) => (
                  <span key={i} style={{ width: '3ch', display: 'inline-block', textAlign: 'center' }}>
                    {toHex(i, 2)}
                  </span>
                ))}
              </span>
              <span className="ml-2">ASCII</span>
            </div>

            {/* Rows */}
            {Array.from({ length: Math.min(rows, 1000) }, (_, rowIdx) => {
              const offset = rowIdx * BYTES_PER_ROW;
              const rowBytes = data.slice(offset, offset + BYTES_PER_ROW);

              return (
                <div key={rowIdx} className="flex hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {/* Offset */}
                  <span className="text-gray-400 flex-shrink-0" style={{ width: `${offsetWidth + 2}ch`, textAlign: 'center' }}>
                    {toHex(offset, offsetWidth)}
                  </span>

                  {/* Hex bytes */}
                  <span className="flex-shrink-0" style={{ width: `${BYTES_PER_ROW * 3}ch` }}>
                    {Array.from(rowBytes).map((b, i) => {
                      const idx = offset + i;
                      const isHovered = hoveredIndex === idx;
                      return (
                        <span
                          key={i}
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className={`inline-block text-center cursor-default ${byteClass(b)} ${
                            isHovered ? 'bg-emerald-200 dark:bg-emerald-800 rounded' : ''
                          }`}
                          style={{ width: '3ch' }}
                        >
                          {toHex(b, 2)}
                        </span>
                      );
                    })}
                    {/* Pad if last row is short */}
                    {rowBytes.length < BYTES_PER_ROW &&
                      Array.from({ length: BYTES_PER_ROW - rowBytes.length }, (_, i) => (
                        <span key={`pad-${i}`} className="inline-block" style={{ width: '3ch' }}> </span>
                      ))
                    }
                  </span>

                  {/* ASCII */}
                  <span className="ml-2 flex-shrink-0">
                    {Array.from(rowBytes).map((b, i) => {
                      const idx = offset + i;
                      const isHovered = hoveredIndex === idx;
                      const ch = isPrintableAscii(b) ? String.fromCharCode(b) : '.';
                      return (
                        <span
                          key={i}
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className={`inline-block text-center cursor-default ${byteClass(b)} ${
                            isHovered ? 'bg-emerald-200 dark:bg-emerald-800 rounded' : ''
                          }`}
                          style={{ width: '1ch' }}
                        >
                          {ch}
                        </span>
                      );
                    })}
                  </span>
                </div>
              );
            })}

            {rows > 1000 && (
              <div className="text-center text-gray-400 mt-2">
                Showing first 1000 rows of {rows.toLocaleString()} total ({data.length.toLocaleString()} bytes)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
