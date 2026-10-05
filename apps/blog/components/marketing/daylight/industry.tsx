import { FUNDING_OPTIONS } from '../ft/content';
import {
  CashFlowIcon,
  EquipmentIcon,
  ExpandIcon,
  InventoryIcon,
  MarketingIcon,
  PayrollIcon,
} from '../ft/icons';
import { Faq } from '../ft/shared-sections';
import type { IndustryPage } from './industry-content';
import { DaylightFundingRail } from './funding-rail';
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

/**
 * The shortlist's cards, IN THE RECORD'S ORDER rather than the menu's.
 *
 * `FUNDING_OPTIONS.cards.filter(...)` would have been shorter and is wrong
 * here: it returns them in FUNDING_PROGRAMS order, which is Denis's order for
 * the menu and the index — a stable global ranking that says nothing about any
 * one trade. A record lists its products most-relevant-first (a food business
 * is shown equipment finance before a line of credit), and that ordering is the
 * editorial judgement the page exists to make.
 *
 * A slug with no card is dropped rather than crashing the page. It cannot
 * happen today — `slugs` is typed FundingSlug and every program has a card — so
 * this is only here to keep that a render bug rather than a 500 if the two ever
 * come apart.
 */
function cardsFor(page: IndustryPage) {
  const bySlug = new Map(FUNDING_OPTIONS.cards.map((card) => [card.slug, card]));
  return page.products.slugs
    .map((slug) => bySlug.get(slug))
    .filter((card) => card !== undefined);
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
        THE SHORTLIST, as the homepage's products section — Denis, 2026-10-05:
        "mimic the main page with products, title on the left, product cards
        scrolling on the right."

        THE SAME COMPONENT, not a copy of it. ./funding-rail.tsx was the
        homepage's own `FundingOptions` until this page asked for it; it moved
        out so both call it, the way ./hero.tsx is shared. This page hands it
        its own chip, headline and standfirst, and the handful of products this
        trade usually wants instead of all nine.

        THE SECTION CARRIES ITS OWN `border-t`, which is the divider Denis
        asked for between this and the block above. It is on the rail rather
        than on the needs grid for the reason the How It Works rule is on How
        It Works: every page that drops this section in gets the edge without
        having to remember.

        IT IS ON WHITE, AND THE NAVY BAND THAT WAS HERE IS GONE. That band
        carried the heading on `.dl-deep`'s artwork for a round and the type
        measured 2.20:1 and 1.29:1 over the gold curve — the note in globals.css
        over `.dl-deep` has the numbers and why the sweep missed them. Mimicking
        the main page settles it: the main page's section is on white.
      */}
      <DaylightFundingRail
        id="dl-fit"
        label={page.products.label}
        heading={page.products.heading}
        body={page.products.body}
        cards={cardsFor(page)}
      />

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
