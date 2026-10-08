/**
 * Splitting a post body around its in-content CTA markers.
 *
 * An author drops a CTA block into the body in the editor; what is stored is an
 * empty div carrying the block's slug:
 *
 *   <div data-cta="blended-rate-calculator"></div>
 *
 * The renderer has to turn that into a React component rather than HTML — the
 * email variant owns a form and a success state — so the body cannot be one
 * `dangerouslySetInnerHTML` any more. This splits it into the runs of HTML
 * between the markers and the markers themselves.
 *
 * REGEX, NOT A PARSER, and the same bargain `headings.ts` and `links.ts` make:
 * this runs on SANITISED html, which sanitize-html re-serialises from a parsed
 * tree, so tags are well-formed and attribute values are quoted. Do not point
 * it at arbitrary input.
 */

/**
 * The marker.
 *
 * Attribute order is not guessed at: sanitize-html emits the attributes it kept
 * in source order, and `data-cta` is the only one allowed on a div in the post
 * profile, so there is nothing to sit beside it. The inner match tolerates
 * whitespace because an editor may pretty-print, and the slug charset is the
 * one `lead_magnets_slug_format` enforces.
 */
const CTA_RE = /<div\s+data-cta=["']([a-z0-9]+(?:-[a-z0-9]+)*)["']\s*>\s*<\/div>/gi;

export type BodySegment =
  | { kind: 'html'; html: string }
  | { kind: 'cta'; slug: string };

/**
 * Split a body into renderable segments, in document order.
 *
 * Empty HTML runs are dropped — two adjacent markers, or a marker at the very
 * start or end, would otherwise produce segments that render an empty div and
 * contribute nothing but a key to chase.
 */
export function splitBodyIntoBlocks(html: string): BodySegment[] {
  if (!html) return [];

  const out: BodySegment[] = [];
  let last = 0;

  // `matchAll` rather than a stateful `exec` loop: CTA_RE is a module-level
  // /g regex, and `lastIndex` leaking between calls is the classic way for the
  // second post on a page to lose its blocks.
  for (const match of html.matchAll(CTA_RE)) {
    const slug = match[1] ?? '';

    /*
     * The `i` flag is for the TAG and attribute name, not the value.
     *
     * Sanitised HTML has lowercase tags, but being strict about that would
     * mean a block silently vanishing if that ever stopped being true — the
     * wrong direction to fail in. The slug is the other way round: it is a
     * database key constrained to lowercase, so anything else is not a
     * reference to a block and belongs in the prose it was typed into.
     * `continue` without advancing `last`, so it stays in the next HTML run.
     */
    if (slug !== slug.toLowerCase()) continue;

    const before = html.slice(last, match.index);
    if (before.trim()) out.push({ kind: 'html', html: before });
    out.push({ kind: 'cta', slug });
    last = match.index + match[0].length;
  }

  const rest = html.slice(last);
  if (rest.trim()) out.push({ kind: 'html', html: rest });

  return out;
}

/**
 * Every distinct block slug a body references, in first-appearance order.
 *
 * Distinct, because one block may legitimately appear twice in a long post and
 * that is one row to fetch, not two.
 */
export function ctaSlugsIn(html: string): string[] {
  const seen = new Set<string>();
  for (const segment of splitBodyIntoBlocks(html)) {
    if (segment.kind === 'cta') seen.add(segment.slug);
  }
  return [...seen];
}

/** What the editor writes, and therefore the one place the shape is spelled. */
export function ctaMarker(slug: string): string {
  return `<div data-cta="${slug}"></div>`;
}
