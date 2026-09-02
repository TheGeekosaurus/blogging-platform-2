'use server';

import { revalidatePath } from 'next/cache';

import { slugify, type TermKind } from '@blog/core';

import { requireCurrentSite } from '@/lib/current-site';
import { revalidateSite } from '@/lib/revalidate';
import { createClient } from '@/lib/supabase/server';

export interface TermState {
  error?: string;
  saved?: boolean;
}

/**
 * Turn a Postgres constraint failure into something actionable.
 *
 * The hierarchy checks live in migration 0005 as triggers, so they surface as
 * raised exceptions rather than named constraints — matched on their message
 * text, which is why those texts are worth keeping stable.
 */
function describeTermError(message: string, kind: TermKind): string {
  if (message.includes('terms_slug_per_site_kind_unique')) {
    return `A ${kind} with that slug already exists.`;
  }
  if (message.includes('cannot be its own ancestor') || message.includes('likely a cycle')) {
    return 'That would put the category inside itself. Pick a different parent.';
  }
  if (message.includes('tags cannot be nested')) {
    return 'Tags cannot have a parent. Only categories nest.';
  }
  if (message.includes('does not exist')) {
    return 'That parent category no longer exists. Reload and try again.';
  }
  if (message.includes('belongs to a different site')) {
    return 'That parent belongs to another site.';
  }
  return message;
}

export async function createTerm(_prev: TermState, formData: FormData): Promise<TermState> {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const name = String(formData.get('name') ?? '').trim();
  const kind = (String(formData.get('kind') ?? 'category') as TermKind);
  const parentId = String(formData.get('parent_id') ?? '').trim() || null;

  if (!name) return { error: 'Give it a name.' };

  /*
   * Tags never nest. The `terms_tag_flat` trigger enforces this, but the form
   * hides the picker when Tag is selected, so a parent arriving with kind=tag
   * means the two controls got out of step — drop it rather than surfacing a
   * database error for something the user did not choose.
   */
  const { error } = await supabase.from('terms').insert({
    site_id: site.id,
    kind,
    name,
    slug: slugify(String(formData.get('slug') ?? '').trim() || name),
    parent_id: kind === 'category' ? parentId : null,
  });

  if (error) {
    return { error: describeTermError(error.message, kind) };
  }

  revalidatePath('/terms');
  await revalidateSite(site, { type: 'site' });
  return { saved: true };
}

export async function deleteTerm(formData: FormData) {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const id = String(formData.get('id') ?? '');

  // post_terms rows cascade, so posts keep existing and simply lose the label.
  const { error } = await supabase
    .from('terms')
    .delete()
    .eq('id', id)
    .eq('site_id', site.id);

  if (error) throw new Error(`Could not delete: ${error.message}`);

  revalidatePath('/terms');
  await revalidateSite(site, { type: 'site' });
}

/**
 * Re-parent a category, or move it to the top level.
 *
 * Nesting is set by choosing a parent, never by typing a path — the category URL
 * stays flat (/blog/category/<slug>) at any depth, so moving a category never
 * changes its URL or needs a redirect.
 */
export async function setTermParent(
  _prev: TermState,
  formData: FormData,
): Promise<TermState> {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const id = String(formData.get('id') ?? '');
  const parentId = String(formData.get('parent_id') ?? '').trim() || null;

  if (!id) return { error: 'No category given.' };
  if (parentId === id) {
    return { error: 'A category cannot be its own parent.' };
  }

  const { error } = await supabase
    .from('terms')
    .update({ parent_id: parentId })
    .eq('id', id)
    .eq('site_id', site.id)
    .eq('kind', 'category');

  if (error) return { error: describeTermError(error.message, 'category') };

  revalidatePath('/terms');
  // Archives list posts from the whole subtree, so moving a category changes
  // which posts several archive pages show.
  await revalidateSite(site, { type: 'site' });
  return { saved: true };
}
