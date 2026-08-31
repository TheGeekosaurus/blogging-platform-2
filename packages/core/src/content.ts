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
