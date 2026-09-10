import { getPostBySlug, listPublishedSlugs, postAuthorName } from '@blog/core';

import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '@/lib/og-card';
import { getClient, getSite } from '@/lib/site';

export const alt = 'Post preview';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;


export async function generateStaticParams() {
  const site = await getSite();
  const slugs = await listPublishedSlugs(getClient(), site.id);
  return slugs.map((slug) => ({ slug }));
}

/**
 * A post's social preview card, generated at build time alongside the page.
 *
 * The layout lives in lib/og-card so the post, page and author cards cannot
 * drift into three different-looking designs. This one used to carry its own
 * copy, on the generic slate palette rather than the brand's.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getSite();
  const post = await getPostBySlug(getClient(), site.id, decodeURIComponent(slug));

  return ogCard({
    title: post?.title ?? site.name,
    eyebrow: post?.categories[0]?.name ?? 'Article',
    footer: [post ? postAuthorName(post) : null, site.name].filter(Boolean).join(' \u00b7 '),
  });
}
