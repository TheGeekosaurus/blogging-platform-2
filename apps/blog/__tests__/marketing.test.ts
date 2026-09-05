import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

  /*
   * This guard used to assert the opposite — that the dropdown items had NO
   * href, because HighLevel never built their pages and the header greyed them
   * out. They have destinations now, and every one resolves: either a coded
   * route, the calculator rewrite, or a STUB_PAGES entry the pages catch-all
   * answers with a heading. The invariant worth pinning is no longer "no links",
   * it is "no link that 404s".
   */
  it('points every nav item somewhere that resolves', async () => {
    const { CODED_ROUTES } = await import('@blog/core');
    const { NAV, STUB_PAGES } = await import('../components/marketing/brand');

    const coded = new Set(CODED_ROUTES.map((route) => `/${route.path}`));
    const stubs = new Set(Object.keys(STUB_PAGES).map((path) => `/${path}`));
    // Proxied to the calculator deployment by a rewrite in next.config.ts.
    const rewritten = new Set(['/calc']);

    const links = NAV.flatMap((item) => [item, ...(item.children ?? [])]).filter(
      (item) => item.href,
    );

    expect(links.length).toBeGreaterThan(0);

    for (const item of links) {
      const href = item.href as string;
      if (item.external) {
        expect(href, item.label).toMatch(/^https?:\/\//);
        continue;
      }
      expect(
        coded.has(href) || stubs.has(href) || rewritten.has(href),
        `${item.label} -> ${href} resolves to a page, a stub or the calc rewrite`,
      ).toBe(true);
    }
  });

  it('keeps the phone number out of the header and in the footer', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const read = (file: string) =>
      readFileSync(join(__dirname, '..', 'components', 'marketing', file), 'utf8');

    // One phone number, one place. Two in the header split the click.
    expect(read('site-header.tsx')).not.toContain('CONTACT.phone');
    expect(read('site-footer.tsx')).toContain('CONTACT.phone');
  });
});

describe('the SocialJuice review wall', () => {
  async function source() {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    return readFileSync(
      join(__dirname, '..', 'components', 'marketing', 'testimonial-wall.tsx'),
      'utf8',
    );
  }

  it('embeds this account\'s wall', async () => {
    const { REVIEWS } = await import('../components/marketing/brand');

    expect(REVIEWS.wallUrl).toContain('embed.socialjuice.io/wall/9690');
    expect(REVIEWS.wallUrl).toContain('s=nntm-capital');
  });

  /*
   * The same invisible regression the HighLevel iframe has, and the reason both
   * are pinned: iframeResizer resolves its target from a selector built off this
   * id. Change one without the other and the wall still renders — it just never
   * resizes, staying clipped at initialHeight, with nothing logged anywhere.
   */
  it('points the resizer at the id the iframe actually carries', async () => {
    const code = await source();
    const id = code.match(/const FRAME_ID = '([^']+)'/)?.[1];

    expect(id, 'FRAME_ID should be a string literal the test can read').toBeTruthy();
    expect(code).toContain('id={FRAME_ID}');
    expect(code).toContain('`#${FRAME_ID}`');
  });

  it('calls the resizer from onLoad, so the library is there when it runs', async () => {
    const code = await source();

    // Next only guarantees script ORDER for beforeInteractive, so an inline call
    // beside the <Script src> could run before iFrameResize exists. onLoad is the
    // documented mechanism — and it is why this component is client-side.
    expect(code).toContain("strategy=\"afterInteractive\"");
    expect(code).toContain('onLoad=');
    expect(code).toMatch(/^'use client';/);
    // A bare <script src> would be hoisted into <head> and could run too early.
    expect(code).not.toMatch(/<script\s+src=/);
  });

  it('reserves a height so the sections below it do not jump', async () => {
    const { REVIEWS } = await import('../components/marketing/brand');

    expect(REVIEWS.initialHeight).toBeGreaterThan(0);
    expect(await source()).toContain('height: REVIEWS.initialHeight');
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

describe('the page ground is one colour', () => {
  /**
   * The header and the footer sit at opposite ends of every marketing page, so
   * nothing on screen ever shows them together — which is exactly why they
   * drifted apart. The header moved to #141414 when /home-v2 landed and the
   * footer stayed on --color-brand (#0B0B0C), and the mismatch survived until
   * someone scrolled the whole page and noticed.
   *
   * Asserting they name the SAME token, rather than that each equals some hex:
   * the point is that there is one declaration to change, not two that happen
   * to agree today.
   */
  const read = (...parts: string[]) =>
    readFileSync(join(__dirname, '..', ...parts), 'utf8');

  it('declares the ground once', () => {
    const css = read('app', 'globals.css');
    const declarations = css.match(/--color-ground:\s*#[0-9a-fA-F]{6}/g) ?? [];

    expect(declarations).toHaveLength(1);
    expect(declarations[0]).toContain('#141414');
  });

  it.each([
    ['header', ['components', 'marketing', 'header-shell.tsx']],
    ['footer', ['components', 'marketing', 'site-footer.tsx']],
  ])('the %s paints with it', (_label, parts) => {
    expect(read(...parts)).toContain('bg-[var(--color-ground)]');
  });

  it('does not leave the footer on the old brand ink', () => {
    expect(read('components', 'marketing', 'site-footer.tsx')).not.toContain(
      'bg-[var(--color-brand)]',
    );
  });

  it('gives the blog and /home-v2 the same ground', () => {
    const css = read('app', 'globals.css');

    // Aliases, not copies of the hex — one edit repaints all four surfaces.
    expect(css).toContain('--color-blog-bg: var(--color-ground)');
    expect(css).toContain('--ft-bg: var(--color-ground)');
  });

  it('leaves --color-brand alone for the original homepage', () => {
    // Still the ground of the first homepage's dark bands. Repointing it would
    // have restyled a page nobody asked to change.
    expect(read('app', 'globals.css')).toContain('--color-brand: #0b0b0c');
  });
});
