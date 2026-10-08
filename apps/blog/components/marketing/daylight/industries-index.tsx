import Link from "next/link";

import { INDUSTRIES } from "../brand";
import {
  BoltIcon,
  CarIcon,
  CutleryIcon,
  FanIcon,
  HardHatIcon,
  HouseIcon,
  LedgerIcon,
  PulseIcon,
  ScalesIcon,
  ShearsIcon,
  ShieldIcon,
  SpineIcon,
  StorefrontIcon,
  ToothIcon,
  TreeIcon,
  WheatIcon,
} from "./icons";
import { CONTAINER, Chip } from "./primitives";

/**
 * /industries on Nanotom Capital — the index the menu's "And More" row points at.
 *
 * DELIBERATELY PLAIN. Denis, 2026-10-06: "have an 'And More' option always at
 * the end, going to the industries page directly. Just create the page with the
 * slug, we'll design the page later." So this is the slug made real and nothing
 * more: a heading and the full grid of trades.
 *
 * It is not a stub, though, and that distinction is the whole design decision
 * here. The alternative — a heading-only STUB_PAGES entry — would have been
 * `noindex` and empty, and this path is linked from the header dropdown and the
 * footer of every page on the site. A page every page links to cannot be blank.
 * A grid of sixteen links is the least this can be while still being worth
 * arriving at, and it is the part a design pass would keep anyway.
 *
 * WHAT IT IS MISSING, so the next person does not have to guess: a hero, copy
 * saying what Nanotom does for an industry it has no page for, and a route for
 * someone whose trade is not listed. That last one matters most — the row that
 * leads here says "And More", and right now the page answers with "here are the
 * ones we have" rather than with anything for the reader who clicked it
 * precisely because their trade was not in the list.
 *
 * It reads INDUSTRIES rather than INDUSTRIES_MENU: the menu list ends with the
 * row that points HERE, and a page linking to itself at the end of its own grid
 * is a loop with no exit.
 */
const ICONS = {
  storefront: StorefrontIcon,
  "hard-hat": HardHatIcon,
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
} as const;

export function DaylightIndustriesIndex() {
  return (
    /* Header and footer come from the root layout — see the note there. */
    <div className="dl-surface">
      <section
        aria-labelledby="dl-industries"
        className="border-b border-[var(--ft-line)]"
      >
        <div
          className={`${CONTAINER} flex flex-col items-start gap-5 py-14 lg:py-20`}
        >
          <Chip>Industries</Chip>
          <h1
            id="dl-industries"
            className="max-w-[20ch] font-[family-name:var(--font-headline)] text-[clamp(2.25rem,5vw,3.25rem)] font-bold leading-[1.08] tracking-[-0.01em] text-[var(--ft-ink)]"
          >
            Funding, Built Around How Your Trade Actually Works.
          </h1>
          <p className="max-w-[58ch] text-[1.0625rem] leading-[1.7] text-[var(--ft-muted)]">
            Every one of the nine funding options is open to every business.
            What changes by trade is which of them fits, and why — so each page
            below is written for one.
          </p>
        </div>
      </section>

      <section aria-label="All industries">
        {/*
          CONTAINER ON A WRAPPER, NOT ON THE <ul>. It carries horizontal
          padding, and the list paints --ft-line as its own background so the
          1px grid gaps show through — put the two on one element and that
          padding becomes a 32px band of line colour inside the border, which
          is what it looked like the first time.
        */}
        <div className={`${CONTAINER} my-14 lg:my-20`}>
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-line)] sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((industry) => {
              const Icon = ICONS[industry.icon as keyof typeof ICONS];
              return (
                <li key={industry.href} className="bg-[var(--ft-bg)]">
                  <Link
                    href={industry.href}
                    className="flex h-full items-center gap-4 px-6 py-6 no-underline transition-colors hover:bg-[var(--ft-card)]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--dl-pop-tint)]">
                      {Icon ? (
                        <Icon className="h-5 w-5 text-[var(--ft-ink)]" />
                      ) : null}
                    </span>
                    <span className="font-[family-name:var(--font-headline)] text-[1.0625rem] font-semibold leading-tight text-[var(--ft-ink)]">
                      {industry.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
