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

function token(name: string): string {
  const match = CSS.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (!match?.[1]) throw new Error(`token --${name} not found in globals.css`);
  return match[1];
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
