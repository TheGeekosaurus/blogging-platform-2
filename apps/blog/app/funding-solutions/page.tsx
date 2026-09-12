import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { FundingSolutions } from '@/components/marketing/ft/funding-solutions';
import { isNntmCapital } from '@/lib/marketing';

/*
 * /funding-solutions — the loans page.
 *
 * The destination of the header's "Funding Solutions", the homepage's first
 * funding tile and every "Learn More" on the funding carousel. It was a
 * heading-only stub in brand.ts until now, which stopped it 404ing without
 * giving anyone a reason to stay on it.
 *
 * Its five CHILDREN — /funding-solutions/business-loans and the rest — are
 * still stubs. Only the index is built, so the nav's dropdown still lands on
 * headings; those are separate pages and separate copy.
 *
 * No data fetching: the copy is in ft/content.ts, so there is nothing here for
 * on-demand revalidation to refresh and nothing to add to
 * app/api/revalidate/route.ts. Static for the life of the build.
 *
 * Gated on SITE_SLUG for the same reason /get-funded and /calc are: `apps/blog`
 * is deployed once per blog from one codebase, so an ungated static route would
 * serve this page — and shadow any database page at the same path — on every
 * other blog's domain.
 *
 * Registered in CODED_SITES in @blog/core as well as here. Both are required:
 * this file makes the URL answer, that list makes it reachable from the sitemap
 * and visible in the admin's Pages screen.
 */
export const dynamic = 'force-static';
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Funding Solutions',
    description:
      'Compare business loans, lines of credit, revenue-based financing, working capital ' +
      'and equipment finance from Nanotom Capital. Approvals from $15,000 to $5,000,000.',
    alternates: { canonical: '/funding-solutions' },
  };
}

export default function FundingSolutionsPage() {
  if (!isNntmCapital()) notFound();

  return <FundingSolutions />;
}
