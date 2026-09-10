import { absoluteUrl } from '@blog/core';
import type { SiteRow } from '@blog/core';

/**
 * IndexNow — tell search engines a URL changed, instead of waiting to be
 * crawled.
 *
 * Bing, Yandex, Seznam and Naver share one endpoint; a submission to any of
 * them reaches all of them. GOOGLE DOES NOT PARTICIPATE — it discovers changes
 * through the sitemap, which is why the sitemap being correct matters more
 * than this does. This is upside on the other engines, not a Google strategy.
 *
 * Off unless INDEXNOW_KEY is set, so a deployment without the key configured
 * simply does not ping rather than failing every publish.
 */

const ENDPOINT = 'https://api.indexnow.org/indexnow';

/** Where the key file is served. See app/indexnow-key.txt/route.ts. */
export const KEY_PATH = '/indexnow-key.txt';

export function indexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();
  /*
   * The protocol requires 8–128 hex-ish characters, and a key shorter than
   * that is almost certainly a placeholder someone left in. Treated as unset
   * rather than submitted, because a rejected key produces a 403 on every
   * publish with nothing explaining it.
   */
  if (!key || key.length < 8) return null;
  return key;
}

export interface IndexNowResult {
  ok: boolean;
  submitted: number;
  skipped?: string;
  error?: string;
}

/**
 * Submit content URLs for one site.
 *
 * `paths` are the CANONICAL urls of things that changed — never the sitemap,
 * the feed, or a dynamic route pattern. Submitting a route pattern like
 * `/blog/category/[slug]` would have the endpoint reject the batch, and
 * submitting /sitemap.xml asks a crawler to index a file it should be reading
 * instead.
 */
export async function submitToIndexNow(
  site: Pick<SiteRow, 'base_url'>,
  paths: string[],
): Promise<IndexNowResult> {
  const key = indexNowKey();
  if (!key) return { ok: true, submitted: 0, skipped: 'INDEXNOW_KEY is not set' };

  const urlList = [...new Set(paths)].map((path) => absoluteUrl(site, path));
  if (urlList.length === 0) return { ok: true, submitted: 0, skipped: 'nothing to submit' };

  const host = new URL(site.base_url).host;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host,
        key,
        keyLocation: absoluteUrl(site, KEY_PATH),
        urlList,
      }),
      cache: 'no-store',
      /*
       * Short, because a publish waits on this. The admin already blocks on
       * revalidation; adding an unbounded third-party call to that chain would
       * make saving a post feel broken whenever the endpoint is slow.
       */
      signal: AbortSignal.timeout(3_000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      return {
        ok: false,
        submitted: 0,
        error: `${response.status}${body ? `: ${body.slice(0, 120)}` : ''}`,
      };
    }

    return { ok: true, submitted: urlList.length };
  } catch (cause) {
    return {
      ok: false,
      submitted: 0,
      error: cause instanceof Error ? cause.message : String(cause),
    };
  }
}
