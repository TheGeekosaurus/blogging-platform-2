'use client';

import { useEffect, useState } from 'react';

import type { LeadMagnetOffer } from '@blog/core';

import { LeadMagnetCard } from '@/components/blog/lead-magnet-card';
import { rememberClosed, startsMinimised } from '@/lib/lead-magnet';

/**
 * The offer, as a block inside the sidebar panel.
 *
 * IN FLOW, and that is the change from the popup it replaces. The offer used to
 * float over the rail so the contents list could lay out as though it were not
 * there; now it is the panel's second-to-last row, directly above the standing
 * call to action, and it takes its height from the contents list above it. That
 * is the arrangement asked for and it is a real trade: opening the offer makes
 * the contents list shorter, and on a short viewport it can take nearly all of
 * it. That is the intended priority — someone who has just opened an offer is
 * not reading the contents list — and it is affordable because the list scrolls,
 * so what it loses is visible entries rather than reachable ones.
 *
 * COLLAPSED IS A CALL TO ACTION, not a dismissal and not a bottom-right tile.
 * Closed, this is a second button stacked above the panel's own — one line of
 * copy the reader can reopen. That is why closing is cheap to offer: the offer
 * never leaves the panel, it only stops taking room.
 *
 * THE BORDER LIGHT is two points of brand gold orbiting the outline, in both
 * states. It is the one thing in this column that moves, and it is what makes
 * a block in a quiet panel register as something to look at. Defined in
 * globals.css as `.lm-beam` — see there for why the gold lives in the
 * stylesheet, and for the reduced-motion stop.
 */

type Mode = 'open' | 'collapsed';

function TrayIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 3v8m0 0 3-3m-3 3-3-3" />
      <path d="M3.5 13v2.5h13V13" />
    </svg>
  );
}

export function LeadMagnetBlock({ offer }: { offer: LeadMagnetOffer }) {
  /*
   * Starts open and is corrected on mount, for the same reason the theme
   * control starts at 'system': the server cannot know what this reader closed,
   * and reading localStorage during render is a hydration mismatch.
   *
   * Open rather than collapsed is the right way round. The card is in the
   * prerendered HTML either way, so for a reader who closed it last week it
   * folds to the strip on hydration — brief, and in the direction that costs
   * nothing. Starting collapsed would make it spring OPEN a moment after load
   * for everyone else, which is the version that reads as a bug.
   */
  const [mode, setMode] = useState<Mode>('open');

  useEffect(() => {
    if (startsMinimised(offer.slug)) setMode('collapsed');
  }, [offer.slug]);

  if (mode === 'collapsed') {
    return (
      /*
       * Sized and shaped like the panel's own button so the two read as a pair,
       * and deliberately the quieter of the two: bordered rather than filled,
       * so the site's standing call to action below stays the loud one.
       *
       * `rounded-lg` is what the ring inherits, so the light runs round the
       * strip rather than round a rectangle behind it.
       */
      <button
        type="button"
        onClick={() => setMode('open')}
        className="lm-beam flex w-full shrink-0 items-center justify-between gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-2.5 text-left text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)]"
      >
        {/*
          The headline, truncated. It is the only thing identifying the strip,
          so it is the accessible name too — `truncate` clips the text visually
          without touching what is announced.
        */}
        <span className="truncate">{offer.heading}</span>
        <span className="text-[var(--color-accent)]">
          <TrayIcon />
        </span>
      </button>
    );
  }

  return (
    /*
      FULL HEIGHT WHEREVER IT FITS. This had a flat `max-h-[26rem]` for one
      revision, which meant a scrollbar inside the opt-in form on every screen
      — a form split across a scroll region reads as a broken embed and puts
      the submit button behind a gesture. There is no cap now. On any normal
      window the card deploys to its whole height and nothing here scrolls.

      THE SHRINK ORDER is what makes that safe, and it is worth being precise
      about because it is not obvious from the classes. The contents list above
      is `flex-1`, which is `flex: 1 1 0%` — basis zero, so in a panel short of
      room it is already at its minimum and contributes nothing to shrinking.
      It therefore gives up ALL of its height first, down to nothing, which is
      exactly the priority asked for: someone who has just opened an offer is
      not reading the contents list.

      Only once the list is at zero does this block start to shrink, and
      `min-h-0` plus the scroll below is what it does then instead of pushing
      the call to action out of the panel — which `overflow-hidden` up there
      would clip rather than reveal. Measured: on a 1366x768 laptop with a
      picture, a heading, four lines of copy and the form, the panel is about
      100px short, and without this the Get Funded button is simply not on the
      screen. So the scrollbar is not gone, it is conditional — it appears on
      the screens where the alternative is an unreachable button, and on
      nothing else.

      The other half of keeping it conditional is the image cap in
      LeadMagnetCard. The card's natural height is the whole budget now.
    */
    <div className="lm-beam min-h-0 rounded-xl">
      {/*
        TWO ELEMENTS, and the nesting is load-bearing. The outer one carries the
        border light, this one the scrolling. On a single element the ring
        becomes a child of its own scroll container and slides up the card as
        the reader scrolls it — a light that is supposed to trace the border
        wandering across the middle of the form.

        `h-full` rather than a max-height: the height is whatever the flex
        shrink above left the wrapper, so this follows it instead of naming a
        number that would be wrong at most window sizes.
      */}
      <div className="h-full overflow-y-auto rounded-xl">
        <LeadMagnetCard
          offer={offer}
          onClose={() => {
            rememberClosed(offer.slug, 'closed');
            setMode('collapsed');
          }}
          /*
           * Recorded, but the block stays open on the success state so the
           * download link survives. It only decides how the NEXT article opens.
           */
          onConverted={() => rememberClosed(offer.slug, 'converted')}
        />
      </div>
    </div>
  );
}
