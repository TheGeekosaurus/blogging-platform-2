import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { GetFunded } from '@/components/marketing/ft/get-funded';
import { isMarketingSite } from '@/lib/marketing';

/*
 * The application page — CTA_HREF, and so the destination of the header button,
 * the footer button and every "Get Funded" on the homepage.
 *
 * It used to be one of the heading-only stubs in brand.ts, which stopped it
 * 404ing but left the site's primary conversion behind an empty page. It is a
 * real route now, and has been removed from STUB_PAGES accordingly.
 *
 * No data fetching: the copy is in ft/content.ts and the survey is an iframe, so
 * there is nothing here for on-demand revalidation to refresh and nothing to add
 * to app/api/revalidate/route.ts. Static for the life of the build.
 *
 * Gated on SITE_SLUG for the same reason the rest of the marketing chrome is:
 * `apps/blog` is deployed once per blog from one codebase, so an ungated static
 * route would serve this page — and shadow any database page at the same path —
 * on every other blog's domain.
 */
export const dynamic = 'force-static';
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Get Funded',
    description:
      'Apply for business funding from Nanotom Capital. Answer a few questions about your ' +
      'business and an advisor will build a funding strategy around it.',
    alternates: { canonical: '/get-funded' },
    /*
     * No robots directive, deliberately. This is an indexable page like '/' and
     * '/blog' — the noindex the stub carried was a property of being empty, not
     * of being an application page.
     */
  };
}

export default function GetFundedPage() {
  if (!isMarketingSite()) notFound();

  return <GetFunded />;
}
