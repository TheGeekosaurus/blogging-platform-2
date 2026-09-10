import { codedRoutesFor } from './coded-routes';
import type { PostStatus, RedirectRow, SiteRow, TermRow } from './database.types';
import { extractHeadings } from './headings';
import { isLive } from './queries';
import { htmlToPlainText } from './sanitize';
import { blogIndexPath, browsePath, categoryPath, tagPath } from './urls';

/**
 * The link graph: which piece of content points at which.
 *
 * This exists so the admin can answer three questions it otherwise cannot —
 * what does this post link to, what links back to it, and which of those links
 * are broken. All three are read straight out of `content_html` rather than
 * from a stored link table, and everything in this file is pure: no database,
 * no network, no environment.
 *
 * WHY NOT A STORED TABLE. Rank Math keeps a link table updated on save. That
 * scales better and is the obvious upgrade path if a site ever outgrows this,
 * but it has a failure mode that matters here: `tools/wp-import` writes posts
 * straight into Postgres without going through the admin, so a save-time table
 * would be empty — or worse, stale — immediately after the one event that
 * produces thousands of links at once. Deriving from the body cannot go stale.
 * The cost is one full read of every body per view of the Links screen, which
 * is a single-editor admin page, not a visitor request.
 *
 * NO HTTP CHECKING. An external link's status is `unchecked`, honestly: proving
 * a third-party URL is alive needs a queue, retries and a rate limiter, none of
 * which a request-scoped page render can host. Every INTERNAL link is checked,
 * exhaustively, because that only needs data already in hand — and internal
 * 404s are the ones the site owner actually put there.
 */

// ---------------------------------------------------------------------------
// Extraction
// ---------------------------------------------------------------------------

/**
 * Anchors, and the attribute tokeniser they are read with.
 *
 * Safe against SANITISED html specifically — sanitize-html re-serialises from a
 * parsed tree, so tags are well-formed and attribute values are quoted. This is
 * the same bargain `headings.ts` makes and it comes with the same warning: not a
 * general-purpose HTML parser, do not point it at arbitrary input.
 *
 * Anchors cannot legally nest, so the lazy body match cannot swallow a sibling.
 */
const ANCHOR_RE = /<a(\s[^>]*)?>([\s\S]*?)<\/a>/gi;
const ATTR_RE =
  /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/g;

/** `id` and `name` values, for checking that a `#fragment` lands somewhere. */
const ID_RE = /\s(?:id|name)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

/**
 * Entities inside an attribute value.
 *
 * `&amp;` is the one that actually shows up — a query string with two
 * parameters is serialised that way — and an href compared without decoding it
 * would never match the URL a browser requests.
 */
function decodeAttribute(value: string): string {
  return value
    .replace(/&(?:amp|AMP);/g, '&')
    .replace(/&(?:quot|QUOT);/g, '"')
    .replace(/&(?:apos|#39);/g, "'")
    .replace(/&(?:lt|LT);/g, '<')
    .replace(/&(?:gt|GT);/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)));
}

function parseAttributes(source: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of source.matchAll(ATTR_RE)) {
    const name = match[1]?.toLowerCase();
    if (!name) continue;
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    // First occurrence wins, as a browser does with a duplicated attribute.
    if (!(name in out)) out[name] = decodeAttribute(value);
  }
  return out;
}

export interface ExtractedLink {
  /** The href as authored, entities decoded. */
  href: string;
  /** Anchor text with tags stripped. Empty for an image-only link. */
  text: string;
  /** The whole `rel` value, or null. */
  rel: string | null;
  nofollow: boolean;
}

/** Every `<a href>` in a body, in document order. */
export function extractLinks(html: string): ExtractedLink[] {
  if (!html) return [];

  const out: ExtractedLink[] = [];

  for (const match of html.matchAll(ANCHOR_RE)) {
    const attrs = parseAttributes(match[1] ?? '');
    const href = attrs.href?.trim();
    // `<a name="section">` is an anchor TARGET, not a link. The sanitiser keeps
    // it (WordPress content is full of them) and it has no destination.
    if (!href) continue;

    const rel = attrs.rel?.trim() || null;

    out.push({
      href,
      // Anchor text can carry markup — <a><strong>Read this</strong></a> — so
      // the label comes from the text content, not the inner HTML.
      text: htmlToPlainText(match[2] ?? ''),
      rel,
      nofollow: /(?:^|\s)nofollow(?:\s|$)/i.test(rel ?? ''),
    });
  }

  return out;
}

/**
 * Fragment targets a `#link` in this same document could reach.
 *
 * Two sources, and both are needed. Explicit `id`/`name` attributes survive
 * sanitisation (`id` is in the allowlist). Heading ids do NOT: `headings.ts`
 * adds them at render time, so a link to `#the-real-cost` points at an id that
 * exists on the live page and nowhere in the stored HTML. Checking only the
 * stored attributes would report every table-of-contents link as broken.
 */
function fragmentTargets(html: string): Set<string> {
  const ids = new Set<string>();

  for (const match of html.matchAll(ID_RE)) {
    const value = (match[1] ?? match[2] ?? '').trim();
    if (value) ids.add(value);
  }
  for (const heading of extractHeadings(html)) {
    ids.add(heading.id);
  }

  return ids;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

/** The "link type" column: what sort of destination an href names. */
export type LinkKind = 'internal' | 'external' | 'anchor' | 'email' | 'phone' | 'other';

export interface ClassifiedLink {
  kind: LinkKind;
  /**
   * Site path for an internal link: leading slash, no trailing slash, query and
   * fragment dropped. Null for every other kind.
   */
  path: string | null;
  /** The fragment on an internal or anchor link, without the '#'. */
  fragment: string | null;
  /** Absolute URL where one can be formed, otherwise the raw href. */
  url: string;
  /** Host of an external link, so the UI can group by domain. Null otherwise. */
  hostname: string | null;
}

/**
 * A comparable form of a path.
 *
 * The blog sets `trailingSlash: true`, so `/about` and `/about/` are the same
 * page and must not read as two destinations. Case is deliberately preserved:
 * Next's routing is case-sensitive, so `/Blog/foo` really does 404 and saying
 * so is the point of this module.
 */
export function normalisePath(pathname: string): string {
  let decoded = pathname;
  try {
    decoded = decodeURI(pathname);
  } catch {
    // A malformed escape is not a reason to lose the link; compare it raw.
  }

  const trimmed = decoded.replace(/\/+$/, '');
  if (!trimmed) return '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/** `www.` is not a different site. Content migrated off WordPress mixes both. */
function bareHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, '');
}

const NOT_A_URL = (href: string, kind: LinkKind): ClassifiedLink => ({
  kind,
  path: null,
  fragment: null,
  url: href,
  hostname: null,
});

/**
 * What kind of destination an href names, relative to one site.
 *
 * `base_url` is treated as an origin. A site served from a sub-path would need
 * that prefix stripped here; none is, and the deployment model — one Vercel
 * project per blog, one domain each — is why.
 */
export function classifyLink(
  href: string,
  site: Pick<SiteRow, 'base_url'>,
): ClassifiedLink {
  const raw = href.trim();
  if (!raw) return NOT_A_URL(href, 'other');

  if (raw.startsWith('#')) {
    return {
      kind: 'anchor',
      path: null,
      fragment: raw.slice(1) || null,
      url: raw,
      hostname: null,
    };
  }

  /*
   * Read the scheme before handing the string to URL(). `mailto:` and `tel:`
   * parse fine but have no host or pathname worth reporting, and the sanitiser
   * allows both — an author's contact link must not show up as "broken".
   */
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(raw)?.[1]?.toLowerCase();
  if (scheme === 'mailto') return NOT_A_URL(raw, 'email');
  if (scheme === 'tel') return NOT_A_URL(raw, 'phone');
  if (scheme && scheme !== 'http' && scheme !== 'https') return NOT_A_URL(raw, 'other');

  let base: URL;
  try {
    base = new URL(site.base_url);
  } catch {
    // A site row with an unparseable base_url cannot tell internal from
    // external. Everything absolute becomes external, which is the safe read.
    base = new URL('https://invalid.invalid');
  }

  let url: URL;
  try {
    url = new URL(raw, base);
  } catch {
    return NOT_A_URL(raw, 'other');
  }

  const fragment = url.hash ? url.hash.slice(1) : null;

  if (bareHost(url.hostname) !== bareHost(base.hostname)) {
    return {
      kind: 'external',
      path: null,
      fragment,
      url: url.toString(),
      hostname: url.hostname,
    };
  }

  return {
    kind: 'internal',
    path: normalisePath(url.pathname),
    fragment,
    url: url.toString(),
    hostname: null,
  };
}

// ---------------------------------------------------------------------------
// The graph
// ---------------------------------------------------------------------------

/** A post or page, as the graph refers to it. */
export interface ContentNode {
  id: string;
  kind: 'post' | 'page';
  title: string;
  /** Public path — `postPath(slug)` or `pagePath(page.path)`, normalised. */
  path: string;
  status: PostStatus;
  published_at: string | null;
}

/** A node plus the body its links are read from. */
export interface LinkSource extends ContentNode {
  content_html: string;
}

/**
 * What an internal link actually reaches.
 *
 * `content` is the interesting one — the rest exist so that a link to /blog, to
 * a category archive or to a coded marketing page is reported as fine rather
 * than as a 404, which is the difference between a screen worth opening and a
 * wall of false positives.
 */
export type Destination =
  | { kind: 'content'; label: string; path: string; node: ContentNode }
  | { kind: 'coded'; label: string; path: string }
  | { kind: 'archive'; label: string; path: string }
  | { kind: 'file'; label: string; path: string }
  | { kind: 'redirect'; label: string; path: string; to: string }
  | {
      kind: 'missing';
      label: string;
      path: string;
      /** A path that exists and looks like what was meant. See suggestFor(). */
      suggestion: string | null;
    };

/**
 * `unchecked` is only ever an external link, or an email or phone one. Every
 * internal link gets a real verdict.
 */
export type LinkStatus = 'ok' | 'unpublished' | 'redirect' | 'missing' | 'unchecked';

export interface ContentLink {
  source: ContentNode;
  /** The href as authored. */
  href: string;
  /** Absolute URL where one could be formed, for display. */
  url: string;
  text: string;
  kind: LinkKind;
  status: LinkStatus;
  hostname: string | null;
  nofollow: boolean;
  /** Where an internal link lands. Null for every other kind. */
  target: Destination | null;
  /** How many times this exact href appears in this body. */
  occurrences: number;
}

export interface NodeLinkStats {
  node: ContentNode;
  /** Anchor occurrences, not distinct destinations. */
  internalOut: number;
  externalOut: number;
  /** Internal links that resolve to nothing — real 404s. */
  brokenOut: number;
  /** Internal links that land on a page a visitor cannot see yet. */
  unpublishedOut: number;
  /** Internal links that take a redirect hop instead of going straight there. */
  redirectOut: number;
  /** Distinct OTHER content items linking here. */
  incoming: number;
  /** Of those, the ones a crawler can actually follow. */
  incomingLive: number;
  /** Nothing links here. The reason this screen exists. */
  orphan: boolean;
}

export interface LinkGraph {
  nodes: NodeLinkStats[];
  links: ContentLink[];
  totals: {
    contentItems: number;
    links: number;
    internal: number;
    external: number;
    broken: number;
    unpublished: number;
    redirects: number;
    orphans: number;
  };
}

export interface LinkGraphInput {
  site: Pick<SiteRow, 'slug' | 'base_url'>;
  /** Every post and page, drafts included — the admin's whole point. */
  sources: LinkSource[];
  /** Category and tag archives, so a link to one is not reported missing. */
  terms?: ReadonlyArray<Pick<TermRow, 'kind' | 'slug' | 'name'>>;
  /** Build-time redirects, so a link through one is reported as a hop. */
  redirects?: ReadonlyArray<Pick<RedirectRow, 'from_path' | 'to_path'>>;
}

/** Routes served by a file rather than by content. */
const FILE_ROUTES: ReadonlyArray<{ path: string; label: string }> = [
  { path: '/feed.xml', label: 'RSS feed' },
  { path: '/sitemap.xml', label: 'Sitemap' },
  { path: '/robots.txt', label: 'robots.txt' },
];

/** `/blog/page/2` and friends, which cannot be enumerated without a post count. */
const BLOG_PAGINATION_RE = /^\/blog\/page\/[1-9][0-9]*$/;

function toNode(source: LinkSource): ContentNode {
  const { content_html: _ignored, ...node } = source;
  return node;
}

/**
 * Everything this site serves, by path.
 *
 * Insertion order encodes Next's own precedence: content is reached through the
 * `[...path]` catch-all, and every static route — the archives, the feed, a
 * coded marketing page — is matched before it. So content goes in first and the
 * static routes overwrite it, which is what actually happens at request time if
 * a page is ever given a colliding path.
 */
function buildIndex(input: LinkGraphInput): Map<string, Destination> {
  const index = new Map<string, Destination>();

  for (const source of input.sources) {
    const node = toNode(source);
    index.set(normalisePath(source.path), {
      kind: 'content',
      label: source.title,
      path: normalisePath(source.path),
      node,
    });
  }

  const archives: Array<{ path: string; label: string }> = [
    { path: '/', label: 'Homepage' },
    { path: normalisePath(blogIndexPath()), label: 'Post index' },
    { path: normalisePath(browsePath()), label: 'All categories & tags' },
  ];

  for (const term of input.terms ?? []) {
    const path = term.kind === 'category' ? categoryPath(term.slug) : tagPath(term.slug);
    archives.push({
      path: normalisePath(path),
      label: `${term.name} (${term.kind})`,
    });
  }

  for (const archive of archives) {
    index.set(archive.path, { kind: 'archive', label: archive.label, path: archive.path });
  }
  for (const file of FILE_ROUTES) {
    index.set(file.path, { kind: 'file', label: file.label, path: file.path });
  }

  // Coded routes last: they are real files in apps/blog/app, so they win over
  // anything in the database — the same precedence the Pages screen states.
  for (const route of codedRoutesFor(input.site.slug)) {
    const path = normalisePath(`/${route.path}`);
    index.set(path, { kind: 'coded', label: route.title, path });
  }

  return index;
}

function buildRedirectIndex(
  redirects: LinkGraphInput['redirects'],
): Map<string, { from: string; to: string }> {
  const index = new Map<string, { from: string; to: string }>();
  for (const redirect of redirects ?? []) {
    index.set(normalisePath(redirect.from_path), {
      from: redirect.from_path,
      to: redirect.to_path,
    });
  }
  return index;
}

/**
 * Where an internal path lands.
 *
 * Redirects are checked FIRST because that is the order a request is served in:
 * `next.config.ts` emits them into the routing layer, which runs ahead of the
 * filesystem routes. A link to a redirect source therefore costs a hop even
 * when the path also exists as content, and reporting it as fine would hide
 * exactly the thing worth fixing.
 */
function resolvePath(
  path: string,
  index: Map<string, Destination>,
  redirects: Map<string, { from: string; to: string }>,
): Destination {
  const redirect = redirects.get(path);
  if (redirect) {
    return { kind: 'redirect', label: `→ ${redirect.to}`, path, to: redirect.to };
  }

  const known = index.get(path);
  if (known) return known;

  if (BLOG_PAGINATION_RE.test(path)) {
    return { kind: 'archive', label: 'Post index, paginated', path };
  }

  return { kind: 'missing', label: path, path, suggestion: suggestFor(path, index) };
}

/**
 * The path a broken link probably meant.
 *
 * This is here because of one specific, very common failure. WordPress serves
 * posts at the root — `/sba-loan-guide/` — and this site serves them under
 * `/blog/`. `rewriteInternalUrls` in the importer turns the old absolute URLs
 * into root-relative ones but cannot know about the prefix, so every internal
 * link in an imported corpus lands one directory too high. Reporting hundreds
 * of those as "broken" is accurate and nearly useless; reporting them as
 * "broken, try /blog/sba-loan-guide" is a work queue.
 *
 * Two guesses, most confident first: the same path under /blog, then any single
 * piece of content whose last path segment matches. A tie is no suggestion —
 * guessing between two candidates is worse than not guessing.
 */
function suggestFor(path: string, index: Map<string, Destination>): string | null {
  const prefixed = normalisePath(`/blog${path}`);
  if (index.has(prefixed)) return prefixed;

  const slug = path.split('/').filter(Boolean).pop();
  if (!slug) return null;

  const matches = [...index.values()].filter(
    (destination) =>
      destination.kind === 'content' &&
      destination.path.split('/').filter(Boolean).pop() === slug,
  );

  return matches.length === 1 ? (matches[0]?.path ?? null) : null;
}

function statusFor(target: Destination): LinkStatus {
  if (target.kind === 'missing') return 'missing';
  if (target.kind === 'redirect') return 'redirect';
  // Content that exists in the admin but is not served: a visitor following
  // this link gets a 404, and nothing else on the screen would say so.
  if (target.kind === 'content' && !isLive(target.node)) return 'unpublished';
  return 'ok';
}

/**
 * Read every body once and produce the whole graph.
 *
 * Rows are deduped per (source, href): a post that links the same URL from
 * three paragraphs is one row with `occurrences: 3` rather than three identical
 * rows. The count columns still sum occurrences, because "how many links does
 * this post carry" is a question about anchors.
 */
export function buildLinkGraph(input: LinkGraphInput): LinkGraph {
  const index = buildIndex(input);
  const redirects = buildRedirectIndex(input.redirects);

  const links: ContentLink[] = [];
  /** Distinct source ids per destination node id. */
  const incoming = new Map<string, Set<string>>();

  for (const source of input.sources) {
    const node = toNode(source);
    const anchors = fragmentTargets(source.content_html);
    const byHref = new Map<string, ContentLink>();

    for (const raw of extractLinks(source.content_html)) {
      const seen = byHref.get(raw.href);
      if (seen) {
        seen.occurrences += 1;
        continue;
      }

      const classified = classifyLink(raw.href, input.site);

      let target: Destination | null = null;
      let status: LinkStatus = 'unchecked';

      if (classified.kind === 'internal' && classified.path) {
        target = resolvePath(classified.path, index, redirects);
        status = statusFor(target);

        if (target.kind === 'content' && target.node.id !== source.id) {
          const sources = incoming.get(target.node.id) ?? new Set<string>();
          sources.add(source.id);
          incoming.set(target.node.id, sources);
        }
      } else if (classified.kind === 'anchor' && classified.fragment) {
        /*
         * A same-page jump is checkable and worth checking — a renamed heading
         * leaves the contents list pointing at nothing. Only the fragment of a
         * bare `#foo` is verified; a fragment on a link to ANOTHER page is
         * dropped, because verifying it would mean resolving ids across
         * documents for a link that already lands on the right page.
         */
        status = anchors.has(classified.fragment) ? 'ok' : 'missing';
      }

      const link: ContentLink = {
        source: node,
        href: raw.href,
        url: classified.url,
        text: raw.text,
        kind: classified.kind,
        status,
        hostname: classified.hostname,
        nofollow: raw.nofollow,
        target,
        occurrences: 1,
      };

      byHref.set(raw.href, link);
      links.push(link);
    }
  }

  /* Grouped once rather than filtered per node: a few hundred posts against a
   * few thousand links is the shape here, and the quadratic version of this was
   * the only part of the pass that could be felt. */
  const bySource = new Map<string, ContentLink[]>();
  for (const link of links) {
    const group = bySource.get(link.source.id);
    if (group) group.push(link);
    else bySource.set(link.source.id, [link]);
  }
  const liveById = new Map(input.sources.map((row) => [row.id, isLive(row)]));

  const nodes: NodeLinkStats[] = input.sources.map((source) => {
    const node = toNode(source);
    const own = bySource.get(source.id) ?? [];
    const sum = (predicate: (link: ContentLink) => boolean) =>
      own.reduce((total, link) => (predicate(link) ? total + link.occurrences : total), 0);

    const sources = incoming.get(source.id) ?? new Set<string>();
    const live = [...sources].filter((id) => liveById.get(id) === true);

    return {
      node,
      internalOut: sum((link) => link.kind === 'internal'),
      externalOut: sum((link) => link.kind === 'external'),
      brokenOut: sum((link) => link.status === 'missing'),
      unpublishedOut: sum((link) => link.status === 'unpublished'),
      redirectOut: sum((link) => link.status === 'redirect'),
      incoming: sources.size,
      incomingLive: live.length,
      orphan: sources.size === 0,
    };
  });

  nodes.sort((a, b) => a.node.path.localeCompare(b.node.path));
  links.sort(
    (a, b) =>
      a.source.path.localeCompare(b.source.path) || a.href.localeCompare(b.href),
  );

  const occurrences = (predicate: (link: ContentLink) => boolean) =>
    links.reduce((total, link) => (predicate(link) ? total + link.occurrences : total), 0);

  return {
    nodes,
    links,
    totals: {
      contentItems: input.sources.length,
      links: occurrences(() => true),
      internal: occurrences((link) => link.kind === 'internal'),
      external: occurrences((link) => link.kind === 'external'),
      broken: occurrences((link) => link.status === 'missing'),
      unpublished: occurrences((link) => link.status === 'unpublished'),
      redirects: occurrences((link) => link.status === 'redirect'),
      orphans: nodes.filter((stats) => stats.orphan).length,
    },
  };
}
