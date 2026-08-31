import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  categoryPath,
  getTermBySlug,
  listNonEmptyTerms,
  listPostsByTerm,
} from '@blog/core';

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
  const categories = await listNonEmptyTerms(getClient(), site.id, 'category');
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSite();
  const category = await getTermBySlug(getClient(), site.id, 'category', decodeURIComponent(slug));
  if (!category) return {};

  return {
    title: category.name,
    description: category.description ?? `Posts in ${category.name}`,
    alternates: { canonical: categoryPath(category.slug) },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getSite();
  const client = getClient();

  const category = await getTermBySlug(client, site.id, 'category', decodeURIComponent(slug));
  if (!category) {
    notFound();
  }

  const posts = await listPostsByTerm(client, site.id, category.id, { limit: 50 });

  return (
    <>
      <header className="mb-10">
        <p className="text-sm uppercase tracking-wide text-[var(--color-ink-muted)]">Category</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{category.name}</h1>
        {category.description ? (
          <p className="mt-3 text-[var(--color-ink-muted)]">{category.description}</p>
        ) : null}
      </header>

      <div className="flex flex-col gap-8">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} locale={site.locale} />
        ))}
      </div>
    </>
  );
}
