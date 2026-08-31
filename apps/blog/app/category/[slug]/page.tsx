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
export const dynamicParams = false;

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
