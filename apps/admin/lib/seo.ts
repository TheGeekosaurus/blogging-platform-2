import {
  buildSeoTree,
  ROADMAP_STATUSES,
  type SeoKeywordRow,
  type SeoPageRow,
  type SeoTopicRow,
  type SeoTree,
} from '@blog/core';

import { createClient } from './supabase/server';

/**
 * The one read behind both SEO screens.
 *
 * Three unfiltered selects and an in-memory assembly, rather than a nested
 * PostgREST embed. The tree needs every keyword under every page under every
 * topic, and an embed of that depth returns the same rows in a shape that then
 * has to be flattened anyway — while making "which page owns this keyword"
 * harder to reason about at the point where it matters.
 *
 * RLS scopes all three to sites the caller is an editor on, so the site_id
 * filters below are for correctness when someone administers several sites,
 * not for access control.
 */

/**
 * The scope bound.
 *
 * Research sets run to a few thousand keywords for a mature site — Nanotom
 * Capital is around 550 across 103 planned pages — so the whole tree is a
 * cheap read and paging it would break the roll-ups, which have to sum every
 * keyword to be true. The cap exists so an import gone wrong degrades into a
 * visible warning rather than a page that never renders.
 */
export const SEO_KEYWORD_LIMIT = 5000;

export type SeoScope = 'research' | 'roadmap';

export interface AdminSeoTree extends SeoTree {
  /** True when the keyword set hit the cap, so the screen can say so. */
  truncated: boolean;
  /** Pages held back by the scope filter — the Roadmap's "not briefed yet". */
  outOfScopePages: number;
}

/**
 * `research` returns every page and keyword, including keywords with no page.
 * `roadmap` returns only briefed-or-later pages and drops unclustered keywords,
 * so the roadmap does not fill up with research nobody has committed to.
 */
export async function loadSeoTree(
  siteId: string,
  scope: SeoScope,
): Promise<AdminSeoTree> {
  const supabase = await createClient();

  const [topics, pages, keywords] = await Promise.all([
    supabase
      .from('seo_topics')
      .select('*')
      .eq('site_id', siteId)
      .order('position')
      .order('name'),
    supabase.from('seo_pages').select('*').eq('site_id', siteId).order('position'),
    supabase
      .from('seo_keywords')
      .select('*')
      .eq('site_id', siteId)
      .order('volume', { ascending: false, nullsFirst: false })
      .limit(SEO_KEYWORD_LIMIT),
  ]);

  if (topics.error) throw new Error(`Failed to load SEO topics: ${topics.error.message}`);
  if (pages.error) throw new Error(`Failed to load SEO pages: ${pages.error.message}`);
  if (keywords.error)
    throw new Error(`Failed to load SEO keywords: ${keywords.error.message}`);

  const allPages = (pages.data ?? []) as SeoPageRow[];
  const inScope =
    scope === 'roadmap'
      ? allPages.filter((p) => (ROADMAP_STATUSES as readonly string[]).includes(p.status))
      : allPages;

  const tree = buildSeoTree(
    (topics.data ?? []) as SeoTopicRow[],
    inScope,
    (keywords.data ?? []) as SeoKeywordRow[],
    {
      includeUnassigned: scope === 'research',
      /*
       * Ordered in memory rather than by the select above, because the select
       * cannot do it: the roll-ups have to sum every keyword under a topic to
       * be true, so nothing can be filtered or paged away in SQL, and a few
       * hundred rows already in hand sort faster than a second round trip.
       * Which is also why 0014 adds no index.
       */
      orderBy: scope === 'roadmap' ? 'priority' : 'position',
    },
  );

  return {
    ...tree,
    truncated: (keywords.data ?? []).length >= SEO_KEYWORD_LIMIT,
    outOfScopePages: allPages.length - inScope.length,
  };
}

/**
 * Whether this site has any SEO rows at all.
 *
 * Both screens need it to tell "nothing researched yet" apart from "everything
 * is filtered out", which are the same empty tree but very different messages.
 */
export function isSeoTreeEmpty(tree: AdminSeoTree): boolean {
  return (
    tree.topics.length === 0 &&
    tree.unassigned.length === 0 &&
    tree.outOfScopePages === 0
  );
}
