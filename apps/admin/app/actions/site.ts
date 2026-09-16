'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { readGtmContainerId } from '@blog/core';

import { requireCurrentSite, SITE_COOKIE } from '@/lib/current-site';
import { revalidateSite } from '@/lib/revalidate';
import { readStructuredData } from '@/lib/structured-data';
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

  /*
   * An empty field means "no tracking on this site", which is a legitimate and
   * common answer — so only a non-empty value is validated, and a rejected one
   * stops the save rather than being silently dropped. Silently dropping it is
   * what the old analytics_id field effectively did: it stored anything and the
   * site rendered none of it, so a typo and a correct id were indistinguishable
   * from this screen.
   *
   * Mirrors the sites_gtm_container_format constraint, so the author gets a
   * usable message instead of a raw Postgres error.
   */
  const gtmInput = String(formData.get('gtm_container_id') ?? '').trim();
  const gtm = readGtmContainerId(gtmInput);

  if (gtmInput && !gtm) {
    return {
      error:
        `"${gtmInput}" is not a Google Tag Manager container id. ` +
        `They look like GTM-XXXXXXX — copy it from the container's own page in ` +
        `Tag Manager. Leave the field empty to turn tracking off for this site.`,
    };
  }

  const structured = readStructuredData(formData);
  if ('error' in structured) return { error: structured.error };

  const { error } = await supabase
    .from('sites')
    .update({
      name: String(formData.get('name') ?? '').trim(),
      description: String(formData.get('description') ?? '').trim() || null,
      base_url: baseUrl,
      locale: String(formData.get('locale') ?? 'en').trim() || 'en',
      gtm_container_id: gtm,
      structured_data: structured.nodes,
    })
    .eq('id', site.id);

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');

  /*
   * Refresh the LIVE site, not just this dashboard.
   *
   * This used to stop at the revalidatePath above, which only purges the
   * admin's own cache. That was survivable while the form held nothing the
   * public site renders per-page — but site-wide structured data is emitted in
   * the blog's root layout, so it is on every route, and editing it without
   * this call would appear to work and change nothing a reader sees until
   * somebody happened to press Flush cache.
   *
   * The updated base_url is what gets flushed, not the stored one: this is the
   * form where that value changes, and the old origin is the one place the
   * purge definitely does not need to go.
   */
  const refresh = await revalidateSite({ ...site, base_url: baseUrl }, { type: 'site' });

  if (!refresh.ok) {
    return {
      saved: true,
      warning:
        `Settings saved, but the live site was not refreshed: ${refresh.error}. ` +
        `Use "Flush cache" below once the blog is reachable.`,
    };
  }

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
