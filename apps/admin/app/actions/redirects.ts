'use server';

import { revalidatePath } from 'next/cache';

import { requireCurrentSite } from '@/lib/current-site';
import { createClient } from '@/lib/supabase/server';

export interface RedirectState {
  error?: string;
  saved?: boolean;
}

/** The codes the table's check constraint allows. */
const CODES = [301, 302, 307, 308];

/**
 * Normalise a submitted path.
 *
 * A full URL pasted from a browser is the common input — someone copies
 * https://old.example.com/some-post/ out of the address bar — so the origin is
 * stripped rather than rejected. What is left must start with '/', which is
 * also what `redirects_from_is_path` enforces.
 *
 * `to` may legitimately be an absolute URL (redirecting off-site), so only
 * `from` is forced to a path.
 */
function readPath(value: FormDataEntryValue | null, { allowExternal = false } = {}): string {
  let raw = String(value ?? '').trim();

  if (allowExternal && /^https?:\/\//i.test(raw)) return raw;

  raw = raw.replace(/^https?:\/\/[^/]+/i, '');
  if (!raw.startsWith('/')) raw = `/${raw}`;

  // Collapse doubled slashes, which a hand-typed path picks up easily and which
  // would never match an incoming request.
  return raw.replace(/\/{2,}/g, '/');
}

export async function saveRedirect(
  _prev: RedirectState,
  formData: FormData,
): Promise<RedirectState> {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const from = readPath(formData.get('from_path'));
  const to = readPath(formData.get('to_path'), { allowExternal: true });
  const code = Number(formData.get('status_code') ?? 301);

  if (from === '/') {
    return { error: 'Refusing to redirect the homepage. That would take the whole site down.' };
  }

  // Checked on the RAW field, not on `to`: readPath turns an empty string into
  // '/', which is a legitimate destination — sending a retired URL to the
  // homepage is the commonest redirect there is.
  if (String(formData.get('to_path') ?? '').trim() === '') {
    return { error: 'A destination is required.' };
  }

  /*
   * Loops are checked here as well as by the constraint, because the constraint
   * only catches the trivial from === to case. A two-hop loop (/a → /b and
   * /b → /a) satisfies both rows individually and hangs a browser between them,
   * and it is the shape you actually create by fixing a redirect the wrong way
   * round.
   */
  if (from === to) {
    return { error: 'That redirect points at itself.' };
  }

  const { data: existing, error: readError } = await supabase
    .from('redirects')
    .select('id, from_path, to_path')
    .eq('site_id', site.id);

  if (readError) return { error: `Could not read the existing redirects: ${readError.message}` };

  const rows = existing ?? [];
  const id = String(formData.get('id') ?? '').trim() || null;

  const clash = rows.find((row) => row.from_path === from && row.id !== id);
  if (clash) {
    return { error: `${from} already redirects to ${clash.to_path}. Edit that rule instead.` };
  }

  const reverse = rows.find((row) => row.id !== id && row.from_path === to && row.to_path === from);
  if (reverse) {
    return {
      error: `That would loop: ${to} already redirects back to ${from}. Remove that rule first.`,
    };
  }

  // A destination that is itself redirected is a chain — legal, but it costs an
  // extra round trip and Google follows a limited number of hops.
  const chain = rows.find((row) => row.id !== id && row.from_path === to);
  if (chain) {
    return {
      error:
        `${to} is itself redirected, to ${chain.to_path}. ` +
        `Point this rule straight there instead of chaining.`,
    };
  }

  const row = {
    site_id: site.id,
    from_path: from,
    to_path: to,
    status_code: CODES.includes(code) ? code : 301,
  };

  const { error } = id
    ? await supabase.from('redirects').update(row).eq('id', id).eq('site_id', site.id)
    : await supabase.from('redirects').insert(row);

  if (error) {
    if (error.message.includes('redirects_from_per_site_unique')) {
      return { error: `${from} already has a redirect.` };
    }
    if (error.message.includes('redirects_from_is_path')) {
      return { error: 'The source must be a path on this site, starting with "/".' };
    }
    if (error.message.includes('row-level security')) {
      return { error: 'You do not have permission to write to this site.' };
    }
    return { error: error.message };
  }

  revalidatePath('/redirects');
  return { saved: true };
}

export async function deleteRedirect(formData: FormData) {
  const site = await requireCurrentSite();
  const supabase = await createClient();
  const id = String(formData.get('id') ?? '').trim();
  if (!id) return;

  await supabase.from('redirects').delete().eq('id', id).eq('site_id', site.id);
  revalidatePath('/redirects');
}
