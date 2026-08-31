import { htmlToPlainText, sanitizePostHtml, truncateWords } from '@blog/core';

/**
 * WordPress content transforms.
 *
 * `content:encoded` in a WXR export is the RAW editor content, not what a
 * visitor sees. WordPress applies a stack of filters at render time that we have
 * to reproduce here — otherwise Classic-editor posts arrive as one giant
 * paragraph and Gutenberg posts arrive full of HTML comments.
 *
 * Order matters. Each step assumes the previous one has run.
 */

export interface TransformOptions {
  /** Old site origin, e.g. `https://oldblog.com`. Internal links become relative. */
  oldDomain?: string;
}

export interface TransformResult {
  html: string;
  /** Excerpt derived from a <!--more--> split, if there was one. */
  excerptFromMore: string | null;
  /** Shortcode names that were dropped, for the import report. */
  droppedShortcodes: string[];
}

const BLOCK_LEVEL_TAGS = [
  'address', 'article', 'aside', 'blockquote', 'details', 'div', 'dl', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'header', 'hr', 'iframe', 'li', 'main', 'nav', 'ol', 'p', 'pre', 'section',
  'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'ul',
];

/**
 * Remove Gutenberg block delimiters: `<!-- wp:paragraph -->`, `<!-- /wp:list -->`,
 * and self-closing ones like `<!-- wp:spacer {"height":20} /-->`.
 *
 * The inner HTML they wrap is real content and is left alone.
 */
export function stripGutenbergComments(html: string): string {
  return html.replace(/<!--\s*\/?wp:[\s\S]*?-->/g, '');
}

/**
 * Split on the WordPress more-tag. Accepts `<!--more-->` and the labelled
 * `<!--more Continue reading-->` form.
 */
export function splitMoreTag(html: string): { before: string; after: string; found: boolean } {
  const match = html.match(/<!--\s*more(?:\s[^>]*?)?\s*-->/i);
  if (!match || match.index === undefined) {
    return { before: html, after: '', found: false };
  }
  return {
    before: html.slice(0, match.index),
    after: html.slice(match.index + match[0].length),
    found: true,
  };
}

/**
 * Convert `[caption]` into semantic markup.
 *
 * `[caption id="x" align="alignnone" width="300"]<img src="..."/> Some text[/caption]`
 * becomes `<figure><img src="..."/><figcaption>Some text</figcaption></figure>`.
 *
 * The caption text is whatever follows the image or link inside the shortcode,
 * which is exactly how WordPress itself parses it.
 */
export function unwrapCaptionShortcode(html: string): string {
  return html.replace(
    /\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/gi,
    (_full, inner: string) => {
      const trimmed = inner.trim();
      // The leading element is the image, optionally wrapped in a link.
      const leading = trimmed.match(/^((?:<a\b[^>]*>\s*)?<img\b[^>]*\/?>(?:\s*<\/a>)?)/i);

      if (!leading?.[1]) {
        return `<figure>${trimmed}</figure>`;
      }

      const media = leading[1];
      const caption = trimmed.slice(media.length).trim();

      return caption
        ? `<figure>${media}<figcaption>${caption}</figcaption></figure>`
        : `<figure>${media}</figure>`;
    },
  );
}

/**
 * Drop remaining shortcodes, recording their names.
 *
 * These are plugin-provided ([gallery], [contact-form], [embed]…) and there is no
 * honest way to render them without the plugin. Dropping them and REPORTING the
 * drop is better than leaving raw `[gallery ids="1,2"]` text visible on the page,
 * which is what happens if you do nothing.
 *
 * `[embed]` is a special case: it wraps a bare URL, so the URL is kept as a link.
 */
export function stripShortcodes(html: string): { html: string; dropped: string[] } {
  const dropped = new Set<string>();

  // Paired shortcodes, e.g. [gallery]...[/gallery]
  let out = html.replace(
    /\[([a-z][a-z0-9_-]*)((?:\s[^\]]*)?)\]([\s\S]*?)\[\/\1\]/gi,
    (_full, name: string, _attrs: string, inner: string) => {
      const lower = name.toLowerCase();
      if (lower === 'caption') return _full as string; // already handled upstream
      dropped.add(lower);
      if (lower === 'embed') {
        const url = inner.trim();
        return /^https?:\/\/\S+$/.test(url) ? `<p><a href="${url}">${url}</a></p>` : '';
      }
      return '';
    },
  );

  // Self-closing shortcodes, e.g. [gallery ids="1,2"]
  out = out.replace(
    /\[([a-z][a-z0-9_-]*)((?:\s[^\]]*)?)\/?\]/gi,
    (full, name: string) => {
      const lower = name.toLowerCase();
      // Leave anything that looks like ordinary prose in brackets alone.
      if (lower === 'caption') return full as string;
      dropped.add(lower);
      return '';
    },
  );

  return { html: out, dropped: [...dropped] };
}

/**
 * WordPress's wpautop, applied only when needed.
 *
 * Classic-editor content stores bare newlines and no `<p>` tags; WordPress adds
 * them at render time. Gutenberg content already has real markup, so running
 * this over it would double-wrap. The heuristic is whether any block-level tag
 * is present.
 */
export function wpautop(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return '';

  const blockPattern = new RegExp(`<(${BLOCK_LEVEL_TAGS.join('|')})\\b`, 'i');
  if (blockPattern.test(trimmed)) {
    return trimmed;
  }

  return trimmed
    .split(/\n\s*\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => `<p>${chunk.replace(/\n/g, '<br />')}</p>`)
    .join('\n');
}

/**
 * Point links and images at this site instead of the old WordPress domain.
 *
 * Without this, every internal link in imported content keeps sending readers
 * back to the site being replaced. Media URLs are left absolute: the images still
 * live on the old host until they are re-uploaded, so rewriting them to relative
 * paths would break them immediately.
 */
export function rewriteInternalUrls(html: string, oldDomain?: string): string {
  if (!oldDomain) return html;

  let origin: string;
  try {
    origin = new URL(oldDomain).origin;
  } catch {
    return html;
  }

  const escaped = origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Only href targets, and not anything under wp-content (uploads/media).
  const pattern = new RegExp(`href=(["'])${escaped}(?!/wp-content)(/[^"']*|)\\1`, 'gi');

  return html.replace(pattern, (_full, quote: string, path: string) => {
    return `href=${quote}${path || '/'}${quote}`;
  });
}

/** Run the full pipeline and sanitise the result. */
export function transformWordPressContent(
  rawHtml: string,
  options: TransformOptions = {},
): TransformResult {
  const source = rawHtml ?? '';

  // The more-tag is found before Gutenberg comments are stripped, because the
  // stripper's `<!--` pattern would otherwise be a hazard to reason about.
  const { before, after, found } = splitMoreTag(source);

  const process = (fragment: string) => {
    let out = stripGutenbergComments(fragment);
    out = unwrapCaptionShortcode(out);
    const shortcodeResult = stripShortcodes(out);
    out = wpautop(shortcodeResult.html);
    out = rewriteInternalUrls(out, options.oldDomain);
    return { html: out, dropped: shortcodeResult.dropped };
  };

  const head = process(before);
  const tail = found ? process(after) : { html: '', dropped: [] as string[] };

  const combined = [head.html, tail.html].filter(Boolean).join('\n');
  const dropped = [...new Set([...head.dropped, ...tail.dropped])];

  return {
    html: sanitizePostHtml(combined),
    excerptFromMore: found ? truncateWords(htmlToPlainText(head.html), 300) || null : null,
    droppedShortcodes: dropped,
  };
}
