/**
 * Reader-side state for the lead capture block.
 *
 * Everything here is per-browser and disposable. Nothing about which reader has
 * seen or closed which offer is worth a row in Postgres, and putting it there
 * would mean identifying anonymous readers to store it — a cookie and a consent
 * problem in exchange for remembering that someone pressed an X.
 *
 * Note what closing means: the block folds to a one-line button above the
 * sidebar's own call to action, it does not go away. So this records which
 * offers open COLLAPSED on the next article, not which ones are suppressed.

 * The names here still say "minimised". That is deliberate rather than stale —
 * the stored records are keyed by it and written to real browsers, so renaming
 * the concept would mean either migrating what is out there or quietly
 * reopening every offer someone has already closed.
 */

/** One key per offer, so retiring one offer does not reopen the others. */
export function closedKey(slug: string): string {
  return `nntm-lm:${slug}`;
}

/**
 * How long an offer keeps opening collapsed.
 *
 * Two horizons, because the two gestures mean different things. Closing is
 * "not now" and expires — a reader who closes it in March should be offered it
 * again in May, which is how these earn anything. Converting is "I have this",
 * and re-opening a panel for a file someone already downloaded is how a site
 * looks like it is not paying attention.
 *
 * Neither is forever. A year out, the offer has probably been rewritten. And
 * neither suppresses the offer outright: the strip is always there to reopen.
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

/** Should this offer open collapsed for this reader? */
export function startsMinimised(slug: string, now: number = Date.now()): boolean {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(closedKey(slug));
  } catch {
    // Storage throws outright when site data is blocked. Open the offer.
    return false;
  }

  if (!raw) return false;

  let parsed: ClosedRecord;
  try {
    parsed = JSON.parse(raw) as ClosedRecord;
  } catch {
    // Something else wrote this key, or an older format did. Treat it as
    // absent rather than leaving the offer collapsed forever on unparseable
    // data.
    return false;
  }

  const days = MINIMISED_DAYS[parsed?.reason as CloseReason];
  if (!days || typeof parsed.at !== 'number') return false;

  return now - parsed.at < days * DAY_MS;
}

/** Remember that this offer should open collapsed from now on. */
export function rememberClosed(slug: string, reason: CloseReason): void {
  const record: ClosedRecord = { reason, at: Date.now() };

  try {
    localStorage.setItem(closedKey(slug), JSON.stringify(record));
  } catch {
    // Holds for this page view; it just will not persist. Same trade as the
    // theme control makes.
  }
}
