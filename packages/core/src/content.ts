import { htmlToPlainText, truncateWords } from './sanitize';

const WORDS_PER_MINUTE = 200;

/** Estimated reading time in whole minutes, minimum 1. */
export function readingMinutes(html: string): number {
  const words = htmlToPlainText(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/**
 * Excerpt for cards, meta descriptions and RSS.
 * Prefers the stored excerpt; falls back to the opening of the body.
 */
export function excerptFor(
  post: { excerpt: string | null; content_html: string },
  maxChars = 160,
): string {
  const stored = post.excerpt?.trim();
  if (stored) {
    return truncateWords(htmlToPlainText(stored), maxChars);
  }
  return truncateWords(htmlToPlainText(post.content_html), maxChars);
}

/** Format a publish date for display. Stable across server and client. */
export function formatPostDate(iso: string, locale = 'en'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
}

/**
 * Images in a body of HTML that carry no `alt` attribute at all.
 *
 * Returns each one's `src`, so a warning can name them rather than just count
 * them — "3 images have no alt text" sends an author hunting.
 *
 * ABSENT, not empty. `alt=""` is the correct, standards-compliant markup for a
 * decorative image and flagging it would be wrong: an author who has decided an
 * image carries no information has done the right thing, and a warning that
 * fires on correct markup is a warning people learn to ignore. A missing
 * attribute is the different case — nobody decided anything, which is what
 * WordPress exports look like.
 *
 * Regex rather than a parse: this runs on every save next to the sanitiser,
 * which has already normalised the markup, and pulling in a DOM to count
 * attributes would cost more than the check is worth.
 */
export function imagesMissingAlt(html: string): string[] {
  const out: string[] = [];

  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    if (/\balt\s*=/i.test(tag)) continue;
    const src = tag.match(/\bsrc\s*=\s*["']([^"']*)["']/i)?.[1];
    out.push(src ?? '(no src)');
  }

  return out;
}

/**
 * A sentence naming the images that need alt text, or null when none do.
 *
 * Here rather than in the admin so posts and pages word it identically, and so
 * the phrasing is tested once.
 */
export function altTextWarning(html: string): string | null {
  const missing = imagesMissingAlt(html);
  if (missing.length === 0) return null;

  const shown = missing.slice(0, 3).map((src) => src.split('/').pop() || src);
  const rest = missing.length - shown.length;

  return (
    `${missing.length} image${missing.length === 1 ? '' : 's'} ` +
    `${missing.length === 1 ? 'has' : 'have'} no alt text: ` +
    `${shown.join(', ')}${rest > 0 ? ` and ${rest} more` : ''}. ` +
    `Add it in the Media library, or set alt="" if the image is decorative.`
  );
}
