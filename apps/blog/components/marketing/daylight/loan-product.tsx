import { FUNDING_PROGRAMS } from '../brand';
import { APPLY_LABEL, FACT_LABELS, LOAN_PAGE_HEADS, type LoanPage } from '../ft/content';
import {
  BankIcon,
  BridgeIcon,
  CashFlowIcon,
  CheckIcon,
  CoinsIcon,
  EquipmentIcon,
  GrowthIcon,
  InventoryIcon,
  InvoiceIcon,
  MinusIcon,
  WalletIcon,
} from '../ft/icons';
import { Faq } from '../ft/shared-sections';
import { DaylightHowItWorks } from './how-it-works';
import { DaylightTestimonials } from './testimonials';
import { DaylightUseCases } from './use-cases';
import { CONTAINER, Chip, CtaButton, GhostButton } from './primitives';

/**
 * DAYLIGHT — /funding-solutions/<slug>, one page per funding product.
 *
 * The light twin of ft/loan-product.tsx, built the way the homepage and the
 * funding index were: a parallel file rather than a theme flag, so the dark
 * page stays intact as the revert path.
 *
 * MOST OF THIS PAGE RECOLOURED ITSELF. Every colour in the dark original is a
 * `--ft-*` token, and `.dl-surface` re-points all of them — so the prose
 * bands, the Quick Stats card and the whole compare widget (which is plain CSS
 * in globals.css, also token-driven) arrive in the light palette with no
 * per-element work. That is the token system paying for itself, and it is why
 * this file is mostly the same markup.
 *
 * WHAT ACTUALLY CHANGED, and why each one needed a hand:
 *
 *   - the three shared bands are the Daylight versions, with the review wall
 *     added between the use-of-funds grid and the FAQ. The dark file's note
 *     says a product page "ends the way every other page on this site ends",
 *     and since the homepage and /funding-solutions were converted, that
 *     ending includes the reviews.
 *   - the compare tabs square off, matching the blog's category filters, which
 *     Denis asked for on 2026-10-02. They are the same lozenge drawn by the
 *     same 42px radius, so they take the same marker class.
 *   - the "why choose" glyph is the PRODUCT'S OWN. The dark page draws
 *     CoinsIcon on all five, which is the funding-options mark rather than the
 *     product's — a credit line and a piece of equipment finance both
 *     illustrated with a stack of coins. The nine products already have glyphs
 *     for the menu and the index; this uses the same key, so a product cannot
 *     wear one mark in the nav and another on its own page.
 *
 * ONE component for all five, as before. They differ only in copy, which is
 * the whole reason the copy lives in ft/content.ts.
 */

/* The nine product glyphs, keyed as FUNDING_PROGRAMS keys them. */
const ICONS = {
  coins: CoinsIcon,
  growth: GrowthIcon,
  equipment: EquipmentIcon,
  'cash-flow': CashFlowIcon,
  wallet: WalletIcon,
  bank: BankIcon,
  inventory: InventoryIcon,
  invoice: InvoiceIcon,
  bridge: BridgeIcon,
} as const;

/**
 * The glyph for a product page, by slug.
 *
 * FALLS BACK TO COINS, and the fallback is reachable: `revenue-based-financing`
 * has a LOAN_PAGES entry but no FUNDING_PROGRAMS entry — it is the interest-only
 * BANKROLL program, which left the core nine when Denis reorganised them and
 * kept its page. A product with no glyph gets the generic funding mark rather
 * than crashing, which is the right failure for a page that still has to render.
 */
function iconFor(slug: string) {
  const program = FUNDING_PROGRAMS.find((p) => p.slug === slug);
  return ICONS[program?.icon as keyof typeof ICONS] ?? CoinsIcon;
}

function Hero({ page }: { page: LoanPage }) {
  return (
    <section aria-labelledby="ft-loan" className="border-b border-[var(--ft-line)]">
      <div className={`${CONTAINER} py-16 lg:py-24`}>
        <Chip>{page.hero.eyebrow}</Chip>

        {/*
          NO ACCENT ON THE LAST WORD, unlike the homepage and the funding index.
          That treatment works there because both headings end on the word the
          sentence is about — "…Needs To Grow", "…One Application." These end on
          "Repay", "Around", "Itself"; colouring a preposition or a reflexive
          pronoun emphasises the one word carrying no meaning. The note in
          ./hero.tsx says to check exactly this before reusing the trick.
        */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:gap-16">
          <h1
            id="ft-loan"
            className="max-w-[18ch] flex-1 font-[family-name:var(--font-headline)] text-[clamp(2.25rem,5.5vw,4rem)] font-bold leading-[1.06] text-[var(--ft-ink)]"
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
          className="max-w-[24ch] font-[family-name:var(--font-headline)] text-[clamp(1.625rem,3vw,2.25rem)] font-semibold leading-[1.14] text-[var(--ft-ink)]"
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
  const Icon = iconFor(page.slug);

  return (
    <section aria-labelledby="ft-loan-why" className="border-b border-[var(--ft-line)]">
      {/* Columns centred against each other with the divider on the right one —
          same construction and same reasoning as the funding-solutions list. */}
      <div className={`${CONTAINER} lg:flex lg:gap-0`}>
        <div className="py-14 lg:flex lg:w-[42%] lg:shrink-0 lg:flex-col lg:justify-center lg:py-20 lg:pr-12">
          {/*
            The glyph on the chip tint rather than bare, matching the dropdown's
            tiles and the funding index's cards — on white a hairline mark
            floats, where the tinted square gives it a seat.
          */}
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--dl-pop-tint)]">
            <Icon className="h-6 w-6 text-[var(--ft-ink)]" />
          </span>
          <h2
            id="ft-loan-why"
            className="mt-7 max-w-[22ch] font-[family-name:var(--font-headline)] text-[clamp(1.625rem,3vw,2.25rem)] font-semibold leading-[1.14] text-[var(--ft-ink)]"
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
 * NO JAVASCRIPT, and that is unchanged from the dark build. It is a radio
 * group: every comparison panel is in the DOM and CSS shows the one whose radio
 * is checked. That keeps this page a server component — a `useState` selector
 * would pull hydration into all five product pages to run one picker — and it
 * keeps the comparison readable with JS off and findable by in-page search.
 *
 * The show/hide rules are HAND-WRITTEN CSS in globals.css (`.ft-compare-*`),
 * not Tailwind variants, because Tailwind generates classes by scanning source
 * text and `peer-checked/${slug}:grid` built from a variable produces no CSS at
 * all. Those rules are entirely token-driven, so they arrive in the light
 * palette without a single edit.
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
 * offering to take you to where you are is a dead control.
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
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ft-accent)]">
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
          className="max-w-[24ch] font-[family-name:var(--font-headline)] text-[clamp(1.625rem,3vw,2.25rem)] font-semibold leading-[1.14] text-[var(--ft-ink)]"
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
                /*
                  `ft-catpill` CARRIES NO STYLES HERE. It is the marker the blog's
                  category filters wear, and one rule under `.dl-surface` squares
                  both off at the button radius — Denis asked for that on the blog
                  on 2026-10-02, and these are the same 42px lozenge doing the
                  same job. Sharing the marker means they cannot drift apart.
                */
                className="ft-compare-tab ft-catpill cursor-pointer rounded-[42px] px-6 py-3 text-[0.9375rem] text-[var(--ft-muted)] ring-1 ring-[var(--ft-line)] transition-colors hover:text-[var(--ft-ink)]"
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

export function DaylightLoanProduct({
  page,
  others,
}: {
  page: LoanPage;
  others: readonly LoanPage[];
}) {
  return (
    /* Header and footer come from the root layout — see the note there. */
    <div className="dl-surface">
      <Hero page={page} />

      {/* Alternating ground so the two prose blocks either side of the stats
          card do not read as one long slab. */}
      <Prose id="ft-loan-what" heading={page.whatIs.heading} body={page.whatIs.body} raised />
      <WhyChoose page={page} />
      <Prose id="ft-loan-how" heading={page.how.heading} body={page.how.body} raised />

      <Compare page={page} others={others} />

      {/*
        The same bands every other converted page carries, in the same order and
        from the same components. The dark file's note says a product page
        "ends the way every other page on this site ends" — and since the
        homepage and /funding-solutions moved to Daylight, that ending has the
        review wall in it between the use-of-funds grid and the FAQ.
      */}
      <DaylightHowItWorks />

      {/* Use of funds on the band artwork, a wrapper rather than a prop —
          everything the grid draws is opaque, so it sits ON the artwork
          without knowing the artwork is there. */}
      <div className="dl-art">
        <DaylightUseCases />
      </div>

      <DaylightTestimonials />

      {/* One row at a time, and no second Ask-a-Question beside the list —
          the same props the homepage and the funding index give it. */}
      <Faq exclusive blurb={false} label="FAQ" />
    </div>
  );
}
