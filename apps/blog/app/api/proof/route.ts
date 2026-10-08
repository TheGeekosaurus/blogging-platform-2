import { NextResponse } from 'next/server';

import { getProofPayload, type ProofPayload } from '@blog/core';

import { getClient, getSite } from '@/lib/site';

/**
 * Every active social-proof campaign for this site, as JSON.
 *
 * A static route, like every page: built once and purged by the admin's
 * site-wide revalidation (`revalidatePath('/', 'layout')` covers route
 * handlers too), so the toasts cost one cached file per visitor and no
 * database read.
 *
 * A separate request rather than props from the root layout, because the
 * layout is in the HTML of every page — a campaign with forty events would be
 * re-sent on every navigation, in the bytes that block first paint. The
 * toasts fetch this after the page is idle instead.
 *
 * Fails soft, unlike the lead-magnet query. A toast is decoration; a database
 * that is one migration behind the code should cost the toasts, not the
 * build. The error is still logged so the cause is findable.
 */

export const dynamic = 'force-static';
export const revalidate = false;

export async function GET() {
  let payload: ProofPayload = { campaigns: [] };

  try {
    const site = await getSite();
    payload = await getProofPayload(getClient(), site.id);
  } catch (error) {
    console.error('[proof] serving no campaigns:', error);
  }

  return NextResponse.json(payload);
}
