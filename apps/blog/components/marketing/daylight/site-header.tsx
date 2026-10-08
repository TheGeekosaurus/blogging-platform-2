import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { LOCAL_IMAGES, NAV, type NavItem } from '../brand';
import {
  BankIcon,
  BridgeIcon,
  CalculatorIcon,
  CashFlowIcon,
  CoinsIcon,
  EquipmentIcon,
  GrowthIcon,
  InventoryIcon,
  InvoiceIcon,
  WalletIcon,
} from '../ft/icons';
import { NAV_CTA } from './content';
import { DaylightHeaderShell } from './header-shell';
import {
  BoltIcon,
  CarIcon,
  CutleryIcon,
  FanIcon,
  GaugeIcon,
  HardHatIcon,
  HouseIcon,
  LedgerIcon,
  MoreGridIcon,
  PulseIcon,
  ScalesIcon,
  ShearsIcon,
  ShieldIcon,
  SpineIcon,
  StorefrontIcon,
  ToothIcon,
  TreeIcon,
  WheatIcon,
} from './icons';
import { DaylightMobileNav } from './mobile-nav';
import { CtaButton } from './primitives';

/*
 * Daylight's site header — the light twin of ../site-header.tsx.
 *
 * A separate component rather than a themed version of that one. The shared
 * header writes `text-white`, `border-white/10` and `bg-white/5` as literals,
 * so it cannot be re-pointed by tokens the way every section of the page body
 * can; and more to the point, this branch exists so the light build can be
 * changed freely, which a shared component would make impossible without
 * touching the live site on every edit.
 *
 * What it does NOT fork is the navigation itself. NAV comes from ../brand, the
 * same array the dark header reads, because the two sites have the same
 * navigation until Denis says otherwise — and a copied array is how one of them
 * ends up advertising a program the other has dropped.
 *
 * THE OPENING SEQUENCE is three beats, in pure CSS — see `.dl-headbar` and the
 * block around it in globals.css. The island starts as a pill holding only the
 * wordmark, widens to full width with the CTA riding out from behind the logo,
 * and only then do the nav items arrive one at a time from the right. All this
 * file adds is the marker classes and `--dl-i`, the per-item index, counted
 * from the right because that is the direction the run travels.
 *
 * No state and no effect for any of it. The shell is already a client component
 * for the scroll treatment, so this is not about a bundle — CSS delays simply
 * start on first paint, which is earlier and steadier than anything an effect
 * can schedule, and there is nothing here for React to own.
 */

const TRIGGER_CLASS =
  'flex items-center gap-1.5 py-6 text-sm font-semibold text-[var(--ft-ink)]';

/*
 * The dropdown glyphs, keyed by the `icon` string on each NAV child.
 *
 * The nine funding marks come from ft/icons.tsx, which is the shared set and is
 * where product glyphs belong — /funding-solutions draws the same nine from the
 * same keys, so a product cannot wear one mark in the menu and another on the
 * page. Only the two industry marks are Daylight's own. Mapping here rather
 * than in brand.ts keeps that module free of JSX — see the note on
 * NavItem.icon.
 *
 * Every key in FUNDING_PROGRAMS and INDUSTRIES must appear here; a test in
 * __tests__/daylight.test.ts fails if one does not, because a missing key
 * renders the row with no tile rather than with a wrong one, which is quiet.
 */
const NAV_ICONS = {
  coins: CoinsIcon,
  /* Draw and repay, draw again — the revolving arrows are the line of credit. */
  'cash-flow': CashFlowIcon,
  /* Revenue-led, so the rising chart: an advance repaid out of sales. */
  growth: GrowthIcon,
  wallet: WalletIcon,
  equipment: EquipmentIcon,
  bank: BankIcon,
  inventory: InventoryIcon,
  invoice: InvoiceIcon,
  bridge: BridgeIcon,
  storefront: StorefrontIcon,
  'hard-hat': HardHatIcon,
  wheat: WheatIcon,
  ledger: LedgerIcon,
  car: CarIcon,
  spine: SpineIcon,
  shears: ShearsIcon,
  tooth: ToothIcon,
  bolt: BoltIcon,
  pulse: PulseIcon,
  fan: FanIcon,
  shield: ShieldIcon,
  tree: TreeIcon,
  scales: ScalesIcon,
  house: HouseIcon,
  cutlery: CutleryIcon,
  /* The row that ends the Industries menu, out to the index. */
  more: MoreGridIcon,
  /* The two calculators. The gauge is the DSCR one: a ratio read off a dial. */
  calculator: CalculatorIcon,
  gauge: GaugeIcon,
} as const;

/**
 * One row in a dropdown: a tinted glyph tile beside the label.
 *
 * The tile is the chip tint with a navy glyph, 10.74:1 — the same pairing the
 * section chips use, so the menu reads as part of the page rather than as
 * chrome borrowed from somewhere else.
 *
 * An entry with no `icon` renders WITHOUT a tile rather than with a fallback
 * mark. A stand-in glyph would quietly mislabel the link; a row that is only a
 * label is obviously just a label. A test keeps every current entry supplied.
 */
function DropdownRow({ item }: { item: NavItem }) {
  const Icon = item.icon ? NAV_ICONS[item.icon as keyof typeof NAV_ICONS] : undefined;

  const inner = (
    <>
      {Icon ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--dl-pop-tint)]">
          <Icon className="h-5 w-5 text-[var(--ft-ink)]" />
        </span>
      ) : null}
      <span className="text-[0.9375rem] font-medium leading-tight">{item.label}</span>
    </>
  );

  const shape = 'flex items-center gap-3.5 rounded-xl px-3 py-2.5';

  return (
    <li>
      {item.href ? (
        <Link
          href={item.href}
          className={`${shape} text-[var(--ft-ink)] no-underline transition-colors hover:bg-[var(--ft-card)]`}
        >
          {inner}
        </Link>
      ) : (
        <span className={`${shape} cursor-default text-[var(--ft-subtle)]`} title="Coming soon">
          {inner}
        </span>
      )}
    </li>
  );
}

function DesktopItem({ item, index }: { item: NavItem; index: number }) {
  /*
   * `dl-headitem` carries the arrival animation and `--dl-i` its place in the
   * queue; both are styles-free here. On a dropdown the class goes on the <li>
   * that also holds the panel, which is deliberate — the panel is absolutely
   * positioned inside it, so trigger and panel share one transform and the
   * panel cannot be left behind in the depth.
   */
  const stagger = { '--dl-i': index } as CSSProperties;

  if (item.children) {
    const chevron = (
      <svg
        className="h-3 w-3 text-[var(--ft-subtle)] transition-transform group-hover:rotate-180"
        viewBox="0 0 12 12"
        aria-hidden="true"
      >
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );

    /*
     * Two columns once the list is long enough to need them, one otherwise.
     * Both class strings are written out because Tailwind compiles by scanning
     * source text: a template literal built from `item.children.length` would
     * produce no CSS at all.
     *
     * Funding Solutions has five entries and goes wide; Industries has two and
     * would look like a poster at that width.
     *
     * AND ONLY FROM 1280px. Measured at the three desktop widths: at 1024 —
     * which is where `lg:` turns the desktop nav on, so it is a width real
     * visitors get — a 620px panel hung off "Funding Solutions" started at
     * x = -153 and lost its first column off the side of the screen. There is
     * simply less room to the left of that trigger than the panel needs. Below
     * xl it is the narrow single column instead, which fits with room to spare.
     */
    /*
     * Pinned rows come out of the scrolling list and sit in a band of their
     * own — see NavItem.pinned. `wide` counts only the rows that actually go
     * in the grid, so a menu is not pushed into two columns by its own escape
     * hatch.
     */
    const rows = item.children.filter((child) => !child.pinned);
    const pinned = item.children.filter((child) => child.pinned);
    const wide = rows.length > 4;

    return (
      <li className="dl-headitem group relative" style={stagger}>
        {item.href ? (
          <Link
            href={item.href}
            className={`${TRIGGER_CLASS} no-underline hover:text-[var(--ft-accent)]`}
          >
            {item.label}
            {chevron}
          </Link>
        ) : (
          /*
            A BUTTON, NOT A SPAN, and that is a fix rather than a flourish.
            This branch renders the trigger for a menu with no page of its own —
            Industries and Loan Calculator, both of which lost their `href`
            deliberately. A <span> is not focusable, so the panel below could be
            opened by hover and by nothing else: the `focus-within` half of the
            selector could never fire, and the eight pages behind those two
            menus were unreachable from the header without a mouse. Measured, in
            a browser, by tabbing the header and watching focus skip them.

            A button is focusable natively and announced as something you can
            operate, and focusing it satisfies `:focus-within` on the <li>, so
            the CSS-only mechanism works unchanged.

            NO `aria-expanded`, which is the honest gap here. The menu's open
            state lives in CSS, so there is no boolean to report, and an
            attribute that always said "false" would be worse than none. Making
            it accurate means making the dropdown stateful; that is a bigger
            change than restoring reachability and has not been asked for.
          */
          <button type="button" className={`${TRIGGER_CLASS} cursor-default`}>
            {item.label}
            {chevron}
          </button>
        )}

        {/*
          CSS-only dropdown, so the whole header stays a server component but
          the menu is still reachable by keyboard — `focus-within` covers the
          users a hover-only menu locks out.

          The panel is white over a hairline and a soft shadow. On the dark
          header the raised near-black alone separates the panel from the page;
          on white there is no tonal step available, so the shadow is what does
          the separating and the border is what keeps its edge crisp.

          ANCHORED RIGHT, not left. These are the first two of four nav items in
          a right-aligned group, and a 620px panel hung from the left edge of
          "Funding Solutions" runs past the container and off the page at 1024px.
          Hanging it from the right edge grows it back towards the logo, where
          there is always room.

          `overflow-hidden` so the CTA band below picks up the panel's radius
          without repeating it.
        */}
        <div
          className={`dl-menu invisible absolute right-0 top-full z-40 ${
            wide ? 'w-[360px] xl:w-[620px]' : 'w-[360px]'
          } overflow-hidden rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-bg)] opacity-0 shadow-[0_24px_48px_-24px_rgba(16,24,40,0.28)] transition-[opacity,visibility] group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100`}
        >
          {/*
            NO SECTION HEADING above the list. The reference puts one over each
            column ("BUSINESS FINANCING OPTIONS", "INDUSTRIES"); Denis asked for
            them to be left out, and they were labelling a list whose trigger is
            six pixels above it and says the same thing.
          */}
          {/*
            THE LIST SCROLLS IF IT HAS TO, and that is not defensive coding —
            it is the fix for a menu that was measured broken.

            Industries went from six rows to seventeen on 2026-10-06. At 1024px
            the two-column layout has not kicked in yet (see `wide` above: it
            is `xl`, because a 620px panel right-anchored at this width starts
            at x = -80), so seventeen rows stacked in one column stood 1259px
            tall and hung 582px BELOW a 768px viewport. The panel is absolutely
            positioned inside a sticky header, so there was nothing to scroll
            to: the last ten trades simply could not be reached with a mouse.
            At 1280x800 it fitted with 34px to spare, which is not spare.

            The cap goes on the <ul> rather than on the panel so the call to
            action underneath stays pinned and visible rather than scrolling
            away with the list.

            `min(calc(100vh - 22rem), 34rem)`. The viewport term keeps it inside
            a short window and the rem term stops it becoming a full-height
            column on a tall one — but the SUBTRACTION is measured, not guessed,
            and it has been wrong twice. The list is not the whole panel: above
            it sit the page inset and the 74px header, and below it the pinned
            row and the call-to-action band. A plain `70vh` left the panel 11px
            below a 768px viewport; 17rem was right until the pinned band was
            added and put it 55px below. 22rem is the four of them with room,
            and at 768 the panel now finishes 25px clear.
          */}
          <ul
            className={`grid max-h-[min(calc(100vh-22rem),34rem)] gap-1 overflow-y-auto overscroll-contain p-3 ${
              wide ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {rows.map((child) => (
              <DropdownRow key={child.label} item={child} />
            ))}
          </ul>

          {/*
            The pinned rows, below the scroller and above the call to action.
            Separated by a hairline so it reads as the end of the list rather
            than as a row that failed to scroll with it.
          */}
          {pinned.length > 0 ? (
            <ul className="grid gap-1 border-t border-[var(--ft-line)] p-3">
              {pinned.map((child) => (
                <DropdownRow key={child.label} item={child} />
              ))}
            </ul>
          ) : null}

          {/*
            The band at the foot of the panel. Copy in daylight/content.ts,
            which records which line each half of it comes from.

            IT STACKS UNLESS THE PANEL IS ACTUALLY WIDE. Side by side in 360px
            the button took half the row and left the copy a four-line column
            reading "Approvals from / $15,000 to / $5,000,000, with a / soft
            credit check." Stacked, the sentence gets the full width and the
            button spans it. `xl` rather than `wide`, because a wide panel is
            still 360px below that breakpoint.
          */}
          <div
            className={`flex flex-col items-stretch gap-3 border-t border-[var(--ft-line)] bg-[var(--ft-card)] px-5 py-4 ${
              wide ? 'xl:flex-row xl:items-center xl:justify-between xl:gap-6' : ''
            }`}
          >
            <div className="min-w-0">
              <p className="text-[0.9375rem] font-semibold leading-snug text-[var(--ft-ink)]">
                {NAV_CTA.heading}
              </p>
              <p className="mt-1 text-[0.8125rem] leading-snug text-[var(--ft-muted)]">
                {NAV_CTA.body}
              </p>
            </div>
            <CtaButton
              className={`shrink-0 !px-6 !py-3 !text-[0.8125rem] ${wide ? 'xl:!w-auto' : ''}`}
            />
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="dl-headitem" style={stagger}>
      {item.external ? (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block py-6 text-sm font-semibold text-[var(--ft-ink)] no-underline hover:text-[var(--ft-accent)]"
        >
          {item.label}
        </a>
      ) : (
        <Link
          href={item.href ?? '#'}
          className="block py-6 text-sm font-semibold text-[var(--ft-ink)] no-underline hover:text-[var(--ft-accent)]"
        >
          {item.label}
        </Link>
      )}
    </li>
  );
}

export function DaylightHeader() {
  return (
    <DaylightHeaderShell>
      <div className="flex items-center gap-6 px-5 lg:px-6">
        <Link
          href="/"
          /* `dl-headmark` only raises it above the CTA — see globals.css. */
          className="dl-headmark flex shrink-0 items-center py-3 no-underline"
        >
          {/*
            The ink wordmark, not the white one the dark header uses — see
            LOCAL_IMAGES.logoDark for why this is a second file rather than a
            CSS filter over the first.
          */}
          <Image
            src={LOCAL_IMAGES.logoDark}
            alt="Nanotom Capital"
            width={190}
            height={56}
            className="h-[42px] w-auto lg:h-[48px]"
            priority
          />
        </Link>

        {/*
          `ml-auto` here and not on the CTA: it pushes the nav and the button
          right together as one group, leaving the logo alone on the left.
        */}
        <nav aria-label="Main" className="dl-headnav ml-auto hidden lg:block">
          {/*
            `--dl-i` counts from the RIGHT: the item nearest the CTA is 0 and
            leads, so the run reads right to left.
          */}
          <ul className="flex items-center gap-8">
            {NAV.map((item, i) => (
              <DesktopItem key={item.label} item={item} index={NAV.length - 1 - i} />
            ))}
          </ul>
        </nav>

        {/*
          Gold, and a rounded RECTANGLE rather than the pill it wore briefly.
          The live Nanotom Capital site sets every button that way, so the shape
          is the brand's and not this design's to reinvent — `rounded-md` comes
          from CtaButton's own base class, which is why there is no radius
          override here.
          
          It was navy for a while, on the argument that the reference reserves
          its warm colour for the one button that starts the flow. Denis wants
          the brand colour on the header instead, and the argument survives the
          change intact — it just resolves the other way: gold is now the
          primary action everywhere it appears, and navy became the secondary
          one, which is what SolidButton carries on the funding cards.

          The label is ink rather than white. That is the `.dl-surface .nc-cta`
          rule in globals.css doing its job, not a class here — white on gold is
          2.13:1.
        */}
        <div className="dl-headcta hidden shrink-0 items-center lg:flex">
          <CtaButton className="!px-8 !py-3.5 !text-sm" />
        </div>

        {/*
          Below lg the whole menu is this one button, so it takes the item
          animation at index 0 and arrives in the beat the rightmost desktop
          item would.
        */}
        <div
          className="dl-headitem ml-auto lg:hidden"
          style={{ '--dl-i': 0 } as CSSProperties}
        >
          <DaylightMobileNav />
        </div>
      </div>
    </DaylightHeaderShell>
  );
}
