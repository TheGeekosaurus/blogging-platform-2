import Link from 'next/link';

import { CTA_HREF } from '../brand';
import { APPLY_LABEL, FUNDING_OPTIONS, LOAN_PRODUCTS, LOANS } from './content';
import {
  ArrowUpRightIcon,
  BankIcon,
  BridgeIcon,
  CashFlowIcon,
  CoinsIcon,
  EquipmentIcon,
  GrowthIcon,
  InventoryIcon,
  InvoiceIcon,
  WalletIcon,
} from './icons';
import { Chip, CONTAINER, SectionHead } from './primitives';
import { Faq, HowItWorks, Qualifier, UseCases } from './shared-sections';

/*
 * /funding-solutions — the loans page.
 *
 * Built from the "Podcasts Page" frame of the FutureTech Figma template, which
 * is a listing page: an oversized headline paired with a paragraph set against
 * its baseline, then a run of split feature blocks. What that template gives a
 * podcast, this gives a funding product — the shapes carry over, the content
 * does not.
 *
 * Hero, then the grey header band over one block per funding product, then
 * four sections shared with the homepage: how it works, what the money is for,
 * the qualifier survey for anyone still choosing, and the FAQ.
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
/*
 * The nine product glyphs, keyed by the `icon` string on each FUNDING_PROGRAMS
 * entry — the same keys ../daylight/site-header.tsx maps for the dropdown, so a
 * product cannot wear one mark in the menu and a different one here. This map
 * used to carry its own four keys, one of them spelled `cashflow` against the
 * nav's `cash-flow`, which is the kind of near-miss that only shows up as a
 * missing icon on a page nobody opened that week.
 */
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
 * homepage leads with these same nine and two hand-written descriptions of one
 * credit line is how they drift apart. Everything this layout needs beyond the
 * card comes from LOAN_PRODUCTS, keyed by the same slug.
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
  const detail = LOAN_PRODUCTS[product.slug];
  const Icon = ICONS[product.icon as keyof typeof ICONS];

  /*
   * THE ID IS THE CONTRACT, not decoration. Five of the nine products have no
   * page of their own yet, and the header, the footer and their own homepage
   * cards all link to `/funding-solutions#ft-loans-<slug>` — this block. The
   * anchor is built from the same slug in ../brand, so the two cannot drift,
   * and a test asserts every anchored program has a block here.
   *
   * It used to be derived from the CTA's URL, which was fine while every
   * product had a page and breaks the moment one links to an anchor instead.
   *
   * ON THE ARTICLE, NOT ON THE HEADING, and that is the fix for a real bug
   * rather than a tidier structure. With the id on the <h3>, following the link
   * put the heading's own top edge at y=0 — directly under a sticky header 73px
   * tall, which covered it. A reader arriving from the menu landed on a product
   * whose name they could not see. The heading keeps its own id for
   * aria-labelledby, which is all it ever needed one for.
   */
  const blockId = `ft-loans-${product.slug}`;
  const headingId = `${blockId}-title`;

  return (
    /*
      An <article> rather than a <section>: each of these is a self-contained
      description of one product, and they now sit INSIDE the section the header
      band labels rather than being siblings of it.
    */
    <article
      id={blockId}
      aria-labelledby={headingId}
      /*
        `scroll-mt-24` is 96px against a 73px desktop / 67px mobile sticky
        header, so the block's top rule clears it with air to spare at both
        sizes. Measured, not guessed — see the note on `blockId`.
      */
      className="scroll-mt-24 border-b border-[var(--ft-line)]"
    >
      {/*
        The template's divider runs the full height between the columns, so it
        is a border on the right column rather than a rule between two cards —
        and it only exists at the breakpoint where there are two columns.

        Which is why the columns are centred with `justify-center` on EACH of
        them rather than `items-center` on the row. Centring the row's items
        stops them stretching, so that border would shrink to the right
        column's own height and stop being a full-height rule. Leaving the
        columns stretched and centring inside each keeps the rule and still
        sits both blocks on the section's middle.
      */}
      <div className={`${CONTAINER} lg:flex lg:gap-0`}>
        <div className="py-14 lg:flex lg:w-[38%] lg:shrink-0 lg:flex-col lg:justify-center lg:py-20 lg:pr-12">
          <Icon className="h-10 w-10 text-[var(--ft-accent)]" />

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {/* h3, under the band's h2 — the level follows the grouping, not
                the size, and the size is unchanged. The text is the product's
                NAME now, read off the program as `label`, so this heading, the
                menu item and the footer link are one string. */}
            <h3
              id={headingId}
              className="font-[family-name:var(--font-headline)] text-[clamp(1.5rem,2.6vw,2rem)] font-medium leading-[1.15] text-[var(--ft-ink)]"
            >
              {product.label}
            </h3>
            {featured ? (
              <span className="shrink-0 rounded-full bg-[var(--ft-card-raised)] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[var(--ft-accent)]">
                {LOANS.featuredLabel}
              </span>
            ) : null}
          </div>

          {/*
            The sentence that used to be this block's heading, now set under the
            product's name. 19px/700 for the reason spelled out in globals.css
            where --ft-subhead is declared — on the light theme that weight is
            what keeps this colour above AA. This page is the dark theme, where
            it measures 5.70:1 and would pass at any size, but the two are set
            the same so one copy of the rule covers both.
          */}
          <p className="mt-3 text-[1.1875rem] font-bold leading-[1.3] text-[var(--ft-subhead)]">
            {product.subtitle}
          </p>

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
            {/*
              NOT product.cta ON THIS PAGE, for the five products whose CTA is
              an anchor to this very block. "Learn More" pointing at the
              paragraph you are already reading is a dead control that looks
              like a live one — and on the homepage the same card's CTA is
              correct, which is why this is fixed here rather than in the data.

              What replaces it is the application, which is what someone who
              has just read all there is to read about a product would want
              next. Products with a page keep "Learn More" and their page.
            */}
            <Link
              href={product.hasPage ? product.cta.href : CTA_HREF}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--ft-line)] bg-[var(--ft-card-raised)] px-5 py-3 text-[0.9375rem] text-[var(--ft-muted)] no-underline transition-colors hover:border-[var(--ft-accent)] hover:text-[var(--ft-ink)]"
            >
              {product.hasPage ? product.cta.label : APPLY_LABEL}
              <ArrowUpRightIcon className="h-4 w-4 text-[var(--ft-accent)]" />
            </Link>
          </div>
        </div>

        <div className="border-t border-[var(--ft-line)] py-14 lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:justify-center lg:border-l lg:border-t-0 lg:py-20 lg:pl-12">
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
          In FUNDING_PROGRAMS order, so someone arriving from the homepage or
          the menu meets the products in the order they last saw them — all
          three read the same array. The first is the one Denis put first and is
          the only one that carries the "Featured" pill.

          This is also the landing place for the five programs with no page of
          their own: the header and the footer link straight to a block in this
          run. Keyed by slug rather than by title so renaming a product does not
          silently remount every block after it.
        */}
        {FUNDING_OPTIONS.cards.map((card, index) => (
          <Product key={card.slug} product={card} featured={index === 0} />
        ))}
      </section>

      {/*
        The homepage's own sections, imported rather than reproduced — see
        ./shared-sections. In this order because it is the reader's order: they
        have just compared four products, so what happens after you apply comes
        first, what the money is for second, and the survey last for anyone who
        got to the bottom still undecided. The Qualifier is the page's second
        conversion path, after the "Learn More" on each product.
      */}
      <HowItWorks />
      <UseCases />
      <Qualifier />
      <Faq />
    </div>
  );
}
