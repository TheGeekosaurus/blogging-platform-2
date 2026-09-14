import sanitizeHtml from 'sanitize-html';

/**
 * HTML sanitisation.
 *
 * This runs on WRITE — in the importer today, in the admin's Server Actions from
 * phase 4 — never on read. `posts.content_html` is therefore already safe, and
 * the public renderer echoes it straight out with no per-request cost.
 *
 * The consequence to remember: widening this allowlist does NOT retroactively
 * un-strip existing content. Re-derive from `posts.original_html` after a change.
 */

/** Embed providers allowed to appear in an <iframe>. */
/**
 * URL schemes a link may use.
 *
 * Exported because the EDITOR has to agree with it. A link the sanitiser
 * refuses is not a broken link, it is a silently deleted one: the mark is
 * stripped on save and the author sees their text un-linked with nothing
 * explaining why. The admin's link editor validates against this same list, so
 * the rejection happens while they are typing instead.
 */
export const LINK_SCHEMES = ['http', 'https', 'mailto', 'tel'] as const;

/**
 * Turn what someone typed into a storable href.
 *
 * Accepts the shapes people actually paste — a bare domain, a path, an anchor,
 * an email address — and rejects anything the sanitiser would strip rather than
 * letting it through to be deleted later.
 */
export function normaliseLinkHref(
  input: string,
): { ok: true; href: string } | { ok: false; error: string } {
  const raw = input.trim();
  if (!raw) return { ok: false, error: 'Enter a URL.' };

  // Relative destinations are legitimate and have no scheme to check: an
  // internal link, or an anchor within the same post.
  if (raw.startsWith('/') || raw.startsWith('#')) return { ok: true, href: raw };

  const scheme = raw.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();

  if (scheme) {
    if ((LINK_SCHEMES as readonly string[]).includes(scheme)) return { ok: true, href: raw };
    return {
      ok: false,
      error:
        `Links cannot use "${scheme}:". Allowed: ` +
        `${LINK_SCHEMES.join(', ')} — anything else is removed when the post saves.`,
    };
  }

  // An email address with no scheme is the one ambiguous case, and mailto: is
  // what someone typing one into a link field means.
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return { ok: true, href: `mailto:${raw}` };

  // Everything else with no scheme is a bare domain or domain/path. https,
  // not http: defaulting to the insecure one in 2026 would be a choice.
  return { ok: true, href: `https://${raw}` };
}

const ALLOWED_IFRAME_HOSTNAMES = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'player.vimeo.com',
  'w.soundcloud.com',
  'open.spotify.com',
  'codepen.io',
  'gist.github.com',
];

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    // Structure
    'p', 'div', 'section', 'article', 'aside', 'header', 'footer', 'hr', 'br',
    // Headings — h1 is intentionally excluded; the page template owns the h1.
    'h2', 'h3', 'h4', 'h5', 'h6',
    // Text level
    'a', 'em', 'strong', 'b', 'i', 'u', 's', 'del', 'ins', 'mark', 'small',
    'sub', 'sup', 'span', 'abbr', 'cite', 'q', 'time',
    // Lists
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    // Block
    'blockquote', 'pre', 'code', 'kbd', 'samp', 'var',
    // Media
    'img', 'figure', 'figcaption', 'picture', 'source', 'iframe',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  ],

  allowedAttributes: {
    a: ['href', 'name', 'target', 'rel', 'title'],
    img: ['src', 'srcset', 'sizes', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
    source: ['src', 'srcset', 'sizes', 'type', 'media'],
    iframe: ['src', 'width', 'height', 'title', 'allow', 'allowfullscreen', 'loading', 'frameborder'],
    time: ['datetime'],
    abbr: ['title'],
    q: ['cite'],
    blockquote: ['cite'],
    th: ['scope', 'colspan', 'rowspan'],
    td: ['colspan', 'rowspan'],
    col: ['span'],
    colgroup: ['span'],
    ol: ['start', 'reversed', 'type'],
    // `class` is allowed on these because WordPress content and our own
    // transforms lean on classes for alignment and code highlighting. It carries
    // no script risk; the CSS simply ignores classes it does not know.
    '*': ['class', 'id', 'lang', 'dir'],
  },

  // javascript: and data: are absent by design. `data:` on <img> is excluded too:
  // WordPress never emits it, and permitting it invites megabyte-scale inline
  // payloads in the content column.
  allowedSchemes: [...LINK_SCHEMES],
  allowedSchemesAppliedToAttributes: ['href', 'src', 'cite', 'srcset'],
  // Protocol-relative and root-relative URLs must keep working — internal links
  // rewritten off the old WordPress domain become `/some-post`.
  allowProtocolRelative: false,

  allowedIframeHostnames: ALLOWED_IFRAME_HOSTNAMES,
  allowIframeRelativeUrls: false,

  // Anything not allowed is dropped entirely rather than escaped and shown.
  disallowedTagsMode: 'discard',
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],

  transformTags: {
    // External links get rel="noopener noreferrer" — without noopener the target
    // page can reach back through window.opener.
    a: (tagName, attribs) => {
      const href = attribs.href ?? '';
      const isExternal = /^https?:\/\//i.test(href);
      if (!isExternal) {
        return { tagName, attribs };
      }
      return {
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      };
    },
    // Lazy-load images below the fold. The featured image is rendered by the
    // page template with next/image and priority, so everything inside the body
    // is genuinely below the fold.
    img: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: 'lazy', decoding: 'async' },
    }),
    iframe: (tagName, attribs) => ({
      tagName,
      attribs: { ...attribs, loading: 'lazy' },
    }),
  },

  /**
   * Drop elements that lost the attribute that gave them meaning.
   *
   * When an <iframe> points at a host outside ALLOWED_IFRAME_HOSTNAMES,
   * sanitize-html removes the `src` but keeps the element — leaving an empty
   * `<iframe></iframe>` shell that renders as a blank box. Same for images.
   * Returning true removes the element entirely.
   */
  exclusiveFilter: (frame) => {
    if (frame.tag === 'iframe' && !frame.attribs.src) return true;
    if (frame.tag === 'img' && !frame.attribs.src && !frame.attribs.srcset) return true;
    return false;
  },
};

/**
 * PAGE sanitisation — a deliberately looser profile than posts.
 *
 * Why two profiles. Post content can arrive from an untrusted WordPress export,
 * so it gets the strict allowlist above. Page content is authored only by site
 * admins (enforced by RLS) and is often a marketing layout with its own CSS —
 * pushed through the post profile it loses `<style>` and comes out looking like
 * a blog post.
 *
 * The trust model here is explicitly WordPress's: an admin authoring a page is
 * equivalent to shipping code. What is still NOT negotiable is script execution
 * — `<script>`, `on*` handlers and `javascript:` URLs are stripped exactly as
 * for posts. `<style>` is permitted because CSS cannot execute script in a
 * modern browser.
 */
const PAGE_OPTIONS: sanitizeHtml.IOptions = {
  ...OPTIONS,
  allowedTags: [
    ...(OPTIONS.allowedTags as string[]),
    // Layout and semantic elements a landing page needs.
    'style', 'main', 'nav', 'button', 'label', 'svg', 'path', 'g', 'circle',
    'rect', 'line', 'polyline', 'polygon', 'defs', 'use', 'symbol', 'title',
    'video', 'audio', 'track', 'details', 'summary', 'hgroup', 'h1',
  ],
  allowedAttributes: {
    ...(OPTIONS.allowedAttributes as Record<string, string[]>),
    // Inline styles are how an exported layout carries its design.
    '*': ['class', 'id', 'lang', 'dir', 'style', 'role', 'title', 'aria-label',
          'aria-hidden', 'aria-labelledby', 'aria-describedby', 'data-*'],
    svg: ['viewbox', 'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width',
          'width', 'height', 'preserveaspectratio'],
    path: ['d', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'],
    circle: ['cx', 'cy', 'r', 'fill', 'stroke', 'stroke-width'],
    rect: ['x', 'y', 'width', 'height', 'rx', 'ry', 'fill', 'stroke'],
    line: ['x1', 'y1', 'x2', 'y2', 'stroke', 'stroke-width'],
    polyline: ['points', 'fill', 'stroke', 'stroke-width'],
    polygon: ['points', 'fill', 'stroke', 'stroke-width'],
    video: ['src', 'poster', 'controls', 'autoplay', 'muted', 'loop', 'playsinline', 'width', 'height'],
    audio: ['src', 'controls', 'loop'],
    source: ['src', 'srcset', 'sizes', 'type', 'media'],
    button: ['type', 'disabled'],
    label: ['for'],
  },
  // `style` must be dropped from nonTextTags or its CSS would be discarded as
  // text rather than kept as a stylesheet.
  nonTextTags: ['script', 'textarea', 'option', 'noscript'],
};

/** Sanitise page HTML. See PAGE_OPTIONS for why this differs from posts. */
export function sanitizePageHtml(dirty: string): string {
  if (!dirty) return '';
  return sanitizeHtml(dirty, PAGE_OPTIONS);
}

/** Sanitise post body HTML. Safe to render with dangerouslySetInnerHTML. */
export function sanitizePostHtml(dirty: string): string {
  if (!dirty) return '';
  return sanitizeHtml(dirty, OPTIONS);
}

/**
 * Strip every tag, for excerpts and meta descriptions.
 * Also collapses whitespace and decodes the handful of entities that matter.
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  const stripped = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} });
  return stripped
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

/** Truncate on a word boundary, for generated excerpts. */
export function truncateWords(text: string, maxChars = 160): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export { ALLOWED_IFRAME_HOSTNAMES };
