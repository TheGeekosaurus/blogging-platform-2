import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * NNTM Labs — the second hand-coded site.
 *
 * Two classes of regression are guarded here, and neither surfaces on its own.
 *
 * The first is a link that goes nowhere. The design's nav promises seven
 * destinations and only two are built, so the unbuilt ones deliberately carry
 * no href. Handing one an href before its route exists produces a 404 on the
 * site's primary navigation, and nothing in a build or a typecheck notices.
 *
 * The second is a form that accepts input and drops it. Neither the enquiry
 * form nor the newsletter has an endpoint, and the site's only conversion path
 * runs through the first of them. Enabling a field before wiring it means
 * leads land nowhere, silently, which is the most expensive failure on the
 * page and the least visible.
 */
const LABS = join(__dirname, '..', 'components', 'marketing', 'labs');
const read = (file: string) => readFileSync(join(LABS, file), 'utf8');

describe('every destination resolves', () => {
  it('gives a nav item an href only when its route exists', async () => {
    const { codedRoutesFor, NNTM_LABS_SLUG } = await import('@blog/core');
    const { NAV, FOOTER_COLUMNS, LEGAL_LINKS, SOCIAL_CARDS } = await import(
      '../components/marketing/labs/brand'
    );

    const coded = new Set(codedRoutesFor(NNTM_LABS_SLUG).map((route) => `/${route.path}`));
    // '' becomes '/', which the set above stores as '/'.
    expect(coded.has('/')).toBe(true);

    /*
     * Normalised to one shape before merging: social cards name their label
     * `name` where nav and footer links call it `label`, so a bare spread
     * type-errors on the union even though every member has an href.
     */
    const links = [
      ...NAV.map((item) => ({ label: item.label, href: item.href })),
      ...FOOTER_COLUMNS.flatMap((column) =>
        column.links.map((link) => ({ label: link.label, href: link.href })),
      ),
      ...LEGAL_LINKS.map((link) => ({ label: link.label, href: link.href })),
      ...SOCIAL_CARDS.map((card) => ({ label: card.name, href: card.href })),
    ].filter((item) => item.href);

    expect(links.length).toBeGreaterThan(0);

    for (const item of links) {
      const href = item.href as string;

      const resolves =
        coded.has(href) ||
        // The database-driven blog, which the /blog routes serve.
        href === '/blog' ||
        href.startsWith('/blog/') ||
        // An anchor into the homepage — '/#ask' is the enquiry form.
        href.startsWith('/#');

      expect(resolves, `${item.label} -> ${href}`).toBe(true);
    }
  });

  it('keeps the unbuilt nav items unlinked rather than pointing them at 404s', async () => {
    const { NAV } = await import('../components/marketing/labs/brand');

    const unbuilt = NAV.filter((item) => !item.href).map((item) => item.label);

    // If this list shrinks, the route should exist and be registered in
    // CODED_SITES — check that before updating the expectation.
    expect(unbuilt).toEqual(['Services', 'Projects', 'About', 'Careers']);
  });

  it('routes every call to action at one destination, so it moves in one edit', async () => {
    const { ENQUIRY_ANCHOR } = await import('../components/marketing/labs/brand');
    const home = read('home.tsx');

    expect(ENQUIRY_ANCHOR).toBe('/#ask');
    // The anchor the CTAs point at has to be an element that actually exists.
    expect(home).toContain('id="ask"');
    expect(home).not.toMatch(/href="\/contact/);
  });
});

describe('no form silently discards input', () => {
  it.each([
    ['the enquiry form', 'home.tsx', 3],
    ['the newsletter', 'site-footer.tsx', 1],
  ])('%s is disabled until it has an endpoint', (_label, file, controls) => {
    const source = read(file);
    const disabled = source.match(/\bdisabled\b/g) ?? [];

    expect(disabled.length).toBeGreaterThanOrEqual(controls);
    // A bare <form> would submit to the current URL on Enter and look like it
    // worked. There is deliberately no form element in either.
    expect(source).not.toMatch(/<form[\s>]/);
  });
});

describe('the marquees loop seamlessly', () => {
  /*
   * The track holds the strip twice and travels exactly -50%, so copy two
   * lands where copy one began. Rendering it once, or animating -100%, scrolls
   * the strip off screen and snaps back — obvious in motion, invisible in a
   * screenshot and in every other test.
   */
  it('renders the strip twice and travels half the track', () => {
    const primitives = read('primitives.tsx');
    const css = readFileSync(join(__dirname, '..', 'app', 'globals.css'), 'utf8');

    expect(primitives).toContain('strip(false)');
    expect(primitives).toContain('strip(true)');
    expect(css).toContain('translate3d(-50%, 0, 0)');
  });

  it('stops for readers who ask for reduced motion', () => {
    const css = readFileSync(join(__dirname, '..', 'app', 'globals.css'), 'utf8');
    const block = css.slice(css.indexOf('.nl-marquee'));

    expect(block).toContain('prefers-reduced-motion: reduce');
    // Halted, not hidden: the strip is the service list, and it has to stay
    // readable when it is not moving.
    expect(block).not.toMatch(/prefers-reduced-motion[^}]*display:\s*none/);
  });
});

describe('the NNTM Labs palette meets WCAG AA', () => {
  const CSS = readFileSync(join(__dirname, '..', 'app', 'globals.css'), 'utf8');

  function token(name: string): string {
    const match = CSS.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8});`));
    if (!match?.[1]) throw new Error(`token --${name} not found in globals.css`);
    return match[1];
  }

  function luminance(hex: string): number {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
    const channel = (pair: string) => {
      const v = parseInt(pair, 16) / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return (
      0.2126 * channel(full.slice(0, 2)) +
      0.7152 * channel(full.slice(2, 4)) +
      0.0722 * channel(full.slice(4, 6))
    );
  }

  function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
    return (hi + 0.05) / (lo + 0.05);
  }

  const SURFACES = ['nl-bg', 'nl-card', 'nl-raised'] as const;

  /*
   * Every text tone against every surface it can land on. The template's own
   * muted grey was #676665, which measures 2.88:1 on --nl-raised — it is the
   * reason this suite exists rather than trusting the design file. See the
   * palette comment in globals.css.
   */
  it.each(['nl-ink', 'nl-body', 'nl-muted', 'nl-accent'])(
    '--%s clears 4.5:1 on every surface',
    (name) => {
      for (const surface of SURFACES) {
        const ratio = contrast(token(name), token(surface));
        expect(ratio, `--${name} on --${surface} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(
          4.5,
        );
      }
    },
  );

  it('puts dark ink on the accent band, not white', () => {
    // #0F0F0F on the accent is 6.15:1; white is 3.10:1 and fails for body copy.
    // The closing CTA is a full-width band of exactly this pairing.
    const accent = token('nl-accent');
    expect(contrast('#0f0f0f', accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#ffffff', accent)).toBeLessThan(4.5);
    expect(read('home.tsx')).toContain('text-[#0f0f0f]');
  });
});

describe('the chrome stays server-rendered', () => {
  /*
   * Capital's header is a server component on purpose, and the same reasoning
   * applies here: a `useState` menu toggle would put a client bundle on every
   * route of the site, the blog included, to do what <details> does natively.
   */
  it.each(['site-header.tsx', 'site-footer.tsx', 'home.tsx', 'primitives.tsx'])(
    '%s ships no client bundle',
    (file) => {
      expect(read(file)).not.toMatch(/^'use client';/m);
    },
  );

  it('opens the mobile menu with <details>, not JavaScript', () => {
    /*
     * Comments stripped first. The header's own docstring names `useState`
     * while explaining why it is not used, and matching that mention would
     * fail the test for the presence of the sentence that documents the rule —
     * the same trap the site-footer test above hits with the old subdomain.
     */
    const header = read('site-header.tsx')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/\/\/.*$/gm, '');

    expect(header).toContain('<details');
    expect(header).not.toContain('useState');
  });
});

describe('the homepage renders', () => {
  /**
   * Server-rendering the real components, not asserting on their source.
   *
   * Everything above reads files, which catches wiring but not a component
   * that throws — a bad icon key, a map lookup that returns undefined, a
   * `.map` over something that is not an array. None of those fail a typecheck
   * when the key is a string, and the first place they would otherwise appear
   * is a failed production build against a live database.
   */
  async function render() {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { LabsHome } = await import('../components/marketing/labs/home');
    const { LabsHeader } = await import('../components/marketing/labs/site-header');
    const { LabsFooter } = await import('../components/marketing/labs/site-footer');

    return [LabsHeader, LabsHome, LabsFooter]
      .map((Component) => renderToStaticMarkup(React.createElement(Component)))
      .join('');
  }

  it('puts every section on the page', async () => {
    const html = await render();
    const { SECTIONS, SERVICES, FAQS, TESTIMONIALS, HERO, CLOSING_CTA } = await import(
      '../components/marketing/labs/content'
    );

    for (const line of HERO.headingLines) expect(html).toContain(line);
    for (const heading of Object.values(SECTIONS)) expect(html).toContain(heading);
    for (const service of SERVICES) {
      expect(html, service.title).toContain(service.title);
      expect(html, service.price).toContain(service.price);
    }
    for (const faq of FAQS) expect(html).toContain(faq.question);
    for (const person of TESTIMONIALS) expect(html).toContain(person.name);
    expect(html).toContain(CLOSING_CTA.heading);
  });

  it('renders unbuilt nav destinations as text, not anchors', async () => {
    const html = await render();
    const { NAV } = await import('../components/marketing/labs/brand');

    for (const item of NAV.filter((nav) => !nav.href)) {
      expect(html, item.label).toContain(item.label);
      // No anchor anywhere carries this label as its whole text.
      expect(html, item.label).not.toMatch(
        new RegExp(`<a[^>]*>\\s*${item.label}\\s*</a>`),
      );
    }
  });

  it('gives every image alt text, and decorative avatars an empty one', async () => {
    const html = await render();
    const alts = [...html.matchAll(/<img[^>]*\balt="([^"]*)"/g)].map((m) => m[1]);

    expect(alts.length).toBeGreaterThan(0);
    // Avatars sit beside the name they depict, so they are decorative and take
    // alt="" rather than repeating the name to a screen reader.
    expect(alts.some((alt) => alt === '')).toBe(true);
    expect(alts.some((alt) => alt && alt.length > 0)).toBe(true);
  });
});

describe('the radius scale matches the artwork', () => {
  /*
   * The design has seven radius steps, measured off its path geometry. This
   * was first built with two (24 panel / 16 card), which read visibly too
   * round because collapsing the scale pushed every small control up to a
   * pill. A pill and a 12px rounded rect are different shapes, and the
   * difference is loudest along the header where seven of them sit in a row.
   *
   * Fully round is correct in exactly three places, so this does not ban
   * `rounded-full` outright — it bans it on the controls the artwork gives a
   * radius to.
   */
  const CSS = readFileSync(join(__dirname, '..', 'app', 'globals.css'), 'utf8');

  it('declares every step the components reference', () => {
    for (const step of [
      'badge',
      'input',
      'control',
      'card',
      'card-lg',
      'block',
      'panel',
    ]) {
      expect(CSS, step).toMatch(new RegExp(`--nl-radius-${step}:\\s*\\d+px;`));
    }
  });

  it('gives the header nav rounded rectangles, not pills', () => {
    const header = read('site-header.tsx');
    const navClasses = header.slice(
      header.indexOf('function navClasses'),
      header.indexOf('function NavLink'),
    );

    expect(navClasses).toContain('--nl-radius-control');
    expect(navClasses).not.toContain('rounded-full');
  });

  it('leaves only the arrow rings, avatars and metadata pills fully round', () => {
    /*
     * Every remaining `rounded-full` should be one of those three. Counted
     * rather than located, so a new pill anywhere in the section components
     * trips this and has to be justified by updating the count.
     */
    const pills = ['home.tsx', 'primitives.tsx', 'site-footer.tsx', 'site-header.tsx']
      .flatMap((file) => read(file).match(/rounded-full/g) ?? []);

    expect(pills.length).toBeLessThanOrEqual(9);
  });
});

describe('the success stories switch without JavaScript', () => {
  /*
   * The tabs are a radio group styled with CSS — no client component, so the
   * page still ships none of its own JavaScript. What can regress silently:
   * the default panel, the per-story grouping, and the CSS that does the
   * switching. All three fail invisibly (a page that looks right and does
   * nothing), so they are pinned rather than eyeballed.
   */
  const CSS = readFileSync(join(__dirname, '..', 'app', 'globals.css'), 'utf8');

  it('offers exactly Before and After, defaulting to the outcome', async () => {
    const { STORY_TABS, DEFAULT_STORY_TAB } = await import(
      '../components/marketing/labs/content'
    );

    expect([...STORY_TABS]).toEqual(['Before', 'After']);
    expect(DEFAULT_STORY_TAB).toBe('After');
  });

  it('gives every story a panel for every tab', async () => {
    const { SUCCESS_STORIES, STORY_TABS } = await import(
      '../components/marketing/labs/content'
    );

    for (const story of SUCCESS_STORIES) {
      for (const tab of STORY_TABS) {
        const panel = story.panels[tab.toLowerCase() as 'before' | 'after'];
        expect(panel?.heading, `${story.client}/${tab}`).toBeTruthy();
        expect(panel?.body, `${story.client}/${tab}`).toBeTruthy();
      }
    }
  });

  it('renders one checked radio per story, in its own group', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { LabsHome } = await import('../components/marketing/labs/home');
    const html = renderToStaticMarkup(React.createElement(LabsHome));

    const groups = new Set([...html.matchAll(/name="(nl-story-[^"]+)"/g)].map((m) => m[1]));
    const { SUCCESS_STORIES } = await import('../components/marketing/labs/content');

    // One group per story: a shared name would make the two switch together.
    expect(groups.size).toBe(SUCCESS_STORIES.length);
    // One default per story, and it is the "after" input.
    const checked = [...html.matchAll(/<input[^>]*checked[^>]*>/g)].map((m) => m[0]);
    expect(checked).toHaveLength(SUCCESS_STORIES.length);
    for (const input of checked) expect(input).toContain('value="after"');
  });

  it('keeps the switching in CSS, with a readable no-:has() fallback', () => {
    const block = CSS.slice(CSS.indexOf('.nl-tab-panel'));

    // The panel swap needs :has() because panels are not siblings of the inputs.
    expect(block).toContain(":has(input[value='before']:checked)");
    // The label highlight does not — it is a plain adjacent sibling.
    expect(block).toContain('input:checked + [data-tab-label]');
    /*
     * Only "before" is hidden by default. If both were, a browser without
     * :has() would render two empty cards instead of the outcome panel.
     */
    const bareRule = (tab: string) =>
      // Anchored to the start of a line, so this matches only the DEFAULT rule
      // and not the `:has(...) .nl-tab-panel[data-tab='after']` one, which
      // legitimately hides "after" while "before" is selected.
      new RegExp(`(^|\\n)\\s*\\.nl-tab-panel\\[data-tab='${tab}'\\]\\s*\\{\\s*display:\\s*none`);

    expect(block).toMatch(bareRule('before'));
    expect(block).not.toMatch(bareRule('after'));
  });
});

describe('the stat band', () => {
  it('renders every figure and the trailing call', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { LabsHome } = await import('../components/marketing/labs/home');
    const { STATS, STATS_CTA } = await import('../components/marketing/labs/content');
    const html = renderToStaticMarkup(React.createElement(LabsHome));

    expect(STATS.length).toBeGreaterThan(0);
    for (const stat of STATS) {
      expect(html, stat.label).toContain(stat.label);
      expect(html, stat.value).toContain(stat.value);
    }
    expect(html).toContain(STATS_CTA);
  });
});
