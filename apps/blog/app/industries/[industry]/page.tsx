import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DaylightIndustry } from '@/components/marketing/daylight/industry';
import {
  INDUSTRY_PAGES,
  industryBySlug,
} from '@/components/marketing/daylight/industry-content';
import { isNntmCapital } from '@/lib/marketing';

/*
 * /industries/<industry> — Nanotom Capital's industry pages.
 *
 * ONE DYNAMIC ROUTE, since 2026-10-06. It was a literal app/industries/
 * food-business/page.tsx while food was the only industry with a record, for a
 * specific reason: A ROUTE SEGMENT ALWAYS BEATS THE CATCH-ALL, so a dynamic
 * segment here would have captured `construction-business` too — which was
 * still a noindex STUB_PAGES entry served by the pages catch-all, and linked
 * live from the header dropdown and the footer. It would have gone from 200 to
 * a hard 404 with nothing to notice.
 *
 * That is settled now: every path under /industries has a record in
 * INDUSTRY_PAGES, construction included, and the stub is gone from brand.ts in
 * this same change. A test fails if a stub is ever reintroduced under this
 * prefix while this file is dynamic — the two cannot coexist.
 *
 * The pages differ only in copy, all of which lives in INDUSTRY_PAGES, so six
 * route files would be six copies of the same twenty lines waiting to drift.
 *
 * Gated on SITE_SLUG like every other coded route: `apps/blog` is deployed once
 * per blog from one codebase, so an ungated static route would answer on every
 * other blog's domain and shadow any database page at the same path.
 *
 * Registered in CODED_SITES in @blog/core as well as here. Both are required —
 * a page that renders but is missing from that registry is invisible to
 * crawlers and to the admin, and nothing fails to say so.
 */
export const dynamic = 'force-static';
export const revalidate = false;

/*
 * `dynamicParams` is left at its DEFAULT of true, and __tests__/route-config
 * enforces that across every dynamic route here. See the long note in
 * app/funding-solutions/[product]/page.tsx for why pinning it false is not
 * worth the failure mode it risks; an unknown slug renders once and falls
 * through to notFound() below, which is the same answer by a safer route.
 */
export function generateStaticParams() {
  return INDUSTRY_PAGES.map((page) => ({ industry: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ industry: string }>;
}): Promise<Metadata> {
  const { industry } = await params;
  const page = industryBySlug(industry);
  if (!page) return {};

  return {
    title: page.navLabel,
    description: page.description,
    alternates: { canonical: `/industries/${page.slug}` },
  };
}

export default async function IndustryPage({
  params,
}: {
  params: Promise<{ industry: string }>;
}) {
  if (!isNntmCapital()) notFound();

  const { industry } = await params;
  const page = industryBySlug(industry);
  if (!page) notFound();

  return <DaylightIndustry page={page} />;
}
