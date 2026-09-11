import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const APP = join(__dirname, '..', 'app');
const read = (...parts: string[]) => readFileSync(join(APP, ...parts), 'utf8');

const COMPONENTS = join(__dirname, '..', 'components', 'blog');
const component = (name: string) => readFileSync(join(COMPONENTS, name), 'utf8');

const panels = component('sidebar-panels.tsx');

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
  const toc = component('table-of-contents.tsx');
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
    // It has to hold at every level between the bounded aside and the
    // scrolling list — the panel that now sits between them included.
    expect(panels).toContain('min-h-0');
    expect(toc).toContain('min-h-0 flex-1 overflow-y-auto');
  });

  it('keeps the heading outside the scroll container', () => {
    /*
     * The contents list used to carry its own heading, positioned outside its
     * scroll container so that scrolling the list did not scroll its label
     * away. The panel header replaced it and has to do the same job: a
     * shrink-0 sibling of the body, never inside it.
     */
    expect(panels).toContain('<h2 className="shrink-0">');
    expect(toc).not.toContain('Table of Contents<');
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
 * breakpoints, so `display: none` keeps only one in the accessibility tree.
 *
 * They used to be told apart by an `id` prop, because each labelled its own
 * <nav> through `aria-labelledby` and two elements cannot share one id. The
 * rail's heading now belongs to its panel, so it names itself instead — and
 * the id prop is gone, which is what these guard.
 */
describe('the two contents variants stay distinguishable', () => {
  const page = read('blog', '[slug]', 'page.tsx');
  const toc = component('table-of-contents.tsx');

  it('names the rail without borrowing an id', () => {
    expect(toc).toContain('aria-label="Table of Contents"');
    // The attribute, not the word: the file explains in a comment why the
    // prop it used to need is gone.
    expect(toc).not.toMatch(/aria-labelledby=/);
  });

  it('has no toc id left to collide', () => {
    expect(page).not.toMatch(/id="toc-/);
  });

  it('shows exactly one of them at any width', () => {
    // The rail lives in its panel now, so the breakpoint gate moved with it.
    expect(panels).toContain('hidden lg:flex');
    expect(page).toContain('lg:hidden');
  });
});

/*
 * The accordion is the fix for a rail that ran past the bottom of the
 * viewport. Two panels that can both be open can both be too tall together,
 * which is the state it exists to make unreachable.
 */
describe('the sidebar panels open one at a time', () => {
  it('holds which panel is open, not whether each one is', () => {
    // Two booleans can both be true. One slot cannot.
    expect(panels).toContain("useState<PanelId | null>");
    expect(panels).not.toMatch(/useState\(false\)/);
  });

  it('does not open the contents list by default', () => {
    expect(panels).toContain("offer ? 'offer' : 'toc'");
  });

  it('toggles from one control carrying both the title and the icon', () => {
    // A separate icon button would be a second tab stop announcing nothing
    // the title does not already say.
    expect(panels).toContain('aria-expanded={open}');
    expect(panels).toContain('aria-hidden="true"');
  });

  it('unmounts a closed body rather than hiding it with a class', () => {
    /*
     * `[hidden]` and Tailwind's `flex` are both display declarations at equal
     * specificity, so a panel hidden that way stays visible or not depending
     * on stylesheet order.
     */
    expect(panels).toContain('{open ? (');
    expect(panels).not.toMatch(/hidden=\{!open\}/);
  });
});
