import type {
  AuthorRow,
  LeadMagnetRow,
  LeadMagnetTargetRow,
  LeadRow,
  PageRow,
  PageTemplate,
  PostRow,
  PostStatus,
  TermRow,
} from '@blog/core';
import { explainLeadMagnetSchemaError, mediaPublicUrl } from '@blog/core';

import { createClient } from './supabase/server';

/**
 * Admin-side reads.
 *
 * Deliberately NOT in packages/core: every query there filters to published
 * posts, and the admin needs to see drafts. Keeping the two sets apart means the
 * public app cannot accidentally import a query that bypasses that filter.
 */

/**
 * Rows per page on every admin table.
 *
 * One constant, not one per screen: the number is a reading-comfort decision,
 * not a per-table one, and separate constants drift until Posts shows 20 and
 * Pages shows 50 for no reason anyone remembers. Distinct from
 * `POSTS_PER_PAGE` in @blog/core, which is the PUBLIC blog's page size (10) and
 * is a visitor-facing design choice with nothing to do with this.
 */
export const ADMIN_PER_PAGE = 20;

export interface PostListItem {
  id: string;
  slug: string;
  title: string;
  status: PostStatus;
  published_at: string | null;
  updated_at: string;
  author_name: string | null;
  /** Category names only — the list shows them, it does not link them. */
  categories: string[];
}

export interface PostListResult {
  posts: PostListItem[];
  total: number;
}

export interface PostFilters {
  status?: PostStatus | 'all';
  termId?: string;
  search?: string;
  page?: number;
}

export async function listPosts(
  siteId: string,
  filters: PostFilters = {},
): Promise<PostListResult> {
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * ADMIN_PER_PAGE;

  // A category filter resolves to post ids first; PostgREST cannot express
  // "has this term" as a plain column filter.
  let restrictToIds: string[] | null = null;
  if (filters.termId) {
    const { data, error } = await supabase
      .from('post_terms')
      .select('post_id')
      .eq('term_id', filters.termId);

    if (error) throw new Error(`Failed to filter by term: ${error.message}`);

    restrictToIds = (data ?? []).map((row) => row.post_id);
    if (restrictToIds.length === 0) return { posts: [], total: 0 };
  }

  /*
   * The embed is what puts a Categories column on the list. It costs one join
   * on a page of at most ADMIN_PER_PAGE rows, not a second round trip, and it
   * is scoped to this query — the public site's own post queries are in
   * @blog/core and are untouched, so nothing on the reader-facing side pays
   * for a column only the admin shows.
   */
  let query = supabase
    .from('posts')
    // One string literal, not a concatenation: supabase-js parses this at
    // compile time to type the result, and a concatenated expression defeats
    // that — the rows come back as GenericStringError[] and the shape has to be
    // cast back in by hand.
    .select(
      'id, slug, title, status, published_at, updated_at, author_name, post_terms(term:terms(name, kind))',
      { count: 'exact' },
    )
    .eq('site_id', siteId);

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (restrictToIds) {
    query = query.in('id', restrictToIds);
  }
  if (filters.search?.trim()) {
    // Escape PostgREST's wildcards and its value delimiters so a search for
    // "50%" or "a,b" is treated as text rather than as pattern syntax.
    const safe = filters.search.trim().replace(/[%_,()]/g, '');
    if (safe) query = query.ilike('title', `%${safe}%`);
  }

  const { data, error, count } = await query
    .order('updated_at', { ascending: false })
    .range(from, from + ADMIN_PER_PAGE - 1);

  if (error) throw new Error(`Failed to list posts: ${error.message}`);

  /*
   * Flattened here rather than in a view: PostgREST returns the join nested,
   * and the list wants a plain array of names. Tags come back in the same embed
   * and are filtered out — `terms` holds both kinds, and a Categories column
   * that quietly included tags would be wrong in a way nobody would notice.
   */
  const posts: PostListItem[] = (data ?? []).map(({ post_terms, ...post }) => ({
    ...post,
    categories: (post_terms ?? [])
      .map((row) => row.term)
      .filter((term) => term !== null && term.kind === 'category')
      .map((term) => term.name)
      .sort((a, b) => a.localeCompare(b)),
  }));

  return { posts, total: count ?? 0 };
}

export interface PostForEdit extends PostRow {
  termIds: string[];
}

export async function getPostForEdit(
  siteId: string,
  postId: string,
): Promise<PostForEdit | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('posts')
    .select('*, post_terms(term_id)')
    .eq('site_id', siteId)
    .eq('id', postId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load post: ${error.message}`);
  if (!data) return null;

  const { post_terms: joins, ...post } = data as PostRow & {
    post_terms: Array<{ term_id: string }> | null;
  };

  return { ...post, termIds: (joins ?? []).map((row) => row.term_id) };
}

export interface MediaOption {
  id: string;
  alt: string | null;
  /** File name, for the picker's filter box. */
  name: string;
  /**
   * Fully-built public URL.
   *
   * Computed HERE, on the server, and not in the picker. `mediaPublicUrl` reads
   * SUPABASE_URL, which has no NEXT_PUBLIC_ prefix and so is never inlined into
   * the browser bundle — calling it from a client component throws at runtime in
   * the user's browser. See apps/admin/__tests__/client-env.test.ts.
   */
  url: string;
}

export interface MediaOptions {
  items: MediaOption[];
  /** Total rows for the site, so the picker can say when it is showing a subset. */
  total: number;
}

/**
 * Media for the editor's image picker, newest first.
 *
 * Bounded: a library of thousands after the WordPress import would otherwise
 * ship all its metadata into every post form. The picker says so when the list
 * is truncated rather than silently hiding older images.
 */
const PICKER_LIMIT = 120;

export async function listMediaOptions(siteId: string): Promise<MediaOptions> {
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from('media')
    .select('id, storage_path, alt', { count: 'exact' })
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(PICKER_LIMIT);

  if (error) throw new Error(`Failed to list media: ${error.message}`);

  return {
    items: (data ?? []).map((row) => ({
      id: row.id,
      alt: row.alt,
      name: row.storage_path.split('/').pop() ?? row.storage_path,
      url: mediaPublicUrl(row.storage_path),
    })),
    total: count ?? (data ?? []).length,
  };
}

export async function listAllTerms(siteId: string): Promise<TermRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('terms')
    .select('*')
    .eq('site_id', siteId)
    .order('kind')
    .order('name');

  if (error) throw new Error(`Failed to list terms: ${error.message}`);
  return data ?? [];
}

/** Post counts per term, so the taxonomy screen can warn before a delete. */
export async function countPostsPerTerm(siteId: string): Promise<Map<string, number>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('post_terms')
    .select('term_id, posts!inner(site_id)')
    .eq('posts.site_id', siteId);

  if (error) throw new Error(`Failed to count term usage: ${error.message}`);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    counts.set(row.term_id, (counts.get(row.term_id) ?? 0) + 1);
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export interface PageListItem {
  id: string;
  slug: string;
  path: string;
  title: string;
  parent_id: string | null;
  template: PageTemplate;
  status: PostStatus;
  /* Needed to decide whether a page is actually live — see isLive(). */
  published_at: string | null;
  updated_at: string;
}

/** The page column list, shared so the paged and unpaged reads cannot diverge. */
const PAGE_COLUMNS =
  'id, slug, path, title, parent_id, template, status, published_at, updated_at';

export interface PageListResult {
  pages: PageListItem[];
  total: number;
}

/**
 * One page of pages, ordered by path so the list reads as a tree without
 * needing a recursive query — 'projects' sorts immediately before
 * 'projects/solar'.
 *
 * Paging by path rather than by date is what keeps that readable across the
 * break: a parent still precedes its children globally, so page two can begin
 * mid-subtree but is never out of order. Depth is derived from the path itself,
 * so the indentation is right even when the parent is on the previous page.
 */
export async function listPages(
  siteId: string,
  page = 1,
): Promise<PageListResult> {
  const supabase = await createClient();
  const from = (Math.max(1, page) - 1) * ADMIN_PER_PAGE;

  const { data, error, count } = await supabase
    .from('pages')
    .select(PAGE_COLUMNS, { count: 'exact' })
    .eq('site_id', siteId)
    .order('path')
    .range(from, from + ADMIN_PER_PAGE - 1);

  if (error) throw new Error(`Failed to list pages: ${error.message}`);
  return { pages: (data ?? []) as PageListItem[], total: count ?? 0 };
}

/**
 * EVERY page, unpaginated.
 *
 * For the two consumers that are a `<select>` rather than a table: the parent
 * picker, and the homepage chooser on the Pages screen. Both have to offer
 * pages the table is not currently showing — a dropdown silently narrowed to
 * page one is a control that cannot reach most of its own options, and nothing
 * about it would look broken.
 *
 * Unbounded on purpose. A site with more pages than fit in a `<select>` has a
 * navigation problem this function cannot solve, and truncating here would make
 * it invisible instead.
 */
export async function listAllPages(siteId: string): Promise<PageListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pages')
    .select(PAGE_COLUMNS)
    .eq('site_id', siteId)
    .order('path');

  if (error) throw new Error(`Failed to list pages: ${error.message}`);
  return (data ?? []) as PageListItem[];
}

export async function getPageForEdit(siteId: string, id: string): Promise<PageRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('site_id', siteId)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load page: ${error.message}`);
  return data ?? null;
}

/**
 * Pages selectable as a parent.
 *
 * Excludes the page being edited and everything beneath it: choosing one would
 * create a cycle. The database rejects that anyway, but offering an option that
 * always errors is a worse experience than not offering it.
 */
export async function listParentOptions(
  siteId: string,
  excludeId?: string,
): Promise<PageListItem[]> {
  // listAllPages, not listPages: a parent picker limited to the first 20 pages
  // cannot express most of the hierarchies it exists to build.
  const pages = await listAllPages(siteId);
  if (!excludeId) return pages;

  const self = pages.find((page) => page.id === excludeId);
  if (!self) return pages;

  const subtreePrefix = `${self.path}/`;
  return pages.filter(
    (page) => page.id !== excludeId && !page.path.startsWith(subtreePrefix),
  );
}

// ---------------------------------------------------------------------------
// Authors
// ---------------------------------------------------------------------------
// Public byline records — distinct from `profiles`, which is auth users, and
// from `posts.author_id`, which points at those users and gates write
// permissions. See supabase/migrations/0006_authors.sql.

export interface AuthorListItem extends AuthorRow {
  /** Pre-built on the server, for the same reason MediaOption.url is. */
  avatar_url: string | null;
}

/** Every author for the site, alphabetical — this list stays short by design. */
export async function listAuthors(siteId: string): Promise<AuthorListItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('authors')
    .select('*, avatar:media(storage_path)')
    .eq('site_id', siteId)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to list authors: ${error.message}`);

  return (data ?? []).map((row) => {
    const { avatar, ...author } = row as AuthorRow & {
      avatar: { storage_path: string } | { storage_path: string }[] | null;
    };
    const one = Array.isArray(avatar) ? avatar[0] : avatar;

    return {
      ...author,
      avatar_url: one ? mediaPublicUrl(one.storage_path) : null,
    };
  });
}

export async function getAuthorForEdit(
  siteId: string,
  id: string,
): Promise<AuthorRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .eq('id', id)
    .eq('site_id', siteId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load author: ${error.message}`);
  return data ?? null;
}

/** Just enough to fill the post form's Author select. */
export async function listAuthorOptions(
  siteId: string,
): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('authors')
    .select('id, name')
    .eq('site_id', siteId)
    .order('name', { ascending: true });

  if (error) throw new Error(`Failed to list authors: ${error.message}`);
  return data ?? [];
}

/**
 * How many posts each author is attached to.
 *
 * Shown beside every author on the list page. There is no delete confirmation
 * anywhere in this admin; a count you can see beforehand does that job better,
 * and it is what the taxonomy screen already does.
 */
export async function countPostsPerAuthor(siteId: string): Promise<Map<string, number>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('posts')
    .select('byline_id')
    .eq('site_id', siteId)
    .not('byline_id', 'is', null);

  if (error) throw new Error(`Failed to count author usage: ${error.message}`);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (row.byline_id) counts.set(row.byline_id, (counts.get(row.byline_id) ?? 0) + 1);
  }
  return counts;
}

// ---------------------------------------------------------------------------
// Lead magnets
// ---------------------------------------------------------------------------

export interface LeadMagnetListItem extends LeadMagnetRow {
  /** How many rules aim it somewhere. Zero means it appears nowhere. */
  targetCount: number;
  /** Pre-built here, as on the authors list: mediaPublicUrl is server-only. */
  image_url: string | null;
}

export async function listLeadMagnets(siteId: string): Promise<LeadMagnetListItem[]> {
  const supabase = await createClient();

  /*
   * `count` on the embed rather than a second query. PostgREST returns it as
   * `[{ count: n }]`, which is why the unwrapping below looks odd for what is
   * one integer.
   */
  const { data, error } = await supabase
    .from('lead_magnets')
    .select('*, image:media(storage_path), targets:lead_magnet_targets(count)')
    .eq('site_id', siteId)
    .order('active', { ascending: false })
    .order('name');

  // Same embed as the blog's query, so the same schema-drift failure, and the
  // admin is where someone would be going to apply the migration.
  if (error) throw explainLeadMagnetSchemaError(error, 'Failed to list lead magnets');

  return (data ?? []).map((row) => {
    const { targets, image, ...magnet } = row as LeadMagnetRow & {
      targets: Array<{ count: number }> | null;
      image: { storage_path: string } | { storage_path: string }[] | null;
    };
    const one = Array.isArray(image) ? image[0] : image;

    return {
      ...magnet,
      targetCount: targets?.[0]?.count ?? 0,
      image_url: one ? mediaPublicUrl(one.storage_path) : null,
    };
  });
}

export interface LeadMagnetForEdit extends LeadMagnetRow {
  targets: LeadMagnetTargetRow[];
}

export async function getLeadMagnetForEdit(
  siteId: string,
  id: string,
): Promise<LeadMagnetForEdit | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lead_magnets')
    .select('*, targets:lead_magnet_targets(*)')
    .eq('site_id', siteId)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load the lead magnet: ${error.message}`);

  return (data as LeadMagnetForEdit | null) ?? null;
}

/** Leads captured per magnet, for the list screen. */
export async function countLeadsPerMagnet(siteId: string): Promise<Map<string, number>> {
  const supabase = await createClient();

  /*
   * Returns nothing rather than throwing when the signed-in user is below
   * `admin`: reading leads is gated at that level (0010_lead_magnets.sql), and
   * RLS answers a disallowed select with an empty set, not an error. An editor
   * therefore sees the offers they may configure with no counts beside them,
   * which is the intended shape of that screen for them.
   */
  const { data, error } = await supabase
    .from('leads')
    .select('magnet_id')
    .eq('site_id', siteId)
    .not('magnet_id', 'is', null);

  if (error) throw new Error(`Failed to count leads: ${error.message}`);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (row.magnet_id) counts.set(row.magnet_id, (counts.get(row.magnet_id) ?? 0) + 1);
  }
  return counts;
}

/**
 * The most recent captures for one offer.
 *
 * Capped rather than paginated. This screen answers "is it working, and who is
 * signing up" — the mailing list itself lives wherever the webhook sends it,
 * and building a second CRM here would be building the wrong thing.
 */
export const RECENT_LEADS = 25;

export async function listRecentLeads(
  siteId: string,
  magnetId: string,
): Promise<LeadRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('site_id', siteId)
    .eq('magnet_id', magnetId)
    .order('created_at', { ascending: false })
    .limit(RECENT_LEADS);

  if (error) throw new Error(`Failed to list leads: ${error.message}`);
  return data ?? [];
}

/**
 * Every post title, for the per-post targeting picker.
 *
 * Unpaginated on purpose, and it is the one query here that would not survive a
 * ten-thousand-post site. It is bounded by what the picker can usefully be:
 * a list you scroll to find one article. Past a few hundred posts the control
 * needs to become a search, and that is the change to make — not a LIMIT that
 * silently hides the post someone is looking for.
 */
export interface PostOption {
  id: string;
  title: string;
}

export async function listPostOptions(siteId: string): Promise<PostOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('posts')
    .select('id, title')
    .eq('site_id', siteId)
    .order('title');

  if (error) throw new Error(`Failed to list posts: ${error.message}`);
  return data ?? [];
}

export interface RedirectListItem {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  created_at: string;
}

export interface RedirectListResult {
  redirects: RedirectListItem[];
  total: number;
}

/**
 * One page of redirects, source first.
 *
 * Ordered by from_path rather than creation date: the list is used to check
 * whether a given URL is already handled, and that is a lookup, not a history.
 *
 * Paginated because this is the table most likely to get very long — a
 * WordPress migration needs one row per URL whose shape changed, which on a
 * few hundred posts is a few hundred rows arriving at once.
 */
export async function listRedirectRows(
  siteId: string,
  page = 1,
): Promise<RedirectListResult> {
  const supabase = await createClient();
  const from = (Math.max(1, page) - 1) * ADMIN_PER_PAGE;

  const { data, error, count } = await supabase
    .from('redirects')
    .select('id, from_path, to_path, status_code, created_at', { count: 'exact' })
    .eq('site_id', siteId)
    .order('from_path')
    .range(from, from + ADMIN_PER_PAGE - 1);

  if (error) throw new Error(`Failed to list redirects: ${error.message}`);
  return { redirects: (data ?? []) as RedirectListItem[], total: count ?? 0 };
}
