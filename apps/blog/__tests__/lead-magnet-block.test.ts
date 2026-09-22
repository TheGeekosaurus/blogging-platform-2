import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { LeadMagnetOffer } from '@blog/core';

import { LeadMagnetBlock } from '@/components/blog/lead-magnet-block';

/**
 * The offer is a row of the sidebar panel, not something floating over it.
 *
 * That is the property worth pinning, and it is the reverse of what this file
 * asserted a version ago. The offer was an overlay precisely so the contents
 * list could lay out as though it were not there; in the panel it is in flow
 * again, directly above the standing call to action, and the list is the row
 * that gives way. The tests below are what stop it drifting back out of flow —
 * an absolutely positioned row inside a flex panel would overlap the button
 * under it rather than push it.
 *
 * Static markup only: there is no DOM here, so this covers the state a reader
 * is served. The collapsed strip is reached by a click and by localStorage, and
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

const html = () => renderToStaticMarkup(createElement(LeadMagnetBlock, { offer: OFFER }));

const withImage = () =>
  renderToStaticMarkup(
    createElement(LeadMagnetBlock, {
      offer: {
        ...OFFER,
        image: {
          url: 'https://project.supabase.co/storage/v1/object/public/media/toolkit.png',
          alt: null,
          width: 1400,
          height: 1050,
        },
      },
    }),
  );

describe('the offer block', () => {
  it('is served open, with the card inside it', () => {
    const out = html();

    expect(out).toContain('Get the Equipment Financing Toolkit');
    expect(out).toContain('Send it to me');
  });

  /*
   * In flow. Out of flow it would sit on top of the call to action below it
   * rather than above it, which is the one arrangement the panel exists to
   * prevent.
   */
  it('occupies the panel rather than floating over it', () => {
    /*
     * The OUTERMOST element only. Positioned boxes inside the card are fine and
     * necessary — the close control is pinned to its corner and the honeypot
     * sits off-screen — so a whole-document search for `absolute` would fail on
     * two things that are not this.
     */
    const root = html().match(/^<div class="([^"]*)"/);

    expect(root, 'the block does not start with a classed div').not.toBeNull();
    expect(root?.[1]).not.toMatch(/\b(lg:)?(absolute|fixed)\b/);
  });

  /*
   * NOT `shrink-0`, which is the counter-intuitive half of the shrink order.
   *
   * The contents list above is `flex-1` — basis zero — so it is already at its
   * floor when the panel runs short and cannot absorb any more. That makes this
   * block the one that overflows, and refusing to shrink here does not conjure
   * space: it pushes the call to action past the panel's edge, where
   * `overflow-hidden` clips it off the screen. `min-h-0` plus the scroll below
   * is what it does instead.
   */
  it('shrinks only after the contents list has given up everything', () => {
    const root = html().match(/^<div class="([^"]*)"/);

    expect(root?.[1]).toContain('min-h-0');
    expect(root?.[1]).not.toMatch(/\bshrink-0\b/);
  });

  /*
   * It HAD a flat `max-h-[26rem]`, which meant a scrollbar inside the opt-in
   * form on every screen — a form split across a scroll region reads as a
   * broken embed and puts the submit button behind a gesture. There is no cap
   * now: the card deploys to its whole height wherever it fits, and only
   * scrolls on a window too short to hold it, which is strictly better than an
   * unreachable Get Funded button.
   *
   * So the assertion is about the CAP, not the overflow. A `max-h` on this
   * block is the thing that must not come back.
   */
  it('scrolls only when it has to, never at a fixed height', () => {
    const out = html();

    expect(out).not.toMatch(/class="[^"]*max-h-\[/);
    // Bounded by whatever the flex shrink above left it, not by a number.
    expect(out).toMatch(/class="[^"]*h-full[^"]*overflow-y-auto/);
  });

  /*
   * The border light must not be a child of the box that scrolls, or it slides
   * up the card as the reader scrolls it — a ring that is supposed to trace the
   * outline drifting across the middle of the form instead.
   */
  it('keeps the border light off the scrolling box', () => {
    const beam = html().match(/class="([^"]*lm-beam[^"]*)"/);

    expect(beam, 'no element carries the beam').not.toBeNull();
    expect(beam?.[1]).not.toContain('overflow-y-auto');
  });

  /*
   * The card's natural height is now the whole budget, so the picture is the
   * one part of it an author can make arbitrarily large. Capped by HEIGHT, not
   * width: a portrait mockup constrained by width is still tall.
   */
  it('bounds the picture rather than the card', () => {
    const out = withImage();

    expect(out).toMatch(/class="[^"]*max-h-40/);
    // Height-capped and aspect-preserving, so nothing is ever cropped.
    expect(out).toMatch(/class="[^"]*w-auto/);
    expect(out).not.toMatch(/class="[^"]*object-cover/);
  });

  it('carries the border light', () => {
    expect(html()).toMatch(/class="[^"]*lm-beam/);
  });

  /*
   * Closing collapses it to a strip above the call to action; it does not
   * dismiss it. The control is the card's, so this only checks it survived
   * the move into the panel.
   */
  it('offers a way to close it', () => {
    expect(html()).toContain('Close this offer');
  });

  /*
   * Not a modal. A backdrop over the article is the thing Google treats as an
   * intrusive interstitial, and this is a row in a sidebar instead.
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

  it('owns its own positioning context', () => {
    /*
     * The ring is `position: absolute; inset: 0`, so without this it resolves
     * against the nearest positioned ancestor and draws itself somewhere else
     * entirely. That is not hypothetical: moving the offer from an overlay into
     * the panel dropped the `relative` utility the class used to rely on, and
     * the two points ended up running down the edge of the sidebar.
     */
    expect(css).toMatch(/\.lm-beam \{\s*position: relative/);
  });

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
