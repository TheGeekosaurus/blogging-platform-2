import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { HeadingGroup } from '@blog/core';

import { TableOfContents } from '@/components/blog/table-of-contents';

/**
 * How a row of the contents list is built.
 *
 * createElement rather than JSX, and .ts rather than .tsx, for the reason
 * json-ld.test.ts gives: the blog's vitest project has no JSX transform.
 *
 * Static markup only, so this is the list as a reader is served it. The
 * highlight and the automatic expansion need a DOM and a scroll position; what
 * is asserted here is the structure they act on.
 */

const GROUPS: HeadingGroup[] = [
  {
    heading: { id: 'what-is', text: 'What Is Equipment Financing?', level: 2 },
    children: [],
  },
  {
    heading: { id: 'rates', text: 'Rates and Terms', level: 2 },
    children: [
      { id: 'rates-apr', text: 'APR vs. Factor Rate', level: 3 },
      { id: 'rates-term', text: 'Term Length', level: 3 },
    ],
  },
];

const html = () =>
  renderToStaticMarkup(
    createElement(TableOfContents, {
      groups: GROUPS,
      variant: 'panel' as const,
      labelledBy: 'panel-label',
    }),
  );

describe('the contents list', () => {
  /*
   * A hairline track down the left with a gold fill marking reading progress.
   * Removed: inside the sidebar panel it sat a few pixels from the panel's own
   * border, so it read as a second edge rather than as a gauge, and beside a
   * short list it ran on into empty space.
   *
   * Asserted as an absence because the failure mode is re-introduction — the
   * data attributes are what a reinstated version would reach for.
   */
  it('draws no rail down its left edge', () => {
    const out = html();

    expect(out).not.toContain('data-toc-track');
    expect(out).not.toContain('data-toc-progress');
    // The padding the rail was reserving went with it.
    expect(out).toMatch(/<ol class="flex list-none flex-col gap-3"/);
  });

  /*
   * The marker is at the trailing edge of the row. That is not only a
   * preference: leading, it forced every row WITHOUT sub-headings to carry an
   * invisible spacer of the same width, purely so the titles lined up.
   */
  it('puts the disclosure marker after the title, not before it', () => {
    const out = html();

    const row = out.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)?.[1] ?? '';

    expect(row, 'no disclosure row rendered').not.toBe('');
    expect(row.indexOf('Rates and Terms')).toBeLessThan(row.indexOf('<svg'));
  });

  it('gives a section with no sub-headings no spacer to line up against', () => {
    const out = html();

    // The childless row is a bare list item: no flex row, no phantom box where
    // a marker would have been.
    expect(out).toContain('<li><a href="#what-is"');
  });

  /*
   * Native `<details>`, so the server-rendered HTML is a working collapsible
   * list before any JavaScript arrives — the client layer only adds the
   * highlight and the automatic expansion.
   */
  it('collapses natively, not in JavaScript', () => {
    const out = html();

    expect(out).toContain('<details');
    expect(out).toContain('#rates-apr');
  });

  it('renders nothing at all for a post with no headings', () => {
    expect(
      renderToStaticMarkup(
        createElement(TableOfContents, {
          groups: [],
          variant: 'panel' as const,
          labelledBy: 'panel-label',
        }),
      ),
    ).toBe('');
  });
});
