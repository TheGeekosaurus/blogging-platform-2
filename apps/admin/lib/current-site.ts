import { cookies } from 'next/headers';
import { cache } from 'react';

import type { SiteRow } from '@blog/core';

import { createClient } from './supabase/server';

const COOKIE = 'admin_site_id';

/**
 * Sites the signed-in user can administer.
 *
 * RLS scopes this: `sites` is publicly readable, so the membership join is what
 * actually restricts the list. A user with no site_members row sees nothing,
 * which is the expected state before the owner row is seeded.
 */
export const listMySites = cache(async (): Promise<SiteRow[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('site_members')
    .select('site:sites(*)')
    .order('site_id');

  if (error) throw new Error(`Failed to list sites: ${error.message}`);

  return (data ?? [])
    .map((row) => (Array.isArray(row.site) ? row.site[0] : row.site))
    .filter((site): site is SiteRow => Boolean(site));
});

/**
 * The site currently being edited: the cookie selection if it is still one the
 * user can reach, otherwise the first available.
 */
export const getCurrentSite = cache(async (): Promise<SiteRow | null> => {
  const sites = await listMySites();
  if (sites.length === 0) return null;

  const selected = (await cookies()).get(COOKIE)?.value;
  return sites.find((site) => site.id === selected) ?? sites[0] ?? null;
});

export async function requireCurrentSite(): Promise<SiteRow> {
  const site = await getCurrentSite();
  if (!site) {
    throw new Error(
      'This account is not a member of any site. Seed a site_members row — ' +
        'see docs/DEPLOYMENT.md.',
    );
  }
  return site;
}

export const SITE_COOKIE = COOKIE;
