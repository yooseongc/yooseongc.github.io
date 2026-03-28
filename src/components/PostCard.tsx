import { TagBadge } from './TagBadge';

interface PostCardProps {
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  slug: string;
}

export function PostCard({ title, date, excerpt, tags = [], slug }: PostCardProps) {
  return (
    <a
      href={`/blog/${slug}`}
      className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-5 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group"
    >
      <time className="text-xs text-gray-500 dark:text-gray-500">{date}</time>
      <h3 className="mt-1.5 text-base font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
        {title}
      </h3>
      {excerpt && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{excerpt}</p>
      )}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
        </div>
      )}
    </a>
  );
}
