import { APPLY_LABEL, HOW_IT_WORKS, QUALIFIER, USE_CASES } from './content';
import { CtaButton } from '../cta-button';
import { HighLevelForm } from '../highlevel-form';
import {
  CashFlowIcon,
  ConsolidateIcon,
  EquipmentIcon,
  ExpandIcon,
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
                <h3 className="text-lg font-medium text-[var(--ft-ink)]">{step.title}</h3>
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
