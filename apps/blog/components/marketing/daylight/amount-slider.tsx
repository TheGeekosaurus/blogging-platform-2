'use client';

import Link from 'next/link';
import { useId, useState } from 'react';

import { CTA_HREF } from '../brand';
import { CheckCircleIcon } from './icons';

/**
 * The hero's "how much do you need?" card.
 *
 * DELIBERATELY NOT A CALCULATOR. It does not price anything, check anything or
 * submit anything — it collects one number and hands it to /get-funded, where
 * the real GoHighLevel qualifier asks the other ten questions. Denis asked for
 * it "bogus for now", and the honest version of bogus is a control that works
 * perfectly and simply does less, not one that looks like it computes something
 * and does not.
 *
 * WHY IT IS A CLIENT COMPONENT, on a page where nothing else is. A range input
 * with no JavaScript drags but cannot update the figure above it, so the number
 * would sit at its default while the thumb moved — which reads as broken rather
 * than as static. That is the whole cost: one small island in the hero, and the
 * markup still server-renders, so the card is in the static HTML with its
 * default value already in place.
 *
 * The amount rides in the querystring rather than anywhere else. It survives
 * the navigation with no storage and no state library, and /get-funded can pick
 * it up whenever the survey is wired to accept a starting figure. Until then it
 * is inert and harmless.
 *
 * THE RANGE IS $15K TO $5M, which is the site-wide figure and not a guess. It
 * appears three times in content.ts — the homepage's first CTA tile, LOANS.hero
 * and the business-loans page's `facts.amount` — and it is the widest of the
 * products because business loans are the widest product.
 *
 * An earlier version of this file capped it at $1.5M and called the two figures
 * a contradiction to be resolved. They are not: $1.5M is the LINE OF CREDIT's
 * ceiling specifically, stated as such everywhere it appears, and reading it as
 * a site-wide cap made this control quietly understate what the business
 * actually funds.
 */

const MIN = 15_000;
const MAX = 5_000_000;

/*
 * THE TRACK IS LOGARITHMIC, and it has to be at this range.
 *
 * Linear, $15,000 and $400,000 — which is most of the realistic asks — would
 * share the first eight percent of the travel, so nearly every visitor would be
 * fighting for a few pixels while four fifths of the bar covered amounts almost
 * nobody requests. The position runs 0-100 and maps onto the amount by a
 * constant RATIO, so equal movement is an equal PERCENTAGE change: the halfway
 * point is about $274,000 rather than $2.5M.
 *
 * The <input> carries the position, not the money, which is why aria-valuetext
 * below is not optional — without it a screen reader announces "57" for
 * $500,000.
 */
const POSITIONS = 100;

function amountAt(position: number): number {
  const raw = MIN * (MAX / MIN) ** (position / POSITIONS);
  /*
   * Rounded by magnitude, so the figure reads like something a person would
   * ask for. Without this the log curve produces $273,861 and similar, which
   * looks like a calculation rather than a request.
   */
  const step = raw < 100_000 ? 5_000 : raw < 1_000_000 ? 10_000 : 50_000;
  return Math.min(MAX, Math.max(MIN, Math.round(raw / step) * step));
}

/*
 * The default is an ANCHOR, not a neutral starting point — it is the figure a
 * visitor who never touches the control submits, and the one every other
 * position is judged against. Mid-track, which the curve puts near $275,000:
 * a credible mid-market ask, and visually a track that reads as set rather
 * than as empty or as maxed out.
 */
const DEFAULT_POSITION = POSITIONS / 2;

/** Whole dollars, no cents — the figure is a round number by construction. */
const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function AmountSlider() {
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const id = useId();

  const amount = amountAt(position);
  const nudge = (by: number) =>
    setPosition((p) => Math.min(POSITIONS, Math.max(0, p + by)));
  /* Drives the filled portion of the track — see the gradient in globals.css. */
  const fill = position;

  return (
    <div className="rounded-[28px] border-2 border-[var(--ft-ink)] bg-[var(--ft-bg)] p-7 shadow-[0_28px_60px_-32px_rgba(45,55,72,0.45)] sm:p-10">
      <h2
        id={`${id}-label`}
        className="text-center text-[clamp(1.25rem,2.2vw,1.6rem)] font-bold leading-tight text-[var(--ft-ink)]"
      >
        How much funding do you need?
      </h2>

      <div className="mt-7 flex items-center justify-between gap-4">
        {/*
          Steppers, for anyone who would rather not drag. They are real buttons
          with real labels — a bare "−" is announced as "minus" and nothing
          else, which says nothing about what it decrements.
        */}
        <button
          type="button"
          onClick={() => nudge(-2)}
          disabled={position <= 0}
          /*
           * "Decrease amount", not "Decrease by $5,000": the step is a constant
           * percentage of the current figure, so a fixed dollar label would be
           * wrong at every position but one.
           */
          aria-label="Decrease amount"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--ft-card-raised)] text-2xl leading-none text-[var(--ft-ink)] transition-colors hover:bg-[var(--dl-pop)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--ft-card-raised)]"
        >
          <span aria-hidden="true">−</span>
        </button>

        {/*
          `tabular-nums` so the figure does not jump sideways as digits change
          while dragging. aria-live is off: the range input below already
          announces its own value on every change, and a second announcement of
          the same number is noise rather than help.
        */}
        <p className="min-w-0 flex-1 text-center text-[clamp(2rem,4.4vw,3rem)] font-bold tabular-nums leading-none tracking-tight text-[var(--ft-ink)]">
          {money.format(amount)}
        </p>

        <button
          type="button"
          onClick={() => nudge(2)}
          disabled={position >= POSITIONS}
          aria-label="Increase amount"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-[var(--ft-card-raised)] text-2xl leading-none text-[var(--ft-ink)] transition-colors hover:bg-[var(--dl-pop)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--ft-card-raised)]"
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={POSITIONS}
        step={1}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-labelledby={`${id}-label`}
        /* Without this a reader announces the POSITION — "57" — not the money. */
        aria-valuetext={money.format(amount)}
        style={{ ['--dl-fill' as string]: `${fill}%` }}
        className="mt-8"
      />

      <Link
        href={`${CTA_HREF}?amount=${amount}`}
        className="nc-cta mt-8 block rounded-md bg-[var(--dl-gold)] px-6 py-5 text-center text-[1.0625rem] font-bold leading-tight no-underline transition-[background-color,box-shadow] hover:bg-[#cf9832] hover:shadow-[0_8px_24px_-8px_rgba(224,168,64,0.8)]"
      >
        See what you qualify for
      </Link>

      <p className="mt-6 text-center text-[0.9375rem] leading-[1.55] text-[var(--ft-muted)]">
        Answer a few simple questions and an advisor will come back with the options you
        actually qualify for.
      </p>

      <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[0.9375rem] text-[var(--ft-muted)]">
        {/*
          Both claims are the live site's own, not the reference's. "Soft credit
          check" rather than "no credit check": the footer's funding disclaimer
          states that every application is subject to a soft pull, and a hero
          promising none would contradict it on the same page.
        */}
        {['Soft credit check only', 'No obligation'].map((claim) => (
          <li key={claim} className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 shrink-0 text-[var(--ft-accent)]" />
            {claim}
          </li>
        ))}
      </ul>
    </div>
  );
}
