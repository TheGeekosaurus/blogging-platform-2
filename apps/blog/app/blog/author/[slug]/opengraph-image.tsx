import { getAuthorBySlug, listAuthorsWithPosts } from '@blog/core';

import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '@/lib/og-card';
import { getClient, getSite } from '@/lib/site';

export const alt = 'Author preview';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export async function generateStaticParams() {
  const site = await getSite();
  const authors = await listAuthorsWithPosts(getClient(), site.id);
  return authors.map((author) => ({ slug: author.slug }));
}

/**
 * An author's card: the name as the headline, their role as the footer.
 *
 * The avatar is not drawn into it. Fetching and decoding a remote image per
 * card would add a network round trip to the build for every author, and a
 * name set large is the more legible thing at this size anyway.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getSite();
  const author = await getAuthorBySlug(getClient(), site.id, decodeURIComponent(slug));

  if (!author) {
    return ogCard({ title: site.name, eyebrow: null, footer: new URL(site.base_url).host });
  }

  return ogCard({
    title: author.name,
    eyebrow: 'Author',
    footer: [author.title, site.name].filter(Boolean).join(' · '),
  });
}
