import type { MetadataRoute } from 'next';

import {
  browsePath,
  categoryPath,
  codedRoutesFor,
  listNonEmptyTerms,
  listPublishedPages,
  listPublishedPosts,
  pagePath,
  pageUrl,
  postPath,
  tagPath,
} from '@blog/core';

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
  const [categories, tags, pages] = await Promise.all([
    listNonEmptyTerms(client, site.id, 'category'),
    listNonEmptyTerms(client, site.id, 'tag'),
    listPublishedPages(client, site.id),
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
      url: pageUrl(site, '/blog'),
      lastModified: newest ? new Date(newest) : new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: pageUrl(site, browsePath()),
      changeFrequency: 'weekly',
      priority: 0.3,
    },
    /*
     * Coded pages: React routes in the repo rather than rows in `pages`, so no
     * query can discover them. Without this they would be absent from the
     * sitemap entirely — an incomplete sitemap on an SEO migration, with nothing
     * to signal the omission. Source of truth is CODED_ROUTES in @blog/core.
     *
     * `path !== ''` skips the homepage, which the '/' entry above already
     * covers; the database pages below are filtered the same way.
     */
    ...codedRoutesFor(site.slug)
      .filter((route) => route.index && route.path !== '')
      .map((route) => ({
        url: pageUrl(site, pagePath(route.path)),
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    // Pages marked noindex are omitted: advertising a URL in the sitemap while
    // telling crawlers not to index it sends contradictory signals.
    ...pages
      .filter((page) => !page.noindex && page.path !== '')
      .map((page) => ({
        url: pageUrl(site, pagePath(page.path)),
        lastModified: new Date(page.updated_at),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })),
    ...posts.map((post) => ({
      url: pageUrl(site, postPath(post.slug)),
      lastModified: new Date(post.published_at),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...categories.map((term) => ({
      url: pageUrl(site, categoryPath(term.slug)),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
    ...tags.map((term) => ({
      url: pageUrl(site, tagPath(term.slug)),
      changeFrequency: 'weekly' as const,
      priority: 0.4,
    })),
  ];
}
