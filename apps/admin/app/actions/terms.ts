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

export async function createTerm(_prev: TermState, formData: FormData): Promise<TermState> {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const name = String(formData.get('name') ?? '').trim();
  const kind = (String(formData.get('kind') ?? 'category') as TermKind);

  if (!name) return { error: 'Give it a name.' };

  const { error } = await supabase.from('terms').insert({
    site_id: site.id,
    kind,
    name,
    slug: slugify(String(formData.get('slug') ?? '').trim() || name),
  });

  if (error) {
    return {
      error: error.message.includes('terms_slug_per_site_kind_unique')
        ? `A ${kind} with that slug already exists.`
        : error.message,
    };
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
