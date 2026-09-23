import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { LOAN_PAGES } from '@/components/marketing/ft/content';
import { LoanProduct } from '@/components/marketing/ft/loan-product';
import { isNntmCapital } from '@/lib/marketing';

/*
 * /funding-solutions/<product> — the five individual funding products.
 *
 * ONE dynamic route rather than five files. The pages differ only in copy, all
 * of which lives in LOAN_PAGES, so five routes would be five copies of the same
 * twenty lines waiting to drift.
 *
 * These five paths were STUB_PAGES until now — served by the pages catch-all as
 * a noindex heading and nothing else. A static segment beats the catch-all, so
 * this file takes them over the moment it exists; they are removed from
 * STUB_PAGES in brand.ts in the same change, and added to CODED_SITES in
 * @blog/core so the sitemap and the admin's Pages screen can see them. All
 * three are required — a page that renders but is missing from that registry is
 * invisible to crawlers and nothing fails to say so.
 *
 * Gated on SITE_SLUG like every other coded route: `apps/blog` is deployed once
 * per blog from one codebase, so an ungated static route would answer on every
 * other blog's domain and shadow any database page at the same path.
 */
export const dynamic = 'force-static';
export const revalidate = false;

/*
 * `dynamicParams` is left at its DEFAULT of true, and __tests__/route-config
 * enforces that across every dynamic route here.
 *
 * Pinning it false looked defensible on this one — the five products are a
 * build-time constant, so nothing can publish a sixth between deploys. It is
 * still not worth it: the only thing false buys is a marginally faster 404 on
 * URLs nobody visits, and the failure mode it risks is the one that took the
 * blog's archive down (see the long note in app/blog/page/[page]/page.tsx).
 * With the default, an unknown slug renders once and falls through to
 * notFound() below, which is the same answer by a safer route.
 */
export function generateStaticParams() {
  return LOAN_PAGES.map((page) => ({ product: page.slug }));
}

function find(slug: string) {
  return LOAN_PAGES.find((page) => page.slug === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ product: string }>;
}): Promise<Metadata> {
  const { product } = await params;
  const page = find(product);
  if (!page) return {};

  return {
    title: page.navLabel,
    description: page.description,
    alternates: { canonical: `/funding-solutions/${page.slug}` },
  };
}

export default async function LoanProductPage({
  params,
}: {
  params: Promise<{ product: string }>;
}) {
  if (!isNntmCapital()) notFound();

  const { product } = await params;
  const page = find(product);
  if (!page) notFound();

  /*
   * Everything except this page, in LOAN_PAGES order, for the comparison
   * widget. Computed here rather than inside the component so the component
   * stays a pure render of what it is handed.
   */
  const others = LOAN_PAGES.filter((other) => other.slug !== page.slug);

  return <LoanProduct page={page} others={others} />;
}
