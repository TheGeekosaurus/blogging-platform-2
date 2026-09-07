import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { LabsServices } from '@/components/marketing/labs/services';
import { isNntmLabs } from '@/lib/marketing';

/*
 * Nanotom Labs' Services page — the destination of the header's "Services",
 * and the second coded route on that deployment.
 *
 * No data fetching: the copy is in labs/services-content.ts and the imagery is
 * static, so there is nothing here for on-demand revalidation to refresh and
 * nothing to add to app/api/revalidate/route.ts. Static for the life of the
 * build.
 *
 * Gated on SITE_SLUG for the same reason Capital's /get-funded is: `apps/blog`
 * is deployed once per blog from one codebase, so an ungated static route
 * would serve this page — and shadow any database page at the same path — on
 * every other blog's domain.
 *
 * Registered in CODED_SITES in @blog/core as well as here. Both are required:
 * this file makes the page exist, that entry makes the sitemap and the admin's
 * Pages screen know it does.
 */
export const dynamic = 'force-static';
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Services',
    description:
      'Web design, web development, mobile app development and digital marketing from ' +
      'Nanotom Labs — what each service covers, what it starts from, and the work behind it.',
    alternates: { canonical: '/services' },
  };
}

export default function ServicesPage() {
  if (!isNntmLabs()) notFound();

  return <LabsServices />;
}
