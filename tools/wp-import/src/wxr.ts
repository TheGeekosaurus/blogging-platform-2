import { XMLParser } from 'fast-xml-parser';

import { slugify, type PostStatus } from '@blog/core';

/**
 * WXR (WordPress eXtended RSS) parsing.
 *
 * A WXR file is RSS 2.0 with WordPress-specific namespaced elements. Only
 * `wp:post_type = post` items are of interest; pages, attachments, nav menu
 * items and revisions are skipped.
 */

export interface WxrTerm {
  kind: 'category' | 'tag';
  slug: string;
  name: string;
}

/**
 * A channel-level `<wp:category>` declaration.
 *
 * Distinct from the `<category>` elements on each `<item>`, which say only which
 * terms a post carries. The hierarchy is declared once per export, at the
 * channel level, and referenced BY NICENAME rather than by id:
 *
 *   <wp:category>
 *     <wp:category_nicename>solar</wp:category_nicename>
 *     <wp:cat_name>Solar</wp:cat_name>
 *     <wp:category_parent>energy</wp:category_parent>
 *   </wp:category>
 *
 * Without reading these, an import flattens the whole category tree — every
 * category lands at the top level and the structure is silently lost.
 */
export interface WxrCategory {
  slug: string;
  name: string;
  /** Parent's nicename, or null at the top level. */
  parentSlug: string | null;
}

export interface WxrPost {
  wpPostId: number | null;
  title: string;
  /** `wp:post_name` — preserved verbatim. The SEO-critical field. */
  slug: string;
  contentHtml: string;
  excerptHtml: string;
  status: PostStatus;
  /** ISO 8601, or null for posts that were never published. */
  publishedAt: string | null;
  authorName: string | null;
  terms: WxrTerm[];
  /** Original permalink, used to detect slug changes and build redirects. */
  link: string | null;
}

export interface WxrParseResult {
  posts: WxrPost[];
  /** Channel-level category declarations, carrying the hierarchy. */
  categories: WxrCategory[];
  /** `wp:base_blog_url` — the old site origin, for internal link rewriting. */
  baseBlogUrl: string | null;
  /** Counts of `wp:post_type` values that were skipped. */
  skipped: Record<string, number>;
}

/** WordPress post statuses → our post_status enum. */
const STATUS_MAP: Record<string, PostStatus | 'skip'> = {
  publish: 'published',
  future: 'scheduled',
  draft: 'draft',
  pending: 'draft',
  // Private posts were deliberately hidden; importing them as drafts keeps them
  // hidden rather than silently publishing them.
  private: 'draft',
  trash: 'skip',
  'auto-draft': 'skip',
  inherit: 'skip',
};

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/** fast-xml-parser gives `string`, `{ '#text': string }`, or `''` for empty tags. */
function text(node: unknown): string {
  if (node === undefined || node === null) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);
  if (typeof node === 'object' && '#text' in (node as Record<string, unknown>)) {
    const inner = (node as Record<string, unknown>)['#text'];
    return inner === undefined || inner === null ? '' : String(inner);
  }
  return '';
}

/**
 * WordPress writes GMT dates as `YYYY-MM-DD HH:MM:SS` with no zone, and uses
 * `0000-00-00 00:00:00` as its null. Interpret the former as UTC.
 */
export function parseWpDate(raw: string): string | null {
  const value = raw.trim();
  if (!value || value.startsWith('0000-00-00')) return null;

  const iso = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Derive a slug from a title, for posts WordPress never assigned one to.
 * Re-exported from @blog/core so the admin and the importer cannot drift.
 */
export const slugifyTitle = slugify;

interface RawCategory {
  '#text'?: string;
  '@_domain'?: string;
  '@_nicename'?: string;
}

function parseTerms(raw: unknown): WxrTerm[] {
  const terms: WxrTerm[] = [];

  for (const entry of asArray(raw as RawCategory | RawCategory[])) {
    if (typeof entry === 'string') continue; // no domain attribute: unusable

    const domain = entry['@_domain'];
    if (domain !== 'category' && domain !== 'post_tag') continue;

    const name = text(entry).trim();
    const slug = (entry['@_nicename'] ?? '').trim() || slugifyTitle(name);
    if (!name || !slug) continue;

    terms.push({
      kind: domain === 'category' ? 'category' : 'tag',
      slug: decodeURIComponent(slug).toLowerCase(),
      name,
    });
  }

  // WordPress exports the "Uncategorized" default on nearly every post; it
  // carries no information, so it is dropped.
  const meaningful = terms.filter(
    (term) => !(term.kind === 'category' && term.slug === 'uncategorized'),
  );

  // Deduplicate — a post can list the same term twice.
  const seen = new Set<string>();
  return meaningful.filter((term) => {
    const key = `${term.kind}:${term.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parseWxr(xml: string): WxrParseResult {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    // Keep values as raw strings: post IDs and slugs must not be coerced to
    // numbers, and "0123" must not lose its leading zero.
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: false,
    // Namespace prefixes like `wp:` are part of the element names we need.
    removeNSPrefix: false,
    // Force these to arrays even when a single item is present, so the shape
    // does not change with the number of posts in the export.
    isArray: (name) => name === 'item' || name === 'category' || name === 'wp:category',
  });

  const parsed = parser.parse(xml) as Record<string, any>;
  const channel = parsed?.rss?.channel;

  if (!channel) {
    throw new Error(
      'Not a WordPress export: no <rss><channel> element found. ' +
        'Export with Tools → Export → All content in WordPress admin.',
    );
  }

  const baseBlogUrl =
    text(channel['wp:base_blog_url']).trim() || text(channel.link).trim() || null;

  const categories: WxrCategory[] = [];
  const seenCategory = new Set<string>();

  for (const entry of asArray(channel['wp:category'])) {
    if (typeof entry !== 'object' || entry === null) continue;

    const raw = entry as Record<string, unknown>;
    const slugRaw = text(raw['wp:category_nicename']).trim();
    if (!slugRaw) continue;

    const slug = decodeURIComponent(slugRaw).toLowerCase();
    // Same drop as parseTerms: "Uncategorized" carries no information.
    if (slug === 'uncategorized' || seenCategory.has(slug)) continue;
    seenCategory.add(slug);

    const parentRaw = text(raw['wp:category_parent']).trim();
    const parentSlug = parentRaw ? decodeURIComponent(parentRaw).toLowerCase() : null;

    categories.push({
      slug,
      name: text(raw['wp:cat_name']).trim() || slug,
      // A parent of "uncategorized" would point at a category we drop, so treat
      // it as top level rather than leaving a dangling reference.
      parentSlug: parentSlug && parentSlug !== 'uncategorized' ? parentSlug : null,
    });
  }

  const posts: WxrPost[] = [];
  const skipped: Record<string, number> = {};

  for (const item of asArray(channel.item)) {
    const postType = text(item['wp:post_type']).trim() || 'unknown';

    if (postType !== 'post') {
      skipped[postType] = (skipped[postType] ?? 0) + 1;
      continue;
    }

    const rawStatus = text(item['wp:status']).trim().toLowerCase();
    const mapped = STATUS_MAP[rawStatus] ?? 'draft';

    if (mapped === 'skip') {
      skipped[`post:${rawStatus}`] = (skipped[`post:${rawStatus}`] ?? 0) + 1;
      continue;
    }

    const title = text(item.title).trim();
    const rawSlug = text(item['wp:post_name']).trim();
    // Percent-encoded slugs (Cyrillic, CJK) are decoded so the stored slug
    // matches what Next.js sees after route decoding.
    const slug = rawSlug ? decodeURIComponent(rawSlug).toLowerCase() : slugifyTitle(title);

    const wpPostIdRaw = text(item['wp:post_id']).trim();
    const wpPostId = /^\d+$/.test(wpPostIdRaw) ? Number(wpPostIdRaw) : null;

    const publishedAt =
      parseWpDate(text(item['wp:post_date_gmt'])) ?? parseWpDate(text(item['wp:post_date']));

    posts.push({
      wpPostId,
      title: title || '(untitled)',
      slug,
      contentHtml: text(item['content:encoded']),
      excerptHtml: text(item['excerpt:encoded']),
      status: mapped,
      publishedAt,
      authorName: text(item['dc:creator']).trim() || null,
      terms: parseTerms(item.category),
      link: text(item.link).trim() || null,
    });
  }

  return { posts, categories, baseBlogUrl, skipped };
}
