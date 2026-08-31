import { cache } from 'react';

import { createPublicClient, requireSiteBySlug, siteSlug, type Client, type SiteRow } from '@blog/core';

/**
 * Per-render memoised access to the site row and Supabase client.
 *
 * `cache()` dedupes within a single render pass, so a page that needs the site
 * in both `generateMetadata` and the component body makes one query, not two.
 * Across build passes it re-queries, which is fine — this only runs at build and
 * revalidation time, never on a visitor request.
 */

export const getClient = cache((): Client => createPublicClient());

export const getSite = cache(async (): Promise<SiteRow> => {
  return requireSiteBySlug(getClient(), siteSlug());
});
