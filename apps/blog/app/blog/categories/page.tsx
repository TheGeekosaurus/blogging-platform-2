import type { Metadata } from 'next';
import Link from 'next/link';

import { browsePath, categoryPath, listNonEmptyTerms, tagPath } from '@blog/core';

import { getClient, getSite } from '@/lib/site';

export const dynamic = 'force-static';
export const revalidate = false;

export const metadata: Metadata = {
  title: 'Categories',
  alternates: { canonical: browsePath() },
};

export default async function CategoriesPage() {
  const site = await getSite();
  const client = getClient();

  const [categories, tags] = await Promise.all([
    listNonEmptyTerms(client, site.id, 'category'),
    listNonEmptyTerms(client, site.id, 'tag'),
  ]);

  return (
    <>
      <h1 className="mb-8 text-3xl font-bold tracking-tight">Browse</h1>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Categories</h2>
        {categories.length === 0 ? (
          <p className="text-[var(--color-ink-muted)]">No categories yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={categoryPath(category.slug)}>{category.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Tags</h2>
        {tags.length === 0 ? (
          <p className="text-[var(--color-ink-muted)]">No tags yet.</p>
        ) : (
          <p className="flex flex-wrap gap-x-4 gap-y-2">
            {tags.map((tag) => (
              <Link key={tag.id} href={tagPath(tag.slug)}>
                #{tag.name}
              </Link>
            ))}
          </p>
        )}
      </section>
    </>
  );
}
