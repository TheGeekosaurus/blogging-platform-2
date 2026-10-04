import { HERO } from '../ft/content';
import { AmountSlider } from './amount-slider';
import { CONTAINER } from './primitives';

/**
 * The Daylight hero: badge, headline, standfirst, the amount card, three stats.
 *
 * ITS OWN FILE BECAUSE TWO PAGES WEAR IT. Denis asked for /funding-solutions to
 * have "the same hero as main, but keep the headline on this current page", and
 * the honest reading of "the same hero" is the same component rather than a
 * second copy that looks the same on the day it is written. Everything that is
 * the same on both — the rating badge, the amount card, the stat row, the
 * accent on the last word — is here once.
 *
 * WHAT VARIES IS THREE STRINGS, which is exactly what the two pages disagree
 * about:
 *
 *   heading   the homepage's promise, or the loans page's
 *   lead      an optional bold opener. The homepage runs the 551-FICO line
 *             ahead of its body copy; the loans page has no equivalent and
 *             passes nothing rather than being given something to say.
 *   body      the standfirst
 *
 * Nothing else is a prop. A `showStats` or a `badge` flag would be the first
 * step back towards two heroes, and the point of this file is that there is
 * one.
 */
export function DaylightHero({
  heading,
  lead,
  body,
  id = 'dl-hero',
}: {
  heading: string;
  lead?: string;
  body: string;
  id?: string;
}) {
  /*
   * The last word carries the accent colour, as in the reference. Split off the
   * end of the string rather than carrying a second field in content.ts: the
   * dark pages render these headings whole, and a `headingAccent` beside each
   * would be a field one design always ignores.
   *
   * It reads well on both of the headings that use it today — "…Needs To
   * *Grow*" and "…One *Application.*" — because both end on the word the
   * sentence is actually about. A heading ending on a preposition would not,
   * which is a thing to check when a third page takes this hero.
   */
  const words = heading.split(' ');
  const lead_ = words.slice(0, -1).join(' ');
  const accent = words[words.length - 1];

  return (
    <section aria-labelledby={id} className="border-b border-[var(--ft-line)]">
      <div
        className={`${CONTAINER} grid items-center gap-12 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:py-20`}
      >
        <div className="flex flex-col items-start gap-7">
          {/*
            The rating badge. Dark blue on a cyan tint at 10.45:1 — the cyan
            itself is a fill here, never the text, for the reason set out over
            the palette in globals.css.

            Built from HERO.stats rather than written out, so the day the rating
            changes it changes in one place and every page carrying this hero
            follows.
          */}
          <p className="rounded-lg bg-[var(--dl-pop-tint)] px-4 py-2 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-[var(--ft-ink)]">
            {HERO.stats[2]?.value}-Star Average Rating
          </p>

          <h1
            id={id}
            className="max-w-[13ch] font-[family-name:var(--font-headline)] text-[clamp(2.75rem,6.2vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.02em] text-[var(--ft-ink)]"
          >
            {lead_}{' '}
            <span className="text-[var(--dl-display)]">{accent}</span>
          </h1>

          <p className="max-w-[54ch] text-[clamp(1.0625rem,1.5vw,1.1875rem)] leading-[1.7] text-[var(--ft-muted)]">
            {lead ? (
              <>
                <strong className="font-semibold text-[var(--ft-ink)]">{lead}</strong>{' '}
              </>
            ) : null}
            {body}
          </p>
        </div>

        {/* The amount card. A client island; see ./amount-slider. */}
        <AmountSlider />
      </div>

      {/*
        The three figures, given the full width under both columns rather than
        crowded into the left one.
      */}
      <dl className="border-t border-[var(--ft-line)]">
        <div className={`${CONTAINER} grid grid-cols-3`}>
          {HERO.stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`py-8 pr-4 lg:py-10 ${i > 0 ? 'border-l border-[var(--ft-line)] pl-6 lg:pl-10' : ''}`}
            >
              <dd className="text-[clamp(1.5rem,3vw,2rem)] font-semibold leading-none text-[var(--ft-ink)]">
                {stat.value}
                {/*
                  `pre-wrap`, not `pre`. The unit carries a LEADING SPACE —
                  " Stars" — which is why it cannot be plain text, and `pre`
                  kept that space at the cost of forbidding a line break at it:
                  at 390px the three columns are 76px wide and "4.7 Stars"
                  wanted 100, so it overflowed its cell by 24px onto the rule
                  beside it. `pre-wrap` keeps the space and lets the unit drop
                  to a second line instead.
                */}
                <span className="whitespace-pre-wrap text-[var(--ft-accent)]">{stat.unit}</span>
              </dd>
              <dt className="mt-3 max-w-[22ch] text-sm text-[var(--ft-muted)] lg:text-base">
                {stat.label}
              </dt>
            </div>
          ))}
        </div>
      </dl>
    </section>
  );
}
