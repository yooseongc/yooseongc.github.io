interface TagBadgeProps {
  tag: string;
  href?: string;
}

export function TagBadge({ tag, href }: TagBadgeProps) {
  const className = 'inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors';

  if (href) {
    return <a href={href} className={className}>{tag}</a>;
  }
  return <span className={className}>{tag}</span>;
}
