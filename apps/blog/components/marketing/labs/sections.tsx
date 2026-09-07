import Image from 'next/image';
import Link from 'next/link';

import {
  CLOSING_CTA,
  ENQUIRY_FORM,
  FAQS,
  LINKS,
  SECTIONS,
  STATS,
  STATS_CTA,
  TESTIMONIALS,
} from './content';
import { ArrowRight, Plus } from './icons';
import { ArrowLink, Panel, SectionHeader, SectionLink } from './primitives';

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
      <SectionHeader id="faq" title={SECTIONS.faq} link={{ label: LINKS.viewAll }} />

      <div className="nl-faq mt-5 grid gap-5 lg:grid-cols-[minmax(0,1054fr)_minmax(0,746fr)]">
        <div className="flex flex-col gap-4">
          {FAQS.map((faq, index) => (
            <details
              key={faq.question}
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

      <SectionLink label={LINKS.viewAll} />
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
