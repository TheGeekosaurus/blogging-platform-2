import Link from 'next/link';

import { Calculator } from './calculator';
import { CALCULATOR, REQUIREMENTS } from './content';
import { CalculatorIcon } from './icons';
import { CONTAINER } from './primitives';

/*
 * /calc — the page around the calculator.
 *
 * A server component wrapping one client component, which is the split that
 * matters here: the hero, the requirements strip and the closing band are all
 * static copy and ship as HTML, and only ./calculator.tsx crosses the boundary.
 *
 * Unlike the design's other pages this one opens on the working panel rather
 * than a hero — see the note on the heading below. The calculator gets the full
 * container width rather than the 3xl column /get-funded uses: it is two panels
 * side by side, and squeezing it into a reading measure would stack them on a
 * desktop screen with room to spare.
 */
export function LoanCalculator() {
  return (
    <div className="ft-surface">
      <section aria-labelledby="ft-calc-heading" className={`${CONTAINER} pt-8 pb-16 lg:pt-10`}>
        {/*
          THE HEADING IS DELIBERATELY INVISIBLE, and this is the one thing on the
          page most likely to be "fixed" by someone who thinks it was left behind.
          Denis asked for the hero gone so the calculator starts as high as the
          header allows — a visitor arrives here from a nav item called Loan
          Calculator and does not need to be told what they are looking at.
          Removing the <h1> along with it is a different change: the page would
          then have no top-level heading at all, which costs it the "business loan
          calculator" query on a site whose entire migration was for SEO, and
          leaves a screen reader's heading list starting at "Are we a match?".
          So the words stay, out of the visual flow, saying exactly what the page
          shows — sr-only text that matches the page is standard practice, not
          cloaking.

          The eyebrow, the standfirst and the assurance row went with the hero.
          The assurances are below the panel now, beside the disclaimer, where
          they still answer "is this going to cost me an email address?" without
          taking the space above the fold to do it.
        */}
        <h1 id="ft-calc-heading" className="sr-only">
          {CALCULATOR.heading}
        </h1>

        <Calculator />

        {/*
          The disclaimer sits directly under the panel it qualifies, not in the
          footer. The figures above are modelled, not quoted, and a visitor who
          reads a payment and leaves should have passed this on the way.
        */}
        <div className="mx-auto mt-8 max-w-3xl text-center">
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-[var(--ft-subtle)]">
            {CALCULATOR.assurances.map((assurance) => (
              <li key={assurance} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-1 w-1 rounded-full bg-[var(--ft-accent)]"
                />
                {assurance}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs leading-relaxed text-[var(--ft-subtle)]">
            {CALCULATOR.disclaimer}
          </p>
        </div>
      </section>

      {/* The three published minimums, in the same words as the homepage. */}
      <section
        aria-labelledby="ft-calc-requirements"
        className="border-y border-[var(--ft-line)] bg-[var(--ft-band)]"
      >
        <div className={`${CONTAINER} py-16 lg:py-20`}>
          <h2
            id="ft-calc-requirements"
            className="mx-auto max-w-2xl text-center font-[family-name:var(--font-headline)] text-[clamp(1.75rem,3.6vw,2.5rem)] font-medium leading-[1.15] text-[var(--ft-ink)]"
          >
            {REQUIREMENTS.heading}
          </h2>

          <ul className="mt-10 grid gap-4 sm:grid-cols-3">
            {REQUIREMENTS.stats.map((stat) => (
              <li
                key={stat.value}
                className="rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-card)] p-6 text-center"
              >
                <p className="text-sm text-[var(--ft-subtle)]">{stat.lead}</p>
                <p className="mt-2 font-[family-name:var(--font-headline)] text-3xl font-medium text-[var(--ft-accent)]">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-[var(--ft-muted)]">{stat.trail}</p>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center text-[1.0625rem] text-[var(--ft-muted)]">
            {REQUIREMENTS.note}{' '}
            <Link
              href={REQUIREMENTS.callout.cta.href}
              className="text-[var(--ft-accent)] underline decoration-[var(--ft-accent)]/40 underline-offset-4 hover:decoration-[var(--ft-accent)]"
            >
              {REQUIREMENTS.callout.cta.label}
            </Link>
          </p>
        </div>
      </section>

      {/*
        No button in this band, deliberately. The layout's FooterCta renders
        "We Can Secure The Capital You Need For Your Business" and a Get Funded
        button immediately below it on every page but /get-funded, and two gold
        buttons stacked one above the other read as a mistake. This is the
        sentence that leads into that one.
      */}
      <section aria-labelledby="ft-calc-next" className={`${CONTAINER} py-16 lg:pt-24 lg:pb-8`}>
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <CalculatorIcon className="h-10 w-10 text-[var(--ft-accent)]" />

          <h2
            id="ft-calc-next"
            className="mt-5 font-[family-name:var(--font-headline)] text-[clamp(1.75rem,3.6vw,2.5rem)] font-medium leading-[1.15] text-[var(--ft-ink)]"
          >
            {CALCULATOR.next.heading}
          </h2>

          <p className="mt-4 text-[1.0625rem] leading-[1.6] text-[var(--ft-muted)]">
            {CALCULATOR.next.body}
          </p>
        </div>
      </section>
    </div>
  );
}
