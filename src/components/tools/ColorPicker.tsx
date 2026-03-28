import { useState, useCallback } from 'react';

/* ── Color conversion helpers ── */

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => v.toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sn = s / 100, ln = l / 100;
  if (sn === 0) { const v = Math.round(ln * 255); return [v, v, v]; }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const hn = h / 360;
  return [
    Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hn) * 255),
    Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  ];
}

function rgbToOklch(r: number, g: number, b: number): [number, number, number] {
  // sRGB -> linear
  const toLinear = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  // linear sRGB -> OKLab
  const l_ = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m_ = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s_ = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l1 = Math.cbrt(l_), m1 = Math.cbrt(m_), s1 = Math.cbrt(s_);
  const L = 0.2104542553 * l1 + 0.7936177850 * m1 - 0.0040720468 * s1;
  const a = 1.9779984951 * l1 - 2.4285922050 * m1 + 0.4505937099 * s1;
  const bOk = 0.0259040371 * l1 + 0.7827717662 * m1 - 0.8086757660 * s1;
  // OKLab -> OKLCH
  const C = Math.sqrt(a * a + bOk * bOk);
  let H = Math.atan2(bOk, a) * 180 / Math.PI;
  if (H < 0) H += 360;
  return [
    Math.round(L * 100 * 100) / 100,
    Math.round(C * 1000) / 1000,
    Math.round(H * 100) / 100,
  ];
}

/* Relative luminance for contrast ratio */
function relativeLuminance(r: number, g: number, b: number) {
  const toLinear = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]) {
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/* Named CSS colors */
const NAMED_COLORS: { name: string; hex: string }[] = [
  { name: 'Red', hex: '#ff0000' }, { name: 'Orange', hex: '#ffa500' },
  { name: 'Yellow', hex: '#ffff00' }, { name: 'Lime', hex: '#00ff00' },
  { name: 'Green', hex: '#008000' }, { name: 'Teal', hex: '#008080' },
  { name: 'Cyan', hex: '#00ffff' }, { name: 'Blue', hex: '#0000ff' },
  { name: 'Navy', hex: '#000080' }, { name: 'Purple', hex: '#800080' },
  { name: 'Magenta', hex: '#ff00ff' }, { name: 'Pink', hex: '#ffc0cb' },
  { name: 'Coral', hex: '#ff7f50' }, { name: 'Salmon', hex: '#fa8072' },
  { name: 'Gold', hex: '#ffd700' }, { name: 'Khaki', hex: '#f0e68c' },
  { name: 'Olive', hex: '#808000' }, { name: 'Maroon', hex: '#800000' },
  { name: 'White', hex: '#ffffff' }, { name: 'Black', hex: '#000000' },
];

/* ── Toast component ── */
function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 animate-fade-in">
      {message}
    </div>
  );
}

/* ── Slider component ── */
function Slider({ label, value, min, max, onChange, color }: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void; color?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-8 text-xs font-mono text-gray-500 dark:text-gray-400">{label}</span>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: color || '#10b981' }}
      />
      <input
        type="number" min={min} max={max} value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value), min, max))}
        className="w-16 px-2 py-1 text-xs font-mono rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center"
      />
    </div>
  );
}

/* ── Main component ── */
export function ColorPicker() {
  const [rgb, setRgb] = useState<[number, number, number]>([16, 185, 129]);
  const [hexInput, setHexInput] = useState('#10b981');
  const [toast, setToast] = useState('');

  // Contrast checker state
  const [fgRgb, setFgRgb] = useState<[number, number, number]>([0, 0, 0]);
  const [bgRgb, setBgRgb] = useState<[number, number, number]>([255, 255, 255]);

  const hex = rgbToHex(...rgb);
  const hsl = rgbToHsl(...rgb);
  const oklch = rgbToOklch(...rgb);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  }, []);

  const copyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`복사됨: ${text}`);
  }, [showToast]);

  const updateFromRgb = useCallback((r: number, g: number, b: number) => {
    setRgb([r, g, b]);
    setHexInput(rgbToHex(r, g, b));
  }, []);

  const updateFromHex = useCallback((val: string) => {
    setHexInput(val);
    const parsed = hexToRgb(val);
    if (parsed) setRgb(parsed);
  }, []);

  const updateFromHsl = useCallback((h: number, s: number, l: number) => {
    const newRgb = hslToRgb(h, s, l);
    setRgb(newRgb);
    setHexInput(rgbToHex(...newRgb));
  }, []);

  const formatStrings = {
    hex: hex,
    rgb: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
    hsl: `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`,
    oklch: `oklch(${oklch[0]}% ${oklch[1]} ${oklch[2]})`,
  };

  const ratio = contrastRatio(fgRgb, bgRgb);
  const roundedRatio = Math.round(ratio * 100) / 100;

  const sectionCls = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5';
  const labelCls = 'text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block';

  return (
    <div className="space-y-6">
      <Toast message={toast} visible={!!toast} />

      {/* Top: Preview + Hex Input */}
      <div className={sectionCls}>
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Large swatch */}
          <div
            className="w-full sm:w-40 h-40 rounded-lg border border-gray-300 dark:border-gray-600 flex-shrink-0"
            style={{ backgroundColor: hex }}
          />
          <div className="flex-1 space-y-4">
            {/* Hex input */}
            <div>
              <label className={labelCls}>HEX</label>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => updateFromHex(e.target.value)}
                className="w-full px-3 py-2 font-mono text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="#000000"
              />
            </div>
            {/* All formats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(formatStrings).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => copyText(val)}
                  className="flex items-center justify-between px-3 py-2 text-xs font-mono rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:border-emerald-400 transition-colors text-left"
                >
                  <span className="uppercase text-gray-400 mr-2 text-[10px]">{key}</span>
                  <span className="truncate">{val}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RGB Sliders */}
      <div className={sectionCls}>
        <span className={labelCls}>RGB</span>
        <div className="space-y-2">
          <Slider label="R" value={rgb[0]} min={0} max={255} onChange={(v) => updateFromRgb(v, rgb[1], rgb[2])} color="#ef4444" />
          <Slider label="G" value={rgb[1]} min={0} max={255} onChange={(v) => updateFromRgb(rgb[0], v, rgb[2])} color="#22c55e" />
          <Slider label="B" value={rgb[2]} min={0} max={255} onChange={(v) => updateFromRgb(rgb[0], rgb[1], v)} color="#3b82f6" />
        </div>
      </div>

      {/* HSL Sliders */}
      <div className={sectionCls}>
        <span className={labelCls}>HSL</span>
        <div className="space-y-2">
          <Slider label="H" value={hsl[0]} min={0} max={360} onChange={(v) => updateFromHsl(v, hsl[1], hsl[2])} />
          <Slider label="S" value={hsl[1]} min={0} max={100} onChange={(v) => updateFromHsl(hsl[0], v, hsl[2])} />
          <Slider label="L" value={hsl[2]} min={0} max={100} onChange={(v) => updateFromHsl(hsl[0], hsl[1], v)} />
        </div>
      </div>

      {/* Named CSS Colors quick picker */}
      <div className={sectionCls}>
        <span className={labelCls}>CSS Named Colors</span>
        <div className="flex flex-wrap gap-2">
          {NAMED_COLORS.map((c) => (
            <button
              key={c.name}
              onClick={() => updateFromHex(c.hex)}
              title={c.name}
              className="w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-600 hover:ring-2 hover:ring-emerald-400 transition-shadow"
              style={{ backgroundColor: c.hex }}
            />
          ))}
        </div>
      </div>

      {/* Contrast Ratio Checker */}
      <div className={sectionCls}>
        <span className={labelCls}>Contrast Ratio Checker (WCAG)</span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Foreground */}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Foreground</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0" style={{ backgroundColor: rgbToHex(...fgRgb) }} />
              <input
                type="text"
                value={rgbToHex(...fgRgb)}
                onChange={(e) => { const p = hexToRgb(e.target.value); if (p) setFgRgb(p); }}
                className="flex-1 px-2 py-1 text-xs font-mono rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => setFgRgb([...rgb])}
                className="px-2 py-1 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                title="현재 색상 사용"
              >
                적용
              </button>
            </div>
          </div>
          {/* Background */}
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Background</label>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0" style={{ backgroundColor: rgbToHex(...bgRgb) }} />
              <input
                type="text"
                value={rgbToHex(...bgRgb)}
                onChange={(e) => { const p = hexToRgb(e.target.value); if (p) setBgRgb(p); }}
                className="flex-1 px-2 py-1 text-xs font-mono rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => setBgRgb([...rgb])}
                className="px-2 py-1 text-xs rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                title="현재 색상 사용"
              >
                적용
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div
          className="rounded-lg p-4 mb-4 text-center border border-gray-300 dark:border-gray-600"
          style={{ backgroundColor: rgbToHex(...bgRgb), color: rgbToHex(...fgRgb) }}
        >
          <p className="text-lg font-bold">Sample Text</p>
          <p className="text-sm">The quick brown fox jumps over the lazy dog.</p>
        </div>

        {/* Ratio + WCAG badges */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
            Ratio: <strong>{roundedRatio}:1</strong>
          </span>
          <Badge label="AA Normal (4.5:1)" pass={ratio >= 4.5} />
          <Badge label="AA Large (3:1)" pass={ratio >= 3} />
          <Badge label="AAA Normal (7:1)" pass={ratio >= 7} />
          <Badge label="AAA Large (4.5:1)" pass={ratio >= 4.5} />
        </div>
      </div>
    </div>
  );
}

function Badge({ label, pass }: { label: string; pass: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
      pass
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
        : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
    }`}>
      {pass ? '✓' : '✗'} {label}
    </span>
  );
}
