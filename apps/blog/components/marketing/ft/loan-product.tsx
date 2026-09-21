import { APPLY_LABEL, FACT_LABELS, LOAN_PAGE_HEADS, type LoanPage } from './content';
import { CheckIcon, CoinsIcon, MinusIcon } from './icons';
import { Chip, CONTAINER, GhostButton } from './primitives';
import { Faq, HowItWorks, UseCases } from './shared-sections';
import { CtaButton } from '../cta-button';

/*
 * /funding-solutions/<slug> — one page per funding product.
 *
 * Shape follows the brief: hero, "What is X", "Why choose X", "How does X
 * work", a compare widget, then the three bands this site already has. Fora
 * Financial's product pages were the reference for that ORDER, as they were for
 * the hero and the three steps; the words are ours and so is every figure. See
 * the long warning over LOAN_PAGES in ./content — three of the five products
 * are running on terms nobody has confirmed.
 *
 * ONE component for all five. They differ only in copy, which is the whole
 * reason the copy lives in ./content: five near-identical files would drift
 * within a month, and a change to the layout would have to be made five times.
 */

/* ---------------------------------------------------------------------------
 * Hero
 *
 * Same construction as /funding-solutions': headline left, blurb set against
 * its LAST line on the right. `items-end` is what does that — see the note
 * there.
 * ------------------------------------------------------------------------- */
function Hero({ page }: { page: LoanPage }) {
  return (
    <section aria-labelledby="ft-loan" className="border-b border-[var(--ft-line)]">
      <div className={`${CONTAINER} py-16 lg:py-24`}>
        <Chip>{page.hero.eyebrow}</Chip>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:gap-16">
          <h1
            id="ft-loan"
            className="max-w-[18ch] flex-1 font-[family-name:var(--font-headline)] text-[clamp(2.25rem,5.5vw,4rem)] font-medium leading-[1.06] text-[var(--ft-ink)]"
          >
            {page.hero.heading}
          </h1>

          <p className="max-w-[52ch] flex-1 text-[1.0625rem] leading-[1.65] text-[var(--ft-muted)]">
            {page.hero.blurb}
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <CtaButton>{APPLY_LABEL}</CtaButton>
          <GhostButton href="/calc">Estimate a payment</GhostButton>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * Prose blocks
 * ------------------------------------------------------------------------- */

/**
 * "What is X" and "How does X work" — one heading, one paragraph.
 *
 * Both are the same shape, so they are the same component. They alternate
 * ground colour so two long prose blocks with a stats card between them do not
 * read as one undifferentiated slab.
 */
function Prose({
  id,
  heading,
  body,
  raised = false,
}: {
  id: string;
  heading: string;
  body: string;
  raised?: boolean;
}) {
  return (
    <section
      aria-labelledby={id}
      className={`border-b border-[var(--ft-line)] ${raised ? 'ft-band bg-[var(--ft-band)]' : ''}`}
    >
      <div className={`${CONTAINER} py-14 lg:py-20`}>
        <h2
          id={id}
          className="max-w-[24ch] font-[family-name:var(--font-headline)] text-[clamp(1.625rem,3vw,2.25rem)] font-medium leading-[1.14] text-[var(--ft-ink)]"
        >
          {heading}
        </h2>
        <p className="mt-6 max-w-[78ch] text-[1.0625rem] leading-[1.7] text-[var(--ft-muted)]">
          {body}
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * Why choose it, with the Quick Stats card
 * ------------------------------------------------------------------------- */

/** The five single-value rows, in the order the compare table uses them. */
const FACT_ROWS = ['amount', 'term', 'repayment', 'fundingTime', 'requirements'] as const;

function QuickStats({ facts }: { facts: LoanPage['facts'] }) {
  return (
    <div className="rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-card)] p-6 lg:p-8">
      <p className="font-[family-name:var(--font-headline)] text-lg font-semibold text-[var(--ft-accent)]">
        {LOAN_PAGE_HEADS.quickStats}
      </p>

      <dl className="mt-6 flex flex-col">
        {FACT_ROWS.map((key, i) => (
          <div
            key={key}
            className={`grid gap-1 py-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-6 ${
              i > 0 ? 'border-t border-[var(--ft-line)]' : 'pt-0'
            }`}
          >
            <dt className="text-sm text-[var(--ft-muted)]">{FACT_LABELS[key]}</dt>
            <dd className="font-medium text-[var(--ft-ink)]">{facts[key]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function WhyChoose({ page }: { page: LoanPage }) {
  return (
    <section aria-labelledby="ft-loan-why" className="border-b border-[var(--ft-line)]">
      {/* Columns centred against each other with the divider on the right one —
          same construction and same reasoning as the funding-solutions list. */}
      <div className={`${CONTAINER} lg:flex lg:gap-0`}>
        <div className="py-14 lg:flex lg:w-[42%] lg:shrink-0 lg:flex-col lg:justify-center lg:py-20 lg:pr-12">
          <CoinsIcon className="h-10 w-10 text-[var(--ft-accent)]" />
          <h2
            id="ft-loan-why"
            className="mt-8 max-w-[22ch] font-[family-name:var(--font-headline)] text-[clamp(1.625rem,3vw,2.25rem)] font-medium leading-[1.14] text-[var(--ft-ink)]"
          >
            {page.whyChoose.heading}
          </h2>
          <p className="mt-5 max-w-[52ch] text-[1.0625rem] leading-[1.65] text-[var(--ft-muted)]">
            {page.whyChoose.body}
          </p>
        </div>

        <div className="border-t border-[var(--ft-line)] py-14 lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:justify-center lg:border-l lg:border-t-0 lg:py-20 lg:pl-12">
          <QuickStats facts={page.facts} />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * The compare widget
 *
 * NO JAVASCRIPT. It is a radio group: every comparison panel is in the DOM and
 * CSS shows the one whose radio is checked. That keeps this page a server
 * component — a `useState` selector would pull hydration into all five product
 * pages to run one picker — and it keeps the comparison readable with JS off
 * and findable by the browser's own in-page search.
 *
 * The show/hide rules are HAND-WRITTEN CSS in globals.css (`.ft-compare-*`),
 * not Tailwind variants. Tailwind generates classes by scanning source text for
 * literals, so `peer-checked/${slug}:grid` built from a variable produces no
 * CSS at all and fails silently — the panels would simply never appear. Static
 * `data-i` attributes and four indexed selectors cannot rot that way.
 *
 * Each radio precedes the tab row and the panels as a sibling, because the
 * rules reach them with `~`. Labels find their input by `htmlFor`, which does
 * not care about order.
 * ------------------------------------------------------------------------- */

function FactList({
  label,
  items,
  tone,
}: {
  label: string;
  items: readonly string[];
  tone: 'pro' | 'con';
}) {
  const Icon = tone === 'pro' ? CheckIcon : MinusIcon;
  return (
    <div>
      <p className="text-sm text-[var(--ft-muted)]">{label}</p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-[0.9375rem] leading-[1.5]">
            <Icon
              className={`mt-[0.2em] h-4 w-4 shrink-0 ${
                tone === 'pro' ? 'text-[var(--ft-accent)]' : 'text-[var(--ft-subtle)]'
              }`}
            />
            <span className="text-[var(--ft-muted)]">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * One side of the comparison.
 *
 * `current` is the page you are already on, and it gets no button: a link
 * offering to take you to where you are is a dead control, and it appeared on
 * the left of every panel.
 */
function CompareColumn({
  page,
  eyebrow,
  current = false,
}: {
  page: LoanPage;
  eyebrow: string;
  current?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-card)] p-6 lg:p-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--ft-accent)]">
          {eyebrow}
        </p>
        <h3 className="mt-2 font-[family-name:var(--font-headline)] text-[1.375rem] font-semibold leading-[1.2] text-[var(--ft-ink)]">
          {page.navLabel}
        </h3>
      </div>

      <dl className="flex flex-col border-t border-[var(--ft-line)]">
        {FACT_ROWS.map((key) => (
          <div
            key={key}
            className="grid gap-1 border-b border-[var(--ft-line)] py-3 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-4"
          >
            <dt className="text-sm text-[var(--ft-muted)]">{FACT_LABELS[key]}</dt>
            <dd className="text-[0.9375rem] font-medium text-[var(--ft-ink)]">{page.facts[key]}</dd>
          </div>
        ))}
      </dl>

      <FactList label={FACT_LABELS.pros} items={page.facts.pros} tone="pro" />
      <FactList label={FACT_LABELS.cons} items={page.facts.cons} tone="con" />

      {current ? null : (
        <div className="mt-auto pt-2">
          <GhostButton href={`/funding-solutions/${page.slug}/`}>
            {`About ${page.navLabel}`}
          </GhostButton>
        </div>
      )}
    </div>
  );
}

function Compare({ page, others }: { page: LoanPage; others: readonly LoanPage[] }) {
  if (others.length === 0) return null;

  return (
    <section aria-labelledby="ft-loan-compare" className="border-b border-[var(--ft-line)]">
      <div className={`${CONTAINER} py-14 lg:py-20`}>
        <h2
          id="ft-loan-compare"
          className="max-w-[24ch] font-[family-name:var(--font-headline)] text-[clamp(1.625rem,3vw,2.25rem)] font-medium leading-[1.14] text-[var(--ft-ink)]"
        >
          {LOAN_PAGE_HEADS.compare}
        </h2>
        <p className="mt-5 max-w-[68ch] text-[1.0625rem] leading-[1.65] text-[var(--ft-muted)]">
          {LOAN_PAGE_HEADS.compareLead}
        </p>

        <fieldset className="ft-compare mt-10">
          <legend className="sr-only">{LOAN_PAGE_HEADS.compareAgainst}</legend>

          {/*
            `sr-only` rather than `hidden`: a hidden input is unfocusable, which
            would take the whole control away from the keyboard.
          */}
          {others.map((other, i) => (
            <input
              key={other.slug}
              type="radio"
              name="ft-compare"
              id={`ft-compare-${other.slug}`}
              data-i={i}
              defaultChecked={i === 0}
              className="ft-compare-radio sr-only"
            />
          ))}

          <div className="ft-compare-tabs flex flex-wrap gap-3">
            {others.map((other, i) => (
              <label
                key={other.slug}
                htmlFor={`ft-compare-${other.slug}`}
                data-i={i}
                className="ft-compare-tab cursor-pointer rounded-[42px] px-6 py-3 text-[0.9375rem] text-[var(--ft-muted)] ring-1 ring-[var(--ft-line)] transition-colors hover:text-[var(--ft-ink)]"
              >
                {other.navLabel}
              </label>
            ))}
          </div>

          <div className="ft-compare-panels">
            {others.map((other, i) => (
              <div key={other.slug} data-i={i} className="ft-compare-panel mt-8 gap-6 lg:grid-cols-2">
                <CompareColumn page={page} eyebrow={LOAN_PAGE_HEADS.compareThis} current />
                <CompareColumn page={other} eyebrow={LOAN_PAGE_HEADS.compareAgainst} />
              </div>
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * The page
 * ------------------------------------------------------------------------- */

export function LoanProduct({ page, others }: { page: LoanPage; others: readonly LoanPage[] }) {
  return (
    <div className="ft-surface">
      <Hero page={page} />

      {/* Alternating ground so the two prose blocks either side of the stats
          card do not read as one long slab. */}
      <Prose id="ft-loan-what" heading={page.whatIs.heading} body={page.whatIs.body} raised />
      <WhyChoose page={page} />
      <Prose id="ft-loan-how" heading={page.how.heading} body={page.how.body} raised />

      <Compare page={page} others={others} />

      {/*
        The same three bands the homepage and /funding-solutions carry, in the
        same order and from the same components — see ./shared-sections. A
        product page ends the way every other page on this site ends.
      */}
      <HowItWorks />
      <UseCases />
      <Faq />
    </div>
  );
}

