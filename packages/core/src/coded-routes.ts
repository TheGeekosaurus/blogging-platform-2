/**
 * Pages that are React components in this repo rather than rows in `pages`.
 *
 * The marketing site's layouts carry third-party embeds, a bespoke grid and
 * brand CSS — that is code, not content, so it lives in
 * `apps/blog/components/marketing/`. But something has to know those URLs exist,
 * because two consumers cannot discover them by querying the database:
 *
 *   - `apps/blog/app/sitemap.ts`, which would otherwise omit them entirely. That
 *     is the expensive failure: an incomplete sitemap on a migration whose whole
 *     purpose is SEO, with nothing to notice it.
 *   - the admin's Pages screen, so a coded page is visible and previewable
 *     instead of appearing not to exist.
 *
 * IMPORTANT: adding an entry here is part of building a coded page, not an
 * afterthought. A page that renders but is missing from this list is invisible
 * to crawlers and to the admin, and nothing fails to tell you.
 *
 * This lives in `@blog/core` because it is the only module both apps import.
 * The alternative — the admin importing from `apps/blog` — would create an
 * app-to-app dependency that does not otherwise exist and drag public rendering
 * code into the admin's bundle.
 */

export type CodedRoute = {
  /**
   * No leading or trailing slash; '' is the homepage. Same convention as
   * `pages.path`, so `pagePath()` and `pageUrl()` work on both without a
   * special case.
   */
  path: string;
  /** Shown in the admin list. Not the page's <title>, which the route owns. */
  title: string;
  /** false keeps a route out of the sitemap — a thank-you page, say. */
  index: boolean;
};

/**
 * The site whose pages are coded. `apps/blog` is deployed once per blog from one
 * codebase, so this is what keeps another blog from inheriting these routes.
 */
export const MARKETING_SITE_SLUG = 'nntm-capital';

export const CODED_ROUTES: readonly CodedRoute[] = [
  { path: '', title: 'Home', index: true },
  { path: 'get-funded', title: 'Get Funded', index: true },
  // Still to build: programs, privacy-policy, terms-of-use,
  // cancellation-and-refund-policy, anti-spam-policy, dmca-policy,
  // earnings-disclaimer. Add each one here as it lands.
];

/** Coded routes belonging to a site, by slug. Empty for every other site. */
export function codedRoutesFor(siteSlug: string): readonly CodedRoute[] {
  return siteSlug === MARKETING_SITE_SLUG ? CODED_ROUTES : [];
}
