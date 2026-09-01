import { siteSlug } from '@blog/core';

/**
 * Which deployment gets the hand-coded Nanotom Capital marketing site.
 *
 * `apps/blog` is deployed once PER BLOG, all pointing at the same codebase, so
 * anything site-specific has to be gated or every future blog inherits it. The
 * marketing chrome and homepage are the first genuinely site-specific code in
 * here; without this check, a second blog's deployment would render Nanotom
 * Capital's nav, footer and landing page.
 *
 * A site that is not this one keeps the generic chrome and the database-driven
 * homepage (`sites.homepage_page_id`, falling back to a post list).
 */
export const MARKETING_SITE_SLUG = 'nntm-capital';

export function isMarketingSite(): boolean {
  return siteSlug() === MARKETING_SITE_SLUG;
}
