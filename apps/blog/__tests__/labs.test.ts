import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Nanotom Labs — the second hand-coded site.
 *
 * Two classes of regression are guarded here, and neither surfaces on its own.
 *
 * The first is a link that goes nowhere. Three of the nav's destinations are
 * built and the rest deliberately carry no href. Handing one an href before
 * its route exists produces a 404 on the site's primary navigation, and
 * nothing in a build or a typecheck notices.
 *
 * The second is a form that accepts input and drops it. Neither the enquiry
 * form nor the newsletter has an endpoint, and the site's only conversion path
 * runs through the first of them. Enabling a field before wiring it means
 * leads land nowhere, silently, which is the most expensive failure on the
 * page and the least visible.
 */
const LABS = join(__dirname, '..', 'components', 'marketing', 'labs');
const read = (file: string) => readFileSync(join(LABS, file), 'utf8');

/**
 * Rendered markup with HTML entities decoded.
 *
 * The copy carries apostrophes, ampersands and em dashes — "Facebook &
 * Instagram Ads", "a website that\'s built to convert" — and
 * renderToStaticMarkup escapes them, so asserting against the raw markup fails
 * for exactly the strings most worth pinning, and fails in a way that looks
 * like the copy is missing from the page. Decoding makes the assertion mean
 * what it reads as: is this sentence on the page.
 *
 * `&amp;` is decoded LAST, so an escaped entity in the source (`&amp;#x27;`)
 * does not get unwrapped twice into a character that was never rendered.
 */
function decoded(html: string): string {
  return html
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

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

      /*
       * Off-site links are checked for SHAPE, not existence. The footer's
       * social cards point at real profiles this suite cannot reach, so the
       * invariant worth holding is that they are absolute and https — a
       * relative one would 404 on this domain, and http would be downgraded or
       * blocked.
       */
      if (/^https?:\/\//.test(href)) {
        expect(href, item.label).toMatch(/^https:\/\//);
        continue;
      }

      const resolves =
        coded.has(href) ||
        // The database-driven blog, which the /blog routes serve.
        href === '/blog' ||
        href.startsWith('/blog/') ||
        // An anchor into a coded page — '/#ask' is the homepage's enquiry
        // form, '/services#ask' the Services page's copy of it.
        href.startsWith('/#') ||
        coded.has(href.split('#')[0] ?? '');

      expect(resolves, `${item.label} -> ${href}`).toBe(true);
    }
  });

  /*
   * `target="_blank"` without `rel="noopener"` hands the opened tab a live
   * `window.opener` reference back to this page — a real, silent
   * cross-origin hazard on links to profiles nobody here controls. Nothing in
   * a build or a typecheck notices it missing, and the link works either way.
   */
  it('opens every social card off-site, safely', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { LabsFooter } = await import('../components/marketing/labs/site-footer');
    const { SOCIAL_CARDS } = await import('../components/marketing/labs/brand');

    const html = renderToStaticMarkup(React.createElement(LabsFooter));

    expect(SOCIAL_CARDS.length).toBeGreaterThan(0);

    for (const card of SOCIAL_CARDS) {
      const anchor = html.match(
        new RegExp(`<a[^>]*href="${card.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`),
      )?.[0];

      expect(anchor, `${card.name} renders as a link`).toBeTruthy();
      expect(anchor, card.name).toContain('target="_blank"');
      expect(anchor, card.name).toContain('noopener');
    }
  });

  /*
   * The footer shipped pointing at Nanotom CAPITAL's profiles.
   *
   * Nothing caught it: the links were absolute, https, and every one of them
   * resolved to a real live page — they were simply the wrong company's. The
   * two businesses share an owner and a naming pattern, which is what makes
   * `nanotomcapital` and `nanotomlabs` so easy to swap, and a working link to
   * the wrong brand is invisible to every other check here.
   */
  it('sends visitors to Labs\' accounts, not Capital\'s', async () => {
    const { SOCIAL_CARDS } = await import('../components/marketing/labs/brand');

    for (const card of SOCIAL_CARDS) {
      expect(card.href.toLowerCase(), card.name).not.toContain('nanotomcapital');
      expect(card.href.toLowerCase(), card.name).not.toContain('nanotom-capital');
      expect(card.href.toLowerCase(), card.name).toMatch(/nanotom-?labs/);
    }
  });

  it('keeps the unbuilt nav items unlinked rather than pointing them at 404s', async () => {
    const { NAV } = await import('../components/marketing/labs/brand');

    const unbuilt = NAV.filter((item) => !item.href).map((item) => item.label);

    // If this list shrinks, the route should exist and be registered in
    // CODED_SITES — check that before updating the expectation.
    expect(unbuilt).toEqual(['Projects', 'About']);
  });

  it('routes every call to action at one destination per page, so it moves in one edit', async () => {
    const { ENQUIRY_ANCHOR, SERVICES_ENQUIRY_ANCHOR } = await import(
      '../components/marketing/labs/brand'
    );

    expect(ENQUIRY_ANCHOR).toBe('/#ask');
    expect(SERVICES_ENQUIRY_ANCHOR).toBe('/services#ask');

    /*
     * Both anchors land on the SAME shared component, so the element they
     * point at exists on whichever page renders it. Pinned here because the
     * two constants and the id live in three different files now.
     */
    expect(read('sections.tsx')).toContain('id="ask"');
    for (const file of ['home.tsx', 'services.tsx']) {
      expect(read(file), file).not.toMatch(/href="\/contact/);
    }
  });
});

describe('no form silently discards input', () => {
  it.each([
    ['the enquiry form', 'sections.tsx', 3],
    // Four, not one per field: the fields are a `.map`, so the source carries
    // one `disabled` per control TYPE. The rendered-output check below is the
    // one that actually counts every control.
    ['the get-started form', 'get-started.tsx', 4],
    ['the newsletter', 'site-footer.tsx', 1],
  ])('%s is disabled until it has an endpoint', (_label, file, controls) => {
    /*
     * Comments stripped first, the same trap the site-footer and site-header
     * tests hit: the form's own docstring names the element it is explaining
     * the absence of, and matching that mention would fail the test for
     * carrying the sentence that documents the rule.
     */
    const source = read(file)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/\/\/.*$/gm, '');
    const disabled = source.match(/\bdisabled\b/g) ?? [];

    expect(disabled.length).toBeGreaterThanOrEqual(controls);
    // A bare form element would submit to the current URL on Enter and look
    // like it worked. There is deliberately none in either.
    expect(source).not.toMatch(/<form[\s>]/);
  });

  /*
   * Counting `disabled` in the SOURCE is a proxy, and a loose one — a field
   * rendered in a `.map` contributes one occurrence however many fields there
   * are, so a new enabled input beside a disabled one would not move the
   * number. This counts the controls the browser actually receives.
   */
  it.each([
    ['the homepage', 'home'],
    ['the Services page', 'services'],
    ['the Get Started page', 'get-started'],
  ])('%s renders no enabled control anywhere', async (_label, page) => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const mod = await import(`../components/marketing/labs/${page}`);
    const Component = Object.values(mod).find((value) => typeof value === 'function');

    const html = renderToStaticMarkup(
      React.createElement(Component as React.FunctionComponent),
    );

    const controls = html.match(/<(input|textarea|button|select)\b[^>]*>/g) ?? [];
    expect(controls.length).toBeGreaterThan(0);

    for (const control of controls) {
      /*
       * The success stories' and contact tabs' radios are the one exception:
       * they drive a CSS-only switch, take no input from the visitor and post
       * nowhere, so disabling them would break the tabs for no benefit.
       */
      if (control.includes('type="radio"')) continue;
      expect(control).toContain('disabled');
    }
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

describe('the Nanotom Labs palette meets WCAG AA', () => {
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
    // #0F0F0F on the brand gold is 8.99:1; white is 2.13:1 and fails badly.
    // The closing CTA is a full-width band of exactly this pairing.
    const accent = token('nl-accent');
    expect(contrast('#0f0f0f', accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#ffffff', accent)).toBeLessThan(4.5);
    expect(read('sections.tsx')).toContain('text-[#0f0f0f]');
  });
});

describe('the chrome stays server-rendered', () => {
  /*
   * Capital's header is a server component on purpose, and the same reasoning
   * applies here: a `useState` menu toggle would put a client bundle on every
   * route of the site, the blog included, to do what <details> does natively.
   */
  it.each([
    'site-header.tsx',
    'site-footer.tsx',
    'home.tsx',
    'services.tsx',
    'get-started.tsx',
    'project.tsx',
    'sections.tsx',
    'primitives.tsx',
  ])(
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
    const html = decoded(await render());
    const { SECTIONS, SERVICES, FAQS, TESTIMONIALS, HERO, CLOSING_CTA } = await import(
      '../components/marketing/labs/content'
    );

    for (const line of HERO.headingLines) expect(html).toContain(line);
    for (const heading of Object.values(SECTIONS)) expect(html).toContain(heading);
    for (const service of SERVICES) {
      expect(html, service.title).toContain(service.title);
      expect(html, service.title).toContain(`${service.title} Projects`);
    }
    for (const faq of FAQS) expect(html).toContain(faq.question);
    for (const person of TESTIMONIALS) expect(html).toContain(person.name);
    expect(html).toContain(CLOSING_CTA.heading);
  });

  /*
   * "Why you" belongs before "what do you sell", so these four moved off
   * /services and onto the homepage. Pinned in BOTH directions: a section that
   * silently renders on both pages is the failure a move like this leaves
   * behind, and it looks fine on whichever page you happen to open.
   */
  it('owns the reasons block, which /services no longer renders', async () => {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { LabsServices } = await import('../components/marketing/labs/services');
    const { REASONS, SECTIONS } = await import('../components/marketing/labs/content');

    const home = decoded(await render());
    const services = decoded(renderToStaticMarkup(React.createElement(LabsServices)));

    expect(home).toContain(SECTIONS.reasons);
    expect(services).not.toContain(SECTIONS.reasons);

    for (const reason of REASONS) {
      expect(home, reason.title).toContain(reason.title);
      expect(services, reason.title).not.toContain(reason.title);
    }
  });

  /*
   * The headline's rolling word, and the three things about it that break
   * quietly.
   *
   * It looks like an animation, so it reads like something only a human with
   * the page open can check. Two thirds of it are not: what is in the markup,
   * and what a screen reader is handed, are both static facts.
   */
  it('puts every outcome in the markup, with the first one twice', async () => {
    const html = decoded(await render());
    const { HERO } = await import('../components/marketing/labs/content');

    expect(html).toContain(HERO.lead);
    for (const word of HERO.rolling) expect(html, word).toContain(word);

    /*
     * Everything between the track opening and the close that ends it, with
     * the last word's own `</span>` put back — the split eats it, and without
     * a closing bracket after it the final word does not match.
     */
    const start = html.indexOf('class="nl-roll-track">');
    expect(start, 'the roll track is gone').toBeGreaterThan(-1);
    const track = `${html.slice(start).split('</span></span>')[0]}</span>`;
    const words = [...track.matchAll(/>([^<>]+)</g)].map((m) => m[1]);

    /*
     * The column carries the first word again at the end. The animation's last
     * step lands on that copy, which is the frame it restarts from — drop it
     * and the roll either snaps backwards through the whole list or ends on
     * blank space. See the keyframes in globals.css.
     */
    expect(words).toEqual([...HERO.rolling, HERO.rolling[0]]);
  });

  it('hides the moving column from a screen reader and states the words plainly', async () => {
    const html = decoded(await render());
    const { HERO } = await import('../components/marketing/labs/content');

    // The window is the mechanism: read aloud it says the first word twice.
    expect(html).toMatch(/class="nl-roll[^"]*"\s+aria-hidden="true"/);
    // What replaces it is the same four outcomes as one plain phrase.
    expect(html).toContain(`>${HERO.rolling.join(', ')}<`);
  });

  /*
   * THE KEYFRAMES HARD-CODE THE WORD COUNT, and nothing else does.
   *
   * Four words plus the repeat is a five-row column, so each step travels
   * -20%. Add a fifth outcome to ./content.ts and the column becomes six rows
   * while the animation keeps moving in fifths: every word after the first
   * lands part-way, showing two half-words for two seconds each. It looks like
   * a rendering bug and nothing in a build or a typecheck sees it.
   */
  it('keeps the roll keyframes in step with the number of words', async () => {
    const { HERO } = await import('../components/marketing/labs/content');
    const CSS = readFileSync(join(__dirname, '..', 'app', 'globals.css'), 'utf8');

    const start = CSS.indexOf('@keyframes nl-roll');
    expect(start, '@keyframes nl-roll is gone').toBeGreaterThan(-1);
    const block = CSS.slice(start, CSS.indexOf('\n  }', CSS.indexOf('{', start)));

    const rows = HERO.rolling.length + 1; // the words, plus the repeated first
    const step = 100 / rows;

    for (let k = 0; k < rows; k += 1) {
      const offset = k === 0 ? '0' : `-${+(k * step).toFixed(4)}%`;
      expect(block, `step ${k}`).toContain(`translate3d(0, ${offset}, 0)`);
    }

    // And no sixth position left over from a word that was removed.
    expect([...block.matchAll(/translate3d\(/g)]).toHaveLength(rows);
  });

  /*
   * A gallery tile that opens a case study has to SHOW that case study.
   *
   * The tile is a picture with an "Open Project" control over it, so the
   * picture is the promise: click a shot of the Golden Scaffold site and you
   * expect the Golden Scaffold page. That pairing lives in two files — the tile
   * in labs/content.ts, the page's own art in labs/projects-content.ts — and
   * nothing but this test notices when they drift. It nearly shipped drifted:
   * the case study's hero was still the template's A-AURA artwork when the
   * first tile started pointing at it.
   */
  it('shows a project its own artwork on the tile that opens it', async () => {
    const { SERVICES } = await import('../components/marketing/labs/content');
    const { projectBySlug } = await import('../components/marketing/labs/projects-content');

    const linked = SERVICES.flatMap((service) => service.projects).filter(
      (project) => project.href,
    );
    expect(linked.length).toBeGreaterThan(0);

    for (const tile of linked) {
      const href = tile.href as string;
      const study = projectBySlug(href.replace(/^\/projects\//, ''));

      // The destination is a real page, not a slug that was renamed elsewhere.
      expect(study, href).toBeTruthy();
      expect(tile.src, href).toBe(study?.hero.image.src);
      expect(tile.alt, href).toBe(study?.hero.image.alt);
    }
  });

  /*
   * The other tiles stay text. Six of the eight are still the template's stock
   * screens with nothing behind them, and an "Open Project" that looks operable
   * and goes nowhere is worse than a label — see the note on ArrowLink.
   */
  it('renders one anchor per linked tile and leaves the rest as text', async () => {
    const html = await render();
    const { SERVICES, LINKS } = await import('../components/marketing/labs/content');

    const tiles = SERVICES.flatMap((service) => service.projects);
    const labels = [...html.matchAll(new RegExp(`>${LINKS.openProject}<`, 'g'))];
    expect(labels).toHaveLength(tiles.length);

    for (const href of new Set(tiles.map((tile) => tile.href).filter(Boolean))) {
      const anchors = [...html.matchAll(new RegExp(`<a[^>]*href="${href}"`, 'g'))];
      expect(
        anchors.length,
        href as string,
      ).toBe(tiles.filter((tile) => tile.href === href).length);
    }
  });

  /*
   * White type over artwork nobody here controls needs a scrim under it.
   *
   * Measured rather than guessed, in a browser with the real font: over the
   * Golden Scaffold collage the "Open Project" label came out at 2.07:1 — a
   * white label on a white screenshot — and the gradient takes it to between
   * 6:1 and 10.5:1 across 1280-1920, where the crop moves and the artwork under
   * the label changes with it. AA wants 4.5:1.
   *
   * A source assertion, because the number cannot be computed here: it depends
   * on the pixels of an image and on how `object-cover` crops it at each
   * viewport. So this pins the scrim's presence, and the note above records the
   * measurement it came from.
   */
  it('keeps a scrim under the label on every gallery tile', () => {
    const source = read('home.tsx');
    const scrim = /bg-gradient-to-t from-black\/(\d+)/.exec(source);

    expect(scrim, 'the tile overlay lost its gradient').toBeTruthy();
    expect(Number(scrim?.[1])).toBeGreaterThanOrEqual(85);
    // Decorative and non-blocking: it must never eat the click on the link.
    expect(source).toMatch(/pointer-events-none[^"]*bg-gradient-to-t/);
  });

  /*
   * The story and the galleries are about the same engagement, so they name the
   * same client. Stored twice — a success story is not a project entry — and
   * the two would otherwise part company the first time one is renamed.
   */
  it('heads the success stories with the client the galleries link to', async () => {
    const { SUCCESS_STORIES } = await import('../components/marketing/labs/content');
    const { GOLDEN_SCAFFOLD } = await import('../components/marketing/labs/projects-content');

    const story = SUCCESS_STORIES[0];
    expect(story?.client).toBe(GOLDEN_SCAFFOLD.showcase.title);

    const html = decoded(await render());
    expect(html).toContain(story?.client);
    expect(html).toContain(story?.industry);
    expect(html).toContain(story?.service);
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

  /*
   * Every image the page renders resolves to a file that is actually there.
   *
   * next/image takes a string and never checks it, so a renamed or deleted
   * asset is a broken image at runtime and nothing before that — not the
   * typecheck, not the build, not any other test here. This caught the hero
   * when its art was replaced: the old file was removed in the same change
   * that stopped referencing it, and this is what would have failed had only
   * one of the two happened.
   */
  it('ships every asset it references', async () => {
    const { existsSync } = await import('node:fs');
    const html = await render();

    const srcs = [...html.matchAll(/\/_next\/image\?url=([^&"]+)/g)].map((m) =>
      decodeURIComponent(m[1] as string),
    );

    expect(srcs.length).toBeGreaterThan(0);
    for (const src of new Set(srcs)) {
      expect(existsSync(join(__dirname, '..', 'public', src)), src).toBe(true);
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
    const pills = [
      'home.tsx',
      'services.tsx',
      'get-started.tsx',
      'project.tsx',
      'sections.tsx',
      'primitives.tsx',
      'site-footer.tsx',
      'site-header.tsx',
    ].flatMap((file) => read(file).match(/rounded-full/g) ?? []);

    expect(pills.length).toBeLessThanOrEqual(30);
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

describe('the Nanotom Labs branding', () => {
  it('runs on Capital\'s brand gold, so the two sites match', () => {
    const CSS = readFileSync(join(__dirname, '..', 'app', 'globals.css'), 'utf8');
    const gold = CSS.match(/--color-gold:\s*(#[0-9a-f]{6});/i)?.[1];
    const accent = CSS.match(/--nl-accent:\s*(#[0-9a-f]{6});/i)?.[1];

    expect(gold).toBeTruthy();
    // Read from --color-gold rather than hardcoded, so if Capital's brand
    // moves this fails instead of the two sites quietly diverging.
    expect(accent).toBe(gold);
  });

  it('hotlinks the wordmark rather than committing it', async () => {
    const { LOGO, LOGO_ORIGIN } = await import('../components/marketing/labs/brand');
    const { readdirSync } = await import('node:fs');

    expect(LOGO.src.startsWith(LOGO_ORIGIN)).toBe(true);
    // Nothing logo-shaped landed in the asset folder alongside the design art.
    const assets = readdirSync(join(__dirname, '..', 'public', 'nntm-labs'));
    expect(assets.filter((f) => /logo|wordmark|nanotom/i.test(f))).toHaveLength(0);
  });

  it('reserves the wordmark\'s box so the header cannot reflow', () => {
    const header = read('site-header.tsx');

    // Intrinsic width and height on the <img> give the browser the aspect
    // ratio before the bytes arrive; without them the header jumps on load.
    expect(header).toContain('width={LOGO.intrinsic.width}');
    expect(header).toContain('height={LOGO.intrinsic.height}');
    expect(header).not.toMatch(/loading="lazy"/);
  });

  it('calls the company Nanotom Labs everywhere, with no template name left', async () => {
    const strip = (s: string) =>
      s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    for (const file of [
      'content.ts',
      'services-content.ts',
      'get-started-content.ts',
      'brand.ts',
    ]) {
      expect(strip(read(file)), file).not.toMatch(/NexGen|NextGen/);
    }
    expect(read('content.ts')).toContain('Nanotom Labs');
    expect(read('services-content.ts')).toContain('Nanotom Labs');
  });
});

describe('the Services page', () => {
  /**
   * Server-rendering the real page, for the reason the homepage block above
   * gives: everything asserted from source catches wiring but not a component
   * that throws. This page has two new icon maps and three new content lists,
   * and a bad key in any of them is a string as far as the typechecker is
   * concerned.
   */
  async function render() {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { LabsServices } = await import('../components/marketing/labs/services');

    return renderToStaticMarkup(React.createElement(LabsServices));
  }

  it('is registered as a coded route, so it reaches the sitemap and the admin', async () => {
    const { codedRoutesFor, NNTM_LABS_SLUG } = await import('@blog/core');
    const services = codedRoutesFor(NNTM_LABS_SLUG).find((r) => r.path === 'services');

    /*
     * The failure this guards is silent by construction: the page renders,
     * the nav links to it, and it is simply absent from /sitemap.xml and from
     * the admin's Pages screen with nothing anywhere to say so.
     */
    expect(services, 'services missing from CODED_SITES').toBeTruthy();
    expect(services?.index).toBe(true);
  });

  it('is gated on the Labs deployment, not served from every blog', () => {
    const route = readFileSync(join(__dirname, '..', 'app', 'services', 'page.tsx'), 'utf8');

    // Ungated, this static route would shadow a database page at /services on
    // every other blog's domain.
    expect(route).toContain('isNntmLabs()');
    expect(route).toContain('notFound()');
  });

  it('puts every section on the page', async () => {
    const html = decoded(await render());
    const { SECTIONS, CLOSING_CTA, FAQS, TESTIMONIALS, SERVICES } = await import(
      '../components/marketing/labs/content'
    );
    const { SERVICES_HERO, SERVICES_SECTIONS, WORKS } = await import(
      '../components/marketing/labs/services-content'
    );

    for (const line of SERVICES_HERO.headingLines) expect(html).toContain(line);
    expect(html).toContain(SERVICES_HERO.imageTitle);
    for (const heading of Object.values(SERVICES_SECTIONS)) expect(html).toContain(heading);
    expect(html).toContain(SECTIONS.services);
    for (const service of SERVICES) {
      expect(html, service.title).toContain(service.title);
      expect(html, service.body).toContain(service.body);
    }
    for (const work of WORKS) {
      expect(html, work.title).toContain(work.title);
      for (const tech of work.technologies) expect(html, tech).toContain(tech);
    }
    for (const faq of FAQS) expect(html).toContain(faq.question);
    for (const person of TESTIMONIALS) expect(html).toContain(person.name);
    expect(html).toContain(CLOSING_CTA.heading);
  });

  it('points its own calls at its own form, not the homepage\'s', async () => {
    const html = await render();
    const { ENQUIRY_ANCHOR, SERVICES_ENQUIRY_ANCHOR } = await import(
      '../components/marketing/labs/brand'
    );

    // The form is on THIS page. Sending a visitor to the homepage's identical
    // copy of it would navigate away from what they are reading.
    expect(html).toContain(`href="${SERVICES_ENQUIRY_ANCHOR}"`);
    expect(html).not.toContain(`href="${ENQUIRY_ANCHOR}"`);
    expect(html).toContain('id="ask"');
  });

  it('renders every work image and leaves the team portraits decorative', async () => {
    const html = await render();
    const { WORKS, SERVICES_HERO } = await import(
      '../components/marketing/labs/services-content'
    );

    for (const work of WORKS) {
      // next/image rewrites src through the optimiser, so the encoded path is
      // what lands in the markup.
      expect(html, work.image.src).toContain(encodeURIComponent(work.image.src));
      for (const portrait of work.team) {
        expect(html, portrait).toContain(encodeURIComponent(portrait));
      }
    }
    expect(html).toContain(encodeURIComponent(SERVICES_HERO.image.src));

    /*
     * The portraits are the template's stock people and name nobody, so they
     * are decorative: alt="" rather than an invented name read out five times
     * per project. The screenshots do describe something and carry real alt.
     */
    const alts = [...html.matchAll(/<img[^>]*\balt="([^"]*)"/g)].map((m) => m[1]);
    expect(alts.filter((alt) => alt === '').length).toBeGreaterThanOrEqual(
      WORKS.reduce((n, work) => n + work.team.length, 0),
    );
    expect(alts).toContain(SERVICES_HERO.image.alt);
  });

  it('ships every asset it references', async () => {
    const { existsSync } = await import('node:fs');
    const { WORKS, SERVICES_HERO } = await import(
      '../components/marketing/labs/services-content'
    );

    const paths = [
      SERVICES_HERO.image.src,
      ...WORKS.flatMap((work) => [work.image.src, ...work.team]),
    ];

    for (const path of paths) {
      expect(existsSync(join(__dirname, '..', 'public', path)), path).toBe(true);
    }
  });
});

describe('the Get Started page', () => {
  async function render() {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { LabsGetStarted } = await import('../components/marketing/labs/get-started');

    return renderToStaticMarkup(React.createElement(LabsGetStarted));
  }

  it('is registered as a coded route, so it reaches the sitemap and the admin', async () => {
    const { codedRoutesFor, NNTM_LABS_SLUG } = await import('@blog/core');
    const route = codedRoutesFor(NNTM_LABS_SLUG).find((r) => r.path === 'get-started');

    expect(route, 'get-started missing from CODED_SITES').toBeTruthy();
    expect(route?.index).toBe(true);
  });

  it('is gated on the Labs deployment, not served from every blog', () => {
    const file = readFileSync(
      join(__dirname, '..', 'app', 'get-started', 'page.tsx'),
      'utf8',
    );

    expect(file).toContain('isNntmLabs()');
    expect(file).toContain('notFound()');
  });

  /*
   * The header's primary button points here. It pointed at the homepage's form
   * anchor before this page existed, and a stale constant would leave the
   * site's main call scrolling to a section instead of opening the page built
   * for it — which looks deliberate and is not.
   */
  it('is where the header button goes', async () => {
    const { NAV, GET_STARTED_PATH } = await import('../components/marketing/labs/brand');
    const cta = NAV.find((item) => item.cta);

    expect(GET_STARTED_PATH).toBe('/get-started');
    expect(cta?.href).toBe(GET_STARTED_PATH);
  });

  it('puts every section on the page', async () => {
    const html = decoded(await render());
    const { FAQS, TESTIMONIALS, STATS } = await import('../components/marketing/labs/content');
    const { CONTACT_CHANNELS, ENQUIRY_FIELDS, GET_STARTED_HERO, REACH_US } = await import(
      '../components/marketing/labs/get-started-content'
    );

    for (const line of GET_STARTED_HERO.headingLines) expect(html).toContain(line);
    expect(html).toContain(GET_STARTED_HERO.body);
    for (const stat of STATS) expect(html, stat.label).toContain(stat.value);
    expect(html).toContain(REACH_US);
    for (const channel of CONTACT_CHANNELS) expect(html, channel.name).toContain(channel.name);
    for (const field of ENQUIRY_FIELDS) expect(html, field.id).toContain(field.placeholder);
    for (const faq of FAQS) expect(html).toContain(faq.question);
    for (const person of TESTIMONIALS) expect(html).toContain(person.name);
  });

  /*
   * The tabs are a radio group switched in CSS, so the page still ships no
   * JavaScript of its own. What regresses invisibly is the wiring: the panels
   * are keyed by POSITION, and a panel whose key does not match its input's
   * value simply never shows — a tab that looks operable and does nothing.
   */
  it('switches its contact tabs without JavaScript, keyed by position', async () => {
    const html = await render();
    const { CONTACT_CHANNELS } = await import(
      '../components/marketing/labs/get-started-content'
    );
    const css = readFileSync(join(__dirname, '..', 'app', 'globals.css'), 'utf8');

    const values = [...html.matchAll(/<input[^>]*name="nl-contact-channel"[^>]*value="(\d+)"/g)]
      .map((m) => m[1]);
    const panels = [...html.matchAll(/data-tabpanel="(\d+)"/g)].map((m) => m[1]);

    expect(values).toEqual(CONTACT_CHANNELS.map((_, i) => String(i + 1)));
    expect(panels).toEqual(values);

    // Exactly one default, and it is the first tab — which is also the panel
    // the plain-CSS rule shows in a browser without :has().
    const checked = [...html.matchAll(/<input[^>]*checked[^>]*>/g)];
    expect(checked).toHaveLength(1);
    expect(checked[0]?.[0]).toContain('value="1"');
    expect(css).toMatch(/\.nl-tabset \[data-tabpanel='1'\]\s*\{\s*display: block/);

    // Every position the page renders has a rule to reveal it.
    for (const value of values.slice(1)) {
      expect(css, `panel ${value}`).toContain(`:has(input[value='${value}']:checked)`);
    }
  });

  /*
   * A contact page that invents an address is worse than one that admits it
   * has none: a plausible mailbox nobody reads swallows enquiries in silence,
   * which is the single failure this page exists to prevent.
   */
  it('never renders a contact detail it does not have', async () => {
    const html = await render();
    const { CONTACT_CHANNELS, CONTACT_PENDING } = await import(
      '../components/marketing/labs/get-started-content'
    );

    for (const channel of CONTACT_CHANNELS) {
      for (const entry of channel.entries) {
        if (entry.value === null) expect(entry.href, entry.label).toBeUndefined();
      }
    }

    const pending = CONTACT_CHANNELS.flatMap((c) => c.entries).filter((e) => e.value === null);
    if (pending.length > 0) {
      expect(html).toContain(CONTACT_PENDING);
      // No mailto:/tel: anywhere while every detail is still a placeholder.
      expect(html).not.toMatch(/href="(mailto|tel):/);
    }
  });
});

describe('the heroes are one height', () => {
  /*
   * The three heroes used to size themselves from whatever they contained —
   * 520, 573 and 379 at 1920. Close enough to look accidental rather than
   * intentional, and obvious the moment you click between pages and the fold
   * jumps.
   *
   * Asserting they all name the SAME TOKEN rather than that each equals some
   * pixel value: the point is that there is one number to change, not three
   * that happen to agree today. This is the same reasoning as the ground-colour
   * test in marketing.test.ts.
   */
  const CSS = readFileSync(join(__dirname, '..', 'app', 'globals.css'), 'utf8');

  it('declares the height once', () => {
    const declarations = CSS.match(/--nl-hero-h:\s*\d+px/g) ?? [];
    expect(declarations).toHaveLength(1);
  });

  it.each(['home.tsx', 'services.tsx', 'get-started.tsx'])('%s reads it', (file) => {
    const source = read(file);
    const hero = source.slice(source.indexOf('function Hero()'));

    expect(hero).toContain('lg:min-h-[var(--nl-hero-h)]');
    /*
     * And nothing in a hero sets its own height above `lg`. The homepage's
     * image card carried `lg:min-h-[520px]`, which is where the number came
     * from and why the other two never matched it.
     */
    expect(hero.slice(0, hero.indexOf('\n}'))).not.toMatch(/lg:(min-)?h-\[\d+px\]/);
  });
});

describe('the project pages', () => {
  async function render(slug = 'golden-scaffold-los-angeles-ca') {
    const React = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { LabsProject } = await import('../components/marketing/labs/project');
    const { projectBySlug } = await import('../components/marketing/labs/projects-content');

    const project = projectBySlug(slug);
    expect(project, slug).toBeTruthy();

    return renderToStaticMarkup(
      React.createElement(LabsProject, { project: project! }),
    );
  }

  /*
   * The registry and CODED_SITES are two lists of the same slugs, and they
   * have to be, because @blog/core is the shared dependency and importing app
   * code into it would invert that. Two hand-kept lists drift; this is the
   * only thing that would notice.
   */
  it('registers every project in CODED_SITES, and nothing that is not one', async () => {
    const { codedRoutesFor, NNTM_LABS_SLUG } = await import('@blog/core');
    const { PROJECTS } = await import('../components/marketing/labs/projects-content');

    const registered = codedRoutesFor(NNTM_LABS_SLUG)
      .map((route) => route.path)
      .filter((path) => path.startsWith('projects/'))
      .sort();

    expect(registered).toEqual(PROJECTS.map((p) => `projects/${p.slug}`).sort());
  });

  /*
   * The page names a real company beside copy that describes nothing that
   * happened. Submitting that to a search engine publishes a claim about
   * somebody else's business — so the route sets `robots: noindex` AND the
   * sitemap entry says index: false, and the two have to agree. Listing a
   * noindex page in a sitemap is the specific trap Capital's stub pages sat in.
   */
  it('keeps a placeholder case study out of the sitemap and out of the index', async () => {
    const { codedRoutesFor, NNTM_LABS_SLUG } = await import('@blog/core');
    const route = readFileSync(
      join(__dirname, '..', 'app', 'projects', '[slug]', 'page.tsx'),
      'utf8',
    );

    const noindexInRoute = /robots:\s*\{[^}]*index:\s*false/.test(route);
    const projects = codedRoutesFor(NNTM_LABS_SLUG).filter((r) =>
      r.path.startsWith('projects/'),
    );

    expect(projects.length).toBeGreaterThan(0);
    for (const project of projects) {
      expect(project.index, `${project.path} sitemap flag must match the route's robots`).toBe(
        !noindexInRoute,
      );
    }
  });

  it('is gated on the Labs deployment, not served from every blog', () => {
    const route = readFileSync(
      join(__dirname, '..', 'app', 'projects', '[slug]', 'page.tsx'),
      'utf8',
    );

    expect(route).toContain('isNntmLabs()');
    expect(route).toContain('notFound()');
  });

  it('builds one static page per registry entry', async () => {
    const { PROJECTS } = await import('../components/marketing/labs/projects-content');
    const route = readFileSync(
      join(__dirname, '..', 'app', 'projects', '[slug]', 'page.tsx'),
      'utf8',
    );

    expect(route).toContain('generateStaticParams');
    expect(PROJECTS.length).toBeGreaterThan(0);
    // Slugs are URL segments, so anything that would need encoding is a bug.
    for (const project of PROJECTS) {
      expect(project.slug, project.title).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('puts every section on the page', async () => {
    const html = decoded(await render());
    const { FAQS, TESTIMONIALS, CLOSING_CTA, SECTIONS } = await import(
      '../components/marketing/labs/content'
    );
    const { GOLDEN_SCAFFOLD } = await import('../components/marketing/labs/projects-content');

    for (const line of GOLDEN_SCAFFOLD.hero.headingLines) expect(html).toContain(line);
    expect(html).toContain(GOLDEN_SCAFFOLD.hero.body);
    expect(html).toContain(GOLDEN_SCAFFOLD.hero.tag);
    expect(html).toContain(GOLDEN_SCAFFOLD.featuresTitle);
    for (const feature of GOLDEN_SCAFFOLD.features) {
      expect(html, feature.title).toContain(feature.title);
    }
    expect(html).toContain(GOLDEN_SCAFFOLD.showcaseTitle);
    for (const tech of GOLDEN_SCAFFOLD.showcase.technologies) expect(html).toContain(tech);
    expect(html).toContain(SECTIONS.testimonials);
    for (const person of TESTIMONIALS) expect(html).toContain(person.name);
    for (const faq of FAQS) expect(html).toContain(faq.question);
    expect(html).toContain(CLOSING_CTA.heading);
  });

  it('ships every asset it references', async () => {
    const { existsSync } = await import('node:fs');
    const html = await render();

    const srcs = [...html.matchAll(/\/_next\/image\?url=([^&"]+)/g)].map((m) =>
      decodeURIComponent(m[1] as string),
    );

    expect(srcs.length).toBeGreaterThan(0);
    for (const src of new Set(srcs)) {
      expect(existsSync(join(__dirname, '..', 'public', src)), src).toBe(true);
    }
  });

  /*
   * Every call goes to the contact page rather than to the FAQ's form, which
   * the shared section does bring down the page with it. Pinned because the
   * other three pages point their calls at '#ask', so copying a hero from one
   * of them is how this page would quietly stop sending anyone anywhere useful.
   */
  it('sends its calls to the contact page, not to the FAQ form below', async () => {
    const html = await render();
    const { GET_STARTED_PATH } = await import('../components/marketing/labs/brand');

    expect(html).toContain(`href="${GET_STARTED_PATH}"`);
    expect(html).not.toMatch(/href="[^"]*#ask"/);
  });
});
