import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { LeadMagnetOffer } from '@blog/core';

import { LeadMagnetPopover } from '@/components/blog/lead-magnet-popover';

/**
 * The offer floats over the sidebar instead of sitting in it.
 *
 * That is the property worth pinning. In flow, the card and the contents list
 * competed for one column's height and whichever came second lost — which is
 * what produced first a contents list below the fold and then an accordion.
 * Out of flow, the rail lays out as though the offer were not there.
 *
 * Static markup only: there is no DOM here, so this covers the state a reader
 * is served. The minimised tile is reached by a click and by localStorage, and
 * asserting a useState toggle would be testing React.
 */

const OFFER: LeadMagnetOffer = {
  slug: 'equipment-financing-toolkit',
  heading: 'Get the Equipment Financing Toolkit',
  body: 'The 20 checks we run before calling a deal good.',
  buttonLabel: 'Send it to me',
  successMessage: 'Check your inbox.',
  collectName: false,
  consentText: null,
  image: null,
};

const html = () =>
  renderToStaticMarkup(createElement(LeadMagnetPopover, { offer: OFFER }));

describe('the offer popup', () => {
  it('is served open, with the card inside it', () => {
    const out = html();

    expect(out).toContain('Get the Equipment Financing Toolkit');
    expect(out).toContain('Send it to me');
  });

  /*
   * Out of flow at `lg` and up, which is the whole point: the contents list
   * below it is laid out as though the offer were not there, so closing the
   * popup gives back nothing because it never took anything.
   */
  it('floats over the rail rather than occupying it', () => {
    const out = html();

    expect(out).toMatch(/class="[^"]*lg:absolute/);
    expect(out).toMatch(/class="[^"]*lg:top-0/);
  });

  it('stacks over the contents list', () => {
    expect(html()).toMatch(/class="[^"]*lg:z-20/);
  });

  /*
   * Below `lg` there is no second column to float over — the rail stacks under
   * the article — so the overlay is desktop-only and the card sits in the flow
   * with a margin, where an end-of-post call to action belongs.
   */
  it('drops into the flow below the desktop breakpoint', () => {
    const out = html();

    expect(out).toMatch(/class="mb-8 /);
    expect(out).toMatch(/class="[^"]*lg:mb-0/);
  });

  /*
   * Out of flow means nothing pushes back when the card is taller than the
   * window: it would overlap the section below instead of being bounded by it.
   */
  it('is bounded to the rail height and scrolls inside it', () => {
    const out = html();

    expect(out).toMatch(/class="[^"]*lg:max-h-\[calc\(100vh-11rem\)\]/);
    expect(out).toMatch(/class="[^"]*lg:overflow-y-auto/);
  });

  it('offers a way to close it', () => {
    expect(html()).toContain('Close this offer');
  });

  /*
   * Not a modal. A backdrop over the article is the thing Google treats as an
   * intrusive interstitial, and this covers a sidebar in one corner instead.
   */
  it('puts no backdrop over the page', () => {
    const out = html();

    expect(out).not.toContain('role="dialog"');
    expect(out).not.toMatch(/class="[^"]*fixed inset-0/);
  });
});
