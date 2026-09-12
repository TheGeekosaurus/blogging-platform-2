/**
 * Reader-side state for the lead capture card.
 *
 * Everything here is per-browser and disposable. Nothing about which reader has
 * seen or dismissed which offer is worth a row in Postgres, and putting it
 * there would mean identifying anonymous readers to store it — a cookie and a
 * consent problem in exchange for remembering that someone pressed an X.
 */

/** One key per offer, so retiring one offer does not un-dismiss the others. */
export function dismissalKey(slug: string): string {
  return `nntm-lm:${slug}`;
}

/**
 * How long a card stays hidden.
 *
 * Two horizons, because the two gestures mean different things. Dismissing is
 * "not now" and expires — a reader who closes it in March should see it again
 * on a different article in May, which is how these earn anything. Converting
 * is "I have this", and re-offering someone a file they already downloaded is
 * how a site looks like it is not paying attention.
 *
 * Neither is forever. A year out, the offer has probably been rewritten.
 */
export const HIDE_DAYS = {
  dismissed: 30,
  converted: 365,
} as const;

export type DismissalReason = keyof typeof HIDE_DAYS;

interface Dismissal {
  reason: DismissalReason;
  /** Epoch milliseconds. */
  at: number;
}

const DAY_MS = 86_400_000;

/** Is this offer currently hidden for this reader? */
export function isHidden(slug: string, now: number = Date.now()): boolean {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(dismissalKey(slug));
  } catch {
    // Storage throws outright when site data is blocked. Show the card.
    return false;
  }

  if (!raw) return false;

  let parsed: Dismissal;
  try {
    parsed = JSON.parse(raw) as Dismissal;
  } catch {
    // Something else wrote this key, or an older format did. Treat it as
    // absent rather than hiding the card forever on unparseable data.
    return false;
  }

  const days = HIDE_DAYS[parsed?.reason as DismissalReason];
  if (!days || typeof parsed.at !== 'number') return false;

  return now - parsed.at < days * DAY_MS;
}

/**
 * Record a dismissal.
 *
 * There used to be a window event fired alongside this, so that a second
 * placement of the same offer could hide itself too. There has only ever been
 * one placement — the card is rendered once for both breakpoints, because the
 * rail stacks under the article below `lg` — so the only listener was the
 * instance doing the dispatching, and it hides itself directly anyway. Bring
 * the event back with the second placement, not before it.
 */
export function hide(slug: string, reason: DismissalReason): void {
  const record: Dismissal = { reason, at: Date.now() };

  try {
    localStorage.setItem(dismissalKey(slug), JSON.stringify(record));
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
