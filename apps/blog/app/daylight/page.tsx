import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { listNonEmptyTerms, listPublishedPosts } from '@blog/core';

import { DaylightHome } from '@/components/marketing/daylight/home';
import { isNntmCapital } from '@/lib/marketing';
import { getClient, getSite } from '@/lib/site';

/*
 * DAYLIGHT — the homepage in white, beside the homepage in black.
 *
 * A parallel build for Denis to compare against '/', not a replacement for it
 * and not a theme switch on it. The dark homepage is untouched by this route;
 * the two render from the same copy in ft/content.ts and the same posts, so a
 * difference between them is a difference in design and nothing else.
 *
 * NOINDEX, and that is the whole reason this file sets a robots directive when
 * neither '/' nor /get-funded does. This page is the homepage's content at a
 * second URL. Left indexable it would be the textbook duplicate — two pages
 * competing on the same copy, on a domain whose entire migration was for SEO.
 * `follow` rather than `none` so the links out of it still carry, the same
 * choice the placeholder pages make.
 *
 * Registered in CODED_SITES with `index: false`, which keeps it out of the
 * sitemap while still making it visible in the admin's Pages screen. Both parts
 * are required and they have to agree: an `index: true` entry here would submit
 * a page that asks not to be indexed, which is the trap the funding stubs sat
 * in before they had copy.
 *
 * Gated on SITE_SLUG like every other coded route. `apps/blog` is deployed once
 * per blog from one codebase, so an ungated static route would serve this page
 * — and shadow any database page at the same path — on every other blog's
 * domain.
 *
 * WHEN THIS IS RESOLVED, one way or the other, the route goes: promoted onto
 * '/' if Denis prefers it, deleted if he does not. It is not meant to live here
 * as a permanent second homepage. See the chrome note in globals.css for the
 * one piece of it that is a preview-route stopgap rather than a design choice.
 */
export const dynamic = 'force-static';
export const revalidate = false;

/** Matches the homepage, so the two are comparing the same band. */
const HOMEPAGE_POSTS = 3;
const HOMEPAGE_CATEGORIES = 6;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Daylight — homepage preview',
    description:
      'A light-theme build of the Nanotom Capital homepage, for comparison against the ' +
      'live design. Not a public page.',
    alternates: { canonical: '/daylight' },
    robots: { index: false, follow: true },
  };
}

export default async function DaylightPage() {
  if (!isNntmCapital()) notFound();

  const site = await getSite();

  /*
   * The same two reads the homepage does, so the blog band is the same band.
   *
   * `listNonEmptyTerms`, not `listTerms`: a pill leading to an empty archive is
   * a dead end. This route is force-static with `revalidate = false` like '/',
   * but it is deliberately NOT added to the revalidation target in
   * app/api/revalidate/route.ts — a preview page going stale on new posts costs
   * nothing, and putting it there would mean every publish rebuilding a page
   * nobody outside this comparison reads.
   */
  const [posts, categories] = await Promise.all([
    listPublishedPosts(getClient(), site.id, { limit: HOMEPAGE_POSTS }),
    listNonEmptyTerms(getClient(), site.id, 'category'),
  ]);

  return (
    <DaylightHome
      posts={posts}
      categories={categories.slice(0, HOMEPAGE_CATEGORIES)}
      locale={site.locale}
    />
  );
}
