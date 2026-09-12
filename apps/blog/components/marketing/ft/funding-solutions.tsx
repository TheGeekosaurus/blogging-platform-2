import Link from 'next/link';

import { FUNDING_OPTIONS, LOAN_PRODUCTS, LOANS } from './content';
import {
  ArrowUpRightIcon,
  CashFlowIcon,
  CoinsIcon,
  EquipmentIcon,
  GrowthIcon,
} from './icons';
import { Chip, CONTAINER, SectionHead } from './primitives';

/*
 * /funding-solutions — the loans page.
 *
 * Built from the "Podcasts Page" frame of the FutureTech Figma template, which
 * is a listing page: an oversized headline paired with a paragraph set against
 * its baseline, then a run of split feature blocks. What that template gives a
 * podcast, this gives a funding product — the shapes carry over, the content
 * does not.
 *
 * Hero, then the grey header band over one block per funding product. The
 * rest of the page (requirements, closing CTA) comes section by section.
 */

/* ---------------------------------------------------------------------------
 * Hero
 *
 * The template sets the headline large on the left and drops a body paragraph
 * into the right column aligned to the LAST line of it, not the first. That is
 * the whole character of the layout, and `items-end` on the row is what does it
 * — the paragraph hangs off the headline's baseline rather than floating beside
 * its top.
 * ------------------------------------------------------------------------- */
function Hero() {
  return (
    <section aria-labelledby="ft-loans" className="border-b border-[var(--ft-line)]">
      <div className={`${CONTAINER} py-16 lg:py-24`}>
        <Chip>{LOANS.hero.eyebrow}</Chip>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:gap-16">
          <h1
            id="ft-loans"
            className="max-w-[16ch] flex-1 font-[family-name:var(--font-headline)] text-[clamp(2.25rem,5.5vw,4rem)] font-medium leading-[1.06] text-[var(--ft-ink)]"
          >
            {LOANS.hero.heading}
          </h1>

          <p className="max-w-[52ch] flex-1 text-[1.0625rem] leading-[1.65] text-[var(--ft-muted)]">
            {LOANS.hero.body}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * The product sections
 * ------------------------------------------------------------------------- */

/** Resolves LOAN_PRODUCTS' `icon` keys, the way the homepage resolves tiles'. */
const ICONS = {
  coins: CoinsIcon,
  growth: GrowthIcon,
  equipment: EquipmentIcon,
  cashflow: CashFlowIcon,
} as const;

/**
 * The template's three boxed figures under the feature's description.
 *
 * dt/dd inside a wrapping div, not two paragraphs: the list is a set of
 * term/value pairs and says so, which is also the only markup a <dl> actually
 * permits. Same shape as the requirements band on the homepage.
 */
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--ft-line)] bg-[var(--ft-card)] px-5 py-4">
      <dt className="text-sm text-[var(--ft-muted)]">{label}</dt>
      <dd className="mt-1 font-[family-name:var(--font-headline)] text-lg font-semibold text-[var(--ft-ink)]">
        {value}
      </dd>
    </div>
  );
}

/**
 * One funding product, in the template's feature block.
 *
 * `product` is the card from FUNDING_OPTIONS — read, not restated, because the
 * homepage carousel leads with these same four and two hand-written
 * descriptions of one credit line is how they drift apart. Everything this
 * layout needs beyond the card comes from LOAN_PRODUCTS, keyed by the product's
 * own page.
 *
 * The template's right column opens with the podcast's artwork. There is no
 * product photography for a credit line, and the gradient panel that stood in
 * for it here was an empty box with a number in it — so the column now starts
 * on the copy, and the number it was carrying moved into the stat row below,
 * where the other figures are.
 */
function Product({
  product,
  featured,
}: {
  product: (typeof FUNDING_OPTIONS.cards)[number];
  featured: boolean;
}) {
  const detail = LOAN_PRODUCTS[product.cta.href];
  const Icon = ICONS[detail.icon];

  /* The block's heading is its own label, so the id is derived from the page
     the product links to — unique per product and stable across reordering. */
  const headingId = `ft-loans-${product.cta.href.split('/').pop()}`;

  return (
    /*
      An <article> rather than a <section>: each of these is a self-contained
      description of one product, and they now sit INSIDE the section the header
      band labels rather than being siblings of it.
    */
    <article aria-labelledby={headingId} className="border-b border-[var(--ft-line)]">
      {/*
        The template's divider runs the full height between the columns, so it
        is a border on the right column rather than a rule between two cards —
        and it only exists at the breakpoint where there are two columns.
      */}
      <div className={`${CONTAINER} lg:flex lg:gap-0`}>
        <div className="py-14 lg:w-[38%] lg:shrink-0 lg:py-20 lg:pr-12">
          <Icon className="h-10 w-10 text-[var(--ft-accent)]" />

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {/* h3, under the band's h2 — the level follows the grouping, not
                the size, and the size is unchanged. */}
            <h3
              id={headingId}
              className="font-[family-name:var(--font-headline)] text-[clamp(1.5rem,2.6vw,2rem)] font-medium leading-[1.15] text-[var(--ft-ink)]"
            >
              {product.title}
            </h3>
            {featured ? (
              <span className="shrink-0 rounded-full bg-[var(--ft-card-raised)] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[var(--ft-accent)]">
                {LOANS.featuredLabel}
              </span>
            ) : null}
          </div>

          {/*
            The template puts a labelled fact and the section's button together
            in one bordered card. Here the fact is what the product is best at,
            which is the one thing a reader scanning the list needs.
          */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-card)] p-5 sm:flex-nowrap">
            {/*
              `min-w-0` is what keeps the button on the same line as the fact.
              Without it the text block's min-content width is its longest word
              plus the whole unwrapped phrase, so anything longer than "Keeping
              funds on hand" shoved the button onto its own row — the featured
              product kept the template's layout and the other three quietly
              did not. Now the phrase wraps inside the row instead.
            */}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[var(--ft-muted)]">{LOANS.bestForLabel}</p>
              <p className="mt-1 text-[1.0625rem] leading-[1.35] text-[var(--ft-ink)]">
                {detail.bestFor}
              </p>
            </div>
            <Link
              href={product.cta.href}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--ft-line)] bg-[var(--ft-card-raised)] px-5 py-3 text-[0.9375rem] text-[var(--ft-muted)] no-underline transition-colors hover:border-[var(--ft-accent)] hover:text-[var(--ft-ink)]"
            >
              {product.cta.label}
              <ArrowUpRightIcon className="h-4 w-4 text-[var(--ft-accent)]" />
            </Link>
          </div>
        </div>

        <div className="border-t border-[var(--ft-line)] py-14 lg:min-w-0 lg:flex-1 lg:border-l lg:border-t-0 lg:py-20 lg:pl-12">
          <h4 className="font-[family-name:var(--font-headline)] text-[clamp(1.25rem,2.2vw,1.625rem)] font-semibold leading-[1.25] text-[var(--ft-ink)]">
            {detail.lead}
          </h4>
          <p className="mt-4 max-w-[62ch] text-[1.0625rem] leading-[1.6] text-[var(--ft-muted)]">
            {product.body}
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {detail.stats.map((stat) => (
              <StatBox key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </dl>
        </div>
      </div>
    </article>
  );
}

export function FundingSolutions() {
  return (
    <div className="ft-surface">
      <Hero />

      <section aria-labelledby="ft-loans-options">
        {/*
          The homepage's grey header band, reused rather than restyled — it is
          what separates one band of this design from the next, and without it
          the hero ran straight into the first product with nothing naming what
          the list below was.
        */}
        <SectionHead
          id="ft-loans-options"
          label={LOANS.optionsHead.label}
          heading={LOANS.optionsHead.heading}
        />

        {/*
          In carousel order, so someone arriving from the homepage meets the
          products in the order they last saw them. The first is the flagship
          and is the only one that carries the "Featured" pill.
        */}
        {FUNDING_OPTIONS.cards.map((card, index) => (
          <Product key={card.title} product={card} featured={index === 0} />
        ))}
      </section>
    </div>
  );
}
