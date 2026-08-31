import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getTermBySlug, listNonEmptyTerms, listPostsByTerm, tagPath } from '@blog/core';

import { PostCard } from '@/components/post-card';
import { getClient, getSite } from '@/lib/site';

export const dynamic = 'force-static';
export const revalidate = false;
// `dynamicParams` is deliberately left at its DEFAULT of true.
//
// Setting it to false — as this route originally did — restricts the route to
// the params generateStaticParams returned at BUILD time. Any post published
// since the last deploy then 404s permanently, and no amount of cache flushing
// helps. That silently broke publishing until it surfaced in production.
//
// With the default: generateStaticParams still prerenders known content at
// deploy time, an unknown slug renders once on demand and is then cached, and a
// slug with no matching row falls through to notFound() below.
//
// Verified empirically that `force-static` above is NOT what caused the 404. It
// is only an assertion that this route renders statically, kept so the page
// cannot quietly become dynamic.

export async function generateStaticParams() {
  const site = await getSite();
  const tags = await listNonEmptyTerms(getClient(), site.id, 'tag');
  return tags.map((tag) => ({ slug: tag.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSite();
  const tag = await getTermBySlug(getClient(), site.id, 'tag', decodeURIComponent(slug));
  if (!tag) return {};

  return {
    title: `#${tag.name}`,
    description: tag.description ?? `Posts tagged ${tag.name}`,
    alternates: { canonical: tagPath(tag.slug) },
  };
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getSite();
  const client = getClient();

  const tag = await getTermBySlug(client, site.id, 'tag', decodeURIComponent(slug));
  if (!tag) {
    notFound();
  }

  const posts = await listPostsByTerm(client, site.id, tag.id, { limit: 50 });

  return (
    <>
      <header className="mb-10">
        <p className="text-sm uppercase tracking-wide text-[var(--color-ink-muted)]">Tag</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">#{tag.name}</h1>
      </header>

      <div className="flex flex-col gap-8">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} locale={site.locale} />
        ))}
      </div>
    </>
  );
}
