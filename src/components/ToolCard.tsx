import type { ToolMeta } from '../data/tools';

export function ToolCard({ name, slug, description, status }: ToolMeta) {
  const isReady = status === 'ready';

  const inner = (
    <div
      className={[
        'rounded-xl border p-5 flex flex-col h-full transition-colors',
        isReady
          ? 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer'
          : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30 opacity-60',
      ].join(' ')}
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white font-mono">{name}</h3>
      <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 flex-1">{description}</p>
      {!isReady && (
        <span className="mt-3 inline-block text-xs text-gray-400 dark:text-gray-500">Coming Soon</span>
      )}
    </div>
  );

  if (isReady) {
    return <a href={`/tools/${slug}`}>{inner}</a>;
  }
  return inner;
}
