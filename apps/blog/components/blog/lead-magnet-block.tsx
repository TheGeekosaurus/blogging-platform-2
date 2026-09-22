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
 * the contents list shorter. It is affordable because the list scrolls, so
 * "shorter" costs visible entries rather than reachable ones.
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
      TWO ELEMENTS, and the nesting is load-bearing. This one carries the border
      light; the one inside carries the height cap and the scrolling. Putting
      both on one element makes the ring a child of its own scroll container, so
      it slides up the card as the reader scrolls it — a light that is supposed
      to trace the border wandering across the middle of the form.

      `shrink-0` because the contents list above is the flexible row. Without it
      a flex container short of room would take the height out of both, and the
      submit button is not something to shave pixels off.
    */
    <div className="lm-beam shrink-0 rounded-xl">
      {/*
        Capped rather than unbounded. An offer with a tall image could otherwise
        claim the whole panel and leave the contents list at zero height —
        `flex-1 min-h-0` above will shrink to nothing without complaining. The
        cap is generous enough for an image, a line of copy and the form, and
        anything past it scrolls.
      */}
      <div className="max-h-[26rem] overflow-y-auto rounded-xl">
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
