import { Fragment } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ENQUIRY_ANCHOR } from './brand';
import {
  DEFAULT_STORY_TAB,
  HERO,
  LINKS,
  SECTIONS,
  SERVICES,
  SERVICE_MARQUEE,
  STORY_TABS,
  SUCCESS_STORIES,
} from './content';
import { ArrowRight, SERVICE_ICONS, STORY_ICONS } from './icons';
import { ArrowLink, Marquee, Panel, SectionHeader, SectionLink } from './primitives';
import { ClosingCta, Faq, Stats, Testimonials } from './sections';

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
 * WHAT LIVES HERE is the hero and the two sections unique to this page. The
 * stat band, the testimonials, the FAQ and the closing call are shared with
 * /services and live in ./sections.tsx — see the note there.
 */

function Hero() {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1207fr)_minmax(0,593fr)]">
      <div className="flex min-w-0 flex-col justify-between gap-8 rounded-[var(--nl-radius-block)] bg-[var(--nl-card)] p-5 pb-4 lg:p-12 lg:pb-5">
        <div>
          {/*
           * The headline tops out at 62px where the artwork says 78px, and the
           * difference is the font rather than a judgement call.
           *
           * The design's face runs 0.54 em per character; Roboto Flex at 700
           * runs about 0.65, so "OUR COMPREHENSIVE" measures 889px against the
           * artwork's 716px. Roboto Flex's `wdth` axis would close that, but
           * Google Fonts serves the subset with width pinned at 100 — measured
           * at wdth 70/80/90/100 and identical each time, not assumed. At 78px
           * the first line plus the call needs ~1130px inside a 1047px card, so
           * the call wraps below and the composition the design is built around
           * breaks.
           *
           * 62px is measured, not picked: the card's inner width is 1047px, the
           * call is 231px and the gap 24px, which leaves 792px for the phrase
           * and puts the ceiling at 66px. 62 keeps a margin, because the font
           * next/font self-hosts is not byte-identical to the subset this was
           * measured against and a few pixels either way decides whether the
           * call sits beside the headline or drops beneath it.
           *
           * The COMPOSITION is what is preserved: two lines, the call anchored
           * to the right of the first.
           *
           * The size is fluid rather than fixed, because a fixed one is only
           * ever right at one viewport — at 1280 this card is 618px wide, where
           * a 62px headline would leave no room beside it. The clamp's ceiling
           * is what fits at 1920; below that the headline shrinks with the
           * viewport and the call keeps its place at the right edge.
           */}
          <h1 className="nl-heading text-[28px] leading-[1.15] lg:text-[clamp(36px,3.3vw,62px)] lg:leading-[1.1]">
            {/*
             * Two columns rather than a flex row, so the call is PINNED to the
             * right edge of the card instead of trailing the headline. In the
             * artwork it ends at x=1180 against a card that ends at 1177 — it
             * is anchored right, not merely placed after the words, and the gap
             * between them grows and shrinks with the viewport.
             */}
            <span className="grid gap-y-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-8">
              <span>{HERO.headingLines[0]}</span>

              <Link
                href={ENQUIRY_ANCHOR}
                className="group hidden shrink-0 items-center gap-3 justify-self-end lg:inline-flex"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[var(--nl-accent)] text-[var(--nl-accent)] transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="size-6" />
                </span>
                <span className="nl-label whitespace-nowrap text-base text-[var(--nl-accent)]">
                  {HERO.cta}
                </span>
              </Link>
            </span>

            <span className="block">{HERO.headingLines[1]}</span>
          </h1>

          {/* Mobile keeps the same call, stacked under the heading. */}
          <Link
            href={ENQUIRY_ANCHOR}
            className="group mt-6 inline-flex items-center gap-3 lg:hidden"
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
       * The accent here is a BLEND LAYER, not a backdrop.
       *
       * The source photograph is violet — that is what comes out of the Figma
       * export — but the artwork shows it as a monochrome tint. The card paints
       * the accent and the image sits on it in `luminosity`: hue and saturation
       * come from the accent beneath, lightness from the photograph. Drop the
       * blend and the hero turns violet, which is the one colour nowhere else
       * on the page.
       *
       * Because it reads the variable, the hero followed the brand: it was
       * terracotta on the template's accent and is gold on Nanotom's.
       *
       * `isolate` on the card matters. Without it the blend composites against
       * whatever ancestor happens to form a stacking context, so the tint would
       * change depending on what is behind the hero rather than staying fixed
       * to the accent directly underneath.
       */}
      <div className="relative isolate min-h-[320px] min-w-0 overflow-hidden rounded-[var(--nl-radius-block)] bg-[var(--nl-accent)] lg:min-h-[520px]">
        <Image
          src="/nntm-labs/hero-brain.webp"
          alt={HERO.imageAlt}
          fill
          priority
          sizes="(min-width: 1024px) 593px, 100vw"
          className="object-cover mix-blend-luminosity"
        />

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4 lg:p-6">
          <ArrowLink label={HERO.imageCta} href="/blog" variant="solid" />
          <span className="nl-label rounded-[var(--nl-radius-input)] bg-white px-3 py-2 text-[10px] text-[#0f0f0f] lg:text-xs">
            {HERO.imageTag}
          </span>
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
        {/*
          * Two columns, not a wrapping flex row. With `flex-wrap` a long title
          * like "Mobile App Development" pushed "Book A Call" onto its own line
          * and the row lost its right edge; as a grid the call is pinned right
          * and the title wraps within its own column instead.
          */}
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-[var(--nl-radius-control)] bg-[var(--nl-raised)] text-[var(--nl-accent)] lg:size-14">
              <Icon className="size-5 lg:size-6" />
            </span>
            <h3 className="nl-heading text-xl lg:text-3xl">{service.title}</h3>
          </div>

          {/* Desktop only: mobile replaces this with the button below. */}
          <div className="hidden justify-self-end lg:block">
            <ArrowLink label={LINKS.bookACall} href={ENQUIRY_ANCHOR} />
          </div>
        </div>

        {/*
         * Mobile puts the price above the description and desktop below it.
         * `order` rather than two copies of the markup, so the strings exist
         * once.
         */}
        <p className="order-2 text-sm leading-relaxed text-[var(--nl-body)] lg:order-none lg:text-lg">
          {service.body}
        </p>

        <p className="order-1 nl-heading text-lg lg:order-none lg:text-right lg:text-3xl">
          {service.price}
        </p>

        <div className="order-3 lg:hidden">
          <Link
            href={ENQUIRY_ANCHOR}
            className="nl-label flex w-full items-center justify-center rounded-[var(--nl-radius-control)] bg-[var(--nl-accent)] px-5 py-3.5 text-xs text-[#0f0f0f]"
          >
            {LINKS.viewAllProjects}
          </Link>
        </div>
      </article>

      {/* The paired gallery, desktop only — the mobile frame has no equivalent. */}
      <article className="hidden flex-col gap-4 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-6 lg:flex">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <h3 className="nl-heading text-xl 2xl:text-2xl">{service.projectsTitle}</h3>
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
              <div className="absolute inset-x-0 bottom-0 p-4">
                <ArrowLink label={LINKS.openProject} variant="solid" />
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

/**
 * A success story, with working Before / After tabs.
 *
 * INTERACTIVE WITHOUT JAVASCRIPT. The tabs are a radio group: one hidden input
 * per panel, labels styled as the buttons, and `peer-checked` variants doing
 * the switching in CSS. That keeps this a server component, which is the same
 * call the header's <details> menu and the FAQ accordion already make — a
 * `useState` toggle here would put a client bundle on every route of the site
 * to switch between two blocks of static text.
 *
 * It is also better than a scripted tablist on the things that usually get
 * dropped: arrow keys move between the options natively, the state survives
 * with JS disabled, and the checked panel is real DOM rather than a
 * conditional render.
 *
 * The radio `name` is per-story, so the two stories on the page switch
 * independently rather than sharing one group.
 */
function SuccessStory({ story }: { story: (typeof SUCCESS_STORIES)[number] }) {
  const Icon = STORY_ICONS[story.icon];
  const group = `nl-story-${story.icon}`;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,747fr)_minmax(0,953fr)]">
      <article className="flex flex-col justify-between gap-6 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 lg:p-9">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-[var(--nl-radius-control)] bg-[var(--nl-raised)] text-[var(--nl-accent)]">
              <Icon className="size-5" />
            </span>
            <h3 className="nl-heading text-xl lg:text-3xl">{story.client}</h3>
          </div>
          <div className="justify-self-end">
            <ArrowLink label={LINKS.visitWebsite} />
          </div>
        </div>

        <dl className="flex flex-wrap gap-3">
          {[
            { term: 'Industry', value: story.industry },
            { term: 'Service Utilized', value: story.service },
          ].map((meta) => (
            <div
              key={meta.term}
              className="flex items-center gap-2 rounded-full bg-[var(--nl-raised)] px-4 py-2.5"
            >
              <dt className="text-xs text-[var(--nl-muted)] lg:text-sm">{meta.term}</dt>
              <dd className="text-xs text-[var(--nl-ink)] lg:text-sm">{meta.value}</dd>
            </div>
          ))}
        </dl>
      </article>

      <div className="nl-tabs flex flex-col gap-4">
        <div
          role="group"
          aria-label={`${story.client}: before and after`}
          className="flex flex-wrap items-center gap-2 px-1"
        >
          {STORY_TABS.map((tab) => {
            const value = tab.toLowerCase();

            return (
              /*
               * A Fragment rather than a wrapper element, so the input and its
               * label are direct children of the row. The CSS matches the
               * label with `input:checked + [data-tab-label]`, and an
               * intervening element would break that adjacency.
               */
              <Fragment key={tab}>
                <input
                  type="radio"
                  name={group}
                  id={`${group}-${value}`}
                  value={value}
                  defaultChecked={tab === DEFAULT_STORY_TAB}
                  className="sr-only"
                />
                <label
                  htmlFor={`${group}-${value}`}
                  data-tab-label={value}
                  className="nl-label cursor-pointer rounded-[var(--nl-radius-control)] px-4 py-2 text-[10px] transition-colors lg:text-xs"
                >
                  {tab}
                </label>
              </Fragment>
            );
          })}
        </div>

        {STORY_TABS.map((tab) => {
          const value = tab.toLowerCase() as Lowercase<typeof tab>;
          const panel = story.panels[value];

          return (
            <article
              key={tab}
              data-tab={value}
              className="nl-tab-panel flex-1 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 lg:p-8"
            >
              <h4 className="nl-heading text-xl lg:text-5xl">{panel.heading}</h4>
              <p className="mt-4 text-sm leading-relaxed text-[var(--nl-body)] lg:mt-6 lg:text-lg">
                {panel.body}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function LabsHome() {
  return (
    <div className="px-4 pb-6 pt-4 lg:px-[50px] lg:pt-5">
      <Hero />
      <Stats enquiryAnchor={ENQUIRY_ANCHOR} />

      <Panel className="mt-[var(--nl-section-gap)]">
        <SectionHeader title={SECTIONS.services} />
        <div className="mt-5 flex flex-col gap-5">
          {SERVICES.map((service) => (
            <ServiceRow key={service.title} service={service} />
          ))}
        </div>
      </Panel>

      {/*
        * Success Stories is the odd one out, and deliberately so: its heading
        * card sits on the ground rather than inside a panel, and EACH STORY
        * gets its own panel (the artwork has two 1824x434 panels at y=3177 and
        * y=3627, not one tall one). Wrapping them together reads as a single
        * block of four cards instead of two separate case studies.
        */}
      <div className="mt-[var(--nl-section-gap)]">
        <SectionHeader title={SECTIONS.successStories} link={{ label: LINKS.viewAll }} />

        <div className="mt-5 flex flex-col gap-5">
          {SUCCESS_STORIES.map((story) => (
            <Panel key={story.client}>
              <SuccessStory story={story} />
            </Panel>
          ))}
        </div>

        <SectionLink label={LINKS.viewAll} />
      </div>

      <Testimonials />
      <Faq />
      <ClosingCta enquiryAnchor={ENQUIRY_ANCHOR} />
    </div>
  );
}
