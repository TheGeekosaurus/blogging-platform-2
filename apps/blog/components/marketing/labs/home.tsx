import Image from 'next/image';
import Link from 'next/link';

import { ENQUIRY_ANCHOR } from './brand';
import { HERO, LINKS, SECTIONS, SERVICES, SERVICE_MARQUEE, projectsTitle } from './content';
import { ArrowRight, SERVICE_ICONS } from './icons';
import { ArrowLink, Marquee, Panel, SectionHeader } from './primitives';
import { ClosingCta, Faq, Reasons, Stats, Testimonials, Works } from './sections';

/**
 * The Nanotom Labs homepage.
 *
 * A replica of the Figma template's Services frame, which is the page the
 * brief nominated as the homepage. Geometry is measured out of the PDF export
 * rather than estimated: the desktop artboard is 1920 wide with 48px margins
 * (an 1824px panel), 20px gutters, 880px half-cards and 430px quarter-cards;
 * the mobile artboard is 390 wide with 16px margins.
 *
 * Those two artboards disagree in three places, and each disagreement is the
 * mobile frame's own decision rather than a shortcut taken here:
 *   - the hero's image card moves below the copy instead of beside it
 *   - each service row drops its paired project gallery for a single accent
 *     "View all Projects" button
 *   - the fourth testimonial is dropped
 * Each is implemented as a breakpoint change at `lg`, so both ends match their
 * artboard and the space between them interpolates.
 *
 * WHAT LIVES HERE is the hero and the service rows with their project
 * galleries beside them, which is all that is still unique to this page. The
 * stat band, the reasons cards, the work panels, the testimonials, the FAQ and
 * the closing call are all shared and live in ./sections.tsx — the last of
 * those to move was the work, which took the place of the success stories.
 */

/**
 * The headline's first line: "More" and then a word that rolls.
 *
 * EVERY OUTCOME A LOCAL BUSINESS BUYS, IN ONE LINE'S WORTH OF SPACE. The
 * headline used to name two of them and stop. Fourteen now roll through a
 * single slot at two seconds each, so the hero says calls AND bookings AND
 * quote requests AND repeat business without spending a line on any of them.
 *
 * THE WHOLE LIST IS IN THE MARKUP AT ONCE, which is the whole reason this can
 * be a server component: the motion is a CSS translate over a one-line window
 * (`.nl-roll` in app/globals.css), so nothing here needs state, an effect, or
 * a client bundle — and a crawler sees fourteen outcomes rather than one.
 *
 * THE SLOT IS AS WIDE AS THE LONGEST WORD, because the column sizes to its
 * widest child and the window sizes to the column. That is what keeps the
 * headline from twitching sideways fourteen times a cycle, and it is also what
 * makes a long entry expensive — see the note on `rolling` in ./content.ts.
 * The visible cost is a trailing gap after the short ones; nothing sits to the
 * right of this line, so the gap is empty card rather than a hole in the
 * layout. The alternative is animating width, which reflows the headline 60
 * times a second and still twitches.
 *
 * THE WINDOW IS HIDDEN FROM ASSISTIVE TECH and replaced by a plain list of the
 * words. Left exposed, a screen reader reads the column top to bottom
 * including the duplicate, ending "...Repeat Business Contracts Calls" — and
 * the duplicate is a mechanism, not copy.
 */
function RollingOutcome() {
  const words = HERO.rolling;

  return (
    /*
     * `flex-wrap` and a slot that refuses to shrink are the safety net. Below
     * about 340px the line cannot fit at any size worth setting it in, and the
     * two failure modes are not equal: a shrinking slot CLIPS the word — the
     * window is overflow-hidden, so "Quote Requests" silently becomes "Quote
     * Reque" — while a wrap drops it to the next line intact. Same if a longer
     * outcome is added later.
     */
    <span className="flex flex-wrap items-end gap-x-[0.28em]">
      <span>{HERO.lead}</span>

      <span className="sr-only">{words.join(', ')}</span>

      <span className="nl-roll shrink-0 text-[var(--nl-accent)]" aria-hidden>
        {/*
         * The first word again at the end: the last step of the animation
         * lands on it, and that is the frame the loop restarts from. See the
         * keyframes.
         */}
        {/*
         * The count, so the CSS can make the cycle two seconds a word rather
         * than running the same loop faster every time one is added.
         */}
        <span
          className="nl-roll-track"
          style={{ ['--nl-roll-words' as string]: words.length }}
        >
          {[...words, words[0]].map((word, index) => (
            <span key={`${word}-${index}`} className="block whitespace-nowrap">
              {word}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

function Hero() {
  return (
    <section className="grid gap-5 lg:min-h-[var(--nl-hero-h)] lg:grid-cols-[minmax(0,1207fr)_minmax(0,593fr)]">
      <div className="flex min-w-0 flex-col justify-between gap-8 rounded-[var(--nl-radius-block)] bg-[var(--nl-card)] p-5 pb-4 lg:p-12 lg:pb-5">
        <div>
          {/*
           * THE SIZE IS MEASURED, not chosen, and what it is measured against
           * is the LONGEST STATE of a line that changes.
           *
           * The design's face runs 0.54 em per character; Roboto Flex at 700
           * runs about 0.65, so the artwork's 78px never fit this copy. Roboto
           * Flex's `wdth` axis would close the gap, but Google Fonts serves the
           * subset with width pinned at 100 — measured at wdth 70/80/90/100 and
           * identical each time, not assumed.
           *
           * Measured in the browser with the real variable font loaded: "MORE"
           * plus the roll's slot is 14.83em wide, the slot being as wide as
           * "ESTIMATE REQUESTS" whichever word is showing. One number for all
           * fourteen states, because the slot never resizes.
           *
           * So the line fits when the card's inner width is at least 14.83 x
           * the font size, and that inner width is what changes with the
           * viewport: 510px at 1024, 1111px at 1920. The ceilings those imply
           * are 34px and 75px — a ratio no bare `vw` can express, since a bare
           * ratio is a line through the ORIGIN and this one is not. `4vw - 9px`
           * is the line through both points, backed off far enough to keep
           * 7-10% in hand at every width in between (measured at 16 of them,
           * not interpolated).
           *
           * THE LONGEST WORD IS WHAT THE HEADLINE COSTS, and it is the only
           * thing that does. Three static lines ran at 62px; the roll took
           * that to 74.6px, and adding "Estimate Requests" to the list brought
           * it back to 67.8px, because 14.83em has to fit where 13.26em did.
           * Shorten that entry and every word grows again.
           *
           * The third line came back at no cost to any of this: it is the
           * LINE WIDTH that sets the size here, and a fixed short line under
           * the roll does not touch it. Vertically the card has the room —
           * three lines measure 224px at 1920 inside a 520px hero that also
           * holds the body copy and the marquee, with nothing clipped at any
           * width from 320 up.
           */}
          {/*
           * Fluid below `lg` too, and tighter: at 360 the card's inner width is
           * 288px and this line wants 267 of them. If a longer entry ever makes
           * it stop fitting, it wraps rather than shrinking — see the note on
           * the flex row in RollingOutcome.
           */}
          <h1 className="nl-heading text-[clamp(16px,5vw,34px)] leading-[1.1] lg:text-[clamp(30px,calc(4vw_-_9px),76px)]">
            <RollingOutcome />

            {/*
             * The static lines, stacked under the roll — mapped rather than
             * indexed, so the copy decides how many there are.
             *
             * THE CALL RIDES THE LAST ONE, which is a change the roll forced.
             * The artwork pins it to the right of the FIRST line, and that is
             * where it sat while the first line was "More Calls": two short
             * words with 500px to spare beside them. The roll's slot is as wide
             * as "Quote Requests", so that line now runs to the edge of the
             * card at any size worth setting it in — the call beside it would
             * hold the headline to about 24px at 1024, smaller than the phone.
             *
             * "More Revenue" is the short line now, so the call moves to it.
             * The composition the artwork is actually making — the call
             * anchored to the right edge INSIDE the headline block, not
             * trailing the words — is kept; it simply rides the line with room.
             */}
            {HERO.headingLines.map((line, index) =>
              index === HERO.headingLines.length - 1 ? (
                <span
                  key={line}
                  className="grid gap-y-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center xl:gap-x-8"
                >
                  <span>{line}</span>

                  <Link
                    href={ENQUIRY_ANCHOR}
                    className="group hidden shrink-0 items-center gap-3 justify-self-end xl:inline-flex"
                  >
                    <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[var(--nl-accent)] text-[var(--nl-accent)] transition-transform duration-200 group-hover:translate-x-0.5">
                      <ArrowRight className="size-6" />
                    </span>
                    <span className="nl-label whitespace-nowrap text-base text-[var(--nl-accent)]">
                      {HERO.cta}
                    </span>
                  </Link>
                </span>
              ) : (
                <span key={line} className="block">
                  {line}
                </span>
              ),
            )}
          </h1>

          {/* Mobile keeps the same call, stacked under the heading. */}
          <Link
            href={ENQUIRY_ANCHOR}
            className="group mt-6 inline-flex items-center gap-3 xl:hidden"
          >
            <span className="grid size-10 place-items-center rounded-full border border-[var(--nl-accent)] text-[var(--nl-accent)]">
              <ArrowRight className="size-4" />
            </span>
            <span className="nl-label text-sm text-[var(--nl-accent)]">{HERO.cta}</span>
          </Link>

          <p className="mt-5 max-w-[910px] text-sm leading-relaxed text-[var(--nl-muted)] lg:mt-6 lg:text-lg">
            {HERO.body}
          </p>
        </div>

        <Marquee
          items={SERVICE_MARQUEE}
          durationSeconds={38}
          className="rounded-[var(--nl-radius-control)] bg-[var(--nl-bg)] py-4 lg:py-5"
        />
      </div>

      {/*
       * NOT TINTED, unlike the image this replaced.
       *
       * The template's hero was a violet stock photograph the artwork showed as
       * a monochrome wash, so it was composited in `luminosity` against the
       * accent — which is what turned it gold with the rebrand. This image is
       * the business's own, and its colour IS the message: the map pin carries
       * Google's four brand colours and the stars are a review rating. Under
       * `luminosity` all of that collapses into one gold, and the picture stops
       * saying "Google rankings" at all.
       *
       * The dark ground behind it is the card tone rather than the accent,
       * because nothing shows through an opaque square — it only matters while
       * the bytes are in flight.
       */}
      {/*
        * No height of its own above `lg` any more: the section carries
        * --nl-hero-h and grid items stretch, so this card fills the row. It
        * used to set 520px here, which is where that number came from — and
        * which is why the other two heroes did not match it.
        */}
      <div className="relative min-h-[320px] min-w-0 overflow-hidden rounded-[var(--nl-radius-block)] bg-[var(--nl-card)]">
        <Image
          src="/nntm-labs/hero-local-search.webp"
          alt={HERO.imageAlt}
          fill
          priority
          sizes="(min-width: 1024px) 593px, 100vw"
          className="object-cover"
        />

        {/*
          One control, not two: the template's "Web Development." pill labelled
          the image as a portfolio thumbnail and this image is not one.
        */}
        <div className="absolute inset-x-0 bottom-0 p-4 lg:p-6">
          <ArrowLink label={HERO.imageCta} href="/services" variant="solid" />
        </div>
      </div>
    </section>
  );
}

function ServiceRow({ service }: { service: (typeof SERVICES)[number] }) {
  const Icon = SERVICE_ICONS[service.icon];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <article className="flex flex-col justify-between gap-5 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 lg:p-9">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-[var(--nl-radius-control)] bg-[var(--nl-raised)] text-[var(--nl-accent)] lg:size-14">
            <Icon className="size-5 lg:size-6" />
          </span>
          <h3 className="nl-heading min-w-0 text-xl break-words lg:text-2xl 2xl:text-3xl">
            {service.title}
          </h3>
        </div>

        <p className="text-sm leading-relaxed text-[var(--nl-body)] lg:text-lg">
          {service.body}
        </p>

        {/*
         * The call sits where the price used to, bottom right, rather than up
         * beside the title. That also frees the header row: it was a two-column
         * grid purely so a long service name could not push the call onto its
         * own line, and with the call gone the title has the full width.
         */}
        <div className="mt-auto hidden justify-end lg:flex">
          <ArrowLink label={LINKS.bookACall} href={ENQUIRY_ANCHOR} />
        </div>

        {/*
         * Mobile gets the same destination as a full-width button, which is the
         * treatment the mobile artboard gives it. It used to read "View all
         * Projects" while pointing at the enquiry form — a label that described
         * neither where it went nor what it did.
         */}
        <Link
          href={ENQUIRY_ANCHOR}
          className="nl-label flex w-full items-center justify-center rounded-[var(--nl-radius-control)] bg-[var(--nl-accent)] px-5 py-3.5 text-xs text-[#0f0f0f] lg:hidden"
        >
          {LINKS.bookACall}
        </Link>
      </article>

      {/* The paired gallery, desktop only — the mobile frame has no equivalent. */}
      <article className="hidden flex-col gap-4 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-6 lg:flex">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <h3 className="nl-heading text-xl 2xl:text-2xl">{projectsTitle(service)}</h3>
          <div className="justify-self-end">
            <ArrowLink label={LINKS.viewAll} />
          </div>
        </header>

        <div className="grid flex-1 grid-cols-2 gap-5">
          {service.projects.map((project) => (
            <div
              key={project.src}
              className="relative isolate overflow-hidden rounded-[var(--nl-radius-block)] bg-[var(--nl-line-strong)]"
            >
              <Image
                src={project.src}
                alt={project.alt}
                fill
                sizes="392px"
                className="object-cover"
              />
              {/*
                * A scrim under the label, because the label is white and the
                * artwork underneath is whatever the work looked like.
                *
                * The template's eight screenshots were all dark, so white type
                * sat on them unaided; the first real one is a collage of a
                * mostly-white website and "OPEN PROJECT" all but disappeared
                * into it. A gradient is the fix rather than a darker label:
                * the next real screenshot could as easily be dark, and this
                * holds either way.
                */}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/95 via-black/75 to-transparent"
                aria-hidden
              />

              {/*
                * Linked only where there is a case study to open — see the
                * note on `href` in ./content.ts. The rest render as a span,
                * which is what ArrowLink does without one.
                */}
              <div className="absolute inset-x-0 bottom-0 p-4">
                <ArrowLink label={LINKS.openProject} href={project.href} variant="solid" />
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

export function LabsHome() {
  return (
    <div className="px-4 pb-6 pt-4 lg:px-[50px] lg:pt-5">
      <Hero />
      <Stats enquiryAnchor={ENQUIRY_ANCHOR} />
      <Reasons />

      <Panel className="mt-[var(--nl-section-gap)]">
        <SectionHeader title={SECTIONS.services} />
        <div className="mt-5 flex flex-col gap-5">
          {SERVICES.map((service) => (
            <ServiceRow key={service.title} service={service} />
          ))}
        </div>
      </Panel>

      {/*
       * Our Work, where the success stories were. Shared with /services — see
       * the note on `Works` in ./sections.tsx.
       */}
      <Works enquiryAnchor={ENQUIRY_ANCHOR} />

      <Testimonials />
      <Faq />
      <ClosingCta enquiryAnchor={ENQUIRY_ANCHOR} />
    </div>
  );
}
