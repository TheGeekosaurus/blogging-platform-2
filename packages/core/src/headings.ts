import { htmlToPlainText } from './sanitize';
import { slugify } from './urls';

/**
 * Heading extraction, for a post's table of contents.
 *
 * Anchors have to be added at RENDER time rather than stored. `id` is not in the
 * sanitiser's allowedAttributes (see sanitize.ts), so no `id` survives a write —
 * and widening the allowlist would mean re-deriving every existing post from
 * `original_html` to backfill them, for a purely presentational feature. Both
 * functions here run at build/revalidation time, so a visitor request pays
 * nothing for them.
 *
 * Both walk the same regex over the same input, so a heading's generated id is
 * identical whichever function produced it — which is what makes the links land.
 */

export interface Heading {
  /** Anchor target, unique within the document. */
  id: string;
  text: string;
  level: 2 | 3;
}

/*
 * h2 and h3 only. h4-h6 are permitted by the sanitiser but a contents list
 * four levels deep is noise, and the design's list is visually flat.
 *
 * Safe against sanitised HTML specifically: sanitize-html re-serialises its
 * output from a parsed tree, so tags are well-formed and attribute values are
 * quoted. This is not a general-purpose HTML parser and should not be pointed at
 * arbitrary input.
 */
const HEADING_RE = /<(h[23])(\s[^>]*)?>([\s\S]*?)<\/\1>/gi;

function uniqueId(base: string, seen: Map<string, number>): string {
  const fallback = base || 'section';
  const count = seen.get(fallback) ?? 0;
  seen.set(fallback, count + 1);
  return count === 0 ? fallback : `${fallback}-${count + 1}`;
}

/** The headings in a post body, in document order. */
export function extractHeadings(html: string): Heading[] {
  if (!html) return [];

  const seen = new Map<string, number>();
  const out: Heading[] = [];

  for (const match of html.matchAll(HEADING_RE)) {
    const tag = match[1]?.toLowerCase();
    const inner = match[3] ?? '';

    // Headings can contain markup — <h2>The <em>real</em> cost</h2> — so the
    // label comes from the text content, not the raw inner HTML.
    const text = htmlToPlainText(inner);
    if (!text) continue;

    out.push({
      id: uniqueId(slugify(text), seen),
      text,
      level: tag === 'h3' ? 3 : 2,
    });
  }

  return out;
}

/**
 * The same HTML with an `id` on every h2/h3, matching `extractHeadings`.
 *
 * A heading that already carries an id keeps it, so this stays idempotent — it
 * must be, since content can be re-rendered without being re-sanitised.
 */
export function injectHeadingIds(html: string): string {
  if (!html) return html;

  const seen = new Map<string, number>();

  return html.replace(HEADING_RE, (whole, tag: string, attrs: string | undefined, inner: string) => {
    const text = htmlToPlainText(inner);
    if (!text) return whole;

    const existing = attrs?.match(/\sid=["']([^"']*)["']/i);
    if (existing) {
      // Claim the id so a later heading cannot generate a colliding one.
      seen.set(existing[1] ?? '', 1);
      return whole;
    }

    const id = uniqueId(slugify(text), seen);
    return `<${tag}${attrs ?? ''} id="${id}">${inner}</${tag}>`;
  });
}

export interface HeadingGroup {
  /** The h2 that opens the section — or an h3 with no h2 before it. */
  heading: Heading;
  /** The h3s between this heading and the next h2. Often empty. */
  children: Heading[];
}

/**
 * The flat heading list as h2 sections with their h3s nested underneath.
 *
 * Separate from `extractHeadings` rather than replacing its return type. The
 * flat list is the honest shape of a document — headings are a sequence, not a
 * tree — and several callers (and a thorough test file) depend on it. Grouping
 * is a presentation concern, so it lives in its own function.
 *
 * Total by construction: an h3 that appears before any h2 becomes a childless
 * group of its own rather than being dropped. A post whose author started at h3
 * still gets a complete contents list instead of a mysteriously short one.
 */
export function groupHeadings(headings: Heading[]): HeadingGroup[] {
  const out: HeadingGroup[] = [];

  for (const heading of headings) {
    const open = out[out.length - 1];

    // An h3 attaches to the open h2. With no h2 yet — or when the open group is
    // itself an orphaned h3 — it starts a group instead, so nothing is lost.
    if (heading.level === 3 && open && open.heading.level === 2) {
      open.children.push(heading);
      continue;
    }

    out.push({ heading, children: [] });
  }

  return out;
}
