import { Fragment } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ENQUIRY_ANCHOR } from './brand';
import {
  DEFAULT_STORY_TAB,
  HERO,
  LINKS,
  REASONS,
  SECTIONS,
  SERVICES,
  SERVICE_MARQUEE,
  STORY_TABS,
  SUCCESS_STORIES,
  projectsTitle,
} from './content';
import { ArrowRight, SERVICE_ICONS, STORY_ICONS } from './icons';
import { ArrowLink, DiscLink, Marquee, Panel, SectionHeader, SectionLink } from './primitives';
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
    <section className="grid gap-5 lg:min-h-[var(--nl-hero-h)] lg:grid-cols-[minmax(0,1207fr)_minmax(0,593fr)]">
      <div className="flex min-w-0 flex-col justify-between gap-8 rounded-[var(--nl-radius-block)] bg-[var(--nl-card)] p-5 pb-4 lg:p-12 lg:pb-5">
        <div>
          {/*
           * The headline tops out at 62px where the artwork says 78px, and the
           * difference is the font rather than a judgement call.
           *
           * The design's face runs 0.54 em per character; Roboto Flex at 700
           * runs about 0.65. At 78px the first line plus the call overruns the
           * card, so the call wraps below and the composition the design is
           * built around breaks. Roboto Flex's `wdth` axis would close the gap,
           * but Google Fonts serves the subset with width pinned at 100 —
           * measured at wdth 70/80/90/100 and identical each time, not assumed.
           *
           * 62px is measured against THIS copy, in the browser, with the real
           * variable font loaded: the card's inner width is 1111px at 1920, the
           * call is 237px and the gap 32px, which leaves 842px for the first
           * line. "MORE CALLS." measures 400px there, so 62 is comfortable
           * rather than marginal — which matters, because the font next/font
           * self-hosts is not byte-identical to the subset this was measured
           * against.
           *
           * The COMPOSITION is what is preserved: the call anchored to the
           * right of the first line, the rest of the headline stacked beneath.
           *
           * The size is fluid rather than fixed, because a fixed one is only
           * ever right at one viewport — at 1280 this card is 618px wide, where
           * a 62px headline would leave no room beside it. The clamp's ceiling
           * is what fits at 1920; below that the headline shrinks with the
           * viewport and the call keeps its place at the right edge.
           */}
          {/*
           * Fluid below `lg` too, which the two-line template headline did not
           * need. "MORE FOOT TRAFFIC." renders 323px at the old fixed 28px
           * against a 318px card at 390 — measured in the browser with the
           * real face, not estimated — so it broke after "FOOT". The floor is
           * what fits at 360 (278px in 288px) and the ceiling is the size the
           * line reaches before the `lg` clamp takes over.
           */}
          <h1 className="nl-heading text-[clamp(24px,6.5vw,30px)] leading-[1.15] lg:text-[clamp(36px,3.3vw,62px)] lg:leading-[1.1]">
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

            {/*
             * Every line after the first, stacked. Mapped rather than indexed,
             * so the copy decides how many lines there are — see the note on
             * HERO in ./content.ts.
             */}
            {HERO.headingLines.slice(1).map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
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

/**
 * Why this agency, above what it sells.
 *
 * Four across only from `xl`: the artwork's four 430px cards are a 1920
 * layout, and held at four all the way down each is 208px wide at 1024 —
 * narrower than the word "Technologies" set at the artwork's 30px, which
 * pushed the whole PAGE into horizontal scroll rather than merely looking
 * tight. Two up between `sm` and `xl` is the same cards at a readable measure.
 */
function Reasons() {
  return (
    <Panel className="mt-[var(--nl-section-gap)]">
      <SectionHeader title={SECTIONS.reasons} />

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {REASONS.map((reason) => (
          <article
            key={reason.title}
            className="flex flex-col justify-between gap-6 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 lg:p-10"
          >
            <div>
              {/*
                * The size steps with the column count for the same reason.
                * `break-words` is the backstop — a single unbreakable word
                * longer than its column is the one thing that escapes a fluid
                * size, and it escapes as page-wide horizontal scroll.
                */}
              <h3 className="nl-heading text-xl leading-snug break-words lg:text-2xl 2xl:text-3xl">
                {reason.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-[var(--nl-body)] lg:mt-6">
                {reason.body}
              </p>
            </div>

            {/* Unlinked: the design gives these four no destination. */}
            <DiscLink label={LINKS.learnMore} />
          </article>
        ))}
      </div>
    </Panel>
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
