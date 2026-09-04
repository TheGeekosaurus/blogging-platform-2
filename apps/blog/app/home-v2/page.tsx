import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { listNonEmptyTerms, listPublishedPosts } from '@blog/core';

import { HomeV2 } from '@/components/marketing/ft/home-v2';
import { isMarketingSite } from '@/lib/marketing';
import { getClient, getSite } from '@/lib/site';

/*
 * A homepage candidate, parked at its own URL for review.
 *
 * This is the Figma template rebuilt as a real page (see the component's own
 * note). It is NOT wired to `/` — promoting it is a one-line change in
 * app/page.tsx once the copy and images are its own, and until then the live
 * homepage is untouched.
 *
 * Gated on SITE_SLUG for the same reason the rest of the marketing chrome is:
 * `apps/blog` is deployed once per blog from one codebase, so an ungated static
 * route would serve this page — and shadow any database page at the same path —
 * on every other blog's domain.
 */
export const dynamic = 'force-static';
export const revalidate = false;

/**
 * How many posts the design's blog band holds before it stops looking like a
 * highlight and starts looking like the archive. The archive is one click away
 * via "View All Blogs".
 */
const HOMEPAGE_POSTS = 3;

/**
 * And how many category pills fit on one row at the design's width. Ordered by
 * name upstream, so this takes the first few alphabetically rather than an
 * arbitrary slice of an arbitrary order.
 */
const HOMEPAGE_CATEGORIES = 6;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Home (design preview)',
    /*
     * Out of the index while it is a draft. It carries placeholder copy about a
     * fictional company, which is exactly what should not be competing with the
     * real homepage in search results. `follow` stays on so the links it does
     * carry are still crawled.
     */
    robots: { index: false, follow: true },
    alternates: { canonical: '/home-v2' },
  };
}

export default async function HomeV2Page() {
  if (!isMarketingSite()) notFound();

  const site = await getSite();
  const client = getClient();

  /*
   * `listNonEmptyTerms`, not `listTerms`: a pill leading to an archive with
   * nothing in it is a dead end, and on a homepage it is a dead end in the
   * shop window.
   *
   * This page is force-static with `revalidate = false`, exactly like /blog, so
   * both are refreshed by on-demand revalidation rather than a timer. That only
   * works because /home-v2 was added to the post target in
   * app/api/revalidate/route.ts — without it this section would freeze at
   * whatever was published when the site was last built.
   */
  const [posts, categories] = await Promise.all([
    listPublishedPosts(client, site.id, { limit: HOMEPAGE_POSTS }),
    listNonEmptyTerms(client, site.id, 'category'),
  ]);

  return (
    <HomeV2
      posts={posts}
      categories={categories.slice(0, HOMEPAGE_CATEGORIES)}
      locale={site.locale}
    />
  );
}
