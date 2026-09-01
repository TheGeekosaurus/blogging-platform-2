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

describe('the HighLevel survey embed', () => {
  async function source() {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    return readFileSync(
      join(__dirname, '..', 'components', 'marketing', 'highlevel-form.tsx'),
      'utf8',
    );
  }

  it('points at the account\'s white-labelled host, not the canonical one', async () => {
    const { SURVEY } = await import('../components/marketing/brand');

    expect(SURVEY.host).toBe('https://link.mailsengr.com');
    expect(SURVEY.kind).toBe('survey');
    expect(SURVEY.id).toBe('iMvBFKUm0M5CxTrlVGOf');
  });

  it('does not reference the hosts this account is NOT on', async () => {
    // Both were in the first implementation, written before the embed code was
    // available. api.leadconnectorhq.com happens to serve this survey too, but
    // link.msgsndr.com does not serve this account's resizer at all.
    const code = (await source())
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/\/\/.*$/gm, '');

    expect(code).not.toContain('api.leadconnectorhq.com');
    expect(code).not.toContain('link.msgsndr.com');
  });

  /*
   * The regression this guards is invisible: form_embed.js resolves the iframe by
   * getElementById(<id posted back by the survey>). Drop the id attribute and the
   * survey still renders — it just never resizes, staying clipped at
   * initialHeight, with no console error and no failing request.
   */
  it('gives the iframe the id the resize handler looks up', async () => {
    expect(await source()).toContain('id={SURVEY.id}');
  });

  it('loads the resizer after hydration, so the iframe already exists', async () => {
    const code = await source();
    expect(code).toContain("strategy=\"afterInteractive\"");
    // A bare <script src> would be hoisted into <head> and could run too early.
    expect(code).not.toMatch(/<script\s+src=/);
  });

  it('reserves a height so the sections below it do not jump', async () => {
    const { SURVEY } = await import('../components/marketing/brand');
    expect(SURVEY.initialHeight).toBeGreaterThan(0);
    expect(await source()).toContain('height: SURVEY.initialHeight');
  });
});
