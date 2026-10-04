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
import { CONTAINER, Chip } from './primitives';

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
   * `/funding-solutions#ft-loans-<slug>` — this block. It is built from the
   * same slug as the href in ../brand, so the two cannot drift.
   *
   * ON THE ARTICLE, NOT THE HEADING, and `scroll-mt` with it: with the id on
   * the <h2> the link put the heading's own top edge at y=0, directly under a
   * sticky header, and a reader arriving from the menu could not see the
   * product they had just clicked.
   *
   * `scroll-mt-32` IS 128px AND THAT NUMBER IS MEASURED. The stuck Daylight
   * header's bottom edge sits at 84px up to 768px wide and 94px from 1024px
   * up, so this clears it by 44px and 34px. It was `scroll-mt-24` while the
   * header was the dark one, which was 73px tall — against the taller light
   * header that left a 2px gap, which reads as the block being jammed under
   * the bar rather than placed below it.
   */
  const blockId = `ft-loans-${product.slug}`;
  const headingId = `${blockId}-title`;

  return (
    /*
      A CARD, not a full-bleed band. Denis, 2026-10-04: turn the products into
      cards, keep them large, and float them over artwork that holds still.

      `dl-card` is the existing two-level token idiom — the ground re-points
      --ft-* to its light-on-navy values and this class re-points them back —
      so everything inside renders exactly as it would on a white page, with no
      per-element overrides. The same class the homepage's navy band uses; see
      globals.css, where its selector now names both grounds.
    */
    <article
      id={blockId}
      aria-labelledby={headingId}
      className="dl-card scroll-mt-32 overflow-hidden"
    >
      <div className="lg:flex lg:gap-0">
        <div className="p-8 lg:flex lg:w-[38%] lg:shrink-0 lg:flex-col lg:justify-center lg:p-12">
          {/*
            The glyph on the chip tint rather than bare, matching the dropdown's
            tiles — on white a hairline mark floats, where the tinted square
            gives it a seat.
          */}
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--dl-pop-tint)]">
            <Icon className="h-6 w-6 text-[var(--ft-ink)]" />
          </span>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <h2
              id={headingId}
              className="font-[family-name:var(--font-headline)] text-[clamp(1.5rem,2.6vw,2rem)] font-semibold leading-[1.15] text-[var(--ft-ink)]"
            >
              {product.label}
            </h2>
            {featured ? (
              <span className="shrink-0 rounded-md bg-[var(--dl-pop-tint)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ft-ink)]">
                {LOANS.featuredLabel}
              </span>
            ) : null}
          </div>

          {/* 19px/700 — the weight is what keeps --ft-subhead above AA on
              white. See the note where the token is declared. */}
          <p className="mt-2 text-[1.1875rem] font-bold leading-[1.3] text-[var(--ft-subhead)]">
            {product.subtitle}
          </p>

          {/*
            STACKED UNTIL `sm`, side by side after.

            It was a wrapping row at every width, and the wrap never fired:
            `flex-1 min-w-0` lets the text shrink indefinitely rather than push
            the button down, so at 390px "Turning tomorrow's sales into today's
            cash" was squeezed into 77px — six words on six lines beside a
            button, and 13px of it spilling out anyway. Below `sm` the two now
            stack and the text gets the full width.
          */}
          <div className="mt-7 flex flex-col items-start gap-5 rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-card)] p-5 sm:flex-row sm:items-center sm:justify-between">
            {/*
              `min-w-0` keeps the button on the same line as the fact once they
              are side by side: without it the text block's min-content width is
              the whole unwrapped phrase, which shoves the button onto its own
              row on every product whose "Best for" runs long.
            */}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[var(--ft-muted)]">{LOANS.bestForLabel}</p>
              <p className="mt-1 text-[1.0625rem] leading-[1.35] text-[var(--ft-ink)]">
                {detail.bestFor}
              </p>
            </div>
            {/*
              NOT product.cta for the five whose CTA is an anchor to this very
              block — "Learn More" pointing at the paragraph beside it is a dead
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
        </div>

        <div className="border-t border-[var(--ft-line)] p-8 lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:justify-center lg:border-l lg:border-t-0 lg:p-12">
          <h3 className="font-[family-name:var(--font-headline)] text-[clamp(1.25rem,2.2vw,1.625rem)] font-semibold leading-[1.25] text-[var(--ft-ink)]">
            {detail.lead}
          </h3>
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
        THE PRODUCTS, ON ARTWORK THAT DOES NOT MOVE. `dl-cardfield` pins the
        background to the viewport with `background-attachment: fixed`, so the
        cards travel over it — see globals.css for the rule, the measured scrim
        that keeps the heading legible over the mark's light faces, and the
        touch / reduced-motion fallbacks.
      */}
      <section aria-labelledby="ft-loans-options" className="dl-cardfield">
        {/*
          The chip-over-headline the rest of Daylight uses, where the dark page
          had a grey band. Written out rather than taken from SectionIntro only
          because that component pairs its heading with an optional CTA and
          this band wants neither.

          THE HEADING AND LABEL ARE LOANS.optionsHead, unchanged. Denis asked
          for this section "rebranded per our new colors", which is what this
          is — no new copy was invented for it, and the count in the heading is
          still the one a test holds against FUNDING_PROGRAMS.length.
        */}
        <div className={`${CONTAINER} flex flex-col items-start gap-5 pb-10 pt-14 lg:pb-12 lg:pt-20`}>
          <Chip>{LOANS.optionsHead.label}</Chip>
          <h2
            id="ft-loans-options"
            className="max-w-[20ch] font-[family-name:var(--font-headline)] text-[clamp(1.875rem,4vw,2.875rem)] font-bold leading-[1.1] text-[var(--ft-ink)]"
          >
            {LOANS.optionsHead.heading}
          </h2>
        </div>

        {/*
          THE CARDS STACK AS YOU SCROLL — Denis, 2026-10-05, after two wrong
          readings of the brief. Each card pins at the top and the next slides
          up and covers it, like a deck being dealt. The cards keep the full
          width and the header keeps its place above them; the only thing that
          changed is the motion.

          `--dl-i` is the card's index, which `.dl-stack` turns into a few
          pixels of extra offset per card so a sliver of each one underneath
          stays visible. Written as an inline custom property rather than a
          class, because Tailwind compiles by scanning source text and a
          computed `top-[...]` would produce no CSS at all.

          The mechanics, the breakpoint and the reduced-motion fallback are in
          globals.css.

          In FUNDING_PROGRAMS order, which is Denis's order and the order the
          menu lists them in. This run is also where the five products with no
          page of their own land when the header or the footer links to them.
        */}
        <ul className={`${CONTAINER} dl-stack flex flex-col gap-8 pb-16 lg:gap-10 lg:pb-24`}>
          {FUNDING_OPTIONS.cards.map((card, index) => (
            <li key={card.slug} style={{ ['--dl-i' as string]: index }}>
              <Product product={card} featured={index === 0} />
            </li>
          ))}
        </ul>
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
