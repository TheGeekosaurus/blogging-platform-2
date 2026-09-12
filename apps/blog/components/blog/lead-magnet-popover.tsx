'use client';

import { useEffect, useState } from 'react';

import type { LeadMagnetOffer } from '@blog/core';

import { LeadMagnetCard } from '@/components/blog/lead-magnet-card';
import { rememberClosed, startsMinimised } from '@/lib/lead-magnet';

/**
 * The offer as a popup over the sidebar, and as a tile when it is closed.
 *
 * WHY AN OVERLAY. In the rail's flow the card and the contents list competed
 * for one column's height, and whichever came second lost — first the contents
 * list was pushed below the fold, then an accordion traded one for the other a
 * click at a time. Taking the card out of flow ends the competition: the rail
 * lays out as though the offer were not there, and the offer sits on top of it.
 * Closing does not give the contents list its space back, because it never took
 * any.
 *
 * CLOSING MINIMISES, it does not dismiss. The cross drops the popup to a tile
 * pinned to the bottom of the window, which reopens it. An offer a reader
 * declined once is worth one small strip of screen afterwards; it is not worth
 * disappearing, and it is certainly not worth asking again on the next scroll.
 *
 * NOT A MODAL, deliberately. No backdrop, no focus trap, no inert page behind
 * it. It covers a sidebar, never the article, and it is dismissible in one
 * click — which is what keeps it outside what Google treats as an intrusive
 * interstitial. A blog whose traffic is search should not spend rankings on a
 * form. That is also why the overlay is desktop-only: below `lg` there is no
 * second column to float over, so the card sits in the flow where the rail
 * stacks under the article, and only the tile is fixed.
 */

type Mode = 'open' | 'minimised';

function ExpandIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12.5 10 7.5l5 5" />
    </svg>
  );
}

export function LeadMagnetPopover({ offer }: { offer: LeadMagnetOffer }) {
  /*
   * Starts open and is corrected on mount, for the same reason the theme
   * control starts at 'system': the server cannot know what this reader closed,
   * and reading localStorage during render is a hydration mismatch.
   *
   * Open rather than minimised is the right way round. The popup is in the
   * prerendered HTML either way, so for a reader who closed it last week it
   * collapses to the tile on hydration — brief, and in the direction that
   * costs nothing. Starting minimised would make it pop OPEN a moment after
   * load for everyone else, which is the version that reads as a bug.
   */
  const [mode, setMode] = useState<Mode>('open');

  useEffect(() => {
    if (startsMinimised(offer.slug)) setMode('minimised');
  }, [offer.slug]);

  if (mode === 'minimised') {
    return (
      /*
       * Fixed to the window, not to the column. "Anchored to the bottom of the
       * browser" is the whole point of the tile: it survives scrolling past the
       * sidebar entirely, which is when a reader is most likely to want the
       * offer back.
       *
       * Right-aligned to sit under the column it came from, and capped so it
       * cannot run off a narrow screen. Kept deliberately small — a bottom bar
       * that covers content on a phone is the interstitial this is designed not
       * to be.
       */
      <button
        type="button"
        onClick={() => setMode('open')}
        className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-muted)] py-2 pl-4 pr-3 text-left text-sm font-medium text-[var(--color-ink)] shadow-lg transition-colors hover:bg-[var(--color-surface)]"
      >
        {/*
          The headline, truncated. It is the only thing identifying the tile, so
          it is the accessible name too — `truncate` clips the text visually
          without touching what is announced.
        */}
        <span className="truncate">{offer.heading}</span>
        <span className="text-[var(--color-ink-muted)]">
          <ExpandIcon />
        </span>
      </button>
    );
  }

  return (
    /*
      In flow below `lg`, floating above the rail at `lg` and up.
      `lg:absolute` with `inset-x-0 top-0` pins it over the top of the sidebar;
      the aside is `relative`, so that is what it resolves against. `z-20` puts
      it over the contents list without reaching the site header.

      Bounded to the rail's own height, and scrolling inside that. Being out of
      flow means nothing pushes back when the card is taller than the window —
      it would simply overlap the section below, which on a short viewport is
      most of the time. The submit button is the element that has to stay
      reachable, and it is the last one.
    */
    <div className="mb-8 lg:absolute lg:inset-x-0 lg:top-0 lg:z-20 lg:mb-0 lg:max-h-[calc(100vh-11rem)] lg:overflow-y-auto">
      <LeadMagnetCard
        offer={offer}
        onClose={() => {
          rememberClosed(offer.slug, 'closed');
          setMode('minimised');
        }}
        /*
         * Recorded, but the popup stays open on the success state so the
         * download link survives. It only decides how the NEXT article opens.
         */
        onConverted={() => rememberClosed(offer.slug, 'converted')}
        className="shadow-xl lg:shadow-2xl"
      />
    </div>
  );
}
