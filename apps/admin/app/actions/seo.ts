'use server';

import { parsePriority, type SeoPagePriority } from '@blog/core';

import { requireCurrentSite } from '@/lib/current-site';
import { createClient } from '@/lib/supabase/server';

export interface SeoPageState {
  error?: string;
}

/**
 * Rank a planned page, or clear its rank.
 *
 * The only write in the SEO section, and narrow on purpose. 0013 left these
 * screens read-only because which page should own a keyword is settled against
 * a live SERP, and a drag-to-reorder UI would invite exactly the guesswork the
 * research replaces. Priority is the one field that argument does not cover: it
 * is a judgement about what to do next, not a claim about what ranks, and there
 * is nowhere else to record it.
 *
 * A PLAIN CALL, not a form action. The control autosaves on select, so there is
 * no form to submit and no FormData to parse — and the caller needs the result
 * synchronously to decide whether to revert the select. `parsePriority` still
 * guards the value, because `null` arrives here for "cleared" and anything else
 * would be rejected by the enum at the database anyway.
 */
export async function setPagePriority(
  pageId: string,
  next: SeoPagePriority | null,
): Promise<SeoPageState> {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const id = pageId.trim();
  if (!id) return { error: 'No page given.' };

  const priority = parsePriority(next);

  const { error } = await supabase
    .from('seo_pages')
    .update({ priority })
    // `site_id` as well as `id`, matching every other action here. RLS already
    // scopes writes to sites the caller edits; this stops a stale form from one
    // site updating a row in another.
    .eq('id', id)
    .eq('site_id', site.id);

  if (error) return { error: `Could not save: ${error.message}` };

  /*
   * NO revalidatePath AT ALL, and that is the whole deferral.
   *
   * Priority is the Roadmap's first sort key, so re-rendering this screen
   * re-sorts it — moving the row out from under the pointer and, because React
   * reorders with insertBefore, blurring the control and dropping focus to
   * <body> on every change. The picker calls router.refresh() on blur instead,
   * so the value commits immediately and the queue reorders once you have
   * finished with the control.
   *
   * Revalidating '/keywords' is not a way round it: measured, it re-renders the
   * Roadmap too, which is exactly the instant re-sort this is avoiding. Nothing
   * is lost by dropping it — both screens are `force-dynamic`, so neither is in
   * the full route cache, and Next's client router cache has a stale time of
   * zero for dynamic routes, so navigating to Keywords refetches regardless.
   */
  return {};
}
