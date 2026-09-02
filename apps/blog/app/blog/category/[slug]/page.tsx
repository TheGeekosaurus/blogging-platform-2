import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  ancestorTerms,
  categoryPath,
  childTerms,
  descendantTermIds,
  getTermBySlug,
  listNonEmptyTerms,
  listPostsByTerms,
  listTerms,
} from '@blog/core';

import { PostCard } from '@/components/post-card';
import { getClient, getSite } from '@/lib/site';
import { ReadingColumn } from '@/components/reading-column';

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

  /*
   * Categories nest, so this archive lists posts from the whole subtree, not
   * just posts tagged with this exact category — WordPress's behaviour. It
   * matters because editors tag the most specific category only: without it a
   * parent archive is an empty page, and the parent is usually the one worth
   * ranking for the broader term.
   *
   * `listTerms` rather than `listNonEmptyTerms` here: the tree has to be walked
   * through categories that hold no posts of their own, and filtering those out
   * first would cut the subtree short.
   */
  const allCategories = await listTerms(client, site.id, 'category');
  const subtree = descendantTermIds(allCategories, category.id);

  const posts = await listPostsByTerms(client, site.id, subtree, { limit: 50 });

  const parents = ancestorTerms(allCategories, category.id);
  const children = childTerms(allCategories, category.id);

  return (
    <ReadingColumn>
      <header className="mb-10">
        <p className="text-sm uppercase tracking-wide text-[var(--color-ink-muted)]">
          Category
        </p>

        {/* Nearest ancestor last, reading left to right like a breadcrumb. */}
        {parents.length > 0 ? (
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm">
            {[...parents].reverse().map((parent) => (
              <span key={parent.id} className="flex items-center gap-1.5">
                <Link href={categoryPath(parent.slug)}>{parent.name}</Link>
                <span aria-hidden="true" className="text-[var(--color-ink-muted)]">
                  /
                </span>
              </span>
            ))}
          </p>
        ) : null}

        <h1 className="mt-1 text-3xl font-bold tracking-tight">{category.name}</h1>
        {category.description ? (
          <p className="mt-3 text-[var(--color-ink-muted)]">{category.description}</p>
        ) : null}

        {children.length > 0 ? (
          <nav className="mt-5" aria-label={`Subcategories of ${category.name}`}>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {children.map((child) => (
                <li key={child.id}>
                  <Link href={categoryPath(child.slug)}>{child.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </header>

      {posts.length === 0 ? (
        <p className="text-[var(--color-ink-muted)]">Nothing published here yet.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} locale={site.locale} />
          ))}
        </div>
      )}
    </ReadingColumn>
  );
}
