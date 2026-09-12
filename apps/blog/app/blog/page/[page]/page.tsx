import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  POSTS_PER_PAGE,
  blogPagePath,
  countPublishedPosts,
  listNonEmptyTerms,
  listPublishedPosts,
} from '@blog/core';

import { FtBlogArchivePage } from '@/components/marketing/ft/blog-index';
import { PostCard } from '@/components/post-card';
import { isNntmCapital } from '@/lib/marketing';
import { getClient, getSite } from '@/lib/site';
import { ReadingColumn } from '@/components/reading-column';

/** Same cap as the index's pill row, so the two pages carry the same filters. */
const PAGE_CATEGORIES = 6;

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
  const total = await countPublishedPosts(getClient(), site.id);
  const pageCount = Math.ceil(total / POSTS_PER_PAGE);

  // Page 1 lives at `/`, so numbered pages start at 2.
  return Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => ({
    page: String(i + 2),
  }));
}

/*
 * Same fix as the index: without this every numbered page canonicalised to '/'
 * and carried the site name as its title, so page 2 and page 7 were
 * indistinguishable duplicates of the homepage.
 *
 * Self-referencing canonicals, NOT a canonical pointing back at /blog. Google
 * deprecated rel=next/prev and its current guidance is that each page in a
 * series should canonicalise to itself — pointing them all at page one drops
 * the deeper posts out of the index, which on an archive is the only thing
 * those pages are for.
 *
 * They are left indexable for the same reason. These are the crawl path to
 * older posts; noindexing them eventually strands anything past the first page.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  const pageNumber = Number(page);
  const site = await getSite();

  if (!Number.isInteger(pageNumber) || pageNumber < 2) return {};

  return {
    title: `Blog — page ${pageNumber}`,
    description: `Older articles from ${site.name}, page ${pageNumber}.`,
    alternates: { canonical: blogPagePath(pageNumber) },
  };
}

export default async function ArchivePage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const pageNumber = Number(page);

  if (!Number.isInteger(pageNumber) || pageNumber < 2) {
    notFound();
  }

  const site = await getSite();
  const client = getClient();

  const [posts, total] = await Promise.all([
    listPublishedPosts(client, site.id, {
      limit: POSTS_PER_PAGE,
      offset: (pageNumber - 1) * POSTS_PER_PAGE,
    }),
    countPublishedPosts(client, site.id),
  ]);

  if (posts.length === 0) {
    notFound();
  }

  const pageCount = Math.ceil(total / POSTS_PER_PAGE);

  /*
   * Gated like the index, and for the same reason — but ALSO because the index
   * links straight here. Leaving these on the reading column would drop a
   * reader out of the dark marketing design mid-archive, on a click whose whole
   * promise is "more of the same".
   */
  if (isNntmCapital()) {
    const categories = await listNonEmptyTerms(client, site.id, 'category');

    return (
      <FtBlogArchivePage
        posts={posts}
        categories={categories.slice(0, PAGE_CATEGORIES)}
        locale={site.locale}
        heading={`Page ${pageNumber} of ${pageCount}`}
        newerHref={blogPagePath(pageNumber - 1)}
        olderHref={pageNumber < pageCount ? blogPagePath(pageNumber + 1) : undefined}
      />
    );
  }

  return (
    <ReadingColumn>
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">
        Page {pageNumber} of {pageCount}
      </h1>

      <div className="flex flex-col gap-8">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} locale={site.locale} />
        ))}
      </div>

      <nav className="mt-12 flex justify-between text-sm">
        <Link href={blogPagePath(pageNumber - 1)}>← Newer posts</Link>
        {pageNumber < pageCount ? (
          <Link href={blogPagePath(pageNumber + 1)}>Older posts →</Link>
        ) : (
          <span />
        )}
      </nav>
    </ReadingColumn>
  );
}
