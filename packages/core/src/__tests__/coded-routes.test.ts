import { describe, expect, it } from 'vitest';

import {
  CODED_SITES,
  NNTM_CAPITAL_SLUG,
  NNTM_LABS_SLUG,
  codedRoutesFor,
  isCodedSite,
  pagePath,
  pageUrl,
} from '../index';

/**
 * This registry is the only thing that knows coded pages exist. Two consumers
 * depend on its shape — the sitemap and the admin's Pages list — and both fail
 * quietly if it drifts, so the invariants are pinned here rather than trusted.
 *
 * Everything below iterates CODED_SITES rather than naming one site. When this
 * held a single hardcoded list, an invariant that passed for Capital said
 * nothing about the next site added — which is precisely when a silent sitemap
 * omission would ship.
 */
const SITES = Object.entries(CODED_SITES);

describe('codedRoutesFor', () => {
  it('returns the routes for every registered coded site', () => {
    expect(SITES.length).toBeGreaterThan(1);

    for (const [slug, routes] of SITES) {
      expect(codedRoutesFor(slug), slug).toBe(routes);
      expect(codedRoutesFor(slug).length, slug).toBeGreaterThan(0);
    }
  });

  it('registers the two sites the blog app has chrome for', () => {
    expect(isCodedSite(NNTM_CAPITAL_SLUG)).toBe(true);
    expect(isCodedSite(NNTM_LABS_SLUG)).toBe(true);
  });

  it('returns nothing for any other site', () => {
    // apps/blog is deployed once per blog from one codebase; a second blog must
    // not inherit another company's routes in its sitemap or its admin.
    for (const slug of ['demo', 'second-blog', 'nntm-capital-staging', 'nntm', '']) {
      expect(codedRoutesFor(slug), slug).toHaveLength(0);
      expect(isCodedSite(slug), slug).toBe(false);
    }
  });

  it('does not answer for inherited Object properties', () => {
    // CODED_SITES is an object literal, so a bare `slug in CODED_SITES` would
    // report true for 'toString' and hand a prototype method to the sitemap.
    for (const slug of ['toString', 'constructor', 'hasOwnProperty', '__proto__']) {
      expect(isCodedSite(slug), slug).toBe(false);
      expect(codedRoutesFor(slug), slug).toHaveLength(0);
    }
  });
});

describe('CODED_SITES entries', () => {
  it.each(SITES)('%s stores paths without surrounding slashes, like pages.path', (_slug, routes) => {
    // A stray leading slash would make pagePath() produce '//programs' and
    // pageUrl() a doubled path — a broken sitemap entry, silently.
    for (const route of routes) {
      expect(route.path, JSON.stringify(route)).not.toMatch(/^\//);
      expect(route.path, JSON.stringify(route)).not.toMatch(/\/$/);
    }
  });

  it.each(SITES)('%s produces well-formed URLs through the shared helpers', (_slug, routes) => {
    const site = { base_url: 'https://example.test' };

    for (const route of routes) {
      const url = pageUrl(site, pagePath(route.path));
      expect(url.startsWith('https://example.test/'), url).toBe(true);
      // Check the PATH for a doubled slash; the scheme legitimately has one.
      expect(new URL(url).pathname, url).not.toContain('//');
      // Every page URL carries the trailing slash the site actually serves.
      expect(url.endsWith('/'), url).toBe(true);
    }
  });

  it.each(SITES)('%s has a homepage entry, which the admin uses to hide a dead control', (_slug, routes) => {
    expect(routes.some((route) => route.path === '')).toBe(true);
  });

  it.each(SITES)('%s has unique paths', (_slug, routes) => {
    const paths = routes.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
