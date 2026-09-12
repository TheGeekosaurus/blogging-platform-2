import Link from 'next/link';

import { FUNDING_OPTIONS, LOANS } from './content';
import { ArrowUpRightIcon, CoinsIcon } from './icons';
import { Chip, CONTAINER } from './primitives';

/*
 * /funding-solutions — the loans page.
 *
 * Built from the "Podcasts Page" frame of the FutureTech Figma template, which
 * is a listing page: an oversized headline paired with a paragraph set against
 * its baseline, then a split feature block. What that template gives a podcast,
 * this gives a funding product — the shapes carry over, the content does not.
 *
 * Two sections so far, hero and the featured product. The rest of the page (the
 * full product list, requirements, CTA) comes section by section.
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
 * The featured product
 * ------------------------------------------------------------------------- */

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

function Featured() {
  /*
   * Read, not restated: the homepage carousel leads with this same product, and
   * two hand-written descriptions of one credit line is how they drift apart.
   */
  const product = FUNDING_OPTIONS.cards[0];
  const { featured } = LOANS;

  return (
    <section aria-labelledby="ft-loans-featured" className="border-b border-[var(--ft-line)]">
      {/*
        The template's divider runs the full height between the columns, so it
        is a border on the right column rather than a rule between two cards —
        and it only exists at the breakpoint where there are two columns.
      */}
      <div className={`${CONTAINER} lg:flex lg:gap-0`}>
        <div className="py-14 lg:w-[38%] lg:shrink-0 lg:py-20 lg:pr-12">
          <CoinsIcon className="h-10 w-10 text-[var(--ft-accent)]" />

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <h2
              id="ft-loans-featured"
              className="font-[family-name:var(--font-headline)] text-[clamp(1.5rem,2.6vw,2rem)] font-medium leading-[1.15] text-[var(--ft-ink)]"
            >
              {product.title}
            </h2>
            <span className="shrink-0 rounded-full bg-[var(--ft-card-raised)] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[var(--ft-accent)]">
              {featured.label}
            </span>
          </div>

          {/*
            The template puts a labelled fact and the section's button together
            in one bordered card. Here the fact is what the product is best at,
            which is the one thing a reader scanning six options needs.
          */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-card)] p-5">
            <div>
              <p className="text-sm text-[var(--ft-muted)]">{featured.bestForLabel}</p>
              <p className="mt-1 max-w-[22ch] text-[1.0625rem] leading-[1.35] text-[var(--ft-ink)]">
                {featured.bestFor}
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
          {/*
            The template opens this column with the podcast's artwork. There is
            no product photography for a credit line and inventing some would be
            worse than not having it, so the slot carries the number a borrower
            actually came to find. Swap it for real artwork when there is any.
          */}
          <div className="flex aspect-[16/7] items-center justify-center rounded-2xl border border-[var(--ft-line)] bg-[linear-gradient(140deg,var(--ft-card-raised),var(--ft-card))]">
            <div className="px-6 text-center">
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--ft-muted)]">
                {featured.headline.label}
              </p>
              <p className="mt-2 font-[family-name:var(--font-headline)] text-[clamp(2.5rem,6vw,4rem)] font-semibold leading-none text-[var(--ft-accent)]">
                {featured.headline.value}
              </p>
            </div>
          </div>

          <h3 className="mt-10 font-[family-name:var(--font-headline)] text-[clamp(1.25rem,2.2vw,1.625rem)] font-semibold leading-[1.25] text-[var(--ft-ink)]">
            {featured.lead}
          </h3>
          <p className="mt-4 max-w-[62ch] text-[1.0625rem] leading-[1.6] text-[var(--ft-muted)]">
            {product.body}
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-3">
            {featured.stats.map((stat) => (
              <StatBox key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export function FundingSolutions() {
  return (
    <div className="ft-surface">
      <Hero />
      <Featured />
    </div>
  );
}
