import { useState, useMemo } from 'react';

/* ── Simple LCS-based line diff ── */

interface DiffLine {
  type: 'add' | 'del' | 'same';
  text: string;
  leftNum?: number;
  rightNum?: number;
}

function computeDiff(left: string, right: string): DiffLine[] {
  const lLines = left.split('\n');
  const rLines = right.split('\n');
  const m = lLines.length, n = rLines.length;

  // Build LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = lLines[i - 1] === rLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack to produce diff
  const result: DiffLine[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && lLines[i - 1] === rLines[j - 1]) {
      result.push({ type: 'same', text: lLines[i - 1], leftNum: i, rightNum: j });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ type: 'add', text: rLines[j - 1], rightNum: j });
      j--;
    } else {
      result.push({ type: 'del', text: lLines[i - 1], leftNum: i });
      i--;
    }
  }
  return result.reverse();
}

const SAMPLE_LEFT = `function greet(name) {
  console.log("Hello, " + name);
  return true;
}

const x = 10;
const y = 20;
console.log(x + y);`;

const SAMPLE_RIGHT = `function greet(name, lang) {
  const msg = lang === 'ko' ? '안녕하세요' : 'Hello';
  console.log(msg + ", " + name);
  return true;
}

const x = 10;
const z = 30;
console.log(x + z);`;

/* ── Sub-components ── */

function InlineDiff({ diff }: { diff: DiffLine[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        <tbody>
          {diff.map((line, i) => {
            const bgCls = line.type === 'add'
              ? 'bg-emerald-50 dark:bg-emerald-950/40'
              : line.type === 'del'
                ? 'bg-red-50 dark:bg-red-950/40'
                : '';
            const textCls = line.type === 'add'
              ? 'text-emerald-700 dark:text-emerald-300'
              : line.type === 'del'
                ? 'text-red-700 dark:text-red-300'
                : 'text-gray-600 dark:text-gray-400';
            const prefix = line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' ';
            return (
              <tr key={i} className={bgCls}>
                <td className="px-2 py-0.5 text-right text-gray-400 select-none border-r border-gray-200 dark:border-gray-700 w-10">
                  {line.leftNum ?? ''}
                </td>
                <td className="px-2 py-0.5 text-right text-gray-400 select-none border-r border-gray-200 dark:border-gray-700 w-10">
                  {line.rightNum ?? ''}
                </td>
                <td className={`px-1 py-0.5 select-none w-4 text-center ${textCls}`}>{prefix}</td>
                <td className={`px-2 py-0.5 whitespace-pre ${textCls}`}>{line.text}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SideBySideDiff({ diff }: { diff: DiffLine[] }) {
  // Build paired rows
  const rows: { left: DiffLine | null; right: DiffLine | null }[] = [];
  for (const line of diff) {
    if (line.type === 'same') {
      rows.push({ left: line, right: line });
    } else if (line.type === 'del') {
      rows.push({ left: line, right: null });
    } else {
      // Check if we can pair with previous unpaired del
      const last = rows[rows.length - 1];
      if (last && last.left?.type === 'del' && last.right === null) {
        last.right = line;
      } else {
        rows.push({ left: null, right: line });
      }
    }
  }

  const cellCls = (type: string | undefined) => {
    if (type === 'add') return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';
    if (type === 'del') return 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {/* Left side */}
              <td className="px-2 py-0.5 text-right text-gray-400 select-none border-r border-gray-200 dark:border-gray-700 w-10">
                {row.left?.leftNum ?? ''}
              </td>
              <td className={`px-2 py-0.5 whitespace-pre w-1/2 ${cellCls(row.left?.type)}`}>
                {row.left?.text ?? ''}
              </td>
              {/* Right side */}
              <td className="px-2 py-0.5 text-right text-gray-400 select-none border-r border-l border-gray-200 dark:border-gray-700 w-10">
                {row.right?.rightNum ?? ''}
              </td>
              <td className={`px-2 py-0.5 whitespace-pre w-1/2 ${cellCls(row.right?.type)}`}>
                {row.right?.text ?? ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Main component ── */

export function DiffViewer() {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [mode, setMode] = useState<'inline' | 'side'>('inline');

  const diff = useMemo(() => {
    if (!left && !right) return [];
    return computeDiff(left, right);
  }, [left, right]);

  const stats = useMemo(() => {
    let added = 0, removed = 0, unchanged = 0;
    for (const l of diff) {
      if (l.type === 'add') added++;
      else if (l.type === 'del') removed++;
      else unchanged++;
    }
    return { added, removed, unchanged };
  }, [diff]);

  const loadSample = () => {
    setLeft(SAMPLE_LEFT);
    setRight(SAMPLE_RIGHT);
  };

  const clear = () => {
    setLeft('');
    setRight('');
  };

  const sectionCls = 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg';
  const btnActive = 'bg-emerald-600 text-white';
  const btnInactive = 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700';

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={loadSample} className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
          Sample
        </button>
        <button onClick={clear} className="px-5 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          Clear
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setMode('inline')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'inline' ? btnActive : btnInactive}`}
          >
            Inline
          </button>
          <button
            onClick={() => setMode('side')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'side' ? btnActive : btnInactive}`}
          >
            Side by Side
          </button>
        </div>
      </div>

      {/* Text inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Original</label>
          <textarea
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 font-mono text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-y"
            placeholder="원본 텍스트를 입력하세요..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modified</label>
          <textarea
            value={right}
            onChange={(e) => setRight(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 font-mono text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-y"
            placeholder="수정된 텍스트를 입력하세요..."
          />
        </div>
      </div>

      {/* Stats */}
      {diff.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{stats.added} added</span>
          <span className="text-red-600 dark:text-red-400 font-medium">-{stats.removed} removed</span>
          <span className="text-gray-500 dark:text-gray-400">{stats.unchanged} unchanged</span>
        </div>
      )}

      {/* Diff output */}
      {diff.length > 0 && (
        <div className={`${sectionCls} overflow-hidden`}>
          {mode === 'inline'
            ? <InlineDiff diff={diff} />
            : <SideBySideDiff diff={diff} />
          }
        </div>
      )}
    </div>
  );
}
