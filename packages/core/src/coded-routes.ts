/**
 * Pages that are React components in this repo rather than rows in `pages`.
 *
 * Some sites' layouts carry third-party embeds, a bespoke grid and brand CSS —
 * that is code, not content, so it lives in `apps/blog/components/marketing/`.
 * But something has to know those URLs exist, because two consumers cannot
 * discover them by querying the database:
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
 * The sites whose pages are coded.
 *
 * `apps/blog` is deployed once per blog from one codebase, so these slugs are
 * what keeps one company's routes off another's domain. This started as a
 * single slug and a single route list, on the reasoning that one hand-coded
 * site was the exception rather than a category. A second one — Nanotom Labs —
 * made that shape untenable: a boolean cannot say WHICH coded site a deployment
 * is, only that it is one, and the chrome differs completely between them.
 */
export const NNTM_CAPITAL_SLUG = 'nntm-capital';
export const NNTM_LABS_SLUG = 'nntm-labs';

/** Nanotom Capital: the funding site migrated off HighLevel. */
const NNTM_CAPITAL_ROUTES: readonly CodedRoute[] = [
  { path: '', title: 'Home', index: true },
  { path: 'get-funded', title: 'Get Funded', index: true },
  /*
   * The loan calculator. It answered on this path as a rewrite to
   * calc.nanotomcapital.com until it became a route in this repo, which is why
   * it was absent from this list while the URL already worked: a rewrite is
   * invisible to both consumers this registry serves.
   */
  { path: 'calc', title: 'Loan Calculator', index: true },
  /*
   * The loans index. Its five children — business-loans, line-of-credit,
   * revenue-based-financing, working-capital, equipment-financing — are still
   * STUB_PAGES and deliberately absent here: a stub is noindex, so listing one
   * in the sitemap would submit a page that asks not to be indexed.
   */
  { path: 'funding-solutions', title: 'Funding Solutions', index: true },
  // Still to build: programs, privacy-policy, terms-of-use,
  // cancellation-and-refund-policy, anti-spam-policy, dmca-policy,
  // earnings-disclaimer. Add each one here as it lands.
];

/**
 * Nanotom Labs: the agency site.
 *
 * The homepage and /services so far. Projects, about and contact are still to
 * come, and each is a coded route rather than a `pages` row — add them here as
 * they land, or they will not reach the sitemap. `blogs` is deliberately
 * absent: it points at the database-driven /blog renderer, which the sitemap
 * already covers from `posts`.
 */
const NNTM_LABS_ROUTES: readonly CodedRoute[] = [
  { path: '', title: 'Home', index: true },
  { path: 'services', title: 'Services', index: true },
];

/**
 * Coded routes by site slug.
 *
 * Exported so a test can walk every site's list rather than only the one it
 * happens to name — a per-site invariant that holds for Capital and silently
 * fails for Labs is the failure mode this registry exists to prevent.
 */
export const CODED_SITES: Readonly<Record<string, readonly CodedRoute[]>> = {
  [NNTM_CAPITAL_SLUG]: NNTM_CAPITAL_ROUTES,
  [NNTM_LABS_SLUG]: NNTM_LABS_ROUTES,
};

/**
 * Shared empty result, so a database-driven blog gets a stable reference rather
 * than a fresh array per call. `codedRoutesFor` runs in the sitemap and in the
 * admin's Pages screen, both of which may call it repeatedly.
 */
const NO_CODED_ROUTES: readonly CodedRoute[] = [];

/**
 * Coded routes belonging to a site, by slug. Empty for every other site.
 *
 * `Object.hasOwn` rather than a bare index read: slugs come from the database,
 * and `CODED_SITES['toString']` resolves up the prototype chain to a function
 * rather than to undefined, so `?? NO_CODED_ROUTES` would not catch it. The
 * sitemap would then call `.filter` on a function and fail the whole static
 * build. Far-fetched as a slug, free to rule out.
 */
export function codedRoutesFor(siteSlug: string): readonly CodedRoute[] {
  if (!Object.hasOwn(CODED_SITES, siteSlug)) return NO_CODED_ROUTES;
  return CODED_SITES[siteSlug] ?? NO_CODED_ROUTES;
}

/** Whether a slug names a site whose pages are coded rather than content. */
export function isCodedSite(siteSlug: string): boolean {
  return Object.hasOwn(CODED_SITES, siteSlug);
}
