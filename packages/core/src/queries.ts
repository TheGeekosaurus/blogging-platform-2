import type { Client } from './supabase';
import type { RedirectRow, SiteRow, TermKind, TermRow } from './database.types';

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

export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  published_at: string;
  author_name: string | null;
  reading_minutes: number | null;
  featured_image: FeaturedImage | null;
}

export interface PostDetail extends PostSummary {
  content_html: string;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
  noindex: boolean;
  updated_at: string;
  categories: TermRow[];
  tags: TermRow[];
}

/** Supabase types a to-one embed as possibly-array; normalise it. */
function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

const SUMMARY_COLUMNS = `
  id, slug, title, excerpt, published_at, author_name, reading_minutes,
  featured_image:media(id, storage_path, alt, width, height, blur_data_url)
`;

const DETAIL_COLUMNS = `
  id, slug, title, excerpt, content_html, published_at, author_name,
  reading_minutes, seo_title, seo_description, canonical_url, noindex, updated_at,
  featured_image:media(id, storage_path, alt, width, height, blur_data_url),
  post_terms(term:terms(id, site_id, kind, slug, name, description, parent_id, created_at, updated_at))
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
  featured_image: FeaturedImage | FeaturedImage[] | null;
}

function toSummary(row: RawSummary): PostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    published_at: row.published_at,
    author_name: row.author_name,
    reading_minutes: row.reading_minutes,
    featured_image: one(row.featured_image),
  };
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
    updated_at: string;
    post_terms: Array<{ term: TermRow | TermRow[] | null }> | null;
  };

  const terms = (row.post_terms ?? [])
    .map((entry) => one(entry.term))
    .filter((term): term is TermRow => term !== null);

  return {
    ...toSummary(row),
    content_html: row.content_html,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    canonical_url: row.canonical_url,
    noindex: row.noindex,
    updated_at: row.updated_at,
    categories: terms.filter((t) => t.kind === 'category'),
    tags: terms.filter((t) => t.kind === 'tag'),
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
export async function listPostsByTerm(
  client: Client,
  siteId: string,
  termId: string,
  { limit = POSTS_PER_PAGE, offset = 0 }: { limit?: number; offset?: number } = {},
): Promise<PostSummary[]> {
  const { data: joins, error: joinError } = await client
    .from('post_terms')
    .select('post_id')
    .eq('term_id', termId);

  if (joinError) fail('Failed to resolve posts for term', joinError);

  const postIds = (joins ?? []).map((row) => row.post_id);
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
  return terms.filter((term) => used.has(term.id));
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
