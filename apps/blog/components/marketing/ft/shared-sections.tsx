import Link from 'next/link';

import {
  APPLY_LABEL,
  FAQ,
  HOW_IT_WORKS,
  QUALIFIER,
  USE_CASES,
  type AnswerRun,
} from './content';
import { CtaButton } from '../cta-button';
import { HighLevelForm } from '../highlevel-form';
import {
  ArrowUpRightIcon,
  CashFlowIcon,
  ConsolidateIcon,
  EquipmentIcon,
  ExpandIcon,
  HelpIcon,
  HiringIcon,
  InventoryIcon,
  MarketingIcon,
  PayrollIcon,
} from './icons';
import { CONTAINER, SectionHead } from './primitives';

/*
 * The sections that appear on more than one page of this design.
 *
 * All three started on the homepage and moved here whole when
 * /funding-solutions wanted them — the same rule primitives.tsx follows, at the
 * scale of a section rather than a button. They are shared COMPONENTS, not
 * copied markup: a change to the timeline or the use-of-funds grid lands on
 * every page that renders them, which is the only way two pages showing "the
 * same section" stay the same section.
 *
 * They are also self-contained by design — each brings its own header band and
 * its own copy from ./content, and none takes a prop — so adding one to a page
 * is one line and there is no per-page variant to drift.
 */

const USE_CASE_ICONS = {
  inventory: InventoryIcon,
  payroll: PayrollIcon,
  expand: ExpandIcon,
  marketing: MarketingIcon,
  cashflow: CashFlowIcon,
  equipment: EquipmentIcon,
  hiring: HiringIcon,
  consolidate: ConsolidateIcon,
} as const;

/** A "Get Funded" centred under its section. */
export function ApplyRow({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <CtaButton>{APPLY_LABEL}</CtaButton>
    </div>
  );
}

/**
 * How it works, as a numbered timeline.
 *
 * Deliberately not three cards: the CTA tiles directly above are already a
 * three-column row of bordered cells, and repeating that shape would make two
 * different things look like one. Steps are not destinations, so there are no
 * arrow buttons either — the only action is the single button underneath.
 *
 * The connecting rule is drawn as a flex-1 hairline after each numeral rather
 * than as one line behind the row, so it stops at the last step and disappears
 * cleanly when the grid stacks.
 */
export function HowItWorks() {
  return (
    <section aria-labelledby="ft-how">
      <SectionHead id="ft-how" label={HOW_IT_WORKS.label} heading={HOW_IT_WORKS.heading} />

      <div className={`${CONTAINER} py-14 lg:py-20`}>
        {/*
          Centred, over the numbered row, the way the reference Denis sent sets
          it — and the way the "Get Funded" underneath is already set, so the
          band reads as one centred column with the steps laid across its middle.

          h3: it is under the header band's h2 and the step titles sit under it,
          so those drop to h4. The level follows the nesting; no size changed.
        */}
        <h3 className="mb-12 text-center font-[family-name:var(--font-headline)] text-[clamp(1.5rem,2.8vw,2.125rem)] font-semibold leading-[1.2] text-[var(--ft-ink)] lg:mb-16">
          {HOW_IT_WORKS.stepsHeading}
        </h3>

        {/*
         * The sweep is staggered purely by `animation-delay`, computed here so
         * the order lives with the markup rather than in five CSS rules: numeral,
         * its rule, the next numeral, and so on, 1.2s apart.
         */}
        <ol className="ft-steps grid gap-12 md:grid-cols-3 md:gap-8">
          {HOW_IT_WORKS.steps.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-5">
              <div className="flex items-center gap-5">
                <span
                  aria-hidden="true"
                  style={{ animationDelay: `${i * 2.4}s` }}
                  className="ft-step-number font-[family-name:var(--font-headline)] text-[2.75rem] font-semibold leading-none text-[var(--ft-accent)]"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                {i < HOW_IT_WORKS.steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="relative hidden h-px flex-1 bg-[var(--ft-line)] md:block"
                  >
                    {/* Drawn over the resting rule, so the rule never disappears. */}
                    <span
                      style={{ animationDelay: `${i * 2.4 + 1.2}s` }}
                      className="ft-step-fill absolute inset-0 block bg-[var(--ft-accent)]"
                    />
                  </span>
                ) : null}
              </div>

              <div>
                <h4 className="text-lg font-medium text-[var(--ft-ink)]">{step.title}</h4>
                <p className="mt-2 max-w-[34ch] text-[1.0625rem] leading-[1.55] text-[var(--ft-muted)]">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <ApplyRow className="mt-14" />
      </div>
    </section>
  );
}

export function UseCases() {
  return (
    <section aria-labelledby="ft-uses">
      <SectionHead
        id="ft-uses"
        label={USE_CASES.label}
        heading={USE_CASES.heading}
        body={USE_CASES.body}
      />

      <div className={`${CONTAINER} py-14 lg:py-20`}>
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-line)] lg:grid-cols-4">
          {USE_CASES.items.map((item) => {
            const Icon = USE_CASE_ICONS[item.icon];
            return (
              <li
                key={item.label}
                /*
                 * Hover lifts the cell rather than linking it — these are
                 * statements about what funding is for, not destinations, so
                 * the cursor stays default and nothing here is focusable.
                 *
                 * `relative z-10` on hover so the growing cell sits over its
                 * neighbours instead of under them. The scale is small on
                 * purpose: the grid's hairlines are `gap-px` against the
                 * container's own background, and a bigger jump would pull the
                 * cell visibly off them.
                 *
                 * The transition names `scale`, NOT `transform`. Tailwind v4's
                 * `scale-*` compiles to the standalone `scale` property, so a
                 * `transition-[transform,...]` here animates nothing and the
                 * zoom snaps while the colour fades. Same trap in the
                 * reduced-motion guard in globals.css, which resets `scale`.
                 */
                className="ft-use-case relative flex flex-col items-center gap-4 bg-[var(--ft-bg)] px-5 py-10 text-center transition-[scale,background-color] duration-300 ease-out hover:z-10 hover:scale-[1.06] hover:bg-[var(--ft-card)]"
              >
                <Icon className="h-8 w-8 text-[var(--ft-accent)]" />
                <span className="text-[1.0625rem] leading-[1.4] text-[var(--ft-ink)]">
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/**
 * The qualifier, embedded rather than rebuilt.
 *
 * This is the same GoHighLevel survey the live homepage runs — ten questions
 * with conditional logic and two consent checkboxes behind CRM automations.
 * Rebuilding it natively would mean reconstructing that logic and the consent
 * wording, where a mistake silently drops leads. HighLevel stays the system of
 * record; see highlevel-form.tsx.
 */
export function Qualifier() {
  return (
    <section aria-labelledby="ft-qualifier">
      <SectionHead id="ft-qualifier" label={QUALIFIER.label} heading={QUALIFIER.heading} />

      <div className={`${CONTAINER} py-14 lg:py-20`}>
        <ul className="mx-auto flex max-w-4xl flex-col justify-center gap-4 sm:flex-row sm:gap-10">
          {QUALIFIER.points.map((point) => (
            <li
              key={point}
              className="flex items-center gap-3 text-[1.0625rem] text-[var(--ft-muted)]"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ft-accent)]"
              />
              {point}
            </li>
          ))}
        </ul>

        {/*
          The panel matches the page ground rather than being white.

          The survey used to render a white PAGE behind its form card, so a
          white panel was what stopped its edges reading as a rendering fault.
          That is fixed at the source now — the survey's own Custom CSS in
          GoHighLevel paints its html/body #141414 — so the only white left is
          the form card itself, and a white panel here is a slab that flashes
          before the iframe paints and then never matches anything.

          If the survey ever loses that rule, this goes back to bg-white: the
          card would be sitting on a dark page again with nothing framing it.
        */}
        <div className="mt-10 overflow-hidden rounded-2xl bg-[var(--ft-bg)]">
          <HighLevelForm />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * The FAQ
 * ------------------------------------------------------------------------- */

/**
 * One answer's runs: plain text, and the occasional link inside a sentence.
 *
 * next/link for the internal ones rather than a bare anchor — `trailingSlash:
 * true` makes /programs cost a 308 to /programs/ as an <a>, and Link both skips
 * that hop and prefetches. Same reason GhostButton does it.
 */
function Answer({ runs }: { runs: readonly AnswerRun[] }) {
  return (
    <p className="max-w-[70ch] text-[1.0625rem] leading-[1.65] text-[var(--ft-muted)]">
      {runs.map((run, i) =>
        typeof run === 'string' ? (
          <span key={i}>{run}</span>
        ) : (
          <Link
            key={i}
            href={run.href}
            className="text-[var(--ft-ink)] underline decoration-[var(--ft-accent)] underline-offset-4 hover:text-[var(--ft-accent)]"
          >
            {run.text}
          </Link>
        ),
      )}
    </p>
  );
}

/**
 * The FAQ, shared by the homepage and /funding-solutions.
 *
 * Built on <details>/<summary>, not React state — the same choice MobileNav
 * makes and for the same reasons. It is a native disclosure widget: operable by
 * keyboard, announced as expanded or collapsed by a screen reader, and
 * findable by the browser's own in-page search even while shut. Doing it with
 * `useState` would turn both of these pages into client components and ship a
 * bundle to run an accordion.
 *
 * The first one is `open` because the design shows it that way, and because an
 * accordion where every row is shut gives a reader nothing to read.
 *
 * `name` is deliberately NOT set. It would make the group exclusive — opening
 * one closes the rest — which looks tidy and is worse: it stops anyone
 * comparing two answers, and it silently undoes a reader's own expand.
 */
export function Faq() {
  return (
    <section aria-labelledby="ft-faq" className="border-t border-[var(--ft-line)]">
      {/* Columns centred against each other, with the divider on the right
          column — see the long note on the same pattern in funding-solutions. */}
      <div className={`${CONTAINER} lg:flex lg:gap-0`}>
        <div className="py-14 lg:flex lg:w-[38%] lg:shrink-0 lg:flex-col lg:justify-center lg:py-20 lg:pr-12">
          <HelpIcon className="h-10 w-10 text-[var(--ft-accent)]" />

          <h2
            id="ft-faq"
            className="mt-8 max-w-[14ch] font-[family-name:var(--font-headline)] text-[clamp(1.875rem,3.4vw,2.5rem)] font-medium leading-[1.12] text-[var(--ft-ink)]"
          >
            {FAQ.heading}
          </h2>

          <p className="mt-5 max-w-[42ch] text-[1.0625rem] leading-[1.6] text-[var(--ft-muted)]">
            {FAQ.body}
          </p>

          {/*
            A plain anchor, not GhostButton: this is a `tel:` href, and
            GhostButton routes a non-external href through next/link, which is
            for in-app navigation and not for handing a URI scheme to the OS.
          */}
          <a
            href={FAQ.cta.href}
            className="mt-8 inline-flex w-fit shrink-0 items-center gap-3 rounded-xl border border-[var(--ft-line)] bg-[var(--ft-card)] px-6 py-3.5 text-[0.9375rem] text-[var(--ft-muted)] no-underline transition-colors hover:border-[var(--ft-accent)] hover:text-[var(--ft-ink)]"
          >
            {FAQ.cta.label}
            <ArrowUpRightIcon className="h-4 w-4 text-[var(--ft-accent)]" />
          </a>
        </div>

        <div className="border-t border-[var(--ft-line)] py-14 lg:min-w-0 lg:flex-1 lg:border-l lg:border-t-0 lg:py-20 lg:pl-12">
          <ul className="flex flex-col gap-4">
            {FAQ.items.map((item, i) => (
              <li key={item.id}>
                <details
                  open={i === 0}
                  className="group rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-card)] [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 p-6">
                    <h3 className="text-[1.0625rem] font-medium leading-[1.35] text-[var(--ft-ink)]">
                      {item.q}
                    </h3>

                    {/* One glyph swapped for the other on open, so there is no
                        rotation to animate and nothing to get stuck halfway. */}
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      className="h-5 w-5 shrink-0 text-[var(--ft-accent)] group-open:text-[var(--ft-muted)]"
                      aria-hidden="true"
                    >
                      <path d="M4 12h16" />
                      <path className="group-open:hidden" d="M12 4v16" />
                    </svg>
                  </summary>

                  <div className="border-t border-[var(--ft-line)] px-6 pb-6 pt-5">
                    <Answer runs={item.a} />
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
