'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import {
  CTA_LAYOUTS,
  CTA_THEMES,
  normaliseLinkHref,
  slugify,
  type CtaKind,
  type LeadMagnetScope,
} from '@blog/core';

import { requireCurrentSite } from '@/lib/current-site';
import { revalidateSite } from '@/lib/revalidate';
import { createClient } from '@/lib/supabase/server';

export interface LeadMagnetState {
  error?: string;
  savedId?: string;
  /**
   * Set when the row saved but the live site could not be told about it.
   *
   * Reported rather than rolled back, matching how a post save already
   * behaves: the write succeeded, and pretending otherwise would have the
   * editor redo work that is already done. **Flush cache** in site settings
   * retries it.
   */
  staleWarning?: string;
}

function describeError(message: string): string {
  if (message.includes('lead_magnets_slug_per_site_unique')) {
    return 'Another offer already uses that key. Pick a different one.';
  }
  if (message.includes('lead_magnets_slug_format')) {
    return 'A key is lowercase letters, numbers and hyphens — no spaces.';
  }
  if (message.includes('lead_magnets_asset_url_http')) {
    return 'The file link has to start with http:// or https://.';
  }
  if (message.includes('lead_magnets_heading_present')) {
    return 'Give the card a headline — it is the first thing a reader sees.';
  }
  if (message.includes('lead_magnets_button_label_present')) {
    return 'The button needs a label.';
  }
  if (message.includes('lead_magnets_name_present')) {
    return 'Give the offer a name so you can find it in this list.';
  }
  return message;
}

/**
 * Read the targeting checkboxes back into rows.
 *
 * The form posts three groups of ids plus a site-wide flag; the scope is
 * implied by which group a value came from, never sent by the browser. That
 * matters because scope is what the specificity ranking is built on — accepting
 * it from the client would let a stale form label a category rule as a post
 * rule and quietly outrank everything.
 */
function readTargets(
  formData: FormData,
): Array<{ scope: LeadMagnetScope; term_id: string | null; post_id: string | null }> {
  const out: Array<{ scope: LeadMagnetScope; term_id: string | null; post_id: string | null }> = [];

  if (formData.get('target_site') === 'on') {
    out.push({ scope: 'site', term_id: null, post_id: null });
  }

  for (const id of formData.getAll('target_category')) {
    out.push({ scope: 'category', term_id: String(id), post_id: null });
  }

  for (const id of formData.getAll('target_tag')) {
    out.push({ scope: 'tag', term_id: String(id), post_id: null });
  }

  for (const id of formData.getAll('target_post')) {
    out.push({ scope: 'post', term_id: null, post_id: String(id) });
  }

  return out;
}

/**
 * Narrow a submitted value to one of an enum's members.
 *
 * A select can only send what it rendered, so this is not defending against a
 * user — it is making the type true at the boundary, where `formData.get`
 * hands back `FormDataEntryValue | null` and everything downstream is typed.
 */
function readEnum<T extends string>(
  value: FormDataEntryValue | null,
  allowed: readonly T[],
  fallback: T,
): T {
  const raw = String(value ?? '');
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

export async function saveLeadMagnet(
  _prev: LeadMagnetState,
  formData: FormData,
): Promise<LeadMagnetState> {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const id = String(formData.get('id') ?? '').trim() || null;
  const name = String(formData.get('name') ?? '').trim();
  const heading = String(formData.get('heading') ?? '').trim();

  if (!name) return { error: 'Give the offer a name so you can find it in this list.' };
  if (!heading) {
    return { error: 'Give the card a headline — it is the first thing a reader sees.' };
  }

  const buttonLabel = String(formData.get('button_label') ?? '').trim();
  const successMessage = String(formData.get('success_message') ?? '').trim();

  /*
   * What the block DOES, and where it goes.
   *
   * The database has check constraints for both halves of this — a link with
   * no href, and an email block carrying a stale one — so the job here is to
   * turn those into sentences rather than to be the only line of defence. An
   * href is normalised through the same helper the editor's link field uses,
   * so "example.com/apply" becomes a real URL instead of being rejected at the
   * constraint as neither a path nor a scheme.
   */
  const kind: CtaKind = formData.get('kind') === 'link' ? 'link' : 'email';
  let href: string | null = null;

  if (kind === 'link') {
    const raw = String(formData.get('href') ?? '').trim();
    if (!raw) {
      return { error: 'A link block needs somewhere to go. Add a destination.' };
    }
    const parsed = normaliseLinkHref(raw);
    if (!parsed.ok) return { error: parsed.error };
    href = parsed.href;
  }

  const layout = readEnum(formData.get('layout'), CTA_LAYOUTS, 'banner');
  const theme = readEnum(formData.get('theme'), CTA_THEMES, 'surface');

  const row = {
    site_id: site.id,
    // Derived from the name when left blank, exactly as an author's slug is.
    slug: slugify(String(formData.get('slug') ?? '').trim() || name),
    name,
    heading,
    body: String(formData.get('body') ?? '').trim() || null,
    // Falling back to the column default rather than storing '' — both columns
    // are NOT NULL with a non-empty check, so a blank field has to become
    // something.
    button_label: buttonLabel || 'Send it to me',
    success_message: successMessage || 'Check your inbox — it is on the way.',
    collect_name: formData.get('collect_name') === 'on',
    // Empty string means "no image". The column is a nullable FK, so '' would
    // be rejected as a malformed uuid — the same trap as an author's avatar.
    image_id: String(formData.get('image_id') ?? '').trim() || null,
    consent_text: String(formData.get('consent_text') ?? '').trim() || null,
    asset_url: String(formData.get('asset_url') ?? '').trim() || null,
    active: formData.get('active') === 'on',
    kind,
    href,
    layout,
    theme,
    accent_border: formData.get('accent_border') === 'on',
    eyebrow: String(formData.get('eyebrow') ?? '').trim() || null,
  };

  let magnetId = id;

  if (id) {
    const { error } = await supabase
      .from('lead_magnets')
      .update(row)
      .eq('id', id)
      .eq('site_id', site.id);

    if (error) return { error: describeError(error.message) };
  } else {
    const { data, error } = await supabase
      .from('lead_magnets')
      .insert(row)
      .select('id')
      .single();

    if (error) return { error: describeError(error.message) };
    magnetId = data.id;
  }

  if (!magnetId) return { error: 'Saved, but the offer came back without an id.' };

  /*
   * Targeting is replaced wholesale: delete every rule, insert what the form
   * posted.
   *
   * A diff would be fewer statements and more ways to be wrong — the form
   * always sends the complete set, so any rule not in it is one the editor
   * unticked. The window between the two statements is not a real risk here:
   * the only reader is a build, and a build that catches it renders no offer
   * for that one post rather than a wrong one.
   */
  const { error: clearError } = await supabase
    .from('lead_magnet_targets')
    .delete()
    .eq('magnet_id', magnetId);

  if (clearError) return { error: `Could not update targeting: ${clearError.message}` };

  const targets = readTargets(formData);

  if (targets.length > 0) {
    const { error: insertError } = await supabase
      .from('lead_magnet_targets')
      .insert(targets.map((target) => ({ ...target, magnet_id: magnetId })));

    if (insertError) {
      return { error: `Could not update targeting: ${insertError.message}` };
    }
  }

  revalidatePath('/lead-magnets');
  revalidatePath(`/lead-magnets/${magnetId}`);

  /*
   * A whole-site refresh, like an author edit, and for a stronger reason.
   *
   * Post pages are `force-static` with no timer, so the offer a post shows was
   * decided when that post was last rendered. Changing the copy, or aiming a
   * rule at a category, affects an unknown set of posts — and "unknown" is the
   * operative word: the admin cannot enumerate them without walking the
   * taxonomy, which is exactly what a site-level target avoids. Without this,
   * saving would appear to work and change nothing a reader can see.
   */
  const refreshed = await revalidateSite(site, { type: 'site' });

  return {
    savedId: magnetId,
    staleWarning: refreshed.ok
      ? undefined
      : `Saved, but the live site still shows the old version: ${refreshed.error}`,
  };
}

export async function deleteLeadMagnet(formData: FormData) {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const id = String(formData.get('id') ?? '');

  /*
   * The leads survive. `leads.magnet_id` is `on delete set null` and each row
   * keeps its own copy of the slug, so deleting an offer costs the copy and
   * the targeting, never the addresses it collected.
   *
   * Turning an offer OFF is usually what is wanted instead, and the list
   * screen says so — that keeps the copy too.
   */
  const { error } = await supabase
    .from('lead_magnets')
    .delete()
    .eq('id', id)
    .eq('site_id', site.id);

  if (error) throw new Error(`Could not delete the offer: ${error.message}`);

  await revalidateSite(site, { type: 'site' });
  revalidatePath('/lead-magnets');
  redirect('/lead-magnets');
}
