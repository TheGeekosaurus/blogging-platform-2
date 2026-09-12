import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { LeadMagnetOffer } from '@blog/core';

import { LeadMagnetCard } from '@/components/blog/lead-magnet-card';

/**
 * Where the dismiss control sits, and what the card does and does not ship.
 *
 * createElement rather than JSX, and .ts rather than .tsx, for the reason
 * json-ld.test.ts gives: the blog's vitest project has no JSX transform.
 *
 * Static markup only, so this is the card as a reader is served it — not what
 * happens when they click. There is no DOM here, and asserting a useState
 * toggle would be testing React.
 */

const OFFER: LeadMagnetOffer = {
  slug: 'equipment-financing-toolkit',
  heading: 'Get the Equipment Financing Toolkit',
  body: 'The 20 checks we run before calling a deal good.',
  buttonLabel: 'Send it to me',
  successMessage: 'Check your inbox.',
  collectName: false,
  consentText: 'No spam. Unsubscribe any time.',
  image: {
    url: 'https://project.supabase.co/storage/v1/object/public/media/toolkit.png',
    alt: null,
    width: 1400,
    height: 1050,
  },
};

const render = (offer: Partial<LeadMagnetOffer> = {}) =>
  renderToStaticMarkup(createElement(LeadMagnetCard, { offer: { ...OFFER, ...offer } }));

describe('the dismiss control', () => {
  /*
   * It used to live in the heading row, and on a card with an image that reads
   * as floating in the middle: the image is full-bleed across the top, so the
   * heading — and the cross beside it — start a couple of hundred pixels down.
   * Pinning it to the corner is the fix, and it only holds while the button is
   * positioned rather than in flow.
   */
  it('is pinned to the card corner, not placed in the heading row', () => {
    const html = render();

    expect(html).toMatch(/<button[^>]*class="[^"]*absolute[^"]*right-2[^"]*top-2/);
  });

  it('sits above the image rather than behind it', () => {
    // Without a stacking order the cross is painted under a full-bleed image
    // and cannot be clicked at all.
    expect(render()).toMatch(/<button[^>]*class="[^"]*z-10/);
  });

  /*
   * Absolute positioning resolves against the nearest positioned ancestor, so
   * without this the cross escapes to whatever ancestor happens to be
   * positioned — in the rail, somewhere else entirely.
   */
  it('has the card itself as its positioning context', () => {
    expect(render()).toMatch(/^<div class="relative /);
  });

  it('comes before the image in the tab order', () => {
    const html = render();

    // Reaching the way out should not mean tabbing through the fields being
    // declined, and DOM order is what decides that.
    expect(html.indexOf('Dismiss this offer')).toBeLessThan(html.indexOf('<img'));
  });

  it('keeps a long headline from running under it', () => {
    expect(render()).toMatch(/<h2 class="[^"]*pr-8/);
  });

  it('carries an accessible name, since it is icon-only', () => {
    const html = render();

    expect(html).toContain('aria-label="Dismiss this offer"');
    // The glyph itself says nothing worth announcing twice.
    expect(html).toContain('aria-hidden="true"');
  });
});

describe('what the card ships to the browser', () => {
  /*
   * The gate is only a gate while this holds. A client component's props are
   * serialised into the page HTML, so a download URL that reached the card
   * would be in view-source on every article the offer runs on. The capture
   * endpoint returns it after a submission instead.
   */
  it('has no download link in it', () => {
    const html = render();

    expect(html).not.toContain('.pdf');
    expect(html).not.toContain('Download it now');
  });

  it('renders the offer for a reader with no JavaScript yet', () => {
    const html = render();

    expect(html).toContain('Get the Equipment Financing Toolkit');
    expect(html).toContain('Send it to me');
    expect(html).toContain('No spam. Unsubscribe any time.');
  });

  it('omits the name field unless the offer asks for one', () => {
    expect(render()).not.toContain('First name');
    expect(render({ collectName: true })).toContain('First name');
  });

  /*
   * Positioned off-screen rather than `display: none`, because the cheapest
   * bots skip hidden fields and the point is that they should not notice.
   */
  it('carries the honeypot without announcing it', () => {
    const html = render();

    expect(html).toContain('name="company"');
    expect(html).toMatch(/aria-hidden="true"[^>]*class="[^"]*absolute left-\[-9999px\]/);
  });

  it('survives an offer with no image', () => {
    const html = render({ image: null });

    expect(html).not.toContain('<img');
    expect(html).toContain('Dismiss this offer');
  });
});
