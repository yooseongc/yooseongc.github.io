import { useState, useMemo } from 'react';
import { PostCard } from './PostCard';

interface PostData {
  title: string;
  date: string;
  excerpt?: string;
  tags: string[];
  slug: string;
  series?: string;
}

interface BlogPostListProps {
  posts: PostData[];
  basePath?: string;
}

export function BlogPostList({ posts, basePath = '/blog' }: BlogPostListProps) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      if (selectedTag && !p.tags.includes(selectedTag)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          (p.excerpt?.toLowerCase().includes(q)) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [posts, search, selectedTag]);

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="포스트 검색..."
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          <button
            onClick={() => setSelectedTag(null)}
            className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
              !selectedTag
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400'
            }`}
          >
            All
          </button>
          {allTags.map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                selectedTag === tag
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-400'
              }`}
            >
              {tag} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {search || selectedTag ? '검색 결과가 없습니다.' : '아직 작성된 글이 없습니다.'}
        </p>
      ) : (
        <div className="grid gap-4">
          {filtered.map((post) => (
            <PostCard
              key={post.slug}
              title={post.title}
              date={post.date}
              excerpt={post.excerpt}
              tags={post.tags}
              slug={post.slug}
              basePath={basePath}
            />
          ))}
        </div>
      )}

      {search || selectedTag ? (
        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          {filtered.length} / {posts.length}개 표시
        </p>
      ) : null}
    </div>
  );
}
