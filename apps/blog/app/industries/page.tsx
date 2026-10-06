import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DaylightIndustriesIndex } from '@/components/marketing/daylight/industries-index';
import { LabsIndustries } from '@/components/marketing/labs/industries';
import { isNntmCapital, isNntmLabs } from '@/lib/marketing';

/*
 * Nanotom Labs' Industries page — the sixth coded route on that deployment.
 *
 * No data fetching: the copy is in labs/industries-content.ts and the cards
 * carry line marks rather than photographs, so there is nothing here for
 * on-demand revalidation to refresh and nothing to add to
 * app/api/revalidate/route.ts. Static for the life of the build.
 *
 * Gated on SITE_SLUG like every other coded route: `apps/blog` is deployed
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
  if (isNntmCapital()) {
    return {
      title: 'Industries',
      description:
        'Business funding by trade — restaurants, construction, healthcare, legal, HVAC and ' +
        'more. What each one borrows for, and which of the nine options usually fits.',
      alternates: { canonical: '/industries' },
    };
  }

  return {
    title: 'Industries',
    description:
      'Home services, construction, dental and medical, restaurants, legal and auto — ' +
      'what local marketing has to do differently in each, and how Nanotom Labs builds ' +
      'for it.',
    alternates: { canonical: '/industries' },
  };
}

export default function IndustriesPage() {
  /*
   * TWO SITES, ONE PATH. This was Labs-only and called notFound() on Capital,
   * which is why Capital's Industries menu trigger had no href and its footer
   * column no linked heading. Denis asked for an "And More" row pointing here,
   * so Capital needs its own index — a different page for a different business
   * at the same URL, which is exactly what the slug gate is for.
   */
  if (isNntmCapital()) return <DaylightIndustriesIndex />;
  if (isNntmLabs()) return <LabsIndustries />;

  notFound();
}
