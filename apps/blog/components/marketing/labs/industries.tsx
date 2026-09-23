import Image from 'next/image';
import Link from 'next/link';

import { GET_STARTED_PATH, SERVICES_PATH } from './brand';
import { SERVICE_MARQUEE } from './content';
import { ArrowRight, INDUSTRY_ICONS } from './icons';
import {
  INDUSTRIES,
  INDUSTRIES_ANCHOR,
  INDUSTRIES_HERO,
  INDUSTRIES_LINKS,
  INDUSTRIES_SECTIONS,
  INDUSTRIES_STATS_CTA,
} from './industries-content';
import { ArrowLink, Marquee, Panel, SectionHeader, SectionLink } from './primitives';
import { ClosingCta, Faq, Reasons, StatGrid, Testimonials } from './sections';

/**
 * The Nanotom Labs Industries page.
 *
 *   hero          copy card beside the stat grid (shared)
 *   industries    the card grid below
 *   reasons       (shared with the homepage)
 *   testimonials  (shared)
 *   FAQ           (shared)
 *   closing call  (shared)
 *
 * Two of those six are this page's; the rest are components the other pages
 * already render. That ratio is the point of having built ./sections.tsx — a
 * new page is now a hero, a section and a list of imports.
 *
 * WHAT THIS PAGE IS FOR, beyond the design: "do you work with plumbers" is the
 * question every local business asks first, and the answer lives in copy
 * nobody can search for until it has a page. Each card names a trade and
 * describes what its marketing actually has to do, which is what makes the
 * page worth indexing rather than a list of words.
 */
export function LabsIndustries() {
  return (
    <div className="px-4 pb-6 pt-4 lg:px-[50px] lg:pt-5">
      <Hero />
      <Industries />
      <Reasons />
      <Testimonials />
      <Faq />

      {/*
       * To the contact page rather than to the FAQ's form below it — the same
       * call /about and the project pages make, for the same reason: a visitor
       * who has just found their trade on a list is further from deciding than
       * one who clicked "Get Started".
       */}
      <ClosingCta enquiryAnchor={GET_STARTED_PATH} />
    </div>
  );
}

function Hero() {
  return (
    <section className="grid gap-5 lg:min-h-[var(--nl-hero-h)] lg:grid-cols-[minmax(0,1207fr)_minmax(0,593fr)]">
      <div className="flex min-w-0 flex-col justify-between gap-8 rounded-[var(--nl-radius-block)] bg-[var(--nl-card)] p-5 pb-4 lg:p-12 lg:pb-5">
        <div>
          {/*
           * The same clamps as /services, /get-started, /about and the project
           * pages — see the measured note in ./home.tsx. The homepage's differ
           * because its first line carries the rolling slot.
           */}
          <h1 className="nl-heading text-[clamp(24px,6.5vw,30px)] leading-[1.15] lg:text-[clamp(36px,3.3vw,62px)] lg:leading-[1.1]">
            <span className="grid gap-y-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-8">
              <span>{INDUSTRIES_HERO.headingLines[0]}</span>

              <Link
                href={GET_STARTED_PATH}
                className="group hidden shrink-0 items-center gap-3 justify-self-end lg:inline-flex"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[var(--nl-accent)] text-[var(--nl-accent)] transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="size-6" />
                </span>
                <span className="nl-label whitespace-nowrap text-base text-[var(--nl-accent)]">
                  {INDUSTRIES_HERO.cta}
                </span>
              </Link>
            </span>

            {INDUSTRIES_HERO.headingLines.slice(1).map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <Link
            href={GET_STARTED_PATH}
            className="group mt-6 inline-flex items-center gap-3 lg:hidden"
          >
            <span className="grid size-10 place-items-center rounded-full border border-[var(--nl-accent)] text-[var(--nl-accent)]">
              <ArrowRight className="size-4" />
            </span>
            <span className="nl-label text-sm text-[var(--nl-accent)]">
              {INDUSTRIES_HERO.cta}
            </span>
          </Link>

          <p className="mt-5 max-w-[910px] text-sm leading-relaxed text-[var(--nl-muted)] lg:mt-6 lg:text-lg">
            {INDUSTRIES_HERO.body}
          </p>
        </div>

        <Marquee
          items={SERVICE_MARQUEE}
          durationSeconds={38}
          className="rounded-[var(--nl-radius-control)] bg-[var(--nl-bg)] py-4 lg:py-5"
        />
      </div>

      <StatGrid
        trailing={{ label: INDUSTRIES_STATS_CTA, href: `#${INDUSTRIES_ANCHOR}` }}
      />
    </section>
  );
}

/**
 * The trade cards, from the template's related-blogs frame: a tile on top,
 * then a title, a paragraph, and a call.
 *
 * THREE ACROSS, not four. The frame's own count, and the right one here — a
 * paragraph of real copy in a quarter-width card at 1024 is 208px of measure,
 * which is about four words a line.
 *
 * THE TILE CARRIES THE INDUSTRY'S MARK, not a photograph, until there is a
 * photograph worth carrying — see the note at the top of ./industries-content.ts.
 * `image` overrides it per industry, so the two can coexist while the real
 * ones arrive one at a time.
 */
function Industries() {
  return (
    <Panel className="mt-[var(--nl-section-gap)]">
      <SectionHeader
        id={INDUSTRIES_ANCHOR}
        title={INDUSTRIES_SECTIONS.industries}
        link={{ label: INDUSTRIES_LINKS.ourServices, href: SERVICES_PATH }}
      />

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {INDUSTRIES.map((industry) => {
          const Icon = INDUSTRY_ICONS[industry.icon];

          return (
            <article
              key={industry.title}
              className="flex flex-col gap-5 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-4 lg:p-5"
            >
              {/*
               * 5:2 rather than the frame's 16:9. A photograph fills whatever
               * box it is given; a line mark sits in the middle of one, and a
               * 315px-tall tile around an 80px glyph reads as a missing image
               * rather than as a design. Shorter box, bigger mark.
               */}
              <div className="relative flex aspect-[5/2] items-center justify-center overflow-hidden rounded-[var(--nl-radius-control)] bg-[var(--nl-raised)]">
                {industry.image ? (
                  <Image
                    src={industry.image.src}
                    alt={industry.image.alt}
                    fill
                    sizes="(min-width: 1024px) 560px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <Icon className="size-20 text-[var(--nl-accent)] lg:size-24" />
                )}
              </div>

              <div>
                <h3 className="nl-heading text-lg leading-snug break-words lg:text-xl">
                  {industry.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--nl-body)]">
                  {industry.body}
                </p>
              </div>

              {/*
               * Only for a trade that has its own page. None do yet, so no
               * card carries a call rather than every card carrying a dead
               * one — the rule the nav's unbuilt items follow.
               */}
              {industry.href ? (
                <div className="mt-auto">
                  <ArrowLink label={INDUSTRIES_LINKS.readMore} href={industry.href} />
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {/* The mobile half of the header's link — see SectionHeader. */}
      <SectionLink label={INDUSTRIES_LINKS.ourServices} href={SERVICES_PATH} />
    </Panel>
  );
}
