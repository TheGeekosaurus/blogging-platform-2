import { excerptFor, listPublishedPosts, pageUrl, absoluteUrl } from '@blog/core';

import { getClient, getSite } from '@/lib/site';

/**
 * RSS 2.0 feed.
 *
 * Static: the feed changes only when a post is published, and publishing already
 * triggers on-demand revalidation.
 */
export const dynamic = 'force-static';

const FEED_LIMIT = 50;

/**
 * Escape text for XML.
 *
 * Post content is already sanitised HTML, but it is HTML — dropping it into XML
 * unescaped produces a malformed feed the moment a post contains a `<` or a
 * stray `&`. Every interpolated value goes through here.
 */
function xml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const site = await getSite();
  const posts = await listPublishedPosts(getClient(), site.id, { limit: FEED_LIMIT });

  const items = posts
    .map((post) => {
      const url = pageUrl(site, `/${post.slug}`);
      const summary = excerptFor({ excerpt: post.excerpt, content_html: '' }, 400);

      return [
        '    <item>',
        `      <title>${xml(post.title)}</title>`,
        `      <link>${xml(url)}</link>`,
        `      <guid isPermaLink="true">${xml(url)}</guid>`,
        `      <pubDate>${new Date(post.published_at).toUTCString()}</pubDate>`,
        summary ? `      <description>${xml(summary)}</description>` : '',
        post.author_name ? `      <dc:creator>${xml(post.author_name)}</dc:creator>` : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    `    <title>${xml(site.name)}</title>`,
    `    <link>${xml(pageUrl(site, '/'))}</link>`,
    `    <description>${xml(site.description ?? site.name)}</description>`,
    `    <language>${xml(site.locale)}</language>`,
    `    <lastBuildDate>${new Date(posts[0]?.published_at ?? Date.now()).toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${xml(absoluteUrl(site, '/feed.xml'))}" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
