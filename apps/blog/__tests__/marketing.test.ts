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

describe('codedSite', () => {
  it('names the Nanotom Capital deployment', async () => {
    const { codedSite, isNntmCapital, isNntmLabs, NNTM_CAPITAL_SLUG } =
      await loadWithSlug('nntm-capital');
    expect(NNTM_CAPITAL_SLUG).toBe('nntm-capital');
    expect(codedSite()).toBe('nntm-capital');
    expect(isNntmCapital()).toBe(true);
    // The two coded sites must never both answer true: the root layout would
    // then render one company's header above the other's footer.
    expect(isNntmLabs()).toBe(false);
  });

  it('names the Nanotom Labs deployment', async () => {
    const { codedSite, isNntmCapital, isNntmLabs, NNTM_LABS_SLUG } =
      await loadWithSlug('nntm-labs');
    expect(NNTM_LABS_SLUG).toBe('nntm-labs');
    expect(codedSite()).toBe('nntm-labs');
    expect(isNntmLabs()).toBe(true);
    expect(isNntmCapital()).toBe(false);
  });

  it('is null for any other blog, which keeps the generic chrome', async () => {
    for (const slug of ['demo', 'second-blog', 'nntm-capital-staging', 'nntm-labs-staging']) {
      const { codedSite, isNntmCapital, isNntmLabs } = await loadWithSlug(slug);
      expect(codedSite(), slug).toBeNull();
      expect(isNntmCapital(), slug).toBe(false);
      expect(isNntmLabs(), slug).toBe(false);
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
   * route or a STUB_PAGES entry the pages catch-all answers with a heading. The
   * invariant worth pinning is no longer "no links", it is "no link that 404s".
   *
   * /calc was a third case here — a rewrite to the calculator's own deployment,
   * which resolved without being either. It is a coded route now, so the
   * exception is gone; if this list ever needs one again, that is the sign a URL
   * is resolving by configuration nothing else can see.
   */
  it('points every nav item somewhere that resolves', async () => {
    const { codedRoutesFor, NNTM_CAPITAL_SLUG } = await import('@blog/core');
    const { NAV, STUB_PAGES } = await import('../components/marketing/brand');

    const coded = new Set(
      codedRoutesFor(NNTM_CAPITAL_SLUG).map((route) => `/${route.path}`),
    );
    const stubs = new Set(Object.keys(STUB_PAGES).map((path) => `/${path}`));

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
        coded.has(href) || stubs.has(href),
        `${item.label} -> ${href} resolves to a coded page or a stub`,
      ).toBe(true);
    }
  });

  /*
   * This used to assert the phone was in the footer and not the header, on the
   * argument that two numbers in the header split the click. Denis has since
   * had the footer's contact column removed as well, so the number is in
   * NEITHER piece of site chrome.
   *
   * What the test protects is therefore no longer "one place" but "still
   * reachable somewhere": a phone number that exists in brand.ts and is dialled
   * from nowhere is a number the business thinks it is publishing and is not.
   * The calculator's advisor prompts and the FAQ's "Ask a Question" button are
   * what carry it now, so the assertion follows them.
   */
  it('still dials the phone number somewhere, now that no chrome shows it', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const marketing = join(__dirname, '..', 'components', 'marketing');
    const read = (file: string) => readFileSync(join(marketing, file), 'utf8');

    expect(read('site-header.tsx')).not.toContain('CONTACT.phone');
    expect(read('site-footer.tsx')).not.toContain('CONTACT.phone');

    const { CONTACT } = await import('../components/marketing/brand');
    const reachable =
      read(join('ft', 'calculator.tsx')).includes('CONTACT.phoneHref') ||
      read(join('ft', 'content.ts')).includes(CONTACT.phoneHref);

    expect(reachable, 'CONTACT.phoneHref is dialled from at least one page').toBe(true);
  });
});

describe('the review wall', () => {
  /*
   * These are real customers' words, lifted from the SocialJuice wall this
   * section used to embed. The risk with copy nobody can read at a glance is
   * that someone tidies it — "reccomend" looks like a typo to fix, and fixing
   * it turns a quote into a paraphrase we are attributing to a named person.
   */
  it('quotes the reviews exactly, typos included', async () => {
    const { TESTIMONIALS } = await import('../components/marketing/ft/content');
    const quotes = TESTIMONIALS.reviews.map((review) => review.quote);

    expect(quotes.some((quote) => quote.includes('Would reccomend.'))).toBe(true);
    expect(quotes.some((quote) => quote.includes('very straight forward process'))).toBe(true);
  });

  /*
   * The four-star review is the one that says the funding took four days
   * instead of two. Rounding it up would be inventing a rating the customer
   * did not give, so the score is carried per review rather than assumed.
   */
  it('keeps every score as it was given', async () => {
    const { TESTIMONIALS } = await import('../components/marketing/ft/content');
    const scores = TESTIMONIALS.reviews.map((review) => review.score);

    expect(scores).toContain(4);
    for (const score of scores) {
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(5);
    }
  });

  /*
   * The grid is six columns so a short final row widens to fill it. The cells
   * are hairline-separated with `gap-px` over a container painted --ft-line, so
   * a column left empty is not blank — it is a solid bar of rule colour across
   * the bottom of the section. Every row has to add up to six.
   */
  it('lays every row out to a full six columns', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { TESTIMONIALS } = await import('../components/marketing/ft/content');

    const code = readFileSync(
      join(__dirname, '..', 'components', 'marketing', 'ft', 'home-v2.tsx'),
      'utf8',
    );

    const spans = Object.fromEntries(
      [...code.matchAll(/^\s*(\d): 'lg:col-span-(\d)',$/gm)].map(([, cells, span]) => [
        Number(cells),
        Number(span),
      ]),
    );

    // Tailwind only emits classes it can find written out, so these are literals.
    expect(spans).toEqual({ 1: 6, 2: 3, 3: 2 });

    const lastRow = TESTIMONIALS.reviews.length % 3 || 3;
    expect(lastRow * (spans[lastRow] ?? 0)).toBe(6);
  });

  it('still sends "View All Testimonials" to the wall that collects them', async () => {
    const { REVIEWS } = await import('../components/marketing/brand');

    expect(REVIEWS.collectUrl).toContain('collect.socialjuice.io');
  });

  /*
   * The embed is gone, and so is everything it needed: a client component to
   * call iFrameResize after the library loaded, a preconnect, a reserved height
   * and a bodyBackground option to stop the wall rendering as white space. If
   * any of that comes back without the iframe, it is dead weight on every page.
   */
  it('ships nothing the old iframe needed', async () => {
    const { readFileSync, existsSync } = await import('node:fs');
    const { join } = await import('node:path');
    const root = join(__dirname, '..');

    expect(existsSync(join(root, 'components', 'marketing', 'testimonial-wall.tsx'))).toBe(false);

    for (const file of [
      join(root, 'app', 'layout.tsx'),
      join(root, 'components', 'marketing', 'ft', 'home-v2.tsx'),
      join(root, 'components', 'marketing', 'brand.ts'),
    ]) {
      expect(readFileSync(file, 'utf8')).not.toContain('embed.socialjuice.io');
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

  it('declares the ground once, and re-points it only for the light theme', () => {
    const css = read('app', 'globals.css');

    /*
     * The selector sits on the line carrying that rule's opening brace — every
     * rule in this file is written that way, so reading it back is enough to
     * tell a theme override apart from the drift this test exists to catch.
     */
    const declarations = [...css.matchAll(/--color-ground:\s*(#[0-9a-fA-F]{6})/g)].map((match) => {
      const open = css.lastIndexOf('{', match.index);
      return { selector: css.slice(0, open).split('\n').pop()!.trim(), hex: match[1] };
    });

    /*
     * `.ft-light` is the light palette at the bottom of the file, which moves
     * the ground for the whole document on purpose. Every OTHER declaration is
     * still held to one: a second value anywhere else is the header and footer
     * drifting apart again, which is what this test was written for.
     */
    const base = declarations.filter((one) => one.selector !== '.ft-light');

    expect(base.map((one) => one.hex)).toEqual(['#141414']);
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

  it('leaves --color-brand alone', () => {
    /*
     * A separate ink from the ground, and still declared. The first homepage's
     * dark bands were its main consumer and that page is gone; what remains is
     * --color-brand-raised, the panel behind the header and mobile-nav
     * dropdowns, which is read against this value rather than against the
     * ground. Repointing it would restyle those.
     */
    expect(read('app', 'globals.css')).toContain('--color-brand: #0b0b0c');
  });
});
