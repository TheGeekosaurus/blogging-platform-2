import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const APP = join(__dirname, '..', 'app');
const read = (...parts: string[]) => readFileSync(join(APP, ...parts), 'utf8');

/**
 * The marketing rebuild moved the site's reading column out of the root layout so
 * a full-bleed landing page could exist. That is a silent-breakage change: if the
 * container goes missing from a route that used to inherit it, nothing errors —
 * the text just runs edge to edge at 1440px, which no test would otherwise catch.
 *
 * These are source-text assertions rather than render tests on purpose. The
 * container's presence is a static property of these files, and asserting it
 * directly needs no Supabase, no fixtures and no App Router harness.
 */
const CONTAINER = 'max-w-3xl';

describe('the reading column survived leaving the root layout', () => {
  it('is no longer in the root layout, wrapping every route', () => {
    const layout = read('layout.tsx');
    // The generic (non-marketing) header and footer legitimately use it to line
    // themselves up with the content, so this asserts the <main> is not wrapped.
    expect(layout).not.toMatch(/<main[^>]*max-w-3xl/);
  });

  /*
   * It moved again, and for the same reason it left the root layout: the post
   * page is now a full-bleed two-column design, and a route cannot escape an
   * ancestor layout's wrapper. So app/blog/layout.tsx is a pass-through and the
   * column lives in <ReadingColumn>, applied by the routes that want it.
   */
  it('is no longer in app/blog/layout.tsx, which would trap the post page', () => {
    expect(read('blog', 'layout.tsx')).not.toContain(CONTAINER);
  });

  it('is defined once, in the ReadingColumn component', () => {
    const { readFileSync: rf } = require('node:fs') as typeof import('node:fs');
    const source = rf(join(__dirname, '..', 'components', 'reading-column.tsx'), 'utf8');
    expect(source).toContain(CONTAINER);
  });

  it.each([
    ['the blog index', ['blog', 'page.tsx']],
    ['the categories index', ['blog', 'categories', 'page.tsx']],
    ['category archives', ['blog', 'category', '[slug]', 'page.tsx']],
    ['tag archives', ['blog', 'tag', '[slug]', 'page.tsx']],
    ['post pagination', ['blog', 'page', '[page]', 'page.tsx']],
  ])('is applied by %s via ReadingColumn', (_label, parts) => {
    // Matches the opening tag without the closing bracket: the index passes
    // `themeToggle={false}`, and asserting on the bare tag would call that a
    // missing container.
    expect(read(...parts)).toContain('<ReadingColumn');
  });

  it('is NOT applied by the post page, which owns the full width', () => {
    const source = read('blog', '[slug]', 'page.tsx');
    expect(source).not.toContain('<ReadingColumn');
    expect(source).toContain('blog-surface');
  });

  it.each([
    ['the 404 page', ['not-found.tsx']],
    ['the pages catch-all', ['[...path]', 'page.tsx']],
    ['the homepage fallback', ['page.tsx']],
  ])('is supplied locally by %s, which used to inherit it', (_label, parts) => {
    expect(read(...parts)).toContain(CONTAINER);
  });
});

describe('a full-bleed page is genuinely full-bleed', () => {
  it("does not wrap the 'full' page template in the reading column", () => {
    const source = read('[...path]', 'page.tsx');
    const fullBranch = source.slice(
      source.indexOf("page.template === 'full'"),
      source.indexOf('// ', source.indexOf("page.template === 'full'") + 30),
    );
    expect(fullBranch).toContain('<PageBody page={page} />');
    expect(fullBranch).not.toContain(CONTAINER);
  });
});

/*
 * The contents rail is bounded and scrolls inside itself.
 *
 * This regresses silently: the layout looks right at every width until a post
 * is long enough, which no screenshot of a short fixture reveals. The first
 * version of this test was itself the proof — it asserted the CSS properties
 * and passed while the rail scrolled its own heading away and ran past the
 * bottom of the viewport, because the fixture had 16 entries and never
 * overflowed. These assert the structure that makes it work; the behaviour is
 * checked in a browser against a 31-heading fixture.
 */
describe('the contents rail is bounded and scrolls inside itself', () => {
  const { readFileSync: rf } = require('node:fs') as typeof import('node:fs');
  const toc = rf(
    join(__dirname, '..', 'components', 'blog', 'table-of-contents.tsx'),
    'utf8',
  );
  const page = read('blog', '[slug]', 'page.tsx');

  it('bounds the sticky aside rather than the scrolling child', () => {
    // `overflow` on an ancestor breaks `position: sticky` for its descendants,
    // so one element cannot be both. The aside sticks; the list scrolls.
    expect(page).toContain('lg:sticky');
    expect(page).toContain('lg:max-h-[calc(100vh-11rem)]');
  });

  it('sizes that height for the rail before it sticks, not after', () => {
    // 8rem was computed for the stuck position (96px from the top) while the
    // rail actually starts ~137px down at 1280 and ~153px at 1024 — so the box
    // ran past the viewport bottom until you scrolled.
    expect(page).not.toContain('max-h-[calc(100vh-8rem)]');
    expect(page).not.toContain('max-h-[calc(100vh-9rem)]');
  });

  it('lets the list shrink below its content height', () => {
    // Without `min-h-0` a flex child refuses to, and the bound silently fails.
    expect(page).toContain('min-h-0');
    expect(toc).toContain('min-h-0 flex-1 overflow-y-auto');
  });

  it('keeps the heading outside the scroll container', () => {
    // It used to be inside, so scrolling the list scrolled its own label away
    // and left an unlabelled column of links.
    expect(toc).toContain('shrink-0 text-sm font-semibold uppercase');
  });

  it('fades whichever edge has more content beyond it', () => {
    // The scrollbar is near-invisible by design; a list clipped flat against
    // the container edge then reads as broken rather than scrollable.
    expect(toc).toContain('data-fade={fade}');
    const css = read('globals.css');
    for (const value of ['bottom', 'top', 'both']) {
      expect(css).toContain(".toc-scroll[data-fade='" + value + "']");
    }
  });
});

/*
 * Both contents variants render on every post, hidden at each other's
 * breakpoints. `display: none` keeps only one in the accessibility tree, but
 * that only holds if each carries its own id — two elements sharing one makes
 * every `aria-labelledby` pointing at it ambiguous.
 */
describe('the two contents variants stay distinguishable', () => {
  const page = read('blog', '[slug]', 'page.tsx');

  it('gives each variant a distinct id', () => {
    const ids = [...page.matchAll(/id="(toc-[a-z]+)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
  });

  it('shows exactly one of them at any width', () => {
    expect(page).toContain('hidden min-h-0 flex-1 lg:flex');
    expect(page).toContain('lg:hidden');
  });
});
