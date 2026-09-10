import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const read = (...parts: string[]) => readFileSync(join(__dirname, '..', ...parts), 'utf8');

/**
 * Social cards are generated per route file with no shared layout to hang them
 * off, so nothing structurally stops four near-copies from drifting apart —
 * which already happened once: the post card carried its own colours and had
 * been left on the generic slate palette while the site went near-black and
 * gold. A shared post looked like a different company's blog.
 */
describe('every route with a card uses the one renderer', () => {
  const ROUTES = [
    ['site', ['app', 'opengraph-image.tsx']],
    ['post', ['app', 'blog', '[slug]', 'opengraph-image.tsx']],
    ['author', ['app', 'blog', 'author', '[slug]', 'opengraph-image.tsx']],
  ] as const;

  it.each(ROUTES)('the %s card calls ogCard', (_label, parts) => {
    const source = read(...parts);
    expect(source).toContain("from '@/lib/og-card'");
    expect(source).toContain('ogCard(');
    // Its own ImageResponse would mean its own layout and its own palette.
    expect(source).not.toContain('ImageResponse');
  });

  it.each(ROUTES)('the %s card declares size and contentType from the shared pair', (_l, parts) => {
    const source = read(...parts);
    expect(source).toContain('export const size = OG_SIZE');
    expect(source).toContain('export const contentType = OG_CONTENT_TYPE');
  });

  it('does NOT put a card inside the pages catch-all', () => {
    /*
     * Next refuses it: "Catch-all must be the last part of the URL in route
     * /[...path]/opengraph-image". A metadata file cannot live under a
     * catch-all segment, so database-backed pages inherit the site card rather
     * than getting a titled one.
     *
     * Recorded as a test because the obvious fix for "pages have a generic
     * card" is to add that file, and it fails the BUILD rather than typecheck
     * or tests — the slowest possible place to find out.
     */
    expect(existsSync(join(__dirname, '..', 'app', '[...path]', 'opengraph-image.tsx'))).toBe(
      false,
    );
  });

  it('has a card at the app root, which is what covers everything else', () => {
    /*
     * The mechanism worth pinning: an opengraph-image applies to its segment
     * AND every descendant without its own. This one file is why /get-funded,
     * /calc, /services, the policy pages, /blog and the archives all have a
     * card at all.
     */
    expect(existsSync(join(__dirname, '..', 'app', 'opengraph-image.tsx'))).toBe(true);
  });
});

describe('the card uses the brand palette', () => {
  const card = read('lib', 'og-card.tsx');
  const css = read('app', 'globals.css');

  /** Read a token's literal value out of globals.css. */
  function token(name: string): string {
    const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
    if (!match?.[1]) throw new Error(`--${name} not found`);
    return match[1];
  }

  it.each([
    ['ground', 'color-ground'],
    ['gold', 'color-gold'],
    ['ink', 'color-blog-ink'],
    ['muted', 'color-blog-muted'],
  ])('the %s matches globals.css', (_label, name) => {
    /*
     * The card cannot READ the CSS — it renders in the edge runtime with no
     * stylesheet — so the hexes are written out. That is the drift risk, and
     * this is the only thing standing against it: change a brand colour and
     * this test names the card as the other place to change.
     */
    expect(card).toContain(token(name));
  });

  it('is not still on the generic slate palette', () => {
    // Comments stripped first: the file's own docstring names the old colours
    // while explaining why they are gone, and that mention is not a value.
    const code = card.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    expect(code).not.toContain('#101216');
    expect(code).not.toContain('#7ea8ff');
  });
});

describe('the card survives real content', () => {
  const card = read('lib', 'og-card.tsx');

  it('clamps a long title instead of pushing the footer off the card', () => {
    // Titles are author-supplied and unbounded.
    expect(card).toContain('maxHeight');
    expect(card).toContain("overflow: 'hidden'");
  });

  it('shrinks a long title in steps, not on a continuous scale', () => {
    // A different size on every card stops the set looking like a set.
    expect(card).toMatch(/title\.length > \d+ \? \d+ : \d+/);
  });
});
