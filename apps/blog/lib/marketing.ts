import { NNTM_CAPITAL_SLUG, NNTM_LABS_SLUG, isCodedSite, siteSlug } from '@blog/core';

/**
 * Which hand-coded site, if any, this deployment is serving.
 *
 * `apps/blog` is deployed once PER BLOG against one shared codebase, so anything
 * site-specific has to be gated or every future blog inherits it. Without these
 * checks a third blog's deployment would render Nanotom Capital's nav and footer
 * — or Nanotom Labs' — on its own domain.
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

/** The Nanotom Labs deployment: the agency site. */
export function isNntmLabs(): boolean {
  return siteSlug() === NNTM_LABS_SLUG;
}

/** A destination for the sidebar's standing call to action. */
export type SidebarCta = {
  label: string;
  /** A coded route on this same deployment, so it is always a real page. */
  href: string;
};

/**
 * The button pinned to the bottom of a post's sidebar panel.
 *
 * Per site, and null for a database-driven blog — which is the case that makes
 * this a function rather than a constant. `apps/blog` is one codebase deployed
 * once per blog, so a hard-coded "Get Funded" would follow Capital's copy onto
 * every future client's domain.
 *
 * The href is deliberately a route from the coded-route registry above rather
 * than a free-text URL: a CTA pointing at a page this deployment does not serve
 * is a 404 at the end of every article, and nothing would fail to say so.
 */
export function sidebarCta(): SidebarCta | null {
  switch (codedSite()) {
    case NNTM_CAPITAL_SLUG:
      return { label: 'Get Funded', href: '/get-funded' };
    case NNTM_LABS_SLUG:
      return { label: 'Get Started', href: '/get-started' };
    default:
      return null;
  }
}
