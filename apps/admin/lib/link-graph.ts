import {
  buildLinkGraph,
  pagePath,
  postPath,
  type LinkGraph,
  type LinkSource,
  type SiteRow,
} from '@blog/core';

import { createClient } from './supabase/server';

/**
 * The Links screen's one read.
 *
 * Admin-side, and for the same reason everything in `queries.ts` is: the graph
 * has to include drafts. A link pointing at an unpublished post is a 404 for
 * every visitor, and the public queries filter exactly that row out — so a
 * graph built from them would report the broken link as fine.
 *
 * This pulls whole bodies, which is the expensive part. It is bounded, it says
 * so on the screen when the bound bites, and the trade against a stored link
 * table is argued in packages/core/src/links.ts.
 */

/**
 * How many posts and pages the graph covers.
 *
 * A WordPress import can land thousands of rows, and the incoming-link half of
 * this only means anything when the whole corpus is in hand — sampling would
 * report real links as orphaned, which is worse than saying "not all of it".
 * 2000 bodies is a large but survivable read for a page only an editor opens;
 * past that the answer is the save-time link table, not a bigger number here.
 */
export const LINK_GRAPH_LIMIT = 2000;

export interface AdminLinkGraph extends LinkGraph {
  /** True when the corpus hit LINK_GRAPH_LIMIT, so the screen can say so. */
  truncated: boolean;
}

export async function loadLinkGraph(
  site: Pick<SiteRow, 'id' | 'slug' | 'base_url'>,
): Promise<AdminLinkGraph> {
  const supabase = await createClient();

  const [posts, pages, terms, redirects] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, slug, status, published_at, content_html')
      .eq('site_id', site.id)
      .order('updated_at', { ascending: false })
      .limit(LINK_GRAPH_LIMIT),
    supabase
      .from('pages')
      .select('id, title, path, status, published_at, content_html')
      .eq('site_id', site.id)
      .order('path')
      .limit(LINK_GRAPH_LIMIT),
    supabase.from('terms').select('kind, slug, name').eq('site_id', site.id),
    supabase.from('redirects').select('from_path, to_path').eq('site_id', site.id),
  ]);

  if (posts.error) throw new Error(`Failed to load posts: ${posts.error.message}`);
  if (pages.error) throw new Error(`Failed to load pages: ${pages.error.message}`);
  if (terms.error) throw new Error(`Failed to load terms: ${terms.error.message}`);
  // Redirects only downgrade a "broken" verdict to "redirect", so a failure
  // here is survivable — but it would silently mislabel links, so it is not
  // swallowed either.
  if (redirects.error) {
    throw new Error(`Failed to load redirects: ${redirects.error.message}`);
  }

  const sources: LinkSource[] = [
    ...(posts.data ?? []).map((post) => ({
      id: post.id,
      kind: 'post' as const,
      title: post.title,
      path: postPath(post.slug),
      status: post.status,
      published_at: post.published_at,
      content_html: post.content_html ?? '',
    })),
    ...(pages.data ?? []).map((page) => ({
      id: page.id,
      kind: 'page' as const,
      title: page.title,
      path: pagePath(page.path),
      status: page.status,
      published_at: page.published_at,
      content_html: page.content_html ?? '',
    })),
  ];

  const graph = buildLinkGraph({ site, sources, terms: terms.data ?? [], redirects: redirects.data ?? [] });

  return {
    ...graph,
    truncated:
      (posts.data ?? []).length >= LINK_GRAPH_LIMIT ||
      (pages.data ?? []).length >= LINK_GRAPH_LIMIT,
  };
}

/** The admin URL that edits a graph node. */
export function editHref(node: { kind: 'post' | 'page'; id: string }): string {
  return node.kind === 'post' ? `/posts/${node.id}` : `/pages/${node.id}`;
}
