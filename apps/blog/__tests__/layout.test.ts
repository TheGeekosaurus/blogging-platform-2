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
 * The contents list used to share one sticky column with the metadata. Sticky
 * positioning clips rather than scrolls, so on any post whose list ran past the
 * viewport the last entries were simply unreachable — no error, no overflow
 * indicator, just a list that stopped.
 *
 * The fix is the rail owning its own scroll container, and it would regress
 * silently: the layout looks correct at every width until a post happens to be
 * long enough, which no screenshot of a short fixture would reveal.
 */
describe('the contents rail scrolls inside itself', () => {
  const { readFileSync: rf } = require('node:fs') as typeof import('node:fs');
  const source = rf(
    join(__dirname, '..', 'components', 'blog', 'table-of-contents.tsx'),
    'utf8',
  );

  it('pairs its sticky positioning with a bounded height', () => {
    expect(source).toContain('xl:sticky');
    expect(source).toContain('xl:max-h-[calc(100vh-8rem)]');
  });

  it('can scroll what that height cuts off', () => {
    expect(source).toContain('xl:overflow-y-auto');
  });

  it('leaves the metadata column sticky but unbounded, being short by nature', () => {
    const page = read('blog', '[slug]', 'page.tsx');
    expect(page).toContain('lg:sticky');
    expect(page).not.toContain('max-h-[calc');
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
    expect(page).toContain('hidden xl:block');
    expect(page).toContain('xl:hidden');
  });
});
