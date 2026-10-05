import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { DaylightIndustry } from '@/components/marketing/daylight/industry';
import { industryBySlug } from '@/components/marketing/daylight/industry-content';
import { isNntmCapital } from '@/lib/marketing';

/*
 * /industries/food-business — the first of Nanotom Capital's industry pages.
 *
 * A LITERAL SEGMENT RATHER THAN `[industry]`, and that is the whole decision in
 * this file. A dynamic segment here would capture every /industries/* path,
 * including `construction-business` — which has no record in INDUSTRY_PAGES
 * yet, is served today as a noindex stub by the pages catch-all, and is linked
 * live from both the header dropdown and the footer's Industries column. It
 * would have gone from 200 to a hard 404 the moment this file landed, because
 * A ROUTE SEGMENT ALWAYS BEATS THE CATCH-ALL: once /industries/[industry]
 * exists, nothing under it can fall back to STUB_PAGES.
 *
 * Denis asked to start with one. One is what this is.
 *
 * THE DAY A SECOND INDUSTRY IS WRITTEN, this file becomes
 * app/industries/[industry]/page.tsx with generateStaticParams over
 * INDUSTRY_PAGES — exactly the shape app/funding-solutions/[product] has — and
 * the remaining stub paths must be converted in the same change, not left
 * behind. The template and the copy are already arranged for it: nothing here
 * knows the slug except the lookup below.
 *
 * Gated on SITE_SLUG like every other coded route: `apps/blog` is deployed once
 * per blog from one codebase, so an ungated static route would answer on every
 * other blog's domain and shadow any database page at the same path.
 *
 * Registered in CODED_SITES in @blog/core as well as here, and removed from
 * STUB_PAGES in brand.ts in the same change. All three are required — a page
 * that renders but is missing from that registry is invisible to crawlers and
 * to the admin, and nothing fails to say so.
 */
export const dynamic = 'force-static';
export const revalidate = false;

const SLUG = 'food-business';

export async function generateMetadata(): Promise<Metadata> {
  const page = industryBySlug(SLUG);
  if (!page) return {};

  return {
    title: page.navLabel,
    description: page.description,
    alternates: { canonical: `/industries/${page.slug}` },
  };
}

export default function FoodBusinessPage() {
  if (!isNntmCapital()) notFound();

  const page = industryBySlug(SLUG);
  if (!page) notFound();

  return <DaylightIndustry page={page} />;
}
