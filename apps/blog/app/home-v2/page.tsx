import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HomeV2 } from '@/components/marketing/ft/home-v2';
import { isMarketingSite } from '@/lib/marketing';

/*
 * A homepage candidate, parked at its own URL for review.
 *
 * This is the Figma template rebuilt as a real page (see the component's own
 * note). It is NOT wired to `/` — promoting it is a one-line change in
 * app/page.tsx once the copy and images are its own, and until then the live
 * homepage is untouched.
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
    title: 'Home (design preview)',
    /*
     * Out of the index while it is a draft. It carries placeholder copy about a
     * fictional company, which is exactly what should not be competing with the
     * real homepage in search results. `follow` stays on so the links it does
     * carry are still crawled.
     */
    robots: { index: false, follow: true },
    alternates: { canonical: '/home-v2' },
  };
}

export default function HomeV2Page() {
  if (!isMarketingSite()) notFound();

  return <HomeV2 />;
}
