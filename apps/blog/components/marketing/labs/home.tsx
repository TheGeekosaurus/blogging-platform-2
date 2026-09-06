import Image from 'next/image';
import Link from 'next/link';

import { ENQUIRY_ANCHOR } from './brand';
import {
  CLOSING_CTA,
  ENQUIRY_FORM,
  FAQS,
  HERO,
  LINKS,
  SECTIONS,
  SERVICES,
  SERVICE_MARQUEE,
  STORY_TABS,
  SUCCESS_STORIES,
  TESTIMONIALS,
} from './content';
import { ArrowRight, Plus, SERVICE_ICONS, STORY_ICONS } from './icons';
import { ArrowLink, Marquee, Panel, SectionHeader, SectionLink } from './primitives';

/**
 * The NNTM Labs homepage.
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
 *   - each service row drops its paired project gallery for a single coral
 *     "View all Projects" button
 *   - the fourth testimonial is dropped
 * Each is implemented as a breakpoint change at `lg`, so both ends match their
 * artboard and the space between them interpolates.
 *
 * FORMS ARE PRESENTATIONAL. Neither the enquiry form here nor the newsletter
 * in the footer has an endpoint yet, so both are disabled rather than posting
 * into nothing. A form that accepts an address and silently discards it is
 * worse than one that visibly is not ready — and this is the site's only
 * conversion path, so it needs a real destination before launch.
 */

function Hero() {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1207fr)_minmax(0,593fr)]">
      <div className="flex min-w-0 flex-col justify-between gap-10 rounded-[var(--nl-radius-block)] bg-[var(--nl-card)] p-6 pb-4 lg:p-20 lg:pb-5">
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
           * The COMPOSITION is what is preserved: two lines, the call beside
           * the first at full width.
           *
           * The size is fluid rather than fixed, because a fixed one is only
           * ever right at one viewport. The artwork's proportion — headline,
           * gap and call filling the card's 1047px — holds at 1920 and breaks
           * everywhere below it: at 1280 the same card is 618px wide and would
           * need a 32px headline to keep the call alongside, which is not a
           * headline any more. So the row is allowed to WRAP: the headline
           * stays on one line at every width (`lg:whitespace-nowrap`) and the
           * call drops beneath it when there is no room, rather than the phrase
           * breaking mid-sentence. The clamp's ceiling is what fits at 1920.
           */}
          <h1 className="nl-heading text-[28px] leading-[1.15] lg:text-[clamp(36px,3.3vw,62px)] lg:leading-[1.1]">
            <span className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <span className="lg:whitespace-nowrap">{HERO.headingLines[0]}</span>

              <Link
                href={ENQUIRY_ANCHOR}
                className="group hidden shrink-0 items-center gap-3 lg:inline-flex"
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

          <p className="mt-6 max-w-[910px] text-sm leading-relaxed text-[var(--nl-muted)] lg:mt-8 lg:text-lg">
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
       * The coral here is a BLEND LAYER, not a backdrop.
       *
       * The source photograph is violet — that is what comes out of the Figma
       * export — but it reads as coral monochrome in the artwork. The design
       * tints it against the accent, so the card paints the accent and the
       * image sits on it in `luminosity`: hue and saturation come from the
       * coral beneath, lightness from the photograph. Drop the blend and the
       * hero turns violet, which is the one colour nowhere else on the page.
       *
       * `isolate` on the card matters. Without it the blend composites against
       * whatever ancestor happens to form a stacking context, so the tint would
       * change depending on what is behind the hero rather than staying fixed
       * to the accent directly underneath.
       */}
      <div className="relative isolate min-h-[364px] min-w-0 overflow-hidden rounded-[var(--nl-radius-block)] bg-[var(--nl-accent)] lg:min-h-[592px]">
        <Image
          src="/nntm-labs/hero-brain.webp"
          alt={HERO.imageAlt}
          fill
          priority
          sizes="(min-width: 1024px) 593px, 100vw"
          className="object-cover mix-blend-luminosity"
        />

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-5 lg:p-7">
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
    <div className="grid gap-5 lg:grid-cols-2">
      <article className="flex flex-col justify-between gap-6 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-6 lg:p-14">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-[var(--nl-radius-control)] bg-[var(--nl-raised)] text-[var(--nl-accent)] lg:size-14">
              <Icon className="size-5 lg:size-6" />
            </span>
            <h3 className="nl-heading text-xl lg:text-3xl">{service.title}</h3>
          </div>

          {/* Desktop only: mobile replaces this with the button below. */}
          <div className="hidden lg:block">
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
      <article className="hidden flex-col gap-5 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-10 lg:flex">
        <header className="flex items-center justify-between gap-4">
          <h3 className="nl-heading text-2xl">{service.projectsTitle}</h3>
          <ArrowLink label={LINKS.viewAll} />
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

function SuccessStory({ story }: { story: (typeof SUCCESS_STORIES)[number] }) {
  const Icon = STORY_ICONS[story.icon];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,747fr)_minmax(0,953fr)]">
      <article className="flex flex-col justify-between gap-8 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-6 lg:p-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-[var(--nl-radius-control)] bg-[var(--nl-raised)] text-[var(--nl-accent)]">
              <Icon className="size-5" />
            </span>
            <h3 className="nl-heading text-xl lg:text-3xl">{story.client}</h3>
          </div>
          <ArrowLink label={LINKS.visitWebsite} />
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

      <div className="flex flex-col gap-4">
        {/*
         * The tabs are presentational.
         *
         * The design shows "Solution" selected on both cards and supplies copy
         * for that tab only — there is no Challenge or Results text anywhere in
         * the file. Rendering them as real tab controls would promise panels
         * that do not exist, so they are styled markers until the copy lands.
         * Give them content and this becomes a real tablist.
         */}
        <ul className="flex flex-wrap gap-2 px-1">
          {STORY_TABS.map((tab) => (
            <li
              key={tab}
              className={
                tab === story.activeTab
                  ? 'nl-label rounded-[var(--nl-radius-control)] bg-[var(--nl-accent)] px-4 py-2 text-[10px] text-[#0f0f0f] lg:text-xs'
                  : 'nl-label rounded-[var(--nl-radius-control)] bg-[var(--nl-raised)] px-4 py-2 text-[10px] text-[var(--nl-muted)] lg:text-xs'
              }
            >
              {tab}
            </li>
          ))}
        </ul>

        <article className="flex-1 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-6 lg:p-10">
          <h4 className="nl-heading text-xl lg:text-5xl">{story.activeTab}</h4>
          <p className="mt-4 text-sm leading-relaxed text-[var(--nl-body)] lg:mt-6 lg:text-lg">
            {story.body}
          </p>
        </article>
      </div>
    </div>
  );
}

function Testimonials() {
  return (
    <Panel className="mt-5">
      <SectionHeader
        id="testimonials"
        title={SECTIONS.testimonials}
        link={{ label: LINKS.allTestimonials }}
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-4">
        {TESTIMONIALS.map((testimonial, index) => (
          <figure
            key={testimonial.name}
            className={
              // The mobile artboard shows three; the fourth is desktop-only.
              index === 3
                ? 'hidden flex-col justify-between overflow-hidden rounded-[var(--nl-radius-card-lg)] bg-[var(--nl-card)] lg:flex'
                : 'flex flex-col justify-between overflow-hidden rounded-[var(--nl-radius-card-lg)] bg-[var(--nl-card)]'
            }
          >
            <blockquote className="p-6 lg:p-8">
              <p className="nl-heading text-base leading-snug lg:text-xl">
                {testimonial.quote}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--nl-body)]">
                {testimonial.body}
              </p>
            </blockquote>

            <figcaption className="flex items-center justify-between gap-3 bg-[var(--nl-raised)] p-5">
              <div className="flex items-center gap-3">
                <Image
                  src={testimonial.avatar}
                  alt=""
                  width={44}
                  height={44}
                  className="size-11 shrink-0 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm text-[var(--nl-ink)]">{testimonial.name}</p>
                  <p className="text-xs text-[var(--nl-muted)]">{testimonial.role}</p>
                </div>
              </div>
              <ArrowLink label="" />
            </figcaption>
          </figure>
        ))}
      </div>

      <SectionLink label={LINKS.allTestimonials} />
    </Panel>
  );
}

function EnquiryForm() {
  const field = (
    id: string,
    label: string,
    placeholder: string,
    multiline = false,
  ) => (
    <div key={id}>
      <label htmlFor={id} className="text-sm text-[var(--nl-ink)]">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={4}
          disabled
          placeholder={placeholder}
          className="mt-2 w-full resize-none rounded-[var(--nl-radius-input)] border border-[var(--nl-line)] bg-[var(--nl-raised)] px-4 py-3 text-sm text-[var(--nl-body)] outline-none placeholder:text-[var(--nl-muted)]"
        />
      ) : (
        <input
          id={id}
          type={id === 'nl-email' ? 'email' : 'text'}
          disabled
          placeholder={placeholder}
          className="mt-2 w-full rounded-[var(--nl-radius-input)] border border-[var(--nl-line)] bg-[var(--nl-raised)] px-4 py-3 text-sm text-[var(--nl-body)] outline-none placeholder:text-[var(--nl-muted)]"
        />
      )}
    </div>
  );

  return (
    <div
      id="ask"
      className="flex flex-col gap-5 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-6 lg:p-10"
    >
      <h3 className="nl-heading text-xl lg:text-2xl">{ENQUIRY_FORM.heading}</h3>

      {field('nl-name', ENQUIRY_FORM.name.label, ENQUIRY_FORM.name.placeholder)}
      {field('nl-email', ENQUIRY_FORM.email.label, ENQUIRY_FORM.email.placeholder)}
      {field(
        'nl-question',
        ENQUIRY_FORM.question.label,
        ENQUIRY_FORM.question.placeholder,
        true,
      )}

      <button
        type="button"
        disabled
        className="nl-label mt-2 w-full rounded-[var(--nl-radius-control)] bg-[var(--nl-accent)] px-5 py-3.5 text-xs text-[#0f0f0f]"
      >
        {ENQUIRY_FORM.submit}
      </button>
    </div>
  );
}

/**
 * The FAQ has no panel: its rows and the form sit straight on the page ground,
 * and only the heading is a card. Column widths are the artwork's — 1054px of
 * rows against a 746px form.
 */
function Faq() {
  return (
    <div className="mt-5">
      <SectionHeader id="faq" title={SECTIONS.faq} link={{ label: LINKS.viewAll }} />

      <div className="nl-faq mt-5 grid gap-5 lg:grid-cols-[minmax(0,1054fr)_minmax(0,746fr)]">
        <div className="flex flex-col gap-4">
          {FAQS.map((faq, index) => (
            <details
              key={faq.question}
              open={index === 0}
              className="rounded-[var(--nl-radius-card-lg)] border border-[var(--nl-raised)] bg-[var(--nl-card)] px-6 py-5 lg:px-8 lg:py-6"
            >
              <summary className="flex items-start justify-between gap-6">
                <span className="text-base leading-snug text-[var(--nl-ink)] lg:text-lg">
                  {faq.question}
                </span>
                <Plus className="nl-faq-plus mt-0.5 size-5 shrink-0 text-[var(--nl-muted)] transition-transform duration-200" />
              </summary>

              {faq.answer ? (
                <p className="mt-4 text-sm leading-relaxed text-[var(--nl-body)]">
                  {faq.answer}
                </p>
              ) : null}
            </details>
          ))}
        </div>

        <EnquiryForm />
      </div>

      <SectionLink label={LINKS.viewAll} />
    </div>
  );
}

function ClosingCta() {
  return (
    <section className="mx-auto mt-5 w-full max-w-[1824px] rounded-[var(--nl-radius-block)] bg-[var(--nl-accent)] p-8 lg:p-16">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <div className="max-w-[1000px]">
          {/*
           * Dark ink on the accent, not white: #0F0F0F on #CE7D63 is 6.15:1,
           * where white is 3.1:1 and fails AA for the body copy beneath.
           */}
          <h2 className="nl-heading text-[28px] leading-tight text-[#0f0f0f] lg:text-[58px]">
            {CLOSING_CTA.heading}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#0f0f0f]/80 lg:text-lg">
            {CLOSING_CTA.body}
          </p>
        </div>

        <Link
          href={ENQUIRY_ANCHOR}
          className="nl-label inline-flex shrink-0 items-center gap-3 self-start rounded-[var(--nl-radius-control)] bg-[#0f0f0f] px-6 py-4 text-xs text-[var(--nl-ink)] lg:self-auto lg:text-sm"
        >
          {CLOSING_CTA.cta}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

export function LabsHome() {
  return (
    <div className="px-4 pb-6 pt-4 lg:px-[50px] lg:pt-5">
      <Hero />

      <Panel className="mt-5">
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
      <div className="mt-5">
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
      <ClosingCta />
    </div>
  );
}
