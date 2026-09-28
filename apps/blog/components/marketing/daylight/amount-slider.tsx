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
 * THE RANGE IS THE ONE THING HERE WORTH CHECKING AGAINST REALITY. It stops at
 * $1.5M because that is the approval ceiling the funding cards and the page's
 * own metadata state. The homepage's first CTA tile says "$15K to $5M across 6
 * funding types", which disagrees — see the note on MAX. A slider that offers
 * $5M on a lead form for products that cap at $1.5M is a promise the
 * application cannot keep, so this follows the lower of the two until Denis
 * settles which is right.
 */

const MIN = 15_000;
/*
 * Not $5M. See the note above — this tracks the approval ceiling in
 * FUNDING_OPTIONS and in the route's own description, not the tile's copy.
 * Raise it here and in that tile together, once the two are reconciled.
 */
const MAX = 1_500_000;
const STEP = 5_000;
/*
 * The default is an ANCHOR, not a neutral starting point — it is the figure a
 * visitor who never touches the control submits, and the one every other
 * position is judged against. $350k sits mid-market for these products and
 * leaves the track visibly filled; at $150k the cyan was a sliver against a
 * $1.5M ceiling and the slider read as empty rather than as set. Move it if the
 * lead quality argues otherwise — it is one number and nothing else depends on
 * it.
 */
const DEFAULT = 350_000;

/** Whole dollars, no cents — the figure is a round number by construction. */
const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function AmountSlider() {
  const [amount, setAmount] = useState(DEFAULT);
  const id = useId();

  const clamp = (next: number) => Math.min(MAX, Math.max(MIN, next));
  /* Drives the filled portion of the track — see the gradient in globals.css. */
  const fill = ((amount - MIN) / (MAX - MIN)) * 100;

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
          onClick={() => setAmount((a) => clamp(a - STEP))}
          disabled={amount <= MIN}
          aria-label={`Decrease by ${money.format(STEP)}`}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--ft-card-raised)] text-2xl leading-none text-[var(--ft-ink)] transition-colors hover:bg-[var(--dl-pop)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--ft-card-raised)]"
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
          onClick={() => setAmount((a) => clamp(a + STEP))}
          disabled={amount >= MAX}
          aria-label={`Increase by ${money.format(STEP)}`}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--ft-card-raised)] text-2xl leading-none text-[var(--ft-ink)] transition-colors hover:bg-[var(--dl-pop)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--ft-card-raised)]"
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>

      <input
        type="range"
        min={MIN}
        max={MAX}
        step={STEP}
        value={amount}
        onChange={(event) => setAmount(Number(event.target.value))}
        aria-labelledby={`${id}-label`}
        /* Screen readers read the raw number otherwise: "one five zero zero zero zero". */
        aria-valuetext={money.format(amount)}
        style={{ ['--dl-fill' as string]: `${fill}%` }}
        className="mt-8"
      />

      <Link
        href={`${CTA_HREF}?amount=${amount}`}
        className="nc-cta mt-8 block rounded-full bg-[var(--dl-gold)] px-6 py-5 text-center text-[1.0625rem] font-bold leading-tight no-underline transition-[background-color,box-shadow] hover:bg-[#cf9832] hover:shadow-[0_8px_24px_-8px_rgba(224,168,64,0.8)]"
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
