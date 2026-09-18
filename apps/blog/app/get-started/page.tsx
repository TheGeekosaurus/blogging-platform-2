import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { LabsGetStarted } from '@/components/marketing/labs/get-started';
import { isNntmLabs } from '@/lib/marketing';

/*
 * Nanotom Labs' contact page — the destination of the header's "Get Started",
 * and the third coded route on that deployment.
 *
 * No data fetching: the copy is in labs/get-started-content.ts and there is no
 * imagery, so there is nothing here for on-demand revalidation to refresh and
 * nothing to add to app/api/revalidate/route.ts. Static for the life of the
 * build.
 *
 * Gated on SITE_SLUG for the same reason /services is: `apps/blog` is deployed
 * once per blog from one codebase, so an ungated static route would serve this
 * page — and shadow any database page at the same path — on every other blog's
 * domain.
 *
 * Registered in CODED_SITES in @blog/core as well as here. Both are required:
 * this file makes the page exist, that entry makes the sitemap and the admin's
 * Pages screen know it does.
 */
export const dynamic = 'force-static';
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Get Started',
    description:
      'Tell Nanotom Labs about your business and what you want more of — calls, bookings ' +
      'or quote requests — and get a read on where you stand in local search today.',
    alternates: { canonical: '/get-started' },
  };
}

export default function GetStartedPage() {
  if (!isNntmLabs()) notFound();

  return <LabsGetStarted />;
}
