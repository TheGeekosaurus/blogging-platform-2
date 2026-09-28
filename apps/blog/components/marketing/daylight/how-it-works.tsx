import { HOW_IT_WORKS } from '../ft/content';
import { CONTAINER, Chip, CtaButton } from './primitives';

/**
 * How It Works, as three floating cards on the dark region.
 *
 * THE FIRST FORK OF A SHARED SECTION, and worth being clear about why. Every
 * other section on this page is imported whole from ft/shared-sections, because
 * they paint from --ft-* tokens and `.dl-surface` re-themes them for free. This
 * one could not be: Denis asked for the steps as cards on navy, and that is a
 * change of STRUCTURE, not of colour. The shared component draws a numbered
 * timeline with a connecting hairline running between the numerals, which is a
 * different thing from three separated cards — there is no token that turns one
 * into the other.
 *
 * So the dark homepage keeps its timeline, untouched, and this is Daylight's.
 * The copy is still HOW_IT_WORKS from ft/content.ts, so the two say the same
 * thing and always will.
 *
 * WHAT WENT WITH THE TIMELINE: the sweep. The shared version animates the
 * numerals and the connecting rule in sequence, which only means anything when
 * there is a line for the sweep to travel along. Separated cards have no line,
 * so the animation is gone rather than reproduced as three numbers blinking
 * independently — and the page ships one less thing that moves.
 *
 * The heading sits ON the navy rather than in a `SectionHead` band. SectionHead
 * paints --ft-band, which would put a light stripe through the middle of the
 * dark region; the reference puts its heading straight on the dark ground.
 */
export function DaylightHowItWorks() {
  return (
    <section aria-labelledby="dl-how" className="pb-16 pt-14 lg:pb-24 lg:pt-20">
      <div className={CONTAINER}>
        {/*
          Both headings, in the order the shared component uses them: the
          section's own title under the chip, and the steps' title over the
          cards. Keeping the hierarchy matters more than the saving — dropping
          `stepsHeading` to avoid two lines would quietly delete a string from
          content.ts that the dark homepage still renders, and the two pages are
          meant to say the same thing.
        */}
        <div className="flex flex-col items-center gap-5 text-center">
          <Chip>{HOW_IT_WORKS.label}</Chip>
          <h2
            id="dl-how"
            className="max-w-[20ch] font-[family-name:var(--font-headline)] text-[clamp(1.875rem,4vw,2.875rem)] font-bold leading-[1.12] text-[var(--ft-ink)]"
          >
            {HOW_IT_WORKS.heading}
          </h2>
          <p className="max-w-[40ch] text-[1.0625rem] leading-[1.6] text-[var(--ft-muted)]">
            {HOW_IT_WORKS.stepsHeading}
          </p>
        </div>

        <ol className="mt-12 grid gap-6 md:grid-cols-3 lg:mt-16 lg:gap-8">
          {HOW_IT_WORKS.steps.map((step, i) => (
            <li key={step.title} className="dl-card flex flex-col gap-5 p-8 lg:p-10">
              {/*
                The numeral is a filled disc rather than the timeline's large
                outline figure. On a card with no line running through it the
                big numeral had nothing to anchor to and read as decoration;
                as a disc it reads as "step one of three".

                Navy on cyan is 6.12:1. It is aria-hidden because the list is
                already an <ol> — a screen reader counts the items itself, and
                announcing "01" before every title says it twice.
              */}
              <span
                aria-hidden="true"
                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--dl-pop)] font-[family-name:var(--font-headline)] text-lg font-bold text-[var(--dl-deep)]"
              >
                {String(i + 1).padStart(2, '0')}
              </span>

              <div>
                <h3 className="text-xl font-semibold leading-[1.25] text-[var(--ft-ink)]">
                  {step.title}
                </h3>
                <p className="mt-3 text-[1.0625rem] leading-[1.55] text-[var(--ft-muted)]">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex justify-center">
          <CtaButton />
        </div>
      </div>
    </section>
  );
}
