import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Both reading palettes must meet WCAG AA.
 *
 * This is the regression worth guarding. Brand gold reads beautifully on the
 * dark ground at 9.22:1 — and measures 2.13:1 on white, failing even the 3:1
 * large-text floor. The obvious "tidy-up" is to make the light theme use
 * --color-gold for links so both themes match; that quietly ships text almost
 * nobody can read comfortably and that Lighthouse flags. This test refuses it.
 *
 * Values are parsed out of globals.css so the CSS stays the single source of
 * truth — a token renamed there fails here loudly rather than leaving the test
 * asserting stale numbers.
 */
const CSS = readFileSync(join(__dirname, '..', 'app', 'globals.css'), 'utf8');

/**
 * A token's literal colour, following `var()` indirection.
 *
 * Tokens are allowed to alias one another — `--color-blog-bg` is
 * `var(--color-ground)`, the ground the header, footer and /home-v2 all share —
 * and the contrast of an aliased token is the contrast of what it resolves to.
 * Reading only literals would have forced a second copy of that hex just to
 * keep this test happy, which is the opposite of the single source of truth it
 * exists to protect.
 *
 * The hop limit is what keeps a cycle from hanging the suite rather than
 * failing it.
 */
function token(name: string, hops = 4): string {
  const match = CSS.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match?.[1]) throw new Error(`token --${name} not found in globals.css`);

  const value = match[1].trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return value;

  const alias = value.match(/^var\(\s*--([a-z0-9-]+)\s*\)$/i);
  if (alias?.[1]) {
    if (hops === 0) throw new Error(`token --${name} aliases more than 4 levels deep`);
    return token(alias[1], hops - 1);
  }

  throw new Error(`token --${name} is "${value}", neither a hex colour nor a plain var()`);
}

/** Relative luminance, per WCAG 2.1. */
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

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const AA_BODY = 4.5;

describe('dark reading palette meets AA', () => {
  const bg = () => token('color-blog-bg');

  it.each([
    ['body text', 'color-blog-ink'],
    ['muted text', 'color-blog-muted'],
    ['link text', 'color-gold'],
  ])('%s', (_label, name) => {
    expect(ratio(token(name), bg())).toBeGreaterThanOrEqual(AA_BODY);
  });
});

describe('light reading palette meets AA', () => {
  const bg = () => token('color-blog-bg-light');

  it.each([
    ['body text', 'color-blog-ink-light'],
    ['muted text', 'color-blog-muted-light'],
    ['link text', 'color-blog-link-light'],
  ])('%s', (_label, name) => {
    expect(ratio(token(name), bg())).toBeGreaterThanOrEqual(AA_BODY);
  });

  it('also passes on the raised surface, where cards and code blocks sit', () => {
    const raised = token('color-blog-raised-light');
    expect(ratio(token('color-blog-ink-light'), raised)).toBeGreaterThanOrEqual(AA_BODY);
    expect(ratio(token('color-blog-link-light'), raised)).toBeGreaterThanOrEqual(AA_BODY);
  });
});

describe('the specific mistake this file exists to prevent', () => {
  it('brand gold is genuinely unusable as light-mode text', () => {
    // Not an assertion about our code — a statement of the fact that motivates
    // the separate light link colour. If this ever stops being true, the two
    // palettes could be unified.
    expect(ratio(token('color-gold'), token('color-blog-bg-light'))).toBeLessThan(3);
  });

  it('so the light link colour is not brand gold', () => {
    expect(token('color-blog-link-light')).not.toBe(token('color-gold'));
  });
});

/**
 * Blog components must use the SEMANTIC tokens, never the palette-specific ones.
 *
 * `.blog-surface` re-points --color-ink / --color-ink-muted / --color-line /
 * --color-surface-muted / --color-accent per theme. The --color-blog-* names and
 * --color-gold are raw dark values, so a component reading them directly is
 * pinned to the dark palette and renders near-invisible in light mode — grey
 * text on white, gold links at 2.13:1.
 *
 * That is not hypothetical: every one of these components shipped that way, and
 * it only surfaced when light mode was first rendered. Nothing errored.
 */
describe('blog components use theme-aware tokens', () => {
  const { readdirSync: rd, statSync: st } = require('node:fs') as typeof import('node:fs');

  function tsx(dir: string): string[] {
    return rd(dir).flatMap((entry) => {
      const full = join(dir, entry);
      if (st(full).isDirectory()) return tsx(full);
      return /\.tsx$/.test(entry) ? [full] : [];
    });
  }

  const files = [
    ...tsx(join(__dirname, '..', 'components', 'blog')),
    join(__dirname, '..', 'app', 'blog', '[slug]', 'page.tsx'),
    join(__dirname, '..', 'components', 'reading-column.tsx'),
    join(__dirname, '..', 'components', 'post-card.tsx'),
  ];

  it('finds the components to check', () => {
    expect(files.length).toBeGreaterThan(4);
  });

  it.each(['--color-blog-bg', '--color-blog-ink', '--color-blog-muted', '--color-blog-line', '--color-blog-raised', '--color-gold'])(
    'none reference %s directly',
    (token) => {
      const offenders = files
        .filter((file) => readFileSync(file, 'utf8').includes(`var(${token})`))
        .map((file) => file.slice(file.indexOf('apps/blog')));

      expect(offenders, `${token} is a fixed palette value, not theme-aware`).toEqual([]);
    },
  );
});

/*
 * Body links need a cue that is not colour.
 *
 * On the dark palette gold measures 1.91:1 against the prose — well under the
 * 3:1 that WCAG 1.4.1 requires before colour may be the only signal a link
 * exists. The light palette's bronze is 3.40:1 and does pass on its own; it is
 * underlined anyway, because a link that looks like a link in one theme and not
 * the other is worse than a consistent one.
 *
 * The ratios are computed rather than quoted, so a retuned palette fails here
 * instead of leaving a stale comment behind. (An earlier version of this test
 * asserted both were under 3:1 and caught that the light one is not.)
 *
 * A hover-only underline is the tempting compromise and does not count: it
 * leaves touch users, keyboard users, and anyone merely reading with no cue at
 * all. So the assertion is on the resting state.
 */
describe('post-body links are not distinguished by colour alone', () => {
  const RULE = /\.post-body a\s*\{([^}]*)\}/;

  it('has a rule of its own rather than inheriting the bare `a` colour', () => {
    expect(CSS).toMatch(RULE);
  });

  it('underlines at rest, not only on hover', () => {
    const body = CSS.match(RULE)?.[1] ?? '';
    expect(body).toContain('text-decoration: underline');
  });

  it('needs that underline on dark, where the colour difference is under 3:1', () => {
    // If this ever reaches 3:1 the underline becomes a choice rather than a
    // requirement, and this test should be revisited rather than deleted.
    expect(ratio(token('color-gold'), token('color-blog-ink'))).toBeLessThan(3);
  });

  it('records that light passes on colour alone, and is underlined regardless', () => {
    expect(
      ratio(token('color-blog-link-light'), token('color-blog-ink-light')),
    ).toBeGreaterThan(3);
  });

  it('accents the list markers, which inherit prose colour otherwise', () => {
    const marker = CSS.match(/\.post-body li::marker\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(marker).toContain('var(--color-accent)');
  });
});

/**
 * The Daylight palette.
 *
 * Its own describe block with its own token reader, because `token()` above
 * matches the FIRST `--name:` in the file and `.dl-surface` deliberately
 * re-declares the same --ft-* names `.ft-surface` does. Reading them with the
 * shared helper would silently measure the DARK values and pass every
 * assertion below while proving nothing.
 *
 * Every text tone is checked against every ground it can actually land on. The
 * design puts body copy on the page, inside a band, inside a card and inside a
 * chip, and a tone that clears white by a hair can fail on the chip — that is
 * not hypothetical, it is how the blog's light link colour was caught.
 */
describe('the Daylight palette meets AA on every ground', () => {
  const BLOCK = CSS.match(/\.dl-surface\s*\{([^}]*)\}/)?.[1] ?? '';

  function dl(name: string): string {
    const match = BLOCK.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
    if (!match?.[1]) throw new Error(`--${name} is not a literal hex in .dl-surface`);
    return match[1];
  }

  it('finds the block, so a rename fails here rather than silently skipping', () => {
    expect(BLOCK).not.toBe('');
  });

  /*
   * The cyan wash behind the hero badge is in here as a ground, not treated as
   * a special case. It is a surface text lands on, and --ft-subtle measured
   * 4.42:1 against it while clearing all four of the others — which is the
   * whole argument for checking every pairing rather than the obvious ones.
   */
  const GROUNDS = ['ft-bg', 'ft-band', 'ft-card', 'ft-card-raised', 'dl-pop-tint'];
  const INKS = ['ft-ink', 'ft-muted', 'ft-subtle', 'ft-accent'];

  it.each(INKS.flatMap((ink) => GROUNDS.map((ground) => [ink, ground] as const)))(
    '--%s on --%s',
    (ink, ground) => {
      expect(ratio(dl(ink), dl(ground))).toBeGreaterThanOrEqual(AA_BODY);
    },
  );

  /*
   * The two brand colours that cannot be text, asserted from both ends.
   *
   * Denis's light blue is 2.10:1 on white and brand gold is 2.13:1 — both below
   * AA and below even the 3:1 large-text floor. So neither is --ft-accent. The
   * tempting tidy-up is "unify the accent with the brand colour"; these refuse
   * it, and they state WHY in the assertion itself, so the next person reads a
   * measurement rather than a rule.
   */
  it.each(['dl-pop', 'dl-gold'])('keeps %s out of the text accent — it fails on white', (fill) => {
    expect(ratio(dl(fill), dl('ft-bg'))).toBeLessThan(3);
    expect(dl('ft-accent')).not.toBe(dl(fill));
  });

  /*
   * Both fills still have to carry a label, and both are asserted against the
   * ink that actually sits on them — the badge and the arrow discs put --ft-ink
   * on the cyan, and .dl-surface .nc-cta puts its own value on the gold.
   */
  it('puts a readable label on the cyan fill', () => {
    expect(ratio(dl('ft-ink'), dl('dl-pop'))).toBeGreaterThanOrEqual(AA_BODY);
  });

  /*
   * The hero's accent word is the one piece of display type in a brand colour.
   *
   * It is large by construction — the clamp bottoms out at 2.75rem, well past
   * the 24px where WCAG's large-text threshold of 3:1 applies — so it is held
   * to 3:1 rather than 4.5:1, and to nothing less. The reference Denis worked
   * from puts its own accent word at roughly 2.1:1, which is the mistake this
   * assertion exists to keep out.
   */
  it('keeps the hero accent word above the large-text floor', () => {
    expect(ratio(dl('dl-display'), dl('ft-bg'))).toBeGreaterThanOrEqual(3);
  });

  it('and the hero accent word is not the unreadable cyan', () => {
    expect(dl('dl-display')).not.toBe(dl('dl-pop'));
  });

  /*
   * Gold survives as a FILL, and a fill needs a legible label on top of it.
   * White on gold is 2.13:1 — the defect the .dl-surface .nc-cta rule exists to
   * correct — so the check is that whatever that rule sets clears AA.
   */
  it('puts a readable label on the gold fill', () => {
    const label = CSS.match(/\.dl-surface \.nc-cta\s*\{\s*color:\s*(#[0-9a-fA-F]{6})/)?.[1];
    expect(label, '.dl-surface .nc-cta must set a literal colour').toBeTruthy();
    expect(ratio(label!, dl('dl-gold'))).toBeGreaterThanOrEqual(AA_BODY);
    expect(ratio('#ffffff', dl('dl-gold'))).toBeLessThan(3);
  });
});

/**
 * The dark region, where the same tokens are inverted.
 *
 * `.dl-deep` re-points --ft-ink and friends to light-on-navy, and `.dl-card`
 * re-points them back for the white cards floating on it. Both are grounds that
 * text lands on, so both are measured — a palette that passes everywhere on
 * white and fails on the one dark band is the easiest possible thing to ship
 * without noticing.
 */
describe('the Daylight dark region meets AA', () => {
  function block(selector: string): string {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return CSS.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  }

  function tokenIn(selector: string, name: string): string {
    const found = block(selector).match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
    if (!found?.[1]) throw new Error(`--${name} is not a literal hex in ${selector}`);
    return found[1];
  }

  /** .dl-deep paints --dl-deep, which is declared up on .dl-surface. */
  function ground(): string {
    const found = block('.dl-surface').match(/--dl-deep:\s*(#[0-9a-fA-F]{6})/);
    if (!found?.[1]) throw new Error('--dl-deep is not a literal hex on .dl-surface');
    return found[1];
  }

  it('finds both blocks, so a rename fails here rather than skipping silently', () => {
    expect(block('.dl-deep')).not.toBe('');
    expect(block('.dl-deep .dl-card')).not.toBe('');
  });

  it.each(['ft-ink', 'ft-muted', 'ft-subtle', 'ft-accent'])('--%s on the navy', (name) => {
    expect(ratio(tokenIn('.dl-deep', name), ground())).toBeGreaterThanOrEqual(AA_BODY);
  });

  it.each(['ft-ink', 'ft-muted', 'ft-subtle', 'ft-accent'])(
    '--%s inside a white card on the navy',
    (name) => {
      expect(ratio(tokenIn('.dl-deep .dl-card', name), '#ffffff')).toBeGreaterThanOrEqual(
        AA_BODY,
      );
    },
  );

  /*
   * The one genuinely nice thing the navy buys, asserted so it cannot be
   * quietly given up: Denis's exact #0AC4E0 is 2.10:1 on white and unusable as
   * text there, but 6.12:1 on this ground. The dark region is the one place on
   * the page where the real brand cyan carries type, and this states that it
   * has to stay the real one.
   */
  it('uses the exact brand cyan as text, which only the navy makes possible', () => {
    const pop = block('.dl-surface').match(/--dl-pop:\s*(#[0-9a-fA-F]{6})/)?.[1];

    expect(tokenIn('.dl-deep', 'ft-accent')).toBe(pop);
    expect(ratio(pop!, '#ffffff')).toBeLessThan(3);
    expect(ratio(pop!, ground())).toBeGreaterThanOrEqual(AA_BODY);
  });
});

/**
 * Daylight components must not reach past their tokens for a colour.
 *
 * `.dl-surface` re-points the --ft-* set, so anything painting from those
 * tokens comes out light for free. The failure mode is a component reaching for
 * --color-gold or a literal `text-white` instead: on the dark design both are
 * correct and invisible as mistakes, and on white both are unreadable. Every
 * component in this tree shipped from a dark original, so this is the exact
 * copy-paste this test is here to catch.
 *
 * --dl-gold is allowed, and is the point of the distinction: it is this
 * palette's own token for gold as a FILL, which stays legal on white in a way
 * gold as text does not.
 */
describe('Daylight components paint from tokens', () => {
  const { readdirSync: rd } = require('node:fs') as typeof import('node:fs');
  const dir = join(__dirname, '..', 'components', 'marketing', 'daylight');
  const files = rd(dir).filter((f) => /\.tsx$/.test(f));

  /*
   * Comments are stripped before the scan, and that is not a convenience.
   * These files explain themselves partly by NAMING the dark values they
   * replaced — "the shared header writes `text-white` and `border-white/10` as
   * literals" — so a raw substring search flags the documentation and not the
   * code. Left in, the honest fix would have been to stop writing the
   * explanation down.
   */
  function code(file: string): string {
    return readFileSync(join(dir, file), 'utf8')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/\/\/[^\n]*/g, ' ');
  }

  it('finds the components to check', () => {
    expect(files.length).toBeGreaterThan(3);
  });

  it('strips comments rather than searching them', () => {
    // The footer's prose quotes `border-white/10`; its markup must not.
    expect(code('site-footer.tsx')).not.toContain('border-white/');
    expect(readFileSync(join(dir, 'site-footer.tsx'), 'utf8')).toContain('border-white/');
  });

  it.each(['var(--color-gold)', 'border-white/', 'bg-white/'])('none use %s', (needle) => {
    const offenders = files.filter((f) => code(f).includes(needle));
    expect(offenders, `${needle} is a dark-design value and is unreadable on white`).toEqual([]);
  });

  /*
   * White text is allowed, but only on the one dark fill this design has.
   *
   * This started as a flat ban, which was right until the header gained the
   * reference's dark pill — white on --ft-ink is 11.99:1 and is the most
   * legible control on the page. A flat ban would have had to be deleted to
   * let that through, taking the actual guarantee with it.
   *
   * So the rule is narrowed rather than dropped: every class list that paints
   * text white must also paint a dark background in the same list. That still
   * catches the mistake worth catching — white text inherited onto white, which
   * is what copying a class list over from the dark design produces.
   */
  it('only paints text white on the dark fill', () => {
    const DARK_FILL = 'bg-[var(--ft-ink)]';
    const offenders: string[] = [];

    for (const file of files) {
      // Every quoted or backticked class list in the file.
      for (const [, list] of code(file).matchAll(/["'`]([^"'`]*\btext-white\b[^"'`]*)["'`]/g)) {
        if (!list?.includes(DARK_FILL)) offenders.push(`${file}: ${list?.trim()}`);
      }
    }

    expect(offenders, `text-white without ${DARK_FILL} in the same class list`).toEqual([]);
  });
});
