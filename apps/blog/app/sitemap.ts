import type { MetadataRoute } from 'next';

import { listNonEmptyTerms, listPublishedPosts, pageUrl } from '@blog/core';

import { getClient, getSite } from '@/lib/site';

export const dynamic = 'force-static';

/**
 * Every URL uses pageUrl(), so entries carry the same trailing slash the site
 * actually serves. A sitemap full of redirecting URLs wastes crawl budget and
 * contradicts the canonical tags.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite();
  const client = getClient();

  // A sitemap must list everything, not just the first page.
  const posts = await listPublishedPosts(client, site.id, { limit: 50_000 });
  const [categories, tags] = await Promise.all([
    listNonEmptyTerms(client, site.id, 'category'),
    listNonEmptyTerms(client, site.id, 'tag'),
  ]);

  const newest = posts[0]?.published_at;

  return [
    {
      url: pageUrl(site, '/'),
      lastModified: newest ? new Date(newest) : new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: pageUrl(site, '/categories'),
      changeFrequency: 'weekly',
      priority: 0.3,
    },
    ...posts.map((post) => ({
      url: pageUrl(site, `/${post.slug}`),
      lastModified: new Date(post.published_at),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...categories.map((term) => ({
      url: pageUrl(site, `/category/${term.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
    ...tags.map((term) => ({
      url: pageUrl(site, `/tag/${term.slug}`),
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
  ];
}
