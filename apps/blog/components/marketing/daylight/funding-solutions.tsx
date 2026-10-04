import Link from 'next/link';

import { CTA_HREF, FUNDING_PROGRAMS } from '../brand';
import {
  APPLY_LABEL,
  FUNDING_OPTIONS,
  LOAN_PRODUCTS,
  LOANS,
} from '../ft/content';
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
} from '../ft/icons';
import { Faq } from '../ft/shared-sections';
import { DaylightHero } from './hero';
import { DaylightHowItWorks } from './how-it-works';
import { DaylightTestimonials } from './testimonials';
import { DaylightUseCases } from './use-cases';
import { CONTAINER, Chip, CtaButton } from './primitives';

/**
 * DAYLIGHT — /funding-solutions in white.
 *
 * The light twin of ft/funding-solutions.tsx, built the same way the homepage
 * was: a parallel file rather than a theme flag on the dark one, so the dark
 * page stays intact as the revert path and the two can be compared.
 *
 * WHAT DENIS ASKED FOR, 2026-10-04:
 *
 *   - the hero "same as main, but keep the headline on this current page" —
 *     so this renders the same ./hero.tsx the homepage does, handed
 *     LOANS.hero's words instead of HERO's. One component, two headlines.
 *   - the sections shared with the homepage rebranded: How It Works and Use Of
 *     Funds are the Daylight versions, and the FAQ takes the same props the
 *     homepage gives it.
 *   - "All Nine, Side By Side." in the new colours, which is the block below.
 *
 * WHAT IS NOT HERE: the qualifier survey, which the dark page carries between
 * the use-of-funds grid and the FAQ. It is a GoHighLevel iframe whose own
 * Custom CSS paints its html/body #141414 — a deliberate fix from when this
 * site was dark, and the reason it cannot sit on a white page without looking
 * like a rendering fault. The homepage dropped it for the same reason and
 * routes to /get-funded instead, which is where this hero's amount card goes
 * too, so the page keeps its conversion path. Changing the survey's background
 * is a setting in Denis's GoHighLevel account, not a change here.
 *
 * THE PRODUCT BLOCKS ARE NOT IMPORTED FROM THE DARK PAGE even though they are
 * nearly the same markup. They differ in the two places that matter on white —
 * the section header is a chip over a headline rather than the dark design's
 * grey band, and the cards and rules are drawn from the light tokens — and a
 * shared component with two layout branches would be harder to read than two
 * files that each say what they draw.
 */

/*
 * The nine product glyphs, keyed by the `icon` on each FUNDING_PROGRAMS entry.
 * The same keys the dropdown and the dark page map, so a product cannot wear
 * one mark in the menu and another here.
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

/** One boxed figure in a product's stat row. */
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--ft-card)] px-5 py-4">
      <dt className="text-sm text-[var(--ft-muted)]">{label}</dt>
      <dd className="mt-1.5 font-[family-name:var(--font-headline)] text-[1.0625rem] font-semibold leading-snug text-[var(--ft-ink)]">
        {value}
      </dd>
    </div>
  );
}

/**
 * One funding product.
 *
 * Reads the card from FUNDING_OPTIONS and the rest from LOAN_PRODUCTS, keyed by
 * the same slug — so this page and the homepage cannot describe one product two
 * different ways.
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
   * THE ID IS THE CONTRACT. Five of the nine products have no page of their own
   * yet, and the header, the footer and their homepage cards all link to
   * `/funding-solutions#ft-loans-<slug>` — this card. It is built from the same
   * slug as the href in ../brand, so the two cannot drift.
   *
   * ON THE ARTICLE, NOT THE HEADING, and `scroll-mt` with it: with the id on
   * the <h3> the link put the heading's own top edge at y=0, directly under a
   * sticky header, and a reader arriving from the menu could not see the
   * product they had just clicked.
   *
   * `scroll-mt-32` IS 128px AND THAT NUMBER IS MEASURED. The stuck Daylight
   * header's bottom edge sits at 84px up to 768px wide and 94px from 1024px
   * up, so this clears it by 44px and 34px.
   */
  const blockId = `ft-loans-${product.slug}`;
  const headingId = `${blockId}-title`;

  return (
    <li>
      {/*
        ONE COLUMN, not the split this card had for a day.

        It used to put the name and the "Best for" box in a 38% left column
        with the copy and the figures beside them, which is the shape the
        full-bleed dark page used. That shape does not survive moving into the
        scrolling column of a sticky-rail layout: the card is now roughly half
        the page wide, so a 38% sub-column is about 230px and every heading in
        it broke across three lines.

        `dl-card` is the existing two-level token idiom — the ground re-points
        --ft-* to its light-on-navy values and this class re-points them back —
        so everything inside renders exactly as it would on a white page, with
        no per-element overrides.
      */}
      <article
        id={blockId}
        aria-labelledby={headingId}
        className="dl-card scroll-mt-32 p-7 sm:p-9 lg:p-10"
      >
        {/*
          The glyph on the chip tint rather than bare, matching the dropdown's
          tiles — on white a hairline mark floats, where the tinted square gives
          it a seat.
        */}
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--dl-pop-tint)]">
          <Icon className="h-6 w-6 text-[var(--ft-ink)]" />
        </span>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <h3
            id={headingId}
            className="font-[family-name:var(--font-headline)] text-[clamp(1.5rem,2.4vw,1.875rem)] font-semibold leading-[1.15] text-[var(--ft-ink)]"
          >
            {product.label}
          </h3>
          {featured ? (
            <span className="shrink-0 rounded-md bg-[var(--dl-pop-tint)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ft-ink)]">
              {LOANS.featuredLabel}
            </span>
          ) : null}
        </div>

        {/* 19px/700 — the weight is what keeps --ft-subhead above AA on white.
            See the note where the token is declared. */}
        <p className="mt-2 text-[1.1875rem] font-bold leading-[1.3] text-[var(--ft-subhead)]">
          {product.subtitle}
        </p>

        {/*
          `detail.lead` IS DELIBERATELY NOT RENDERED HERE. It is the dark page's
          right-column headline — "One lump sum, a fixed payoff, and a payment
          matched to your cash cycle." — and the body directly under it says the
          same thing in longer form. Stacked in one column they read as the
          sentence twice. The subtitle above carries the line that pairs with
          the product's name, which is what Denis asked these cards to lead
          with; `lead` stays in LOAN_PRODUCTS for the dark build, which still
          lays the two out side by side.
        */}
        <p className="mt-4 text-[1.0625rem] leading-[1.6] text-[var(--ft-muted)]">
          {product.body}
        </p>

        <dl className="mt-7 grid gap-3 border-t border-[var(--ft-line)] pt-7 sm:grid-cols-3">
          {detail.stats.map((stat) => (
            <StatBox key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </dl>

        {/*
          STACKED UNTIL `sm`, side by side after.

          `flex-1 min-w-0` lets the text shrink rather than push the button
          down, so a wrapping row never actually wrapped: at 390px "Turning
          tomorrow's sales into today's cash" was squeezed into 77px over six
          lines and still spilled 13px. Below `sm` the two stack and the text
          gets the full width.
        */}
        <div className="mt-6 flex flex-col items-start gap-5 rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-card)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--ft-muted)]">{LOANS.bestForLabel}</p>
            <p className="mt-1 text-[1.0625rem] leading-[1.35] text-[var(--ft-ink)]">
              {detail.bestFor}
            </p>
          </div>
          {/*
            NOT product.cta for the five whose CTA is an anchor to this very
            card — "Learn More" pointing at the paragraph beside it is a dead
            control that looks like a live one. They get the application
            instead, which is what someone who has just read everything there
            is to read about a product wants next.
          */}
          <Link
            href={product.hasPage ? product.cta.href : CTA_HREF}
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[var(--ft-ink)] px-5 py-3 text-[0.9375rem] font-semibold text-white no-underline transition-colors hover:bg-[#123a8f]"
          >
            {product.hasPage ? product.cta.label : APPLY_LABEL}
            <ArrowUpRightIcon className="h-4 w-4 text-[var(--dl-pop)]" />
          </Link>
        </div>
      </article>
    </li>
  );
}

export function DaylightFundingSolutions() {
  return (
    /* Header and footer come from the root layout — see the note there. */
    <div className="dl-surface">
      {/*
        The homepage's hero, with this page's headline. Denis's words: "same as
        main, but keep the headline on this current page."

        No `lead`: the homepage opens its standfirst with the 551-FICO line and
        this page has no equivalent, so it passes nothing rather than being
        given something to say.
      */}
      <DaylightHero heading={LOANS.hero.heading} body={LOANS.hero.body} id="dl-loans-hero" />

      {/*
        THE STICKY RAIL — the shape Denis pointed at on the homepage: the
        heading holds still on the left while the products scroll past it on
        the right.

        The artwork behind it still holds still too (`dl-cardfield` pins the
        background to the viewport) so two things are now stationary and only
        the cards travel. See globals.css for the measured scrim and the touch
        / reduced-motion fallbacks.
      */}
      <section aria-labelledby="ft-loans-options" className="dl-cardfield">
        <div
          className={`${CONTAINER} grid gap-10 py-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:py-20`}
        >
          {/*
            `self-start` IS WHAT MAKES `sticky` WORK INSIDE A GRID. A grid item
            stretches to the row height by default, so it has no room to move
            within its own track and sticks to nothing.

            `top-28` is 112px, which clears the site header — itself sticky at
            `top-0` and 94px tall when stuck — by 18px. Without the offset the
            heading slides under the bar.
          */}
          <div className="flex flex-col items-start gap-6 lg:sticky lg:top-28 lg:self-start">
            <Chip>{LOANS.optionsHead.label}</Chip>
            <h2
              id="ft-loans-options"
              className="max-w-[16ch] font-[family-name:var(--font-headline)] text-[clamp(1.875rem,3.6vw,2.75rem)] font-bold leading-[1.1] text-[var(--ft-ink)]"
            >
              {LOANS.optionsHead.heading}
            </h2>

            {/*
              NO PARAGRAPH, unlike the homepage's rail. That one borrows
              LOANS.hero.body — and on this page that sentence is already the
              hero's standfirst, a screen and a half above. Repeating it here
              would be the same line twice on one page rather than a second
              thought, and nothing else exists to put in its place that would
              not be marketing copy invented for the gap.
            */}
            <CtaButton className="mt-2" />
          </div>

          {/*
            In FUNDING_PROGRAMS order, which is Denis's order and the order the
            menu lists them in. This run is also where the five products with no
            page of their own land when the header or the footer links to them.
          */}
          <ul className="flex flex-col gap-6 lg:gap-8">
            {FUNDING_OPTIONS.cards.map((card, index) => (
              <Product key={card.slug} product={card} featured={index === 0} />
            ))}
          </ul>
        </div>
      </section>

      <DaylightHowItWorks />

      {/*
        Use of funds, on the band artwork rather than on white — a wrapper
        rather than a prop, exactly as the homepage does it. Everything the
        grid draws is opaque, so it sits ON the artwork without knowing the
        artwork is there, and the picture shows in the margins between its
        bands.
      */}
      <div className="dl-art">
        <DaylightUseCases />
      </div>

      {/* The review wall, above the FAQ — Denis, 2026-10-04. The homepage's
          own section, shared rather than copied; see ./testimonials.tsx. */}
      <DaylightTestimonials />

      {/* One row at a time, and no second Ask-a-Question beside the list —
          the same props the homepage gives it. */}
      <Faq exclusive blurb={false} label="FAQ" />
    </div>
  );
}
