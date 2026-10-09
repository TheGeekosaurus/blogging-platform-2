/**
 * What a lead capture form posts, and where.
 *
 * HERE RATHER THAN IN THE BLOG, which is where both of these started. The card
 * that uses them now lives in `@blog/ui`, because the admin's CTA builder
 * renders the same component for its preview — and a preview that is a second
 * implementation is a preview that lies. A package cannot import from an app,
 * so the two things the card needs from the blog came with it.
 *
 * The rest of the blog's `lib/lead-magnet.ts` did NOT come: closedKey,
 * startsMinimised and rememberClosed are about what a reader has dismissed,
 * which is the wrapper's business and the browser's, not the card's.
 */

/*
 * Read in the browser, never on the server, and that is not a style choice.
 * The post page is statically rendered, so the HTML for
 * `/blog/x?utm_source=newsletter` and `/blog/x` is the same cached document —
 * a server render cannot see the query string at all.
 *
 * Whitelisted to the five standard keys, so a submission carries attribution
 * and not whatever else is hanging off the URL.
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
