import type { Client } from './supabase';
import { SOCIAL_PLATFORMS } from './database.types';
import type {
  PageRow,
  RedirectRow,
  SiteRow,
  SocialLinks,
  SocialPlatform,
  TermKind,
  TermRow,
} from './database.types';
import { termsWithPosts } from './terms';

/**
 * Read-side data access for the public blog.
 *
 * Every function here is called at build time or during on-demand revalidation
 * — never on a visitor request. That is why they can be straightforward
 * round-trips with no caching layer of their own: the rendered page is the cache.
 *
 * The `status`/`published_at` filters duplicate what the RLS policies already
 * enforce. That redundancy is deliberate — it keeps the intent legible at the
 * call site, and it means these queries stay correct if ever run with a
 * service-role client (which bypasses RLS).
 */

export const POSTS_PER_PAGE = 10;

export interface FeaturedImage {
  id: string;
  storage_path: string;
  alt: string | null;
  width: number | null;
  height: number | null;
  blur_data_url: string | null;
}

/**
 * An author record as a post carries it.
 *
 * A projection, like FeaturedImage: the bio and social links are stored but not
 * selected here, because nothing on a post page renders them yet and a build
 * should not pay for columns it does not use.
 */
export interface Byline {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  /** Only the author box renders these two; the byline row shows `title`. */
  bio: string | null;
  social: SocialLinks;
  avatar: { id: string; storage_path: string; alt: string | null } | null;
}

export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string;
  /**
   * Free-text byline. Read through `postAuthorName`, never directly — an
   * attached author record wins over it.
   */
  author_name: string | null;
  /** The attached author record, when there is one. */
  byline: Byline | null;
  reading_minutes: number | null;
  featured_image: FeaturedImage | null;
  /**
   * Last edited. Cards show this rather than `published_at`, matching the post
   * page — see components/blog/post-byline.tsx.
   */
  updated_at: string;
  /**
   * This post's OWN categories.
   *
   * Added because the related-post cards were being handed the *current* post's
   * category for every card, so all three showed the same one whatever they
   * were filed under.
   */
  categories: TermRow[];
}

export interface PostDetail extends PostSummary {
  content_html: string;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  noindex: boolean;
  tags: TermRow[];
}

/** Supabase types a to-one embed as possibly-array; normalise it. */
function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/*
 * The byline embed is in BOTH select strings, not only the detail one.
 *
 * Five things render an author — the post sidebar, the post card, the
 * schema.org JSON-LD, the OG image and <dc:creator> in the feed — and three of
 * those run off a summary. Selecting the record only for the detail page would
 * mean a post with an author attached and its text field cleared showed a
 * byline in one place and nothing in the other four.
 *
 * Two levels, same shape as post_terms(term:terms(...)): the avatar is embedded
 * through `authors`, which is also why it is safe. A second posts → media
 * foreign key would make `featured_image:media(...)` ambiguous.
 */
const BYLINE_EMBED =
  'byline:authors(id, slug, name, title, bio, social, avatar:media(id, storage_path, alt))';

/*
 * Categories and tags arrive as one embed and are split by `kind` after the
 * fact, exactly as the detail query does.
 */
const TERMS_EMBED =
  'post_terms(term:terms(id, site_id, kind, slug, name, description, parent_id, created_at, updated_at))';

const SUMMARY_COLUMNS = `
  id, slug, title, excerpt, published_at, updated_at, author_name, reading_minutes,
  featured_image:media(id, storage_path, alt, width, height, blur_data_url),
  ${BYLINE_EMBED},
  ${TERMS_EMBED}
`;

const DETAIL_COLUMNS = `
  id, slug, title, excerpt, content_html, published_at, author_name,
  reading_minutes, seo_title, seo_description, canonical_url, noindex, updated_at,
  featured_image:media(id, storage_path, alt, width, height, blur_data_url),
  ${BYLINE_EMBED},
  ${TERMS_EMBED}
`;

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

interface RawSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string;
  author_name: string | null;
  reading_minutes: number | null;
  updated_at: string;
  featured_image: FeaturedImage | FeaturedImage[] | null;
  byline: RawByline | RawByline[] | null;
  post_terms: Array<{ term: TermRow | TermRow[] | null }> | null;
}

/** As it arrives: both embeds may be typed as arrays. */
interface RawByline {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  social: SocialLinks | null;
  avatar:
    | { id: string; storage_path: string; alt: string | null }
    | Array<{ id: string; storage_path: string; alt: string | null }>
    | null;
}

function toSummary(row: RawSummary): PostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    published_at: row.published_at,
    author_name: row.author_name,
    // `one()` twice: the author is a to-one embed, and so is its avatar inside
    // it. Supabase types both as possibly-array.
    byline: toByline(one(row.byline)),
    reading_minutes: row.reading_minutes,
    updated_at: row.updated_at,
    featured_image: one(row.featured_image),
    categories: embeddedTerms(row.post_terms).filter((t) => t.kind === 'category'),
  };
}

/** Flatten the post_terms embed into the terms themselves. */
function embeddedTerms(
  rows: Array<{ term: TermRow | TermRow[] | null }> | null | undefined,
): TermRow[] {
  return (rows ?? [])
    .map((entry) => one(entry.term))
    .filter((term): term is TermRow => term !== null);
}

function toByline(row: RawByline | null): Byline | null {
  if (!row) return null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    title: row.title,
    bio: row.bio,
    // jsonb defaults to '{}' in the column, but a null still typechecks.
    social: row.social ?? {},
    avatar: one(row.avatar),
  };
}

/**
 * The name to show for a post's author.
 *
 * An attached record wins; the free-text field is the fallback. Every consumer
 * goes through this rather than reading either field, so assigning a record to
 * an imported post — or clearing the text on one that has a record — cannot
 * blank the byline in some places and not others.
 */
export function postAuthorName(
  post: Pick<PostSummary, 'byline' | 'author_name'>,
): string | null {
  return post.byline?.name ?? post.author_name ?? null;
}

/**
 * Keep only usable social URLs, in a fixed platform order.
 *
 * Validated on the way in by the admin, but an imported or hand-edited row can
 * hold anything, and this is what stands between a stored `javascript:` URL and
 * an `href`. A blank or non-http entry is dropped rather than rendered as a
 * dead link.
 */
export function socialLinks(social: SocialLinks | null | undefined): Array<{
  platform: SocialPlatform;
  url: string;
}> {
  if (!social) return [];

  return SOCIAL_PLATFORMS.flatMap((platform) => {
    const url = social[platform]?.trim();
    if (!url || !/^https?:\/\//i.test(url)) return [];
    return [{ platform, url }];
  });
}

// ---------------------------------------------------------------------------
// Sites
// ---------------------------------------------------------------------------

export async function getSiteBySlug(client: Client, slug: string): Promise<SiteRow | null> {
  const { data, error } = await client
    .from('sites')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) fail(`Failed to load site "${slug}"`, error);
  return data ?? null;
}

/**
 * Load the site this deployment serves, failing loudly if it is missing.
 * A blog deployment pointed at a nonexistent site should not build at all.
 */
export async function requireSiteBySlug(client: Client, slug: string): Promise<SiteRow> {
  const site = await getSiteBySlug(client, slug);
  if (!site) {
    throw new Error(
      `No site row found for SITE_SLUG="${slug}". ` +
        `Create it in the sites table, or correct SITE_SLUG for this deployment.`,
    );
  }
  return site;
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

export async function listPublishedPosts(
  client: Client,
  siteId: string,
  { limit = POSTS_PER_PAGE, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<PostSummary[]> {
  const { data, error } = await client
    .from('posts')
    .select(SUMMARY_COLUMNS)
    .eq('site_id', siteId)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) fail('Failed to list posts', error);
  return ((data ?? []) as unknown as RawSummary[]).map(toSummary);
}

export async function countPublishedPosts(client: Client, siteId: string): Promise<number> {
  const { count, error } = await client
    .from('posts')
    .select('id', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString());

  if (error) fail('Failed to count posts', error);
  return count ?? 0;
}

/** Every published slug, for generateStaticParams. */
export async function listPublishedSlugs(client: Client, siteId: string): Promise<string[]> {
  const { data, error } = await client
    .from('posts')
    .select('slug')
    .eq('site_id', siteId)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false });

  if (error) fail('Failed to list post slugs', error);
  return (data ?? []).map((row) => row.slug);
}

export async function getPostBySlug(
  client: Client,
  siteId: string,
  slug: string,
): Promise<PostDetail | null> {
  const { data, error } = await client
    .from('posts')
    .select(DETAIL_COLUMNS)
    .eq('site_id', siteId)
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .maybeSingle();

  if (error) fail(`Failed to load post "${slug}"`, error);
  if (!data) return null;

  const row = data as unknown as RawSummary & {
    content_html: string;
    seo_title: string | null;
    seo_description: string | null;
    canonical_url: string | null;
    noindex: boolean;
  };

  /*
   * `toSummary` already resolved updated_at and the categories from the same
   * embed, so only the tags are left to split out here.
   */
  return {
    ...toSummary(row),
    content_html: row.content_html,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    canonical_url: row.canonical_url,
    noindex: row.noindex,
    tags: embeddedTerms(row.post_terms).filter((t) => t.kind === 'tag'),
  };
}

/** Most recent posts excluding one, for a "read next" block. */
export async function listRelatedPosts(
  client: Client,
  siteId: string,
  excludePostId: string,
  limit = 3,
): Promise<PostSummary[]> {
  const { data, error } = await client
    .from('posts')
    .select(SUMMARY_COLUMNS)
    .eq('site_id', siteId)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .neq('id', excludePostId)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) fail('Failed to list related posts', error);
  return ((data ?? []) as unknown as RawSummary[]).map(toSummary);
}

// ---------------------------------------------------------------------------
// Terms
// ---------------------------------------------------------------------------

export async function listTerms(
  client: Client,
  siteId: string,
  kind: TermKind,
): Promise<TermRow[]> {
  const { data, error } = await client
    .from('terms')
    .select('*')
    .eq('site_id', siteId)
    .eq('kind', kind)
    .order('name', { ascending: true });

  if (error) fail(`Failed to list ${kind} terms`, error);
  return data ?? [];
}

export async function getTermBySlug(
  client: Client,
  siteId: string,
  kind: TermKind,
  slug: string,
): Promise<TermRow | null> {
  const { data, error } = await client
    .from('terms')
    .select('*')
    .eq('site_id', siteId)
    .eq('kind', kind)
    .eq('slug', slug)
    .maybeSingle();

  if (error) fail(`Failed to load ${kind} "${slug}"`, error);
  return data ?? null;
}

/**
 * Posts carrying a term.
 *
 * Resolves post ids first, then fetches those posts, rather than filtering
 * through an embedded join. An `!inner` embed would work but returns the join
 * rows nested, and the two-step version keeps the ordering and pagination
 * predictable — these result sets are small.
 */
/**
 * Posts carrying ANY of the given terms.
 *
 * Takes a set rather than one id so a category archive can pass the category
 * plus its descendants — WordPress's behaviour, and the reason it matters is
 * that editors tag the most specific category only, leaving a parent archive
 * empty otherwise.
 *
 * A post in both a parent and a child appears once: the join produces duplicate
 * post ids, but they are then used as an `in` filter on `posts`, which matches
 * each row once regardless.
 */
export async function listPostsByTerms(
  client: Client,
  siteId: string,
  termIds: readonly string[],
  { limit = POSTS_PER_PAGE, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<PostSummary[]> {
  if (termIds.length === 0) return [];

  const { data: joins, error: joinError } = await client
    .from('post_terms')
    .select('post_id')
    .in('term_id', termIds as string[]);

  if (joinError) fail('Failed to resolve posts for term', joinError);

  const postIds = [...new Set((joins ?? []).map((row) => row.post_id))];
  if (postIds.length === 0) return [];

  const { data, error } = await client
    .from('posts')
    .select(SUMMARY_COLUMNS)
    .eq('site_id', siteId)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .in('id', postIds)
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) fail('Failed to list posts for term', error);
  return ((data ?? []) as unknown as RawSummary[]).map(toSummary);
}

/** Posts carrying exactly one term. Tag archives, which never nest. */
export async function listPostsByTerm(
  client: Client,
  siteId: string,
  termId: string,
  options: { limit?: number; offset?: number } = {},
): Promise<PostSummary[]> {
  return listPostsByTerms(client, siteId, [termId], options);
}

/** Terms that actually have at least one published post, for archive indexes. */
export async function listNonEmptyTerms(
  client: Client,
  siteId: string,
  kind: TermKind,
): Promise<TermRow[]> {
  const terms = await listTerms(client, siteId, kind);
  if (terms.length === 0) return [];

  const { data, error } = await client
    .from('post_terms')
    .select('term_id, posts!inner(status, published_at, site_id)')
    .eq('posts.site_id', siteId)
    .eq('posts.status', 'published')
    .lte('posts.published_at', new Date().toISOString())
    .in(
      'term_id',
      terms.map((t) => t.id),
    );

  if (error) fail('Failed to check term usage', error);

  const used = new Set((data ?? []).map((row) => row.term_id));

  /*
   * Categories propagate usage upwards; tags cannot nest, so for them this is
   * the same set. A parent tagged on nothing directly still has an archive with
   * content, because archives include descendants — calling it empty would hide
   * it from navigation and from the sitemap while the page itself renders fine.
   */
  const withPosts = kind === 'category' ? termsWithPosts(terms, used) : used;
  return terms.filter((term) => withPosts.has(term.id));
}

// ---------------------------------------------------------------------------
// Redirects
// ---------------------------------------------------------------------------

export async function listRedirects(client: Client, siteId: string): Promise<RedirectRow[]> {
  const { data, error } = await client
    .from('redirects')
    .select('*')
    .eq('site_id', siteId);

  if (error) fail('Failed to list redirects', error);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

/**
 * A page, looked up by its materialised `path`.
 *
 * One indexed query regardless of nesting depth. Walking the parent chain per
 * request would cost a query per level, which is why `path` is materialised by
 * trigger rather than derived at read time.
 */
export async function getPageByPath(
  client: Client,
  siteId: string,
  path: string,
): Promise<PageRow | null> {
  const normalised = path.replace(/^\/+|\/+$/g, '');

  const { data, error } = await client
    .from('pages')
    .select('*')
    .eq('site_id', siteId)
    .eq('path', normalised)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .maybeSingle();

  if (error) fail(`Failed to load page "${normalised}"`, error);
  return data ?? null;
}

export async function getPageById(
  client: Client,
  siteId: string,
  id: string,
): Promise<PageRow | null> {
  const { data, error } = await client
    .from('pages')
    .select('*')
    .eq('site_id', siteId)
    .eq('id', id)
    .maybeSingle();

  if (error) fail('Failed to load page', error);
  return data ?? null;
}

/** Every published page path, for generateStaticParams. */
export async function listPublishedPagePaths(
  client: Client,
  siteId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from('pages')
    .select('path')
    .eq('site_id', siteId)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString());

  if (error) fail('Failed to list page paths', error);
  return (data ?? []).map((row) => row.path);
}

/** Published pages with their update times, for the sitemap. */
export async function listPublishedPages(
  client: Client,
  siteId: string,
): Promise<Array<Pick<PageRow, 'path' | 'updated_at' | 'noindex'>>> {
  const { data, error } = await client
    .from('pages')
    .select('path, updated_at, noindex')
    .eq('site_id', siteId)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('path');

  if (error) fail('Failed to list pages', error);
  return data ?? [];
}
