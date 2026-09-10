import Link from 'next/link';

import { Calculator } from './calculator';
import { CALCULATOR, REQUIREMENTS } from './content';
import { CalculatorIcon } from './icons';
import { Chip, CONTAINER } from './primitives';

/*
 * /calc — the page around the calculator.
 *
 * A server component wrapping one client component, which is the split that
 * matters here: the hero, the requirements strip and the closing band are all
 * static copy and ship as HTML, and only ./calculator.tsx crosses the boundary.
 *
 * The layout follows the design's other pages: a centred hero on the dark
 * ground, then the working panel, then a band. The calculator itself gets the
 * full container width rather than the 3xl column /get-funded uses — it is two
 * panels side by side, and squeezing it into a reading measure would stack them
 * on a desktop screen with room to spare.
 */
export function LoanCalculator() {
  return (
    <div className="ft-surface">
      <section aria-labelledby="ft-calc-heading" className={`${CONTAINER} py-16 lg:pt-24 lg:pb-16`}>
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Chip>{CALCULATOR.eyebrow}</Chip>

          <h1
            id="ft-calc-heading"
            className="mt-6 font-[family-name:var(--font-headline)] text-[clamp(2.25rem,5vw,3.5rem)] font-medium leading-[1.08] text-[var(--ft-ink)]"
          >
            {CALCULATOR.heading}
          </h1>

          <p className="mt-5 text-[1.125rem] leading-relaxed text-[var(--ft-muted)] sm:text-[1.25rem]">
            {CALCULATOR.sub}
          </p>

          <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[var(--ft-subtle)]">
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
        </div>

        <div className="mt-12 lg:mt-16">
          <Calculator />
        </div>

        {/*
          The disclaimer sits directly under the panel it qualifies, not in the
          footer. The figures above are modelled, not quoted, and a visitor who
          reads a payment and leaves should have passed this on the way.
        */}
        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-relaxed text-[var(--ft-subtle)]">
          {CALCULATOR.disclaimer}
        </p>
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
