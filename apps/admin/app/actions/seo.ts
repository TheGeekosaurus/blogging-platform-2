'use server';

import { revalidatePath } from 'next/cache';

import { parsePriority } from '@blog/core';

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
 * An empty submission clears the column rather than writing 'low'. Unranked is
 * a real state — see 0014 — and taking a rank off has to be possible, otherwise
 * a mis-click is permanent.
 */
export async function setPagePriority(
  _prev: SeoPageState,
  formData: FormData,
): Promise<SeoPageState> {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const id = String(formData.get('id') ?? '').trim();
  if (!id) return { error: 'No page given.' };

  // parsePriority returns null for '' AND for anything unrecognised, which is
  // the same write either way: the enum would reject a bad value at the
  // database, and clearing is the honest reading of "not one of the three".
  const priority = parsePriority(formData.get('priority'));

  const { error } = await supabase
    .from('seo_pages')
    .update({ priority })
    // `site_id` as well as `id`, matching every other action here. RLS already
    // scopes writes to sites the caller edits; this stops a stale form from one
    // site updating a row in another.
    .eq('id', id)
    .eq('site_id', site.id);

  if (error) return { error: `Could not save: ${error.message}` };

  revalidatePath('/roadmap');
  // The Keywords screen renders the same rows and does not sort by priority,
  // but it reads from the same cache entry, so it goes stale too.
  revalidatePath('/keywords');

  return {};
}
