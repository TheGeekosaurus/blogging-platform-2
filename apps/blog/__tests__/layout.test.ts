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

  it('is supplied by app/blog/layout.tsx, so every blog route keeps it', () => {
    expect(read('blog', 'layout.tsx')).toContain(CONTAINER);
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
