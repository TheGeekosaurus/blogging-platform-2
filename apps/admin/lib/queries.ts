import type { PostRow, PostStatus, TermRow } from '@blog/core';

import { createClient } from './supabase/server';

/**
 * Admin-side reads.
 *
 * Deliberately NOT in packages/core: every query there filters to published
 * posts, and the admin needs to see drafts. Keeping the two sets apart means the
 * public app cannot accidentally import a query that bypasses that filter.
 */

export const POSTS_PER_PAGE = 20;

export interface PostListItem {
  id: string;
  slug: string;
  title: string;
  status: PostStatus;
  published_at: string | null;
  updated_at: string;
  author_name: string | null;
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
  const from = (page - 1) * POSTS_PER_PAGE;

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

  let query = supabase
    .from('posts')
    .select('id, slug, title, status, published_at, updated_at, author_name', {
      count: 'exact',
    })
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
    .range(from, from + POSTS_PER_PAGE - 1);

  if (error) throw new Error(`Failed to list posts: ${error.message}`);

  return { posts: (data ?? []) as PostListItem[], total: count ?? 0 };
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
