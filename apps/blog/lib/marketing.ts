import { NNTM_CAPITAL_SLUG, NNTM_LABS_SLUG, isCodedSite, siteSlug } from '@blog/core';

/**
 * Which hand-coded site, if any, this deployment is serving.
 *
 * `apps/blog` is deployed once PER BLOG against one shared codebase, so anything
 * site-specific has to be gated or every future blog inherits it. Without these
 * checks a third blog's deployment would render Nanotom Capital's nav and footer
 * — or NNTM Labs' — on its own domain.
 *
 * The slugs themselves live in `@blog/core`'s coded-route registry, which the
 * admin also reads. The predicates stay here because they depend on `SITE_SLUG`,
 * an environment variable only the blog sets — the admin serves every site at
 * once and has no single current slug to compare against.
 *
 * This replaced a single `isMarketingSite()` boolean. A boolean could say that a
 * deployment was the coded site but not WHICH one, which stops working the
 * moment there are two with completely different chrome.
 */
export type CodedSiteSlug = typeof NNTM_CAPITAL_SLUG | typeof NNTM_LABS_SLUG;

export { NNTM_CAPITAL_SLUG, NNTM_LABS_SLUG };

/**
 * The coded site this deployment serves, or null for a database-driven blog.
 *
 * Returns the slug rather than a boolean so callers can `switch` on it — the
 * root layout picks a header and footer this way, and a missing case is then a
 * type error rather than a silently generic page.
 */
export function codedSite(): CodedSiteSlug | null {
  const slug = siteSlug();
  return isCodedSite(slug) ? (slug as CodedSiteSlug) : null;
}

/** The Nanotom Capital deployment: funding marketing chrome and /get-funded. */
export function isNntmCapital(): boolean {
  return siteSlug() === NNTM_CAPITAL_SLUG;
}

/** The NNTM Labs deployment: the agency site. */
export function isNntmLabs(): boolean {
  return siteSlug() === NNTM_LABS_SLUG;
}
