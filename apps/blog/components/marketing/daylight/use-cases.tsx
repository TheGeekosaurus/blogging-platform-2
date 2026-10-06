import { USE_CASES } from '../ft/content';
import {
  CashFlowIcon,
  ConsolidateIcon,
  EquipmentIcon,
  ExpandIcon,
  HiringIcon,
  InventoryIcon,
  MarketingIcon,
  PayrollIcon,
} from '../ft/icons';
import { CONTAINER, SectionIntro } from './primitives';

/**
 * Use of funds — the same eight cells, with the header moved onto the artwork.
 *
 * A FORK, AND ONLY FOR WHERE THE HEADER SITS. The shared version opens with
 * SectionHead, which paints a full-bleed band across the page above the
 * section; Denis asked for that band to go and the header to move down into the
 * section it introduces. That is a change of structure, and the shared
 * component is rendered by the LIVE dark homepage, so it could not be made
 * there. The grid below is reproduced exactly, hover behaviour and all.
 *
 * THE HEADING IS WHITE BECAUSE OF WHERE IT NOW STANDS, not as a style choice.
 * Moving it into the section puts it on the band artwork rather than on a pale
 * banner, and it takes that colour from --ft-ink, which `.dl-art` re-points —
 * so SectionIntro needed no knowledge of this section, and the grid below gets
 * its navy ink back through `.dl-panel`. Both are in globals.css.
 *
 * THE CHIP STAYS LIGHT BLUE with dark text, as asked. It re-points --ft-ink on
 * itself, so it is unaffected by the white the section sets around it.
 *
 * THE CELL ICONS ARE GOLD, also at Denis's request, and the same reasoning
 * applies as to the step numerals: #E0A840 on the white cells is 2.13:1, which
 * would matter if the icon carried the meaning. It does not — every cell prints
 * its label directly underneath, so the mark is decoration beside a word rather
 * than a word of its own.
 */

const USE_CASE_ICONS = {
  inventory: InventoryIcon,
  payroll: PayrollIcon,
  expand: ExpandIcon,
  marketing: MarketingIcon,
  cashflow: CashFlowIcon,
  equipment: EquipmentIcon,
  hiring: HiringIcon,
  consolidate: ConsolidateIcon,
} as const;

export function DaylightUseCases() {
  return (
    <section aria-labelledby="dl-uses">
      <div className={`${CONTAINER} py-14 lg:py-20`}>
        <SectionIntro
          id="dl-uses"
          label={USE_CASES.label}
          heading={USE_CASES.heading}
          className="mb-12 lg:mb-14"
        />

        {/*
          `dl-panel` restores the light tokens inside the grid. Without it the
          white --ft-ink this section sets for its heading would follow into the
          cells and print white labels on white cells.
        */}
        <ul className="dl-panel grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-line)] lg:grid-cols-4">
          {USE_CASES.items.map((item) => {
            const Icon = USE_CASE_ICONS[item.icon];
            return (
              <li
                key={item.label}
                /*
                 * Hover lifts the cell rather than linking it — these are
                 * statements about what funding is for, not destinations, so
                 * the cursor stays default and nothing here is focusable.
                 *
                 * The transition names `scale`, NOT `transform`: Tailwind v4's
                 * `scale-*` compiles to the standalone `scale` property, so a
                 * `transition-[transform,...]` here would animate nothing and
                 * the zoom would snap while the colour faded.
                 */
                className="ft-use-case relative flex flex-col items-center gap-4 bg-[var(--ft-bg)] px-5 py-10 text-center transition-[scale,background-color] duration-300 ease-out hover:z-10 hover:scale-[1.06] hover:bg-[var(--ft-card)]"
              >
                <Icon className="h-8 w-8 text-[var(--dl-gold)]" />
                <span className="text-[1.0625rem] leading-[1.4] text-[var(--ft-ink)]">
                  {item.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
