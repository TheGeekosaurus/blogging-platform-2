/**
 * Reader-side state for the lead capture popup.
 *
 * Everything here is per-browser and disposable. Nothing about which reader has
 * seen or closed which offer is worth a row in Postgres, and putting it there
 * would mean identifying anonymous readers to store it — a cookie and a consent
 * problem in exchange for remembering that someone pressed an X.
 *
 * Note what closing means now: the popup minimises to a tile at the bottom of
 * the window, it does not go away. So this records which offers open MINIMISED
 * on the next article, not which ones are suppressed.
 */

/** One key per offer, so retiring one offer does not reopen the others. */
export function closedKey(slug: string): string {
  return `nntm-lm:${slug}`;
}

/**
 * How long an offer keeps opening minimised.
 *
 * Two horizons, because the two gestures mean different things. Closing is
 * "not now" and expires — a reader who closes it in March should be offered it
 * again in May, which is how these earn anything. Converting is "I have this",
 * and re-opening a panel for a file someone already downloaded is how a site
 * looks like it is not paying attention.
 *
 * Neither is forever. A year out, the offer has probably been rewritten. And
 * neither suppresses the offer outright: the tile is always there to reopen.
 */
export const MINIMISED_DAYS = {
  closed: 30,
  converted: 365,
} as const;

export type CloseReason = keyof typeof MINIMISED_DAYS;

interface ClosedRecord {
  reason: CloseReason;
  /** Epoch milliseconds. */
  at: number;
}

const DAY_MS = 86_400_000;

/** Should this offer open minimised for this reader? */
export function startsMinimised(slug: string, now: number = Date.now()): boolean {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(closedKey(slug));
  } catch {
    // Storage throws outright when site data is blocked. Open the popup.
    return false;
  }

  if (!raw) return false;

  let parsed: ClosedRecord;
  try {
    parsed = JSON.parse(raw) as ClosedRecord;
  } catch {
    // Something else wrote this key, or an older format did. Treat it as
    // absent rather than leaving the offer minimised forever on unparseable
    // data.
    return false;
  }

  const days = MINIMISED_DAYS[parsed?.reason as CloseReason];
  if (!days || typeof parsed.at !== 'number') return false;

  return now - parsed.at < days * DAY_MS;
}

/** Remember that this offer should open minimised from now on. */
export function rememberClosed(slug: string, reason: CloseReason): void {
  const record: ClosedRecord = { reason, at: Date.now() };

  try {
    localStorage.setItem(closedKey(slug), JSON.stringify(record));
  } catch {
    // Holds for this page view; it just will not persist. Same trade as the
    // theme control makes.
  }
}

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
