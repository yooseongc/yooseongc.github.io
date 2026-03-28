import { useState, useMemo } from 'react';

interface CronField {
  label: string;
  range: [number, number];
  names?: string[];
}

const FIELDS: CronField[] = [
  { label: 'Minute', range: [0, 59] },
  { label: 'Hour', range: [0, 23] },
  { label: 'Day of Month', range: [1, 31] },
  { label: 'Month', range: [1, 12], names: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
  { label: 'Day of Week', range: [0, 6], names: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
];

const PRESETS: { label: string; expr: string }[] = [
  { label: 'Every minute', expr: '* * * * *' },
  { label: 'Every 5 minutes', expr: '*/5 * * * *' },
  { label: 'Every 15 minutes', expr: '*/15 * * * *' },
  { label: 'Every hour', expr: '0 * * * *' },
  { label: 'Every 6 hours', expr: '0 */6 * * *' },
  { label: 'Daily at midnight', expr: '0 0 * * *' },
  { label: 'Daily at 9 AM', expr: '0 9 * * *' },
  { label: 'Weekly (Sun midnight)', expr: '0 0 * * 0' },
  { label: 'Weekdays at 9 AM', expr: '0 9 * * 1-5' },
  { label: 'Monthly (1st at midnight)', expr: '0 0 1 * *' },
  { label: 'Quarterly', expr: '0 0 1 1,4,7,10 *' },
  { label: 'Yearly (Jan 1st)', expr: '0 0 1 1 *' },
];

interface ParsedField {
  values: number[];
  error: string | null;
}

function parseField(token: string, min: number, max: number): ParsedField {
  const values: Set<number> = new Set();
  const parts = token.split(',');

  for (const part of parts) {
    const trimmed = part.trim();

    // Match step: */n or range/n
    const stepMatch = trimmed.match(/^(.+)\/(\d+)$/);
    let base = stepMatch ? stepMatch[1] : trimmed;
    const step = stepMatch ? parseInt(stepMatch[2], 10) : 1;

    if (step <= 0) return { values: [], error: `Invalid step: ${step}` };

    if (base === '*') {
      for (let i = min; i <= max; i += step) values.add(i);
    } else {
      const rangeMatch = base.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);
        if (start < min || end > max || start > end) {
          return { values: [], error: `Invalid range: ${start}-${end} (valid: ${min}-${max})` };
        }
        for (let i = start; i <= end; i += step) values.add(i);
      } else {
        const num = parseInt(base, 10);
        if (isNaN(num) || num < min || num > max) {
          return { values: [], error: `Invalid value: ${base} (valid: ${min}-${max})` };
        }
        if (stepMatch) {
          for (let i = num; i <= max; i += step) values.add(i);
        } else {
          values.add(num);
        }
      }
    }
  }

  return { values: Array.from(values).sort((a, b) => a - b), error: null };
}

function parseCron(expr: string): { fields: ParsedField[]; error: string | null } {
  const tokens = expr.trim().split(/\s+/);
  if (tokens.length !== 5) {
    return { fields: [], error: `Expected 5 fields, got ${tokens.length}` };
  }
  const fields: ParsedField[] = [];
  for (let i = 0; i < 5; i++) {
    const f = parseField(tokens[i], FIELDS[i].range[0], FIELDS[i].range[1]);
    if (f.error) return { fields: [], error: `${FIELDS[i].label}: ${f.error}` };
    fields.push(f);
  }
  return { fields, error: null };
}

function describeField(values: number[], field: CronField, isAll: boolean): string {
  if (isAll) return `every ${field.label.toLowerCase()}`;
  if (field.names) {
    return values.map((v) => field.names![v] || String(v)).join(', ');
  }
  // Compact ranges
  if (values.length === 1) return String(values[0]);
  return values.join(', ');
}

function describeCron(expr: string): string {
  const { fields, error } = parseCron(expr);
  if (error) return '';
  const tokens = expr.trim().split(/\s+/);
  const parts: string[] = [];

  const minuteAll = tokens[0] === '*';
  const hourAll = tokens[1] === '*';
  const domAll = tokens[2] === '*';
  const monthAll = tokens[3] === '*';
  const dowAll = tokens[4] === '*';

  // Time description
  if (minuteAll && hourAll) {
    parts.push('Every minute');
  } else if (minuteAll) {
    parts.push(`Every minute during hour ${describeField(fields[1].values, FIELDS[1], false)}`);
  } else if (hourAll) {
    parts.push(`At minute ${describeField(fields[0].values, FIELDS[0], false)} of every hour`);
  } else {
    const times = fields[1].values.map((h) =>
      fields[0].values.map((m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    ).flat();
    parts.push(`At ${times.length <= 5 ? times.join(', ') : times.slice(0, 3).join(', ') + ` (+${times.length - 3} more)`}`);
  }

  // Day/month
  if (!domAll) parts.push(`on day ${describeField(fields[2].values, FIELDS[2], false)} of the month`);
  if (!monthAll) parts.push(`in ${describeField(fields[3].values, FIELDS[3], false)}`);
  if (!dowAll) parts.push(`on ${describeField(fields[4].values, FIELDS[4], false)}`);

  return parts.join(' ');
}

function getNextExecutions(expr: string, count: number): Date[] {
  const { fields, error } = parseCron(expr);
  if (error || fields.length === 0) return [];

  const [minuteVals, hourVals, domVals, monthVals, dowVals] = fields.map((f) => new Set(f.values));
  const results: Date[] = [];
  const now = new Date();
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes() + 1, 0, 0);

  const maxIter = 525960; // ~1 year of minutes
  for (let i = 0; i < maxIter && results.length < count; i++) {
    const m = cursor.getMinutes();
    const h = cursor.getHours();
    const dom = cursor.getDate();
    const month = cursor.getMonth() + 1;
    const dow = cursor.getDay();

    if (minuteVals.has(m) && hourVals.has(h) && domVals.has(dom) && monthVals.has(month) && dowVals.has(dow)) {
      results.push(new Date(cursor));
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }
  return results;
}

export function CronParser() {
  const [expr, setExpr] = useState('0 9 * * 1-5');

  const analysis = useMemo(() => {
    const { fields, error } = parseCron(expr);
    const description = describeCron(expr);
    const nextRuns = getNextExecutions(expr, 10);
    return { fields, error, description, nextRuns };
  }, [expr]);

  const tokens = expr.trim().split(/\s+/);

  return (
    <div className="space-y-6">
      {/* Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cron Expression</label>
        <input
          type="text"
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          placeholder="* * * * *"
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-lg p-4 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
          spellCheck={false}
        />
      </div>

      {/* Error */}
      {analysis.error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
          {analysis.error}
        </div>
      )}

      {/* Description */}
      {!analysis.error && analysis.description && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{analysis.description}</p>
        </div>
      )}

      {/* Field breakdown */}
      {!analysis.error && analysis.fields.length === 5 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Field Breakdown</h3>
          <div className="grid gap-2">
            {FIELDS.map((field, i) => {
              const token = tokens[i] || '';
              const isAll = token === '*';
              const values = analysis.fields[i]?.values || [];
              return (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                  <span className="font-mono text-lg text-emerald-600 dark:text-emerald-400 min-w-[64px] text-center font-bold">
                    {token}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {isAll ? 'Every value' : `Values: ${
                        field.names
                          ? values.map((v) => field.names![v] || String(v)).join(', ')
                          : values.length <= 10
                            ? values.join(', ')
                            : values.slice(0, 8).join(', ') + ` ... (+${values.length - 8} more)`
                      }`}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {field.range[0]}-{field.range[1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next executions */}
      {analysis.nextRuns.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Next 10 Executions</h3>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {analysis.nextRuns.map((d, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span className="text-gray-400 font-mono w-6 text-right">{i + 1}.</span>
                <span className="font-mono text-gray-900 dark:text-gray-100">
                  {d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
                {i === 0 && (
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">
                    next
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Presets */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Presets</h3>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.expr}
              onClick={() => setExpr(p.expr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                expr === p.expr
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="font-mono mr-1">{p.expr}</span>
              <span className="text-gray-400">— {p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reference */}
      <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cron Syntax Reference</h3>
        <div className="font-mono text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          <pre className="whitespace-pre">
{`┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6, Sun=0)
│ │ │ │ │
* * * * *`}
          </pre>
          <div className="mt-2 space-y-0.5">
            <div><span className="text-emerald-600 dark:text-emerald-400">*</span> = any value</div>
            <div><span className="text-emerald-600 dark:text-emerald-400">,</span> = list separator (1,3,5)</div>
            <div><span className="text-emerald-600 dark:text-emerald-400">-</span> = range (1-5)</div>
            <div><span className="text-emerald-600 dark:text-emerald-400">/</span> = step (*/15 = every 15)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
