import { MARKETING_SITE_SLUG, siteSlug } from '@blog/core';

/**
 * Whether this deployment is the hand-coded marketing site.
 *
 * `apps/blog` is deployed once PER BLOG against one shared codebase, so anything
 * site-specific has to be gated or every future blog inherits it. Without this
 * check a second blog's deployment would render Nanotom Capital's nav, footer and
 * landing page on its own domain.
 *
 * The slug itself lives in `@blog/core`'s coded-route registry, which the admin
 * also reads. The predicate stays here because it depends on `SITE_SLUG`, an
 * environment variable only the blog sets — the admin serves every site at once
 * and has no single current slug to compare against.
 */
export { MARKETING_SITE_SLUG };

export function isMarketingSite(): boolean {
  return siteSlug() === MARKETING_SITE_SLUG;
}
