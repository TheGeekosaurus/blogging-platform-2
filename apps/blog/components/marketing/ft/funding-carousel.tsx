'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { ArrowUpRightIcon } from './icons';

/** How long a card holds before the track advances. */
const DWELL_MS = 5000;

/**
 * The funding-options cards, as a slow auto-advancing carousel.
 *
 * A REAL SCROLL CONTAINER, not a transformed track. Scroll snapping does the
 * positioning, which means touch, trackpad, shift-wheel and keyboard all work
 * without any of it being reimplemented here — the arrows and the timer just
 * call `scrollTo`. A translated track would have had to grow its own handlers
 * for every one of those.
 *
 * The cards themselves are server-rendered and passed in as children; this
 * component adds movement, not markup.
 *
 * Auto-advance stops whenever someone is actually using the thing — pointer
 * over it, or keyboard focus inside it — because a card sliding out from under
 * a reader mid-sentence is worse than no animation at all. It never starts under
 * `prefers-reduced-motion`, where an unrequested 5-second loop is exactly the
 * thing being asked for less of; the arrows still work, so nothing is lost.
 */
export function FundingCarousel({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  /** Scroll by one card, wrapping at the end. `dir` is 1 or -1. */
  const step = useCallback((dir: number) => {
    const track = trackRef.current;
    if (!track) return;

    const card = track.firstElementChild as HTMLElement | null;
    if (!card) return;

    // Measured, not assumed: the gap and the card width both change at the
    // breakpoint, and reading the DOM is cheaper than keeping a copy in sync.
    const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
    const stride = card.offsetWidth + gap;

    // scrollWidth - clientWidth is the last valid scrollLeft. The 2px tolerance
    // absorbs sub-pixel layout so "at the end" is not missed by a rounding error.
    const max = track.scrollWidth - track.clientWidth;
    const next = track.scrollLeft + dir * stride;

    track.scrollTo({
      left: next > max + 2 ? 0 : next < -2 ? max : next,
      behavior: 'smooth',
    });
  }, []);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => step(1), DWELL_MS);
    return () => window.clearInterval(timer);
  }, [paused, step]);

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className="group relative"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="ft-carousel-track flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth"
      >
        {children}
      </div>

      <Arrow direction="prev" onClick={() => step(-1)} />
      <Arrow direction="next" onClick={() => step(1)} />
    </div>
  );
}

/**
 * Hidden until the pointer is over the carousel, per the brief — but always
 * visible to a keyboard, via `focus-visible`. An arrow that only exists on
 * hover is an arrow a keyboard user can tab to and never see.
 */
function Arrow({ direction, onClick }: { direction: 'prev' | 'next'; onClick: () => void }) {
  const isNext = direction === 'next';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isNext ? 'Next funding option' : 'Previous funding option'}
      className={`absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--ft-line)] bg-[var(--ft-bg)]/90 text-[var(--ft-ink)] opacity-0 backdrop-blur transition-opacity hover:border-[var(--ft-accent)] focus-visible:opacity-100 group-hover:opacity-100 md:flex ${
        isNext ? '-right-5' : '-left-5'
      }`}
    >
      {/* One icon, rotated: the arrow points up-right, so 45deg is due right. */}
      <ArrowUpRightIcon
        className={`h-5 w-5 ${isNext ? 'rotate-45' : '-rotate-[135deg]'}`}
      />
    </button>
  );
}
