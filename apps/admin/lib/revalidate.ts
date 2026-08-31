import type { SiteRow } from '@blog/core';

import { createClient } from './supabase/server';

/**
 * Tell a blog deployment that something changed.
 *
 * The admin and the blog are separate deployments, so a publish here cannot call
 * revalidatePath() there directly — it goes over HTTP with a shared secret.
 *
 * The admin sends only WHAT changed, never which URLs to purge: the blog owns
 * its own routing and derives the affected paths itself.
 */

export type RevalidateTarget =
  | { type: 'post'; slug: string }
  | { type: 'page'; path: string }
  | { type: 'site' };

export interface RevalidateResult {
  ok: boolean;
  error?: string;
}

async function secretFor(siteId: string): Promise<string | null> {
  const supabase = await createClient();

  // Readable here because the caller is an authenticated admin; the anon role
  // used by the blog has no access to this table at all.
  const { data, error } = await supabase
    .from('site_secrets')
    .select('revalidate_secret')
    .eq('site_id', siteId)
    .maybeSingle();

  if (error || !data) return null;
  return data.revalidate_secret;
}

export async function revalidateSite(
  site: SiteRow,
  target: RevalidateTarget,
): Promise<RevalidateResult> {
  const secret = await secretFor(site.id);
  if (!secret) {
    return { ok: false, error: 'No revalidation secret found for this site.' };
  }

  // Trailing slash is required, not cosmetic: apps/blog sets
  // `trailingSlash: true`, so the slashless form answers with a 308 redirect.
  // fetch would follow it (308 preserves method and body), but that is a wasted
  // round trip resting on redirect-following staying enabled.
  const url = `${site.base_url.replace(/\/+$/, '')}/api/revalidate/`;

  try {
    // Awaited rather than fire-and-forget: the author needs to know whether the
    // post is actually live, and a silent failure would tell them it is.
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify(target),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return {
        ok: false,
        error: `${url} returned ${response.status}${body ? `: ${body.slice(0, 200)}` : ''}`,
      };
    }

    return { ok: true };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    return { ok: false, error: `Could not reach ${url}: ${message}` };
  }
}
