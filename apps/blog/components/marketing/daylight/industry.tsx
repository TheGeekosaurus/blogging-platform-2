import Link from 'next/link';

import { FUNDING_PROGRAMS } from '../brand';
import { FUNDING_OPTIONS, LOAN_PRODUCTS } from '../ft/content';
import {
  ArrowUpRightIcon,
  BankIcon,
  BridgeIcon,
  CashFlowIcon,
  CoinsIcon,
  EquipmentIcon,
  ExpandIcon,
  GrowthIcon,
  InventoryIcon,
  InvoiceIcon,
  MarketingIcon,
  PayrollIcon,
  WalletIcon,
} from '../ft/icons';
import { Faq } from '../ft/shared-sections';
import type { IndustryPage } from './industry-content';
import { DaylightHero } from './hero';
import { DaylightHowItWorks } from './how-it-works';
import { DaylightTestimonials } from './testimonials';
import { DaylightUseCases } from './use-cases';
import { CONTAINER, SectionIntro } from './primitives';

/**
 * DAYLIGHT — an industry page, /industries/<slug>.
 *
 * ONE TEMPLATE OVER A RECORD, the arrangement LOAN_PAGES and ./loan-product
 * already use for the nine products. Denis asked to build one industry and then
 * spin up more; "more" is an entry in ./industry-content.ts and a route, never
 * a second copy of this file.
 *
 * WHAT DENIS ASKED FOR, 2026-10-05: "Let's start with our Hero section same as
 * main, new headline on the left side. Mostly reuse existing sections." So:
 *
 *   hero            ./hero.tsx, the one the homepage and /funding-solutions
 *                   wear, handed this industry's headline and standfirst.
 *   needs           the only block written for this page — what the money
 *                   actually goes on in this trade, which is the whole reason
 *                   an industry page exists rather than a redirect to the
 *                   funding index.
 *   products        the shortlist, drawn from the SAME copy the index and the
 *                   product pages use. Nothing is retyped here.
 *   how it works    shared, unchanged.
 *   use of funds    shared, on the band artwork, exactly as the other two pages
 *                   place it.
 *   testimonials    shared, unchanged.
 *   FAQ             shared, with the same props the homepage gives it.
 *
 * NO QUALIFIER SURVEY, for the reason set out at length in ./funding-solutions:
 * the GoHighLevel iframe paints its own html/body #141414 and cannot sit on a
 * white page. The hero's amount card routes to /get-funded, which is the
 * conversion path every Daylight page uses.
 */

/*
 * Product glyphs, keyed by the `icon` on each FUNDING_PROGRAMS entry — the same
 * map ./funding-solutions and the header dropdown use, so a product cannot wear
 * one mark in the menu and another here. Only the nine core keys, because only
 * core slugs can reach this file: IndustryPage.products.slugs is typed
 * FundingSlug, so a key that is not in this map fails the build rather than
 * rendering nothing.
 */
const PRODUCT_ICONS = {
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

/*
 * Glyphs for the `needs` cells. A separate map from the one above because these
 * are reasons to borrow rather than products, and the two lists only happen to
 * overlap: `equipment` means the fryer here and the product there.
 *
 * The keys are the ones ./use-cases already uses for the same ideas, so an
 * industry's needs and the use-of-funds grid further down the page cannot put
 * two different marks on the same thought.
 */
const NEED_ICONS = {
  equipment: EquipmentIcon,
  inventory: InventoryIcon,
  payroll: PayrollIcon,
  expand: ExpandIcon,
  marketing: MarketingIcon,
  'cash-flow': CashFlowIcon,
} as const;

/** The cards by slug, so a product's copy is looked up rather than retyped. */
const CARDS_BY_SLUG = new Map(FUNDING_OPTIONS.cards.map((card) => [card.slug, card]));

/**
 * One recommended product.
 *
 * A SHORT CARD, not the full block /funding-solutions draws. That page is where
 * someone compares all nine at length; here the product is an answer to the
 * problem described in the section above it, and the card's job is to say which
 * one and get out of the way. Everything it prints — the name, the subhead, the
 * "best for" line — is read from the shared copy, so this page cannot describe
 * a product a fourth way.
 *
 * Every one of the nine has a page of its own now, so `href` is always a real
 * destination and there is no anchor-to-itself case to guard, the way the
 * funding index still has to.
 */
function ProductCard({ slug }: { slug: (typeof FUNDING_PROGRAMS)[number]['slug'] }) {
  const card = CARDS_BY_SLUG.get(slug);
  const detail = LOAN_PRODUCTS[slug];
  if (!card) return null;

  const Icon = PRODUCT_ICONS[card.icon as keyof typeof PRODUCT_ICONS];

  return (
    /*
      `dl-card` re-points --ft-* back to their light values inside the card, so
      everything below renders as it would on a white page even though the
      section around it is navy. The same two-level idiom the homepage's
      destination cards use; see globals.css.

      `h-full` with the grid's `items-stretch` default keeps five cards in a
      three-up grid the same height, so the bottom row's two do not come out
      short beside the gap.
    */
    <li className="dl-card flex h-full flex-col p-7 lg:p-8">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--dl-pop-tint)]">
        <Icon className="h-6 w-6 text-[var(--ft-ink)]" />
      </span>

      <h3 className="mt-6 font-[family-name:var(--font-headline)] text-[1.375rem] font-semibold leading-[1.2] text-[var(--ft-ink)]">
        {card.label}
      </h3>

      {/* 19px/700 — the weight is what carries --ft-subhead over AA on white.
          See the note where the token is declared in globals.css, and the two
          other call sites that a test holds to the same size and weight. */}
      <p className="mt-2 text-[1.1875rem] font-bold leading-[1.3] text-[var(--ft-subhead)]">
        {card.subtitle}
      </p>

      <div className="mt-5 rounded-xl bg-[var(--ft-card)] px-5 py-4">
        <p className="text-sm text-[var(--ft-muted)]">Best for</p>
        <p className="mt-1 text-[1.0625rem] leading-[1.35] text-[var(--ft-ink)]">
          {detail.bestFor}
        </p>
      </div>

      {/* `mt-auto` pins the link to the bottom edge whatever the card above it
          measures, so the five links sit on two straight lines. */}
      <Link
        href={card.href}
        className="mt-auto inline-flex items-center gap-2 pt-6 text-[0.9375rem] font-semibold text-[var(--ft-ink)] no-underline hover:text-[var(--ft-accent)]"
      >
        {card.cta.label}
        <ArrowUpRightIcon className="h-4 w-4" />
      </Link>
    </li>
  );
}

export function DaylightIndustry({ page }: { page: IndustryPage }) {
  return (
    /* Header and footer come from the root layout — see the note there. */
    <div className="dl-surface">
      <DaylightHero
        heading={page.hero.heading}
        body={page.hero.blurb}
        id={`dl-${page.slug}-hero`}
      />

      {/*
        WHAT THE MONEY GOES ON. The one block that is genuinely this page's own,
        and the reason the page is worth having: everything else here is true of
        every business, and this is the part a restaurateur recognises.

        Six cells rather than eight, in a three-up grid — the use-of-funds grid
        further down is already an eight-cell four-up, and repeating that shape
        twenty seconds apart would read as the same section twice.
      */}
      <section aria-labelledby="dl-needs" className="border-t border-[var(--ft-line)]">
        <div className={`${CONTAINER} py-14 lg:py-20`}>
          <SectionIntro id="dl-needs" label={page.needs.label} heading={page.needs.heading} />

          <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-[1.7] text-[var(--ft-muted)]">
            {page.needs.body}
          </p>

          <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-line)] sm:grid-cols-2 lg:grid-cols-3 lg:mt-14">
            {page.needs.items.map((item) => {
              const Icon = NEED_ICONS[item.icon as keyof typeof NEED_ICONS];
              return (
                <li
                  key={item.title}
                  className="flex flex-col gap-4 bg-[var(--ft-bg)] px-7 py-9 transition-colors duration-300 ease-out hover:bg-[var(--ft-card)]"
                >
                  {/*
                    Gold, like the use-of-funds cells and the step numerals.
                    #E0A840 measures 2.13:1 on white, which would matter if the
                    mark carried the meaning — it does not: every cell prints
                    its title directly beneath, so the glyph is decoration
                    beside a sentence rather than a word of its own.

                    `Icon` is only undefined if a content entry names a key this
                    map does not have, which a test catches; rendering nothing
                    is the right answer in the meantime, rather than crashing
                    the whole page over a missing 32px drawing.
                  */}
                  {Icon ? <Icon className="h-8 w-8 text-[var(--dl-gold)]" /> : null}
                  <h3 className="font-[family-name:var(--font-headline)] text-[1.1875rem] font-semibold leading-[1.25] text-[var(--ft-ink)]">
                    {item.title}
                  </h3>
                  <p className="text-[1.0625rem] leading-[1.6] text-[var(--ft-muted)]">
                    {item.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/*
        THE SHORTLIST. White cards want something to float on — the same
        argument that put the homepage's three destination cards on this ground
        — and it breaks up what would otherwise be three white card grids in a
        row between the hero and the FAQ.

        THE HEADING STAYS ON WHITE AND ONLY THE CARDS GO ON THE ARTWORK, which
        is the one thing about this section that was got wrong first and is
        worth stating plainly. `.dl-deep`'s note in globals.css says it is safe
        to put a picture behind that band BECAUSE nothing on it is text; this
        header was on it for a round, and measured against the rendered pixels
        the white heading came out at 2.20:1 and the standfirst at 1.29:1 where
        the artwork's gold curve runs under them from 1024px up. The in-browser
        contrast sweep passed it, because that sweep reads background-COLOR and
        cannot see a background-image — so the only thing that catches this is
        photographing the ground with the glyphs made transparent.

        A navy scrim would have fixed it and was costed: 0.70 alpha, the point
        where the dimmer standfirst colour finally clears 4.5:1. That leaves 30%
        of a picture Denis chose, to carry two lines that read perfectly well on
        white one block earlier. So the header moved instead and the artwork
        kept its strength.
      */}
      <section aria-labelledby="dl-fit">
        <div className={`${CONTAINER} pt-14 lg:pt-20`}>
          <SectionIntro id="dl-fit" label={page.products.label} heading={page.products.heading} />

          <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-[1.7] text-[var(--ft-muted)]">
            {page.products.body}
          </p>
        </div>

        {/* Nothing in here is text — five opaque cards, exactly what the band
            was built to carry. Each card's `.dl-card` puts the light tokens
            back inside it. */}
        <div className="dl-deep mt-12 lg:mt-14">
          <ul className={`${CONTAINER} grid gap-6 py-14 sm:grid-cols-2 lg:grid-cols-3 lg:py-20`}>
            {page.products.slugs.map((slug) => (
              <ProductCard key={slug} slug={slug} />
            ))}
          </ul>
        </div>
      </section>

      {/* Shared from here down. The divider above How It Works is on that
          section itself, so every page that drops it in gets the rule. */}
      <DaylightHowItWorks />

      <div className="dl-art">
        <DaylightUseCases />
      </div>

      <DaylightTestimonials />

      <Faq exclusive blurb={false} label="FAQ" />
    </div>
  );
}
