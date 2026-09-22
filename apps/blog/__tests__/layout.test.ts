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
 * The sidebar panel is bounded and scrolls inside itself.
 *
 * This regresses silently: the layout looks right at every width until a post
 * is long enough, which no screenshot of a short fixture reveals. The first
 * version of this test was itself the proof — it asserted the CSS properties
 * and passed while the rail scrolled its own heading away and ran past the
 * bottom of the viewport, because the fixture had 16 entries and never
 * overflowed. These assert the structure that makes it work; the behaviour is
 * checked in a browser against a 31-heading fixture.
 *
 * The panel has raised the stakes since: the contents list is now one of four
 * rows and the only one that flexes, so a bound that fails does not merely
 * overflow — it pushes the call to action off the bottom of the screen.
 */
describe('the sidebar panel is bounded and scrolls inside itself', () => {
  const { readFileSync: rf } = require('node:fs') as typeof import('node:fs');
  const component = (name: string) =>
    rf(join(__dirname, '..', 'components', 'blog', name), 'utf8');

  const aside = component('post-aside.tsx');
  const toc = component('table-of-contents.tsx');
  const page = read('blog', '[slug]', 'page.tsx');

  it('bounds the sticky panel rather than the scrolling child', () => {
    // `overflow` on an ancestor breaks `position: sticky` for its descendants,
    // so one element cannot be both. The panel sticks; the list scrolls.
    expect(aside).toContain('lg:sticky');
    expect(aside).toContain('lg:h-[calc(100vh-11rem)]');
  });

  it('sizes that height for the panel before it sticks, not after', () => {
    // 8rem was computed for the stuck position (96px from the top) while the
    // panel actually starts ~137px down at 1280 and ~153px at 1024 — so the box
    // ran past the viewport bottom until you scrolled.
    expect(aside).not.toContain('h-[calc(100vh-8rem)]');
    expect(aside).not.toContain('h-[calc(100vh-9rem)]');
  });

  it('keeps the panel inside its column on a short post', () => {
    // A definite height is what lets the list flex and the offer's cap
    // resolve. On a post with three headings it would otherwise hang past the
    // bottom of the section it belongs to.
    expect(aside).toContain('lg:max-h-full');
  });

  it('lets the list shrink below its content height', () => {
    // Without `min-h-0` a flex child refuses to, and the bound silently fails.
    expect(aside).toContain('min-h-0 flex-1');
    expect(toc).toContain('min-h-0 flex-1 overflow-y-auto');
  });

  it('gives up height in order: the list first, the offer next, the button never', () => {
    /*
     * Three classes decide this between them, and none of them says so on its
     * own — which is exactly why it is asserted here rather than left to be
     * re-derived.
     *
     * The list is `flex-1`, i.e. basis zero, so it is already at its floor when
     * the panel runs short and yields everything first. The foot can shrink, so
     * it absorbs what is left rather than overflowing a panel that would clip
     * it. The button inside the foot cannot, so what actually gives is the
     * offer's scroll, not the call to action.
     */
    expect(aside).toContain('min-h-0 flex-1');
    expect(aside).toMatch(/mt-auto flex min-h-0 flex-col/);
    expect(aside).toMatch(/className="block w-full shrink-0 rounded-lg/);
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
 * breakpoints. `display: none` keeps only one in the accessibility tree.
 *
 * They name themselves differently now, and that is the thing to hold on to:
 * the panel variant has no heading of its own — the panel's header row is its
 * label — so it points at an id the panel owns, while the disclosure names
 * itself from its summary. A `panel` rendered without that id is a nav with no
 * accessible name, which is why the prop is required by the type rather than
 * merely documented.
 */
describe('the two contents variants stay distinguishable', () => {
  const { readFileSync: rf } = require('node:fs') as typeof import('node:fs');
  const aside = rf(
    join(__dirname, '..', 'components', 'blog', 'post-aside.tsx'),
    'utf8',
  );
  const page = read('blog', '[slug]', 'page.tsx');

  it('labels the panel list from the panel header, exactly once', () => {
    const ids = [...aside.matchAll(/LABEL_ID/g)];
    // The declaration, the heading's id, and the list's labelledBy.
    expect(ids).toHaveLength(3);
    expect(aside).toContain('labelledBy={LABEL_ID}');
    expect(aside).toContain('id={LABEL_ID}');
  });

  it('leaves the disclosure to name itself', () => {
    expect(page).toContain('variant="disclosure"');
    expect(page).not.toContain('labelledBy');
  });

  it('shows exactly one of them at any width', () => {
    expect(aside).toContain('hidden min-h-0 flex-1 lg:flex');
    expect(page).toContain('lg:hidden');
  });
});
