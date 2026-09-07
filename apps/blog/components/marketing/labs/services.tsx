import Image from 'next/image';
import Link from 'next/link';

import { SERVICES_ENQUIRY_ANCHOR } from './brand';
import { LINKS, SECTIONS, SERVICE_MARQUEE } from './content';
import { ArrowRight, SERVICE_ICONS, WORK_ICONS } from './icons';
import { ArrowLink, DiscLink, Marquee, Panel, SectionHeader, SectionLink } from './primitives';
import { ClosingCta, Faq, Stats, Testimonials } from './sections';
import {
  REASONS,
  SERVICES_HERO,
  SERVICES_LINKS,
  SERVICES_SECTIONS,
  SERVICE_CARDS,
  WORKS,
} from './services-content';

/**
 * The Nanotom Labs Services page.
 *
 * A replica of the template's second Services frame, measured out of the PDF
 * export rather than estimated. The desktop artboard is the same 1920 canvas
 * the homepage uses, with the same 48px margins (an 1824px panel) and 20px
 * gutters, so the two pages share a grid as well as four sections:
 *
 *   y=161   hero            1207 + 593, split 20
 *   y=771   stat band       six 280x150 tiles          (shared)
 *   y=1081  reasons         four 430x398 cards
 *   y=1815  services        four 880x395 cards, 2x2
 *   y=2963  our works       three 579.3 columns per project
 *   y=4221  testimonials    four 430x404 cards          (shared)
 *   y=4975  FAQ             1054 + 746                  (shared)
 *   y=6151  closing call    1821x305 accent band        (shared)
 *
 * The four marked shared are imported from ./sections.tsx, which is where they
 * moved when this page proved they were not the homepage's.
 *
 * NO MOBILE ARTBOARD WAS SUPPLIED for this frame — the homepage had both a
 * 1920 and a 390 export to match. Every breakpoint below `lg` here is
 * therefore an inference from the homepage's mobile frame rather than a
 * transcription: cards stack, the hero's screenshot moves under the copy, and
 * the section links move out of the headers (`SectionLink`). If a mobile
 * export of this frame turns up and disagrees, the export wins.
 */

/**
 * The hero's decorative ring and disc, which overlap the screenshot's top
 * right corner.
 *
 * One SVG rather than two positioned elements: the arc and the disc are
 * concentric in the artwork (a 76px-radius ring around an 88px disc, the ring
 * open on the right where the disc overflows it), and expressing that as a
 * bordered div plus an absolutely positioned circle makes their alignment
 * depend on two independent offsets that drift the moment either size changes.
 *
 * `strokeDasharray` cuts the gap: the circumference is 2π·60 ≈ 377 units, of
 * which 270 are drawn, and the rotation puts the 107-unit gap at three
 * o'clock.
 */
function HeroBadge() {
  return (
    <span className="pointer-events-none absolute right-3 top-6 block size-[104px] lg:right-[13px] lg:top-[31px] lg:size-[136px]">
      <svg viewBox="0 0 160 160" className="size-full" aria-hidden focusable="false">
        <circle
          cx="80"
          cy="80"
          r="60"
          fill="none"
          stroke="var(--nl-accent)"
          strokeWidth="3"
          strokeDasharray="270 107"
          transform="rotate(51 80 80)"
        />
        <circle cx="95" cy="80" r="42" fill="var(--nl-accent)" />
        {/*
          The same glyph ArrowUpRight draws, inlined and scaled by hand rather
          than nested as a second <svg>: a nested svg sized with a utility
          class inherits the CSS box model, not this viewBox, so it lands at
          whatever pixel size the class says instead of 43 user units.
        */}
        <path
          d="M8 16 16 8M9.5 8H16v6.5"
          transform="translate(73.4 58.4) scale(1.8)"
          fill="none"
          stroke="#0f0f0f"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function Hero() {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1207fr)_minmax(0,593fr)]">
      <div className="flex min-w-0 flex-col justify-between gap-8 rounded-[var(--nl-radius-block)] bg-[var(--nl-card)] p-5 pb-4 lg:p-12 lg:pb-5">
        <div>
          {/*
           * The same ceiling and the same reasoning as the homepage's hero —
           * see the long note there. In short: the design's face runs 0.54em
           * per character against Roboto Flex's 0.65, and Google Fonts serves
           * the variable subset with its `wdth` axis pinned at 100, so the
           * artwork's 78px would push the call below the headline and break
           * the composition the design is built around. What is preserved is
           * the composition: two lines, the call anchored right of the first.
           */}
          <h1 className="nl-heading text-[28px] leading-[1.15] lg:text-[clamp(36px,3.3vw,62px)] lg:leading-[1.1]">
            <span className="grid gap-y-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-8">
              <span>{SERVICES_HERO.headingLines[0]}</span>

              <Link
                href={SERVICES_ENQUIRY_ANCHOR}
                className="group hidden shrink-0 items-center gap-3 justify-self-end lg:inline-flex"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[var(--nl-accent)] text-[var(--nl-accent)] transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="size-6" />
                </span>
                <span className="nl-label whitespace-nowrap text-base text-[var(--nl-accent)]">
                  {SERVICES_HERO.cta}
                </span>
              </Link>
            </span>

            <span className="block">{SERVICES_HERO.headingLines[1]}</span>
          </h1>

          {/* Mobile keeps the same call, stacked under the heading. */}
          <Link
            href={SERVICES_ENQUIRY_ANCHOR}
            className="group mt-6 inline-flex items-center gap-3 lg:hidden"
          >
            <span className="grid size-10 place-items-center rounded-full border border-[var(--nl-accent)] text-[var(--nl-accent)]">
              <ArrowRight className="size-4" />
            </span>
            <span className="nl-label text-sm text-[var(--nl-accent)]">
              {SERVICES_HERO.cta}
            </span>
          </Link>

          <p className="mt-5 max-w-[910px] text-sm leading-relaxed text-[var(--nl-muted)] lg:mt-6 lg:text-lg">
            {SERVICES_HERO.body}
          </p>
        </div>

        <Marquee
          items={SERVICE_MARQUEE}
          durationSeconds={38}
          className="rounded-[var(--nl-radius-control)] bg-[var(--nl-bg)] py-4 lg:py-5"
        />
      </div>

      {/*
       * NOT TINTED, unlike the homepage's hero photograph.
       *
       * That one is decorative stock imagery and the artwork shows it as a
       * monochrome wash, so it is composited in `luminosity` against the
       * accent. This is a screenshot of a piece of work, captioned as such,
       * and the artwork leaves it in its own colours — as it does the two
       * project screenshots further down the page. Recolouring a portfolio
       * thumbnail would misrepresent what was delivered.
       */}
      <figure className="flex min-w-0 flex-col overflow-hidden rounded-[var(--nl-radius-block)] bg-[var(--nl-card)]">
        <div className="relative aspect-[593/465] w-full">
          <Image
            src={SERVICES_HERO.image.src}
            alt={SERVICES_HERO.image.alt}
            fill
            priority
            sizes="(min-width: 1024px) 593px, 100vw"
            className="object-cover"
          />
          <HeroBadge />
        </div>

        <figcaption className="bg-[var(--nl-raised)] px-5 py-5 lg:px-7 lg:py-6">
          <p className="nl-heading text-lg lg:text-2xl">{SERVICES_HERO.imageTitle}</p>
          <p className="mt-1 text-sm text-[var(--nl-body)] lg:text-base">
            {SERVICES_HERO.imageTag}
          </p>
        </figcaption>
      </figure>
    </section>
  );
}

function Reasons() {
  return (
    <Panel className="mt-[var(--nl-section-gap)]">
      <SectionHeader title={SERVICES_SECTIONS.reasons} />

      {/*
        * Four across only from `xl`.
        *
        * The artwork's four 430px cards are a 1920 layout. Held at four all
        * the way down, each card is 208px wide at 1024 — narrower than the
        * word "Technologies" set at the artwork's 30px, which pushed the whole
        * PAGE into horizontal scroll rather than merely looking tight. Two up
        * between `sm` and `xl` is the same cards at a readable measure.
        */}
      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {REASONS.map((reason) => (
          <article
            key={reason.title}
            className="flex flex-col justify-between gap-6 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 lg:p-10"
          >
            <div>
              {/*
                * The size steps with the column count for the same reason:
                * 30px is the artwork's figure at 1920, where the card is
                * 430px. `break-words` is the backstop — a single unbreakable
                * word longer than its column is the one thing that escapes a
                * fluid size, and it escapes as page-wide horizontal scroll.
                */}
              <h3 className="nl-heading text-xl leading-snug break-words lg:text-2xl 2xl:text-3xl">
                {reason.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[var(--nl-body)] lg:mt-6">
                {reason.body}
              </p>
            </div>

            {/* Unlinked: the design gives these four no destination. */}
            <DiscLink label={SERVICES_LINKS.learnMore} />
          </article>
        ))}
      </div>
    </Panel>
  );
}

function ServiceCards() {
  return (
    <Panel className="mt-[var(--nl-section-gap)]">
      <SectionHeader title={SECTIONS.services} />

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {SERVICE_CARDS.map((service) => {
          const Icon = SERVICE_ICONS[service.icon];

          return (
            <article
              key={service.title}
              className="flex flex-col gap-5 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 lg:gap-8 lg:p-10"
            >
              {/*
               * Two columns rather than a wrapping flex row, for the reason
               * the homepage's service rows are: with `flex-wrap` a title as
               * long as "Mobile App Development" pushes "Book A Call" onto its
               * own line and the card loses its right edge.
               */}
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-[var(--nl-radius-control)] border border-[var(--nl-line-strong)] bg-[var(--nl-raised)] text-[var(--nl-accent)] lg:size-[66px]">
                    <Icon className="size-5 lg:size-7" />
                  </span>
                  <h3 className="nl-heading min-w-0 text-xl break-words lg:text-2xl 2xl:text-3xl">
                    {service.title}
                  </h3>
                </div>

                <div className="hidden justify-self-end lg:block">
                  <ArrowLink label={LINKS.bookACall} href={SERVICES_ENQUIRY_ANCHOR} />
                </div>
              </div>

              <p className="text-sm leading-relaxed text-[var(--nl-body)] lg:text-lg">
                {service.body}
              </p>

              <p className="nl-heading mt-auto text-lg lg:text-right lg:text-3xl">
                {service.price}
              </p>

              {/* Mobile replaces the header's call with a full-width button. */}
              <Link
                href={SERVICES_ENQUIRY_ANCHOR}
                className="nl-label flex w-full items-center justify-center rounded-[var(--nl-radius-control)] bg-[var(--nl-accent)] px-5 py-3.5 text-xs text-[#0f0f0f] lg:hidden"
              >
                {LINKS.bookACall}
              </Link>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

/**
 * One project, in its own panel.
 *
 * Three equal columns in the artwork — 579.3px each with 20px gutters inside
 * an 1822px panel — so `lg:grid-cols-3` rather than fractions. The right
 * column is itself a stack of three: the technology list, the team strip, and
 * a full-width call, at the artwork's 225 / 90 / 63 heights.
 */
function WorkPanel({ work }: { work: (typeof WORKS)[number] }) {
  const Icon = WORK_ICONS[work.icon];

  return (
    <Panel>
      <div className="grid gap-5 lg:grid-cols-3">
        <article className="flex flex-col gap-6 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 lg:p-10">
          {/*
            * Stacked below `sm`, side by side above it.
            *
            * Held side by side at 390 the title column is 112px — narrower
            * than the word "Ecommerce" set at 18px — so "A-Aura Ecommerce"
            * broke mid-word. Dropping the control to its own line is what the
            * mobile frame does with the service cards' "Book A Call" anyway.
            */}
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-[var(--nl-radius-control)] border border-[var(--nl-line-strong)] bg-[var(--nl-raised)] text-[var(--nl-accent)] lg:size-[66px]">
                <Icon className="size-5 lg:size-7" />
              </span>
              <h3 className="nl-heading min-w-0 text-lg break-words lg:text-xl 2xl:text-2xl">
                {work.title}
              </h3>
            </div>
            <div className="sm:justify-self-end">
              <ArrowLink label={SERVICES_LINKS.details} />
            </div>
          </div>

          <dl className="flex flex-wrap gap-3">
            {[
              { term: SERVICES_LINKS.category, value: work.category },
              { term: SERVICES_LINKS.timeTaken, value: work.timeTaken },
            ].map((meta) => (
              <div
                key={meta.term}
                className="flex items-center gap-2 rounded-full bg-[var(--nl-raised)] px-4 py-2.5"
              >
                <dt className="text-xs text-[var(--nl-muted)] lg:text-sm">{meta.term}</dt>
                <span className="size-1 rounded-full bg-[var(--nl-accent)]" aria-hidden />
                <dd className="text-xs text-[var(--nl-ink)] lg:text-sm">{meta.value}</dd>
              </div>
            ))}
          </dl>

          <p className="text-sm leading-relaxed text-[var(--nl-body)]">{work.body}</p>
        </article>

        <div className="relative min-h-[220px] overflow-hidden rounded-[var(--nl-radius-card)] bg-[var(--nl-line-strong)] lg:min-h-0">
          <Image
            src={work.image.src}
            alt={work.image.alt}
            fill
            sizes="(min-width: 1024px) 580px, 100vw"
            className="object-cover"
          />
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex-1 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 lg:p-10">
            <h4 className="nl-label text-xs text-[var(--nl-ink)] lg:text-sm">
              {SERVICES_LINKS.technologiesUsed}
            </h4>
            <ul className="mt-4 flex flex-wrap gap-2 lg:mt-6">
              {work.technologies.map((technology) => (
                <li
                  key={technology}
                  className="rounded-full bg-[var(--nl-raised)] px-4 py-2 font-[family-name:var(--font-nl-mono)] text-xs text-[var(--nl-body)] lg:text-sm"
                >
                  {technology}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] px-5 py-4 lg:px-10">
            <h4 className="nl-label text-xs text-[var(--nl-ink)] lg:text-sm">
              {SERVICES_LINKS.teamMembers}
            </h4>

            {/*
             * The accent shows THROUGH each portrait: the source files are
             * cut-outs with an alpha channel, so the disc behind them is what
             * supplies the colour. That is how the artwork tints them, and it
             * means they followed the rebrand from terracotta to gold without
             * a re-export.
             *
             * alt="" on every one — they are the template's stock portraits
             * and name nobody, so announcing them would be noise.
             */}
            <ul className="flex items-center gap-2">
              {work.team.map((portrait, index) => (
                <li
                  key={`${portrait}-${index}`}
                  className="size-10 overflow-hidden rounded-full bg-[var(--nl-accent)] lg:size-[50px]"
                >
                  <Image
                    src={portrait}
                    alt=""
                    width={50}
                    height={50}
                    className="size-full object-cover"
                  />
                </li>
              ))}
            </ul>
          </div>

          <Link
            href={SERVICES_ENQUIRY_ANCHOR}
            className="nl-label flex w-full items-center justify-center rounded-[var(--nl-radius-control)] bg-[var(--nl-accent)] px-5 py-4 text-xs text-[#0f0f0f] lg:text-sm"
          >
            {LINKS.bookACall}
          </Link>
        </div>
      </div>
    </Panel>
  );
}

/**
 * Our Works, laid out like the homepage's Success Stories: the heading card
 * sits on the page ground and EACH PROJECT gets its own panel, because the
 * artwork has two 1822x470 panels rather than one tall one. Wrapping them
 * together would read as a single block of six cards instead of two projects.
 */
function Works() {
  return (
    <div className="mt-[var(--nl-section-gap)]">
      <SectionHeader
        id="works"
        title={SERVICES_SECTIONS.works}
        link={{ label: SERVICES_LINKS.allWorks }}
      />

      <div className="mt-5 flex flex-col gap-5">
        {WORKS.map((work) => (
          <WorkPanel key={work.title} work={work} />
        ))}
      </div>

      <SectionLink label={SERVICES_LINKS.allWorks} />
    </div>
  );
}

export function LabsServices() {
  return (
    <div className="px-4 pb-6 pt-4 lg:px-[50px] lg:pt-5">
      <Hero />
      <Stats enquiryAnchor={SERVICES_ENQUIRY_ANCHOR} />
      <Reasons />
      <ServiceCards />
      <Works />
      <Testimonials />
      <Faq />
      <ClosingCta enquiryAnchor={SERVICES_ENQUIRY_ANCHOR} />
    </div>
  );
}
