'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { SOCIAL_PLATFORMS, slugify, type SocialLinks } from '@blog/core';

import { requireCurrentSite } from '@/lib/current-site';
import { revalidateSite } from '@/lib/revalidate';
import { createClient } from '@/lib/supabase/server';

export interface AuthorState {
  error?: string;
  savedId?: string;
}

/** Turn a Postgres constraint failure into something actionable. */
function describeAuthorError(message: string): string {
  if (message.includes('authors_slug_per_site_unique')) {
    return 'Another author already uses that URL slug. Pick a different one.';
  }
  if (message.includes('authors_slug_valid')) {
    return 'A slug is one URL segment — no slashes or spaces.';
  }
  if (message.includes('authors_name_present')) {
    return 'Give the author a name.';
  }
  return message;
}

/**
 * Read the five social URLs off the form, keeping only usable ones.
 *
 * Two things this refuses on purpose. A blank field is dropped rather than
 * stored as an empty string, so `social` holds only platforms actually filled
 * in and rendering can be a plain loop. And anything that is not http(s) is
 * dropped outright — this value ends up in an `href`, and `javascript:` in an
 * href is a scripting vector, not a broken link.
 *
 * A dropped entry is silent by design: the field is right there, still holding
 * what was typed, and an error banner for a half-typed URL would fire on every
 * save. The same filter runs again at render time (`socialLinks` in core), so
 * a bad value that reaches the column some other way still cannot be linked.
 */
function readSocial(formData: FormData): SocialLinks {
  const out: SocialLinks = {};

  for (const platform of SOCIAL_PLATFORMS) {
    const value = String(formData.get(`social_${platform}`) ?? '').trim();
    if (value && /^https?:\/\//i.test(value)) out[platform] = value;
  }

  return out;
}

export async function saveAuthor(
  _prev: AuthorState,
  formData: FormData,
): Promise<AuthorState> {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const id = String(formData.get('id') ?? '').trim() || null;
  const name = String(formData.get('name') ?? '').trim();

  if (!name) return { error: 'Give the author a name.' };

  // Derived from the name when left blank, exactly as a post's slug is.
  const slug = slugify(String(formData.get('slug') ?? '').trim() || name);

  const row = {
    site_id: site.id,
    name,
    slug,
    title: String(formData.get('title') ?? '').trim() || null,
    bio: String(formData.get('bio') ?? '').trim() || null,
    // Empty string means "no avatar". The column is a nullable FK, so '' would
    // be rejected as a malformed uuid.
    avatar_id: String(formData.get('avatar_id') ?? '').trim() || null,
    social: readSocial(formData),
  };

  let authorId = id;

  if (id) {
    const { error } = await supabase
      .from('authors')
      .update(row)
      .eq('id', id)
      .eq('site_id', site.id);

    if (error) return { error: describeAuthorError(error.message) };
  } else {
    const { data, error } = await supabase
      .from('authors')
      .insert(row)
      .select('id')
      .single();

    if (error) return { error: describeAuthorError(error.message) };
    authorId = data.id;
  }

  revalidatePath('/authors');

  /*
   * A whole-site refresh, not a per-post one. An author's name or photo appears
   * on every post they are attached to plus the index cards, and the admin does
   * not know which those are without another query — which is exactly what a
   * site-level target is for.
   */
  await revalidateSite(site, { type: 'site' });

  return { savedId: authorId ?? undefined };
}

export async function deleteAuthor(formData: FormData) {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const id = String(formData.get('id') ?? '');

  // posts.byline_id is `on delete set null`, so the posts survive and fall back
  // to their free-text byline. A delete costs the photo and the links, never
  // the writing.
  const { error } = await supabase
    .from('authors')
    .delete()
    .eq('id', id)
    .eq('site_id', site.id);

  if (error) throw new Error(`Could not delete the author: ${error.message}`);

  await revalidateSite(site, { type: 'site' });
  revalidatePath('/authors');
  redirect('/authors');
}
