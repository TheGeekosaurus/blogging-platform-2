import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { LabsAbout } from '@/components/marketing/labs/about';
import { isNntmLabs } from '@/lib/marketing';

/*
 * Nanotom Labs' About page — the fifth coded route on that deployment, and the
 * destination the nav's "About" item finally has.
 *
 * No data fetching: the copy is in labs/about-content.ts and the only imagery
 * is in /public, so there is nothing here for on-demand revalidation to
 * refresh and nothing to add to app/api/revalidate/route.ts. Static for the
 * life of the build.
 *
 * Gated on SITE_SLUG for the same reason /services and /get-started are:
 * `apps/blog` is deployed once per blog from one codebase, so an ungated
 * static route would serve this page — and shadow any database page at the
 * same path — on every other blog's domain.
 *
 * Registered in CODED_SITES in @blog/core as well as here. Both are required:
 * this file makes the page exist, that entry makes the sitemap and the admin's
 * Pages screen know it does.
 *
 * INDEXED, unlike the project pages. The three placeholder blocks on it are
 * about this business rather than about a named third party, and they are
 * removable in one edit — see the warning at the top of labs/about-content.ts,
 * which is where that judgement should be revisited before launch, not here.
 */
export const dynamic = 'force-static';
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'About',
    description:
      'Nanotom Labs is a marketing team for businesses whose customers live nearby — ' +
      'websites, local search and ads, judged by the calls and bookings they bring in.',
    alternates: { canonical: '/about' },
  };
}

export default function AboutPage() {
  if (!isNntmLabs()) notFound();

  return <LabsAbout />;
}
