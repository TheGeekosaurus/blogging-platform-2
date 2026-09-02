import { describe, expect, it } from 'vitest';

import {
  CODED_ROUTES,
  MARKETING_SITE_SLUG,
  codedRoutesFor,
  pagePath,
  pageUrl,
} from '../index';

/**
 * This registry is the only thing that knows coded pages exist. Two consumers
 * depend on its shape — the sitemap and the admin's Pages list — and both fail
 * quietly if it drifts, so the invariants are pinned here rather than trusted.
 */
describe('codedRoutesFor', () => {
  it('returns the routes for the marketing slug', () => {
    expect(codedRoutesFor(MARKETING_SITE_SLUG)).toBe(CODED_ROUTES);
    expect(codedRoutesFor(MARKETING_SITE_SLUG).length).toBeGreaterThan(0);
  });

  it('returns nothing for any other site', () => {
    // apps/blog is deployed once per blog from one codebase; a second blog must
    // not inherit another company's routes in its sitemap or its admin.
    for (const slug of ['demo', 'second-blog', 'nntm-capital-staging', '']) {
      expect(codedRoutesFor(slug), slug).toHaveLength(0);
    }
  });
});

describe('CODED_ROUTES entries', () => {
  it('store paths without surrounding slashes, like pages.path does', () => {
    // A stray leading slash would make pagePath() produce '//programs' and
    // pageUrl() a doubled path — a broken sitemap entry, silently.
    for (const route of CODED_ROUTES) {
      expect(route.path, JSON.stringify(route)).not.toMatch(/^\//);
      expect(route.path, JSON.stringify(route)).not.toMatch(/\/$/);
    }
  });

  it('produce well-formed URLs through the shared helpers', () => {
    const site = { base_url: 'https://example.test' };

    for (const route of CODED_ROUTES) {
      const url = pageUrl(site, pagePath(route.path));
      expect(url.startsWith('https://example.test/'), url).toBe(true);
      // Check the PATH for a doubled slash; the scheme legitimately has one.
      expect(new URL(url).pathname, url).not.toContain('//');
      // Every page URL carries the trailing slash the site actually serves.
      expect(url.endsWith('/'), url).toBe(true);
    }
  });

  it('has a homepage entry, which the admin uses to hide a dead control', () => {
    expect(CODED_ROUTES.some((route) => route.path === '')).toBe(true);
  });

  it('has unique paths', () => {
    const paths = CODED_ROUTES.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
