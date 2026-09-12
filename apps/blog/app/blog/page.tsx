import type { Metadata } from 'next';
import Link from 'next/link';

import {
  POSTS_PER_PAGE,
  blogIndexPath,
  blogPagePath,
  countPublishedPosts,
  listNonEmptyTerms,
  listPublishedPosts,
} from '@blog/core';

import { FtBlogIndex } from '@/components/marketing/ft/blog-index';
import { PostCard } from '@/components/post-card';
import { isNntmCapital } from '@/lib/marketing';
import { getClient, getSite } from '@/lib/site';
import { ReadingColumn } from '@/components/reading-column';
import { ThemeToggle } from '@/components/blog/theme-toggle';

/**
 * How many category pills fit on one row at the design's width. Same cap the
 * homepage uses, and for the same reason — they are ordered by name upstream,
 * so this is the first few alphabetically rather than an arbitrary slice.
 */
const INDEX_CATEGORIES = 6;

// Fully static, and never expires on a timer. Pages change only when a publish
// triggers on-demand revalidation (phase 5).
export const dynamic = 'force-static';
export const revalidate = false;

/*
 * Without this the index inherited the ROOT metadata, whose canonical is '/'.
 * So /blog told Google it was a duplicate of the homepage — the one page on the
 * site whose whole job is to rank for the blog, disclaiming itself in favour of
 * a page about funding. It also shared the homepage's title, so the two were
 * indistinguishable in a SERP.
 */
export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();

  return {
    title: 'Blog',
    description:
      site.description ??
      `Articles, guides and funding explainers from ${site.name}.`,
    alternates: { canonical: blogIndexPath() },
  };
}

export default async function HomePage() {
  const site = await getSite();
  const client = getClient();

  const [posts, total] = await Promise.all([
    listPublishedPosts(client, site.id, { limit: POSTS_PER_PAGE }),
    countPublishedPosts(client, site.id),
  ]);

  const hasMore = total > POSTS_PER_PAGE;

  /*
   * Nanotom Capital gets the marketing design; every other blog keeps the
   * reading column below. Gated for the same reason /get-funded and /calc are:
   * `apps/blog` is deployed once per blog from one codebase, so an ungated
   * layout here would put Capital's chrome on every other blog's archive.
   *
   * `listNonEmptyTerms`, not `listTerms` — a pill leading to an empty archive
   * is a dead end. Fetched only on this branch so the other blogs do not pay
   * for a query nothing renders.
   */
  if (isNntmCapital()) {
    const categories = await listNonEmptyTerms(client, site.id, 'category');

    return (
      <FtBlogIndex
        posts={posts}
        categories={categories.slice(0, INDEX_CATEGORIES)}
        locale={site.locale}
        olderHref={hasMore ? blogPagePath(2) : undefined}
      />
    );
  }

  return (
    <ReadingColumn themeToggle={false}>
      {/*
        The index had no <h1> at all, only the tagline paragraph — so this is an
        SEO fix as much as a layout one. The wording carries the topic rather
        than describing the page's mechanics ("Latest Posts"), which is what the
        index can actually rank for.
      */}
      <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-headline)] text-3xl leading-tight sm:text-4xl">
            Business Funding Insights
          </h1>
          {site.description ? (
            <p className="mt-3 text-lg text-[var(--color-ink-muted)]">{site.description}</p>
          ) : null}
        </div>

        <ThemeToggle className="shrink-0" />
      </header>

      {posts.length === 0 ? (
        <p className="text-[var(--color-ink-muted)]">
          No posts published yet. Run the seed script or import a WordPress export.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} locale={site.locale} />
          ))}
        </div>
      )}

      {hasMore ? (
        <nav className="mt-12 flex justify-end">
          <Link href={blogPagePath(2)}>Older posts →</Link>
        </nav>
      ) : null}
    </ReadingColumn>
  );
}
