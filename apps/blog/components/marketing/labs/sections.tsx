import { Fragment } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ABOUT_PATH } from './brand';
import type { Work } from './content';
import {
  CLOSING_CTA,
  DEFAULT_WORK_TAB,
  ENQUIRY_FORM,
  FAQS,
  LINKS,
  REASONS,
  SECTIONS,
  STATS,
  STATS_CTA,
  TESTIMONIALS,
  WORKS,
  WORK_TABS,
} from './content';
import { ArrowDown, ArrowRight, Plus, WORK_ICONS } from './icons';
import { ArrowLink, DiscLink, Panel, SectionHeader, SectionLink } from './primitives';

/**
 * The sections the Labs pages share.
 *
 * The template's Home and Services frames are not two designs — they are one
 * design with a different middle. The stat band, the testimonial wall, the FAQ
 * and its form, and the closing call to action are pixel-identical across both
 * (measured: the 1824x194 band at y=771, the 1824x636 testimonial panel, the
 * 1054/746 FAQ split, the 1821x305 accent band), so they live here and both
 * pages import them.
 *
 * This started inside home.tsx, where it was correct for exactly as long as
 * there was one page. Copying it into services.tsx would have meant two places
 * to fix a contrast failure or a disabled input — and the FAQ form is the
 * site's only conversion path, which is the last thing that should exist twice.
 *
 * WHAT IS NOT HERE: the hero. Both pages have one and they are different
 * compositions — the homepage pairs its copy with a tinted photograph, the
 * Services page with a project screenshot and a caption bar. Sharing them
 * would mean a component with a switch in it, which is two components wearing
 * one name.
 *
 * `enquiryAnchor` is passed rather than imported so each page's calls land on
 * ITS OWN form. See SERVICES_ENQUIRY_ANCHOR in ./brand.ts.
 */

/**
 * The stat band beneath the hero.
 *
 * Five figures and a call, in one panel. Six equal columns on desktop; two on
 * mobile, where six would leave each number about 55px of width.
 *
 * The call is the sixth TILE rather than a link floated after the row, so the
 * grid stays even and the band keeps a single rhythm — the artwork does the
 * same, giving it the identical card and footprint as the figures beside it.
 */
export function Stats({ enquiryAnchor }: { enquiryAnchor: string }) {
  return (
    <Panel className="mt-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6 lg:gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center justify-center gap-2 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] px-4 py-6 text-center lg:py-8"
          >
            <p className="nl-label text-[10px] text-[var(--nl-body)] lg:text-xs">
              {stat.label}
            </p>
            <p className="nl-heading text-3xl text-[var(--nl-accent)] lg:text-4xl">
              {stat.value}
            </p>
          </div>
        ))}

        <div className="flex items-center justify-center rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] px-4 py-6 lg:py-8">
          <ArrowLink label={STATS_CTA} href={enquiryAnchor} />
        </div>
      </div>
    </Panel>
  );
}

/**
 * The same five figures, stacked two-up beside a hero instead of banded under
 * one — the shape /get-started and /about both give them.
 *
 * Extracted when the second page wanted it, not before, and the second page is
 * the reason it is worth extracting at all: the tiles, the accent, the label
 * case and the `auto-rows-fr` that keeps the rows even are five decisions that
 * would otherwise be made twice and drift once.
 *
 * `trailing` is the sixth tile, which is a call rather than a figure — the
 * band above does the same. It carries a DOWN arrow because both callers point
 * it further down their own page rather than away from it; if one ever needs
 * to leave the page, that is a new variant, not a new href.
 */
export function StatGrid({ trailing }: { trailing: { label: string; href: string } }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:auto-rows-fr lg:gap-4">
      {STATS.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center justify-center gap-2 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] px-4 py-6 text-center"
        >
          <p className="nl-label text-[10px] text-[var(--nl-body)] lg:text-xs">
            {stat.label}
          </p>
          <p className="nl-heading text-3xl text-[var(--nl-accent)] lg:text-4xl">
            {stat.value}
          </p>
        </div>
      ))}

      <Link
        href={trailing.href}
        className="group flex items-center justify-center gap-3 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] px-4 py-6"
      >
        <span className="nl-label text-xs text-[var(--nl-ink)]">{trailing.label}</span>
        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-current text-[var(--nl-ink)] transition-transform duration-200 group-hover:translate-y-px">
          <ArrowDown className="size-4" />
        </span>
      </Link>
    </div>
  );
}

/**
 * Why this agency, above what it sells.
 *
 * SHARED BY THE HOMEPAGE AND /industries, which is why it lives here rather
 * than in home.tsx where it started. Both pages want the same four answers to
 * "why you" before the visitor reaches anything they would have to decide
 * about, and the copy is one list in ./content.ts either way.
 *
 * Four across only from `xl`: the artwork's four 430px cards are a 1920
 * layout, and held at four all the way down each is 208px wide at 1024 —
 * narrower than the word "Technologies" set at the artwork's 30px, which
 * pushed the whole PAGE into horizontal scroll rather than merely looking
 * tight. Two up between `sm` and `xl` is the same cards at a readable measure.
 */
export function Reasons() {
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

            {/*
             * To /about. The design gives these four no destination, and they
             * sat unlinked until there was one — but "why this agency" is the
             * About page's whole subject, so four controls asking the visitor
             * to learn more now go to the page that does the explaining.
             * One href for both pages that render this.
             */}
            <DiscLink label={LINKS.learnMore} href={ABOUT_PATH} />
          </article>
        ))}
      </div>
    </Panel>
  );
}


export function Testimonials() {
  return (
    <Panel className="mt-[var(--nl-section-gap)]">
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
            <blockquote className="p-5 lg:p-7">
              <p className="nl-heading text-base leading-snug lg:text-xl">
                {testimonial.quote}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[var(--nl-body)]">
                {testimonial.body}
              </p>
            </blockquote>

            <figcaption className="flex items-center justify-between gap-3 bg-[var(--nl-raised)] p-4">
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

/**
 * The enquiry form, which is the site's only conversion path.
 *
 * PRESENTATIONAL. There is no endpoint yet, so every control is disabled and
 * there is no <form> element at all — a bare form would post to the current
 * URL on Enter and look like it had worked. A form that accepts an address and
 * silently discards it is worse than one that visibly is not ready.
 *
 * Only one page renders at a time, so the field ids are page-independent.
 */
export function EnquiryForm() {
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
      className="flex flex-col gap-4 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 lg:p-8"
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
export function Faq() {
  return (
    <div className="mt-[var(--nl-section-gap)]">
      {/*
       * NO "VIEW ALL". The template puts one in this header, and there is no
       * longer list to view — these six ARE the frequently asked questions,
       * and a control promising more of them promises something that does not
       * exist. The section link under the column went with it.
       */}
      <SectionHeader id="faq" title={SECTIONS.faq} />

      <div className="nl-faq mt-5 grid gap-5 lg:grid-cols-[minmax(0,1054fr)_minmax(0,746fr)]">
        <div className="flex flex-col gap-4">
          {FAQS.map((faq, index) => (
            <details
              key={faq.question}
              /*
               * ONE OPEN AT A TIME, in HTML rather than in JavaScript. A shared
               * `name` makes a group of <details> exclusive the way radio
               * buttons are: opening one closes the rest, with no state, no
               * effect and no client bundle — which is the same bargain every
               * other moving part of this site takes.
               *
               * It degrades to the old behaviour rather than breaking: a
               * browser that does not know the attribute ignores it and lets
               * two sit open, which is what this did before. Everything else
               * — the marker, the animation, keyboard operation — is native.
               */
              name="nl-faq"
              open={index === 0}
              className="rounded-[var(--nl-radius-card-lg)] border border-[var(--nl-raised)] bg-[var(--nl-card)] px-5 py-4 lg:px-7 lg:py-5"
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
    </div>
  );
}

export function ClosingCta({ enquiryAnchor }: { enquiryAnchor: string }) {
  return (
    <section className="mx-auto mt-[var(--nl-section-gap)] w-full max-w-[1824px] rounded-[var(--nl-radius-block)] bg-[var(--nl-accent)] p-6 lg:p-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <div className="max-w-[1000px]">
          {/*
           * Dark ink on the accent, not white: #0F0F0F on the brand gold is
           * 8.99:1, where white is 2.13:1 and fails AA for the body copy
           * beneath.
           */}
          <h2 className="nl-heading text-[28px] leading-tight text-[#0f0f0f] lg:text-[58px]">
            {CLOSING_CTA.heading}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#0f0f0f]/80 lg:text-lg">
            {CLOSING_CTA.body}
          </p>
        </div>

        <Link
          href={enquiryAnchor}
          className="nl-label inline-flex shrink-0 items-center gap-3 self-start rounded-[var(--nl-radius-control)] bg-[#0f0f0f] px-6 py-4 text-xs text-[var(--nl-ink)] lg:self-auto lg:text-sm"
        >
          {CLOSING_CTA.cta}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

/**
 * One project, in its own panel.
 *
 * Shared by /services, which stacks two of them under "Our Works", and by each
 * project page, which shows the one it is about.
 *
 * Three equal columns in the artwork — 579.3px each with 20px gutters inside
 * an 1822px panel — so `lg:grid-cols-3` rather than fractions. The right
 * column is itself a stack of three: the technology list, the team strip, and
 * a full-width call, at the artwork's 225 / 90 / 63 heights.
 */
/**
 * Our Work: a heading card on the page ground, then one panel per project.
 *
 * NOT ONE PANEL AROUND ALL OF THEM, which is the artwork's own decision — two
 * 1822x470 panels rather than one tall one. Wrapped together they read as a
 * single block of six cards instead of two separate projects.
 *
 * SHARED BY /services AND THE HOMEPAGE. It was the Services page's until the
 * homepage's success stories made way for it; both now render this, and
 * `enquiryAnchor` is what keeps each page's "Book A Call" on its own form.
 */
export function Works({ enquiryAnchor }: { enquiryAnchor: string }) {
  return (
    <div className="mt-[var(--nl-section-gap)]">
      <SectionHeader id="work" title={SECTIONS.work} link={{ label: LINKS.allWork }} />

      <div className="mt-5 flex flex-col gap-5">
        {WORKS.map((work) => (
          <WorkPanel key={work.title} work={work} enquiryAnchor={enquiryAnchor} />
        ))}
      </div>

      <SectionLink label={LINKS.allWork} />
    </div>
  );
}

/**
 * One project, in three columns: the copy and its call, the artwork, and a
 * Before / After toggle.
 *
 * WHAT THE THIRD COLUMN USED TO BE — a list of technology chips over a row of
 * five stock portraits. That is a developer's portfolio answering "what did
 * you build it with and who was on the team"; a local business wants to know
 * what changed. The toggle came off the success stories this section replaced,
 * where it was the one part worth keeping.
 *
 * INTERACTIVE WITHOUT JAVASCRIPT, the same radio-group trick the contact card
 * uses: one visually-hidden input per panel, labels styled as the buttons, and
 * `.nl-tabs` in globals.css doing the switching with `:has()`. The radio group
 * is named per project, so two panels on one page switch independently.
 *
 * THE GOLD BUTTON MOVED to the bottom of the FIRST column. It sat under the
 * chips and the portraits, which is where the design put it when that column
 * was a list; with a toggle there it would have been a call to action under a
 * pair of tab panels, competing with them for the same corner. The columns
 * stretch to a common height, so it lands at the same vertical position it
 * held before.
 *
 * WHERE IT GOES depends on the project: an entry with a case study sends you
 * there and says so, and one without falls back to "Book A Call" and the
 * page's own form. `linkToCaseStudy` turns the first off for the case-study
 * page itself, which would otherwise offer a button to the page you are on.
 */
export function WorkPanel({
  work,
  enquiryAnchor,
  linkToCaseStudy = true,
}: {
  work: Work;
  enquiryAnchor: string;
  linkToCaseStudy?: boolean;
}) {
  const Icon = WORK_ICONS[work.icon];
  const caseStudy = linkToCaseStudy ? work.href : undefined;
  const group = `nl-work-${work.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

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
              {/* The details ARE the case study, where there is one. */}
              <ArrowLink label={LINKS.details} href={caseStudy} />
            </div>
          </div>

          <dl className="flex flex-wrap gap-3">
            {[
              { term: LINKS.category, value: work.category },
              { term: LINKS.timeTaken, value: work.timeTaken },
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

          {/* `mt-auto` is what holds it to the bottom of the column. */}
          <Link
            href={caseStudy ?? enquiryAnchor}
            className="nl-label mt-auto flex w-full items-center justify-center rounded-[var(--nl-radius-control)] bg-[var(--nl-accent)] px-5 py-4 text-xs text-[#0f0f0f] lg:text-sm"
          >
            {caseStudy ? LINKS.viewCaseStudy : LINKS.bookACall}
          </Link>
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

        <div className="nl-tabs flex flex-col gap-4">
          <div
            role="group"
            aria-label={`${work.title}: before and after`}
            className="flex flex-wrap items-center gap-2 px-1"
          >
            {WORK_TABS.map((tab) => {
              const value = tab.toLowerCase();

              return (
                /*
                 * A Fragment rather than a wrapper element, so the input and
                 * its label are direct children of the row. The CSS matches
                 * the label with `input:checked + [data-tab-label]`, and an
                 * intervening element would break that adjacency.
                 */
                <Fragment key={tab}>
                  <input
                    type="radio"
                    name={group}
                    id={`${group}-${value}`}
                    value={value}
                    defaultChecked={tab === DEFAULT_WORK_TAB}
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

          {WORK_TABS.map((tab) => {
            const value = tab.toLowerCase() as Lowercase<typeof tab>;
            const panel = work.panels[value];

            return (
              <article
                key={tab}
                data-tab={value}
                className="nl-tab-panel flex-1 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 lg:p-8"
              >
                <h4 className="nl-heading text-xl lg:text-4xl">{panel.heading}</h4>
                <p className="mt-4 text-sm leading-relaxed text-[var(--nl-body)] lg:mt-6">
                  {panel.body}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}
