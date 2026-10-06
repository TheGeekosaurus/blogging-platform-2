import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DscrCalculatorPage } from '@/components/marketing/daylight/dscr-calculator';
import { isNntmCapital } from '@/lib/marketing';

/*
 * /calculators/dscr-calculator — the DSCR tool.
 *
 * No data fetching: the copy is in daylight/dscr-content.ts and the calculator
 * is a hosted iframe, so there is nothing here for on-demand revalidation to
 * refresh and nothing to add to app/api/revalidate/route.ts. Static for the
 * life of the build; the one client component on the page is the embed, which
 * hydrates onto the HTML.
 *
 * Gated on SITE_SLUG like every other coded route: `apps/blog` is deployed once
 * per blog from one codebase, so an ungated static route would serve this page
 * — and shadow any database page at the same path — on every other blog's
 * domain.
 *
 * Registered in CODED_SITES in @blog/core as well as here. Both are required:
 * this file makes the page exist, that entry makes the sitemap and the admin's
 * Pages screen know it does.
 *
 * THE PATH IS PLURAL because Denis asked for /calculators/, which reads as a
 * section rather than a page. Nothing else lives there yet. /calc, the business
 * funding calculator, deliberately stays where it is — it is linked from the
 * header, the footer and a homepage tile, so moving it would mean touching all
 * three plus a redirect, for tidiness alone.
 */
export const dynamic = 'force-static';
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'DSCR Calculator For Investment Property',
    description:
      'Work out the debt service coverage ratio on a rental property. Enter the rent, ' +
      'the running costs and the loan payment, and see where the ratio lands — plus what ' +
      'lenders generally look for and how the number is calculated.',
    alternates: { canonical: '/calculators/dscr-calculator' },
  };
}

export default function DscrCalculatorRoute() {
  if (!isNntmCapital()) notFound();

  return <DscrCalculatorPage />;
}
