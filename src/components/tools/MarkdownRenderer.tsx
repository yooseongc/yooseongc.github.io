import { useState, useMemo } from 'react';

const SAMPLE = `# Markdown Preview

## 기능

- **굵은 글씨** 와 *기울임*
- [링크](https://example.com)
- \`인라인 코드\`

### 코드 블록

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

### 인용

> 인용문을 작성할 수 있습니다.

### 테이블

| Header | Header |
|--------|--------|
| Cell   | Cell   |

---

1. 순서 있는
2. 목록도
3. 지원합니다
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function simpleMarkdown(md: string): string {
  let html = escapeHtml(md);

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) =>
    `<pre class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto my-3"><code>${code.trim()}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/gm, (_m, header, _sep, body) => {
    const ths = header.split('|').filter((c: string) => c.trim()).map((c: string) => `<th class="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left">${c.trim()}</th>`).join('');
    const rows = body.trim().split('\n').map((row: string) => {
      const tds = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td class="border border-gray-200 dark:border-gray-700 px-3 py-2">${c.trim()}</td>`).join('');
      return `<tr>${tds}</tr>`;
    }).join('');
    return `<table class="border-collapse w-full my-3"><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');

  // HR
  html = html.replace(/^---$/gm, '<hr class="border-gray-200 dark:border-gray-700 my-6" />');

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-emerald-400 pl-4 my-3 text-gray-600 dark:text-gray-400 italic">$1</blockquote>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-emerald-600 dark:text-emerald-400 underline" target="_blank" rel="noopener noreferrer">$1</a>');

  // Unordered list
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

  // Ordered list
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  // Paragraphs (lines that don't start with HTML tags)
  html = html.replace(/^(?!<[a-z/])((?!^\s*$).+)$/gm, (match) => {
    if (match.startsWith('<')) return match;
    return `<p class="my-2">${match}</p>`;
  });

  return html;
}

type ViewMode = 'split' | 'editor' | 'preview';

export function MarkdownRenderer() {
  const [input, setInput] = useState(SAMPLE);
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  const rendered = useMemo(() => simpleMarkdown(input), [input]);
  const lineCount = useMemo(() => input.split('\n').length, [input]);

  const showEditor = viewMode === 'split' || viewMode === 'editor';
  const showPreview = viewMode === 'split' || viewMode === 'preview';

  return (
    <div className="space-y-4">
      {/* View mode toggle */}
      <div className="flex gap-2">
        {([
          { key: 'editor', label: 'Editor' },
          { key: 'split', label: 'Split' },
          { key: 'preview', label: 'Preview' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setViewMode(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === key
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`grid gap-4 min-h-[500px] ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Editor */}
        {showEditor && (
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Markdown</label>
            <div className="flex flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent">
              <div className="select-none px-3 py-3 text-right text-xs text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-700 font-mono leading-5">
                {Array.from({ length: Math.max(lineCount, 20) }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 min-h-[400px] px-4 py-3 bg-transparent text-gray-900 dark:text-gray-100 font-mono text-sm resize-none focus:outline-none leading-5"
              />
            </div>
          </div>
        )}

        {/* Preview */}
        {showPreview && (
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preview</label>
            <div
              className="flex-1 min-h-[400px] px-6 py-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 text-sm overflow-auto"
              dangerouslySetInnerHTML={{ __html: rendered }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
