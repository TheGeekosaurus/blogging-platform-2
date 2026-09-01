import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * `apps/blog` is deployed once per blog against one shared codebase, so the
 * hand-coded Nanotom Capital chrome and homepage have to be gated on SITE_SLUG.
 * Without the gate a second blog's deployment would silently serve another
 * company's navigation, footer and landing page — a mistake nobody would notice
 * until it was live on a real domain.
 */
async function loadWithSlug(slug: string) {
  vi.resetModules();
  process.env.SITE_SLUG = slug;
  return import('../lib/marketing');
}

const ORIGINAL = process.env.SITE_SLUG;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.SITE_SLUG;
  else process.env.SITE_SLUG = ORIGINAL;
  vi.resetModules();
});

describe('isMarketingSite', () => {
  it('is true only for the marketing slug', async () => {
    const { isMarketingSite, MARKETING_SITE_SLUG } = await loadWithSlug('nntm-capital');
    expect(MARKETING_SITE_SLUG).toBe('nntm-capital');
    expect(isMarketingSite()).toBe(true);
  });

  it('is false for any other blog, which keeps the generic chrome', async () => {
    for (const slug of ['demo', 'second-blog', 'nntm-capital-staging']) {
      const { isMarketingSite } = await loadWithSlug(slug);
      expect(isMarketingSite(), slug).toBe(false);
    }
  });
});

describe('brand constants', () => {
  it('links Blog Articles to /blog on this domain, not the old subdomain', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const footer = readFileSync(
      join(__dirname, '..', 'components', 'marketing', 'site-footer.tsx'),
      'utf8',
    );

    // Strip comments first: the footer's own docstring names the old subdomain
    // while explaining why it is gone, and that mention is not a link.
    const code = footer.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    // The entire point of the migration: one domain, no blog. subdomain.
    expect(code).not.toContain('blog.nanotomcapital.com');
    expect(code).toContain('blogIndexPath()');
  });

  it('ships no dead hrefs for the nav items HighLevel never built', async () => {
    const { NAV } = await import('../components/marketing/brand');
    const unbuilt = NAV.flatMap((item) => item.children ?? []);

    expect(unbuilt.length).toBeGreaterThan(0);
    // `#new-menu-item` is what the live site ships. None of it reaches here.
    for (const child of unbuilt) {
      expect(child.href, child.label).toBeUndefined();
    }
  });
});
