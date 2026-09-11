import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { clampPage, Pagination, parsePage, type PaginationProps } from '@/components/pagination';

const read = (...parts: string[]) => readFileSync(join(__dirname, '..', ...parts), 'utf8');

const render = (props: PaginationProps) =>
  renderToStaticMarkup(createElement(Pagination, props));

describe('parsePage', () => {
  it('defaults to the first page', () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage('')).toBe(1);
  });

  it('rejects junk rather than producing NaN', () => {
    // `Number('abc')` is NaN, and NaN reaches .range() as a broken offset — the
    // query fails rather than the screen falling back to page one.
    expect(parsePage('abc')).toBe(1);
    expect(parsePage('1e999')).toBe(1);
  });

  it('floors a fraction and refuses anything below one', () => {
    expect(parsePage('2.9')).toBe(2);
    expect(parsePage('0')).toBe(1);
    expect(parsePage('-5')).toBe(1);
  });

  it('does NOT cap, because the count is not known yet', () => {
    // This is the whole reason it is separate from clampPage: a
    // database-paginated screen has to build its range before it can learn how
    // many pages exist.
    expect(parsePage('99')).toBe(99);
  });
});

describe('clampPage', () => {
  it('pulls an out-of-range page back to the last real one', () => {
    // Otherwise ?page=99 on a two-page list renders an empty table, which is
    // indistinguishable from "you have no links".
    expect(clampPage('99', 2)).toBe(2);
  });

  it('leaves a page that exists alone', () => {
    expect(clampPage('2', 5)).toBe(2);
  });

  it('survives an empty list', () => {
    expect(clampPage('3', 0)).toBe(1);
  });
});

describe('Pagination', () => {
  const base: PaginationProps = { basePath: '/links', page: 2, pageCount: 5 };

  it('links to the pages either side', () => {
    const html = render(base);
    expect(html).toContain('href="/links?page=3"');
    expect(html).toContain('rel="next"');
    expect(html).toContain('rel="prev"');
  });

  it('links the first page as the bare path, with no ?page=1', () => {
    // A shareable URL with no noise, and it matches what every other "first
    // page" link in the admin produces — two spellings of one page would give
    // the same screen two URLs.
    expect(render(base)).toContain('href="/links"');
  });

  it('carries the other filters across', () => {
    const html = render({
      ...base,
      query: { status: 'missing', q: 'sba', kind: undefined },
    });
    // Dropping a filter key here is the bug this component was extracted to
    // prevent: paging would silently reset the reader's filters.
    expect(html).toContain('status=missing');
    expect(html).toContain('q=sba');
    // Falsy values are dropped rather than serialised as empty.
    expect(html).not.toContain('kind=');
  });

  it('owns the page key, even if a caller passes a stale one', () => {
    /*
     * `query` is documented as "everything EXCEPT page", but a caller that
     * spreads its own searchParams in would pass the current page through. The
     * component must win, or Next would land on `?page=2&page=3` and the
     * reader would never leave page two.
     */
    const html = render({ ...base, query: { page: '2', q: 'x' } });
    expect(html).toContain('href="/links?q=x&amp;page=3"');
    expect(html).not.toContain('page=2');
  });

  it('omits the previous link on the first page', () => {
    const html = render({ ...base, page: 1 });
    expect(html).not.toContain('rel="prev"');
    expect(html).toContain('rel="next"');
  });

  it('omits the next link on the last page', () => {
    const html = render({ ...base, page: 5 });
    expect(html).toContain('rel="prev"');
    expect(html).not.toContain('rel="next"');
  });

  it('renders no nav for a single page', () => {
    expect(render({ ...base, page: 1, pageCount: 1 })).toBe('');
  });

  it('still reports the total on a single page', () => {
    /*
     * A reader looking at 12 rows should not have to wonder whether that is all
     * of them. The pager disappears; the count must not.
     */
    const html = render({ ...base, page: 1, pageCount: 1, total: 12, label: 'post' });
    expect(html).toContain('12 posts');
  });

  it('pluralises the label off the total, not the page size', () => {
    expect(render({ ...base, pageCount: 1, page: 1, total: 1, label: 'post' })).toContain(
      '1 post<',
    );
  });

  it('groups thousands, because that is the number worth noticing', () => {
    const html = render({ ...base, total: 4213, label: 'link' });
    expect(html).toMatch(/4[,.  ]213 links/);
  });
});

describe('every paginated screen uses the shared component', () => {
  it.each([
    ['posts', ['app', '(dashboard)', 'posts', 'page.tsx']],
    ['pages', ['app', '(dashboard)', 'pages', 'page.tsx']],
    ['links', ['app', '(dashboard)', 'links', 'page.tsx']],
    ['redirects', ['app', '(dashboard)', 'redirects', 'page.tsx']],
  ])('%s renders <Pagination>', (_label, parts) => {
    const source = read(...parts);
    expect(source).toContain('<Pagination');
    // No screen should be rebuilding the nav by hand any more — that is how the
    // copies drifted in the first place.
    expect(source).not.toContain('Page {page} of');
  });

  it('reads one page size, not one per screen', () => {
    // Separate constants drift until Posts shows 20 and Pages shows 50 for no
    // reason anyone remembers.
    expect(read('lib', 'queries.ts')).toContain('export const ADMIN_PER_PAGE = 20');

    for (const parts of [
      ['app', '(dashboard)', 'posts', 'page.tsx'],
      ['app', '(dashboard)', 'pages', 'page.tsx'],
      ['app', '(dashboard)', 'links', 'page.tsx'],
      ['app', '(dashboard)', 'redirects', 'page.tsx'],
    ]) {
      expect(read(...parts)).toContain('ADMIN_PER_PAGE');
    }
  });
});

describe('the Pages dropdowns are not paginated with the table', () => {
  /*
   * The trap this guards. Pages paginates its table, but the homepage selector
   * and the parent picker have to offer pages the table is not showing. Wiring
   * either to the paginated read gives you a <select> that cannot reach most of
   * its own options, and nothing about it looks broken.
   */
  it('the homepage selector reads every page', () => {
    const source = read('app', '(dashboard)', 'pages', 'page.tsx');
    expect(source).toContain('listAllPages');
    expect(source).toContain('allPages');
  });

  it('the parent picker reads every page', () => {
    const source = read('lib', 'queries.ts');
    expect(source).toMatch(/listParentOptions[\s\S]*?listAllPages\(siteId\)/);
  });
});
