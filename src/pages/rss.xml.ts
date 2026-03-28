import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const blogPosts = await getCollection('blog', ({ data }) => !data.draft);
  const journalPosts = await getCollection('journal', ({ data }) => !data.draft);

  const allPosts = [
    ...blogPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt ?? '',
      link: `/blog/${post.id}/`,
    })),
    ...journalPosts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt ?? '',
      link: `/journal/${post.id}/`,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'yooseongc',
    description: '백엔드 / 시스템 / 네트워크 / 인프라에 관심이 많은 개발자',
    site: context.site!.toString(),
    items: allPosts,
  });
}
