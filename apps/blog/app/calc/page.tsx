import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { LoanCalculator } from '@/components/marketing/ft/loan-calculator';
import { isNntmCapital } from '@/lib/marketing';

/*
 * /calc — the loan calculator, and the destination of the header's "Loan
 * Calculator", the homepage's calculator tile and the footer link.
 *
 * This path used to be a REWRITE to calc.nanotomcapital.com, a separate
 * deployment that answered on this domain. It is a page in this repo now, so
 * that rewrite is gone from next.config.ts — a rewrite and a route at the same
 * path is a coin toss nobody should have to reason about. The subdomain is
 * deliberately left running and untouched; retiring it belongs with the rest of
 * the redirects at domain transfer.
 *
 * No data fetching: the copy is in ft/content.ts and the maths is in
 * lib/funding-calc.ts, so there is nothing here for on-demand revalidation to
 * refresh and nothing to add to app/api/revalidate/route.ts. Static for the life
 * of the build — the calculator itself is a client component that runs entirely
 * in the browser, so the page ships as HTML and the interactivity hydrates onto
 * it.
 *
 * Gated on SITE_SLUG for the same reason /get-funded is: `apps/blog` is deployed
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
    title: 'Business Loan Calculator',
    description:
      'Estimate the payment, total cost and APR on business funding from Nanotom Capital — ' +
      'line of credit, term loan, revenue-based financing, working capital or equipment ' +
      'finance — against your own credit profile and revenue.',
    alternates: { canonical: '/calc' },
  };
}

export default function CalcPage() {
  if (!isNntmCapital()) notFound();

  return <LoanCalculator />;
}
