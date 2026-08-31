'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { requireCurrentSite, SITE_COOKIE } from '@/lib/current-site';
import { revalidateSite } from '@/lib/revalidate';
import { createClient } from '@/lib/supabase/server';

export async function switchSite(formData: FormData) {
  const siteId = String(formData.get('site_id') ?? '');
  if (!siteId) return;

  (await cookies()).set(SITE_COOKIE, siteId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath('/', 'layout');
}

export interface SettingsState {
  error?: string;
  saved?: boolean;
  warning?: string;
}

export async function saveSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const site = await requireCurrentSite();
  const supabase = await createClient();

  const baseUrl = String(formData.get('base_url') ?? '').trim().replace(/\/+$/, '');

  // Mirrors the sites_base_url_format check constraint, so the author gets a
  // usable message instead of a raw Postgres error.
  if (!/^https?:\/\/[^/]+$/.test(baseUrl)) {
    return { error: 'Base URL must be an origin like https://example.com, with no path.' };
  }

  const { error } = await supabase
    .from('sites')
    .update({
      name: String(formData.get('name') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim() || null,
      base_url: baseUrl,
      locale: String(formData.get('locale') ?? 'en').trim() || 'en',
      analytics_id: String(formData.get('analytics_id') ?? '').trim() || null,
    })
    .eq('id', site.id);

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  return { saved: true };
}

/** Manual recovery when a publish failed to refresh the live site. */
export async function flushCache(): Promise<SettingsState> {
  const site = await requireCurrentSite();
  const result = await revalidateSite(site, { type: 'site' });

  return result.ok
    ? { saved: true }
    : { error: `Could not refresh the live site: ${result.error}` };
}
