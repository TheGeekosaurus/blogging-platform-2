import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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
    expect(html()).toMatch(/class="[^"]*lg:absolute/);
  });

  /*
   * Anchored to the bottom of the sidebar, not the top. A reader deep in an
   * article is looking at the end of the contents list, not its start.
   */
  it('is anchored to the bottom of the rail', () => {
    const out = html();

    expect(out).toMatch(/class="[^"]*lg:bottom-0/);
    expect(out).not.toMatch(/class="[^"]*lg:top-0/);
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

    // Matched as a class among others rather than at the start of the
    // attribute: what matters is that the margin is there and cancelled at
    // `lg`, not what order Tailwind's classes happen to be written in.
    expect(out).toMatch(/class="[^"]*\bmb-8\b/);
    expect(out).toMatch(/class="[^"]*\blg:mb-0\b/);
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

  /*
   * The border light must not be a child of the box that scrolls, or it slides
   * up the card as the reader scrolls it — a ring that is supposed to trace the
   * outline drifting across the middle of the form instead.
   */
  it('keeps the border light off the scrolling box', () => {
    const out = html();

    const beam = out.match(/class="([^"]*lm-beam[^"]*)"/);
    expect(beam, 'no element carries the beam').not.toBeNull();
    expect(beam?.[1]).not.toContain('overflow-y-auto');
  });

  it('carries the border light', () => {
    expect(html()).toMatch(/class="[^"]*lm-beam/);
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

/**
 * The border light is defined in globals.css rather than in the component,
 * because it is the one place brand gold is allowed on a blog surface — see the
 * comment on `.lm-beam` there, and contrast.test.ts for the rule it excepts.
 */
describe('the border light', () => {
  const css = readFileSync(
    join(__dirname, '..', 'app', 'globals.css'),
    'utf8',
  );

  it('rotates the gradient rather than the element', () => {
    /*
     * Rotating the element spins the rounded rectangle itself, which only
     * looks right while the box is square. The popup is far taller than wide.
     */
    expect(css).toContain('from var(--lm-beam-angle)');
    expect(css).not.toMatch(/\.lm-beam::before[\s\S]{0,400}transform: rotate/);
  });

  it('registers the angle so it can be interpolated', () => {
    // An unregistered custom property is a string to the animation engine and
    // jumps from one value to the next instead of sweeping.
    expect(css).toMatch(/@property --lm-beam-angle[\s\S]*?syntax: '<angle>'/);
  });

  it('draws two points, not one', () => {
    // Opposite each other, which is what the second stop 180 degrees on does.
    const stops = css.match(/var\(--color-gold\)/g) ?? [];
    expect(stops.length).toBeGreaterThanOrEqual(2);
  });

  it('masks the gradient down to the border', () => {
    // Without this the conic gradient fills the whole card.
    expect(css).toContain('mask-composite: exclude');
    // Safari spells it differently and neither prefix covers both engines.
    expect(css).toContain('-webkit-mask-composite: xor');
  });

  it('stops for a reader who asked for less motion', () => {
    /*
     * Continuous peripheral movement is a common vestibular trigger, and unlike
     * a transition it never ends.
     */
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,200}\.lm-beam::before[\s\S]{0,80}animation: none/,
    );
  });
});
