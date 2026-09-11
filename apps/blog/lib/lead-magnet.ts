/**
 * Reader-side helpers for the lead capture card.
 *
 * This file used to hold the dismissal machinery — a per-offer localStorage
 * key, two expiry horizons, and a window event so the card's placements agreed
 * with each other. All of it is gone, because the card is no longer dismissed:
 * it collapses into the sidebar accordion instead (see sidebar-panels.tsx), and
 * a panel you can reopen with one click does not need to be remembered for
 * thirty days. Nothing about a reader is stored here any more.
 */

/**
 * The campaign parameters on the current URL.
 *
 * Read from the browser rather than the server because the page is static: the
 * HTML for `/blog/x?utm_source=newsletter` and `/blog/x` is the same cached
 * document, so a server render cannot see the query string at all. Whitelisted
 * to the five standard keys, so a submission carries attribution and not
 * whatever else is hanging off the URL.
 */
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

export function readUtm(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const out: Record<string, string> = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    // Capped: these end up in a jsonb column and nothing legitimate is longer.
    if (value) out[key] = value.slice(0, 200);
  }

  return out;
}

/**
 * Where the capture endpoint lives.
 *
 * Trailing slash is required, not cosmetic — `trailingSlash: true` in
 * next.config.ts means the slashless form answers 308. fetch would follow it,
 * but a POST that depends on redirect-following is a POST that breaks quietly
 * the day something stops following redirects.
 */
export const CAPTURE_ENDPOINT = '/api/leads/';
