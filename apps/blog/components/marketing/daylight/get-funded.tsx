import { HighLevelForm } from '../highlevel-form';
import { GET_FUNDED } from '../ft/content';
import { CONTAINER, Chip } from './primitives';

/**
 * DAYLIGHT — /get-funded in white.
 *
 * The light twin of ft/get-funded.tsx, built the same way every other converted
 * page was: a parallel file rather than a theme flag, so the dark one stays as
 * the revert path. Denis asked to rebrand the page's colours; the structure is
 * unchanged, because the structure was already right — this is the bottom of
 * the funnel and its only job is to not get in the way of the survey.
 *
 * THE SURVEY IS A DARK RECTANGLE AND NOTHING HERE CAN CHANGE THAT. This is the
 * one honest constraint on the page, so it is worth writing down precisely
 * rather than discovering again.
 *
 * The embed is an iframe on link.mailsengr.com. Fetched and read rather than
 * assumed, its document carries two things from Denis's GoHighLevel account:
 *
 *   html, body   a background-image, `cover` and fixed, pointing at a 1000x750
 *                PNG that is a FLAT #141414 — every pixel of it.
 *   the card     `bgColor: "141414"` in the survey's own config payload.
 *
 * So the whole frame is one solid near-black field. Cross-origin CSS cannot be
 * reached from here, and `X-Frame-Options` has nothing to do with it: the fix
 * is two colour pickers in Denis's form builder, not code in this repo.
 *
 * WHICH LEAVES ONE REAL CHOICE: let a black rectangle sit in the middle of a
 * white page looking like a failed image, or frame it so it reads as a panel
 * somebody meant. The wrapper below paints the SAME #141414 and rounds it, so
 * the frame and the iframe are continuous and the result is one dark card on a
 * light page — the shape the homepage's navy band already uses.
 *
 * It is not a brand colour and it should not become one. The moment that
 * background and card are set to #0B2D72 in HighLevel, the hex here changes
 * with them and the page is fully on palette.
 */
const SURVEY_INK = '#141414';

export function DaylightGetFunded() {
  return (
    /* Header and footer come from the root layout — see the note there. */
    <div className="dl-surface">
      <section aria-labelledby="dl-get-funded" className={`${CONTAINER} py-16 lg:py-24`}>
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Chip>{GET_FUNDED.eyebrow}</Chip>

          {/* Bold, like every other section headline in Daylight — see the note
              over SectionIntro in ./primitives. */}
          <h1
            id="dl-get-funded"
            className="mt-6 font-[family-name:var(--font-headline)] text-[clamp(2.25rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.01em] text-[var(--ft-ink)]"
          >
            {GET_FUNDED.heading}
          </h1>

          <p className="mt-5 text-[1.125rem] leading-relaxed text-[var(--ft-muted)] sm:text-[1.25rem]">
            {GET_FUNDED.sub}
          </p>
        </div>

        {/*
          The survey, in a card the same colour as itself.

          `p-2` is a hairline of frame rather than a margin: it is what lets the
          rounded corners read, since the iframe inside is a square-cornered
          document that `overflow-hidden` alone would clip a little raggedly at
          the radius.

          The shadow is the tinted navy the rest of Daylight uses rather than a
          neutral black — a black shadow under a black card is invisible, and
          the card needs to look placed on the page rather than cut out of it.
        */}
        <div
          className="mx-auto mt-12 max-w-3xl overflow-hidden rounded-2xl p-2 shadow-[0_24px_48px_-24px_rgba(11,45,114,0.45)]"
          style={{ backgroundColor: SURVEY_INK }}
        >
          <HighLevelForm eager />
        </div>

        {/*
          THE ONE LINE OF REASSURANCE, which the dark page did not need and this
          one does. On a white page the dark block above reads as a third-party
          widget — because it is one — and a visitor halfway through ten
          questions about their revenue should be told whose form it is.

          Same two facts the hero's amount card closes with, in the same order,
          so the promise a visitor arrived on is the promise they see at the
          point of answering.
        */}
        <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-[var(--ft-muted)]">
          Soft credit check only. No obligation.
        </p>
      </section>
    </div>
  );
}
