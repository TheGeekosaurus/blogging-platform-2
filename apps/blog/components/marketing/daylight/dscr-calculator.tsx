import Link from 'next/link';

import { CONTACT } from '../brand';
import { DscrCalculatorEmbed } from './calc-embed';
import { DSCR } from './dscr-content';
import { DaylightFooter } from './site-footer';
import { DaylightHeader } from './site-header';
import { CONTAINER, Chip, CtaButton } from './primitives';

/**
 * /calculators/dscr-calculator — a free tool, in the Daylight palette.
 *
 * FIRST DAYLIGHT PAGE THAT IS NOT THE HOMEPAGE PREVIEW. Denis chose the light
 * chrome for it knowing the rest of the site is still dark, so a visitor
 * arriving from the nav crosses a theme boundary. That is a deliberate bet on
 * Daylight shipping soon rather than an oversight; when it does, this page
 * needs no change.
 *
 * It wears `.dl-surface` itself, which is also what hides the dark layout's
 * header and footer — see the `body:has(.dl-surface)` rule in globals.css. That
 * rule is still the stopgap its own note says it is, and it now has a second
 * page depending on it, which raises the price of the route-group refactor that
 * would replace it.
 *
 * WHAT THIS PAGE DOES NOT DO is sell a DSCR loan, because there is not one. See
 * the note at the top of ./dscr-content.ts: the thresholds on the page are
 * market convention and say so where a reader can see it, and the band at the
 * bottom says plainly that the product is coming rather than routing a property
 * investor into a business-funding application.
 */
export function DscrCalculatorPage() {
  return (
    <div className="dl-surface">
      <DaylightHeader />

      <section aria-labelledby="dscr-title">
        <div className={`${CONTAINER} flex flex-col items-start gap-5 py-14 lg:py-20`}>
          <Chip>{DSCR.label}</Chip>
          <h1
            id="dscr-title"
            className="max-w-[18ch] font-[family-name:var(--font-headline)] text-[clamp(2.25rem,5vw,3.5rem)] font-bold leading-[1.05] text-[var(--ft-ink)]"
          >
            {DSCR.heading}
          </h1>
          <p className="max-w-[62ch] text-[clamp(1.0625rem,1.5vw,1.1875rem)] leading-[1.7] text-[var(--ft-muted)]">
            {DSCR.intro}
          </p>
        </div>
      </section>

      {/*
        The calculator. A panel rather than a bare frame: the embed is
        transparent (`hide_bg=true`), so without a surface under it the fields
        would float on the page ground with nothing holding them together.
      */}
      <section aria-label="DSCR calculator" className="border-t border-[var(--ft-line)]">
        <div className={`${CONTAINER} py-12 lg:py-16`}>
          <div className="overflow-hidden rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-card)]">
            <DscrCalculatorEmbed />
          </div>
        </div>
      </section>

      <section aria-labelledby="dscr-formula" className="border-t border-[var(--ft-line)]">
        <div className={`${CONTAINER} grid gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20`}>
          <div>
            <h2
              id="dscr-formula"
              className="max-w-[16ch] font-[family-name:var(--font-headline)] text-[clamp(1.875rem,3.6vw,2.5rem)] font-medium leading-[1.12] text-[var(--ft-ink)]"
            >
              {DSCR.formula.heading}
            </h2>
            <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-[1.65] text-[var(--ft-muted)]">
              {DSCR.formula.body}
            </p>

            {/* The formula as a figure, not a heading: it is the thing being
                explained, and it should read as notation. */}
            <p className="mt-8 rounded-xl bg-[var(--dl-pop-tint)] px-6 py-5 text-[clamp(1rem,2vw,1.25rem)] font-semibold leading-snug text-[var(--ft-ink)]">
              {DSCR.formula.expression}
            </p>
          </div>

          <dl className="flex flex-col gap-7 lg:pt-4">
            {DSCR.formula.terms.map((term) => (
              <div key={term.term}>
                <dt className="text-[1.0625rem] font-semibold text-[var(--ft-ink)]">
                  {term.term}
                </dt>
                <dd className="mt-2 max-w-[58ch] text-[1.0625rem] leading-[1.6] text-[var(--ft-muted)]">
                  {term.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="dscr-reading" className="border-t border-[var(--ft-line)]">
        <div className={`${CONTAINER} py-14 lg:py-20`}>
          <h2
            id="dscr-reading"
            className="max-w-[18ch] font-[family-name:var(--font-headline)] text-[clamp(1.875rem,3.6vw,2.5rem)] font-medium leading-[1.12] text-[var(--ft-ink)]"
          >
            {DSCR.reading.heading}
          </h2>

          <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-[var(--ft-line)] sm:grid-cols-2">
            {DSCR.reading.rows.map((row) => (
              <div key={row.value} className="bg-[var(--ft-bg)] p-6 lg:p-8">
                <dt className="font-[family-name:var(--font-headline)] text-[1.5rem] font-semibold leading-none text-[var(--ft-ink)]">
                  {row.value}
                </dt>
                <dd className="mt-3 text-[1.0625rem] leading-[1.55] text-[var(--ft-muted)]">
                  {row.body}
                </dd>
              </div>
            ))}
          </dl>

          {/*
            Body size, directly under the bands, not a footnote. The numbers
            above are what the market asks for and not what this business does,
            and a reader cannot know that unless the page says so.
          */}
          <p className="mt-8 max-w-[70ch] text-[1.0625rem] leading-[1.6] text-[var(--ft-subtle)]">
            {DSCR.reading.caveat}
          </p>
        </div>
      </section>

      <section aria-labelledby="dscr-example" className="border-t border-[var(--ft-line)]">
        <div className={`${CONTAINER} grid gap-10 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20`}>
          <div>
            <h2
              id="dscr-example"
              className="font-[family-name:var(--font-headline)] text-[clamp(1.875rem,3.6vw,2.5rem)] font-medium leading-[1.12] text-[var(--ft-ink)]"
            >
              {DSCR.example.heading}
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-[1.65] text-[var(--ft-muted)]">
              {DSCR.example.intro}
            </p>
            <p className="mt-6 max-w-[46ch] text-[1.0625rem] leading-[1.65] text-[var(--ft-muted)]">
              {DSCR.example.body}
            </p>
          </div>

          <div className="rounded-2xl bg-[var(--ft-card)] p-6 lg:p-8">
            <dl className="flex flex-col">
              {DSCR.example.rows.map((row) => (
                <div
                  key={row.label}
                  /*
                    No wrapping. The expense row's note is long enough that
                    `flex-wrap` dropped its figure onto the next line, which put
                    one number out of the column the other four were in. The
                    label takes the slack instead and the figure holds the edge.
                  */
                  className="flex items-baseline justify-between gap-6 border-b border-[var(--ft-line)] py-4 first:pt-0"
                >
                  <dt className="min-w-0 flex-1 text-[1.0625rem] text-[var(--ft-ink)]">
                    {row.label}
                    <span className="mt-0.5 block text-sm text-[var(--ft-subtle)]">
                      {row.note}
                    </span>
                  </dt>
                  <dd className="shrink-0 font-[family-name:var(--font-headline)] text-[1.125rem] font-semibold tabular-nums text-[var(--ft-ink)]">
                    {row.value}
                  </dd>
                </div>
              ))}

              <div className="flex items-baseline justify-between gap-6 pt-5">
                <dt className="min-w-0 flex-1 text-[1.0625rem] font-semibold text-[var(--ft-ink)]">
                  {DSCR.example.result.label}
                  <span className="mt-0.5 block text-sm font-normal text-[var(--ft-subtle)]">
                    {DSCR.example.result.note}
                  </span>
                </dt>
                <dd className="shrink-0 font-[family-name:var(--font-headline)] text-[clamp(1.75rem,3vw,2.25rem)] font-bold leading-none tabular-nums text-[var(--dl-display)]">
                  {DSCR.example.result.value}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section aria-labelledby="dscr-faq" className="border-t border-[var(--ft-line)]">
        <div className={`${CONTAINER} py-14 lg:py-20`}>
          <h2
            id="dscr-faq"
            className="font-[family-name:var(--font-headline)] text-[clamp(1.875rem,3.6vw,2.5rem)] font-medium leading-[1.12] text-[var(--ft-ink)]"
          >
            {DSCR.faq.heading}
          </h2>

          {/*
            Plain headings and paragraphs rather than the homepage's accordion.
            This is reference material someone may have arrived at from a
            search, and an answer folded behind a click is an answer a crawler
            and a skim-reader both have to work for.
          */}
          <dl className="mt-10 grid gap-x-16 gap-y-9 lg:grid-cols-2">
            {DSCR.faq.items.map((item) => (
              <div key={item.q}>
                <dt className="text-[1.125rem] font-semibold leading-snug text-[var(--ft-ink)]">
                  {item.q}
                </dt>
                <dd className="mt-3 max-w-[58ch] text-[1.0625rem] leading-[1.6] text-[var(--ft-muted)]">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/*
        The honest note — see DSCR.notYet in ./dscr-content.ts.

        A PALE PANEL, NOT THE NAVY CTA CARD, and that is a correction rather
        than a preference. It was `dl-cta-card` first, which put two navy slabs
        back to back: this one saying there is nothing to apply for, and the
        footer's directly beneath it saying We Can Secure The Capital You Need
        with a Get Funded button. Identical weight, opposite messages.

        The footer's card is the page's one apply moment and keeps that job.
        This is an informational note that happens to offer a phone call, so it
        is toned like the page's other panels and sits below them in the
        hierarchy.
      */}
      <section aria-labelledby="dscr-soon" className="border-t border-[var(--ft-line)]">
        <div className={`${CONTAINER} py-14 lg:py-20`}>
          <div className="overflow-hidden rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-card)] px-7 py-9 sm:px-10 sm:py-11 lg:px-14 lg:py-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-14">
              <div className="max-w-[34rem]">
                <h2
                  id="dscr-soon"
                  className="font-[family-name:var(--font-headline)] text-[clamp(1.5rem,3vw,2.125rem)] font-semibold leading-[1.15] text-[var(--ft-ink)]"
                >
                  {DSCR.notYet.heading}
                </h2>
                <p className="mt-4 text-[1.0625rem] leading-[1.6] text-[var(--ft-muted)]">
                  {DSCR.notYet.body}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-3">
                {/*
                  CtaButton rather than a gold anchor written out here. It
                  renders a plain <a> for a `tel:` href — see the note in
                  cta-button.tsx — so the brand button stays in one file and
                  this page does not become a second copy of it.
                */}
                <CtaButton href={CONTACT.phoneHref} className="!px-8 !py-3.5 !text-sm">
                  {DSCR.notYet.primary}
                </CtaButton>
                <Link
                  href="/funding-solutions"
                  className="text-[0.9375rem] text-[var(--ft-ink)] underline underline-offset-4 hover:text-[var(--dl-pop)]"
                >
                  {DSCR.notYet.secondary}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DaylightFooter />
    </div>
  );
}
