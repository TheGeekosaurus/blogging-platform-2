import { Fragment } from 'react';

import Link from 'next/link';

import { SERVICE_MARQUEE, STATS } from './content';
import {
  CONTACT_CHANNELS,
  CONTACT_PENDING,
  ENQUIRY_FIELDS,
  ENQUIRY_FORM_COPY,
  GET_STARTED_HERO,
  REACH_US,
} from './get-started-content';
import { ArrowDown, ArrowRight, ArrowUpRight } from './icons';
import { Marquee, Panel } from './primitives';
import { Faq, Testimonials } from './sections';

/**
 * The Nanotom Labs Get Started page — where the header's button lands.
 *
 * Built from the template's Contact frame, on the same grid as the other two
 * pages: a 1920 canvas with 48px margins (an 1824px panel) and 20px gutters.
 * Its shape is the frame's:
 *
 *   hero          copy card beside a 2x3 stat grid
 *   contact       tabbed channel card beside the enquiry form
 *   testimonials  (shared, from ./sections.tsx)
 *   FAQ           (shared)
 *
 * NO CLOSING CALL TO ACTION, unlike the other two pages. Theirs says "ready to
 * transform your digital presence? get in touch" — on the page that IS getting
 * in touch, a band telling the visitor to do the thing they are already doing
 * is noise between them and the form.
 *
 * NO MOBILE ARTBOARD was supplied for this frame either, so everything below
 * `lg` is an inference from the homepage's mobile frame: the stat grid moves
 * under the copy, the contact card above the form, and both go full width.
 */

/** The page's own form, which every call on it points at. */
const FORM_ANCHOR = '#enquiry';

function Hero() {
  return (
    <section className="grid gap-5 lg:min-h-[var(--nl-hero-h)] lg:grid-cols-[minmax(0,1207fr)_minmax(0,593fr)]">
      <div className="flex min-w-0 flex-col justify-between gap-8 rounded-[var(--nl-radius-block)] bg-[var(--nl-card)] p-5 pb-4 lg:p-12 lg:pb-5">
        <div>
          {/*
           * The same clamps as the other two heroes, for the same measured
           * reason — see the long note in ./home.tsx. The composition the
           * template builds here is the call anchored to the right of the
           * first line, with the second stacked beneath.
           */}
          <h1 className="nl-heading text-[clamp(24px,6.5vw,30px)] leading-[1.15] lg:text-[clamp(36px,3.3vw,62px)] lg:leading-[1.1]">
            <span className="grid gap-y-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-8">
              <span>{GET_STARTED_HERO.headingLines[0]}</span>

              <Link
                href={FORM_ANCHOR}
                className="group hidden shrink-0 items-center gap-3 justify-self-end lg:inline-flex"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[var(--nl-accent)] text-[var(--nl-accent)] transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="size-6" />
                </span>
                <span className="nl-label whitespace-nowrap text-base text-[var(--nl-accent)]">
                  {GET_STARTED_HERO.cta}
                </span>
              </Link>
            </span>

            {GET_STARTED_HERO.headingLines.slice(1).map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <Link
            href={FORM_ANCHOR}
            className="group mt-6 inline-flex items-center gap-3 lg:hidden"
          >
            <span className="grid size-10 place-items-center rounded-full border border-[var(--nl-accent)] text-[var(--nl-accent)]">
              <ArrowRight className="size-4" />
            </span>
            <span className="nl-label text-sm text-[var(--nl-accent)]">
              {GET_STARTED_HERO.cta}
            </span>
          </Link>

          <p className="mt-5 max-w-[910px] text-sm leading-relaxed text-[var(--nl-muted)] lg:mt-6 lg:text-lg">
            {GET_STARTED_HERO.body}
          </p>
        </div>

        <Marquee
          items={SERVICE_MARQUEE}
          durationSeconds={38}
          className="rounded-[var(--nl-radius-control)] bg-[var(--nl-bg)] py-4 lg:py-5"
        />
      </div>

      {/*
       * The same figures the other two pages band across the full width, here
       * stacked two-up beside the copy — which is the template's own idea and a
       * good one: on a contact page the numbers are the reason to bother
       * filling the form in, so they belong next to the invitation rather than
       * under it.
       *
       * The trailing tile is a call rather than a figure, exactly as in the
       * band, and it scrolls DOWN the page rather than away from it — hence
       * the down arrow instead of the up-right one every off-section link
       * uses.
       */}
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
          href={FORM_ANCHOR}
          className="group flex items-center justify-center gap-3 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] px-4 py-6"
        >
          <span className="nl-label text-xs text-[var(--nl-ink)]">{REACH_US}</span>
          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-current text-[var(--nl-ink)] transition-transform duration-200 group-hover:translate-y-px">
            <ArrowDown className="size-4" />
          </span>
        </Link>
      </div>
    </section>
  );
}

/**
 * The contact card: three tabs over a list of ways to reach the business.
 *
 * INTERACTIVE WITHOUT JAVASCRIPT, the same radio-group trick the success
 * stories use — one hidden input per tab, labels styled as the buttons, and
 * `.nl-tabset` in globals.css doing the switching. That keeps this a server
 * component; a `useState` toggle would put a client bundle on every route of
 * the site to swap between three short lists.
 *
 * Tabs are numbered rather than named so the CSS stays content-agnostic. See
 * the note on `.nl-tabset`.
 */
function ContactChannels() {
  return (
    <div className="nl-tabset flex flex-col gap-5 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 lg:p-8">
      <div
        role="group"
        aria-label="Ways to reach us"
        className="flex flex-wrap items-center gap-2"
      >
        {CONTACT_CHANNELS.map((channel, index) => {
          const value = String(index + 1);

          return (
            /*
             * A Fragment, not a wrapper: the CSS matches the label with
             * `input:checked + [data-tab-label]`, and an element between them
             * would break that adjacency.
             */
            <Fragment key={channel.name}>
              <input
                type="radio"
                name="nl-contact-channel"
                id={`nl-contact-${value}`}
                value={value}
                defaultChecked={index === 0}
                className="sr-only"
              />
              <label
                htmlFor={`nl-contact-${value}`}
                data-tab-label={value}
                className="nl-label cursor-pointer rounded-[var(--nl-radius-control)] px-4 py-2.5 text-[10px] transition-colors lg:text-xs"
              >
                {channel.name}
              </label>
            </Fragment>
          );
        })}
      </div>

      {CONTACT_CHANNELS.map((channel, index) => (
        <div key={channel.name} data-tabpanel={String(index + 1)}>
          <dl className="flex flex-col gap-4">
            {channel.entries.map((entry) => (
              <div key={entry.label}>
                <dt className="text-sm text-[var(--nl-muted)]">{entry.label}</dt>

                {/*
                 * Unlinked while the detail is missing, and never invented —
                 * see the note in ./get-started-content.ts. A plausible-looking
                 * address that nobody reads swallows enquiries silently, which
                 * is the one failure this page exists to prevent.
                 */}
                <dd className="mt-2">
                  {entry.value && entry.href ? (
                    <a
                      href={entry.href}
                      className="nl-label flex items-center justify-between gap-4 rounded-[var(--nl-radius-control)] bg-[var(--nl-raised)] px-4 py-4 text-xs text-[var(--nl-ink)] transition-colors hover:bg-[var(--nl-line-strong)] lg:text-sm"
                    >
                      {entry.value}
                      <ArrowUpRight className="size-4 shrink-0 text-[var(--nl-accent)]" />
                    </a>
                  ) : (
                    <span className="nl-label flex items-center rounded-[var(--nl-radius-control)] bg-[var(--nl-raised)] px-4 py-4 text-xs text-[var(--nl-muted)] lg:text-sm">
                      {CONTACT_PENDING}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

/**
 * The enquiry form.
 *
 * PRESENTATIONAL, like the two already on the site: no endpoint, so every
 * control is disabled and there is no <form> element at all — a bare form would
 * post to the current URL on Enter and look like it had worked. On the page
 * whose entire job is capturing an enquiry, a field that accepts an address and
 * discards it is the most expensive thing that could ship here.
 */
function EnquiryForm() {
  return (
    <div
      id="enquiry"
      className="scroll-mt-28 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 lg:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {ENQUIRY_FIELDS.map((field) => (
          <div key={field.id} className={field.half ? undefined : 'sm:col-span-2'}>
            <label htmlFor={field.id} className="nl-label text-[10px] text-[var(--nl-muted)] lg:text-xs">
              {field.label}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                id={field.id}
                rows={5}
                disabled
                placeholder={field.placeholder}
                className="mt-3 w-full resize-none rounded-[var(--nl-radius-input)] border border-[var(--nl-line)] bg-[var(--nl-raised)] px-4 py-3.5 text-sm text-[var(--nl-body)] outline-none placeholder:text-[var(--nl-muted)]"
              />
            ) : (
              <input
                id={field.id}
                type={field.type}
                disabled
                placeholder={field.placeholder}
                className="mt-3 w-full rounded-[var(--nl-radius-input)] border border-[var(--nl-line)] bg-[var(--nl-raised)] px-4 py-3.5 text-sm text-[var(--nl-body)] outline-none placeholder:text-[var(--nl-muted)]"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <input
            id="gs-consent"
            type="checkbox"
            disabled
            className="mt-0.5 size-4 shrink-0 rounded-[var(--nl-radius-badge)] border border-[var(--nl-line-strong)] bg-[var(--nl-raised)]"
          />
          <label htmlFor="gs-consent" className="text-sm text-[var(--nl-muted)]">
            {ENQUIRY_FORM_COPY.consent}
          </label>
        </div>

        <button
          type="button"
          disabled
          className="nl-label shrink-0 rounded-[var(--nl-radius-control)] bg-[var(--nl-accent)] px-8 py-4 text-xs text-[#0f0f0f] lg:text-sm"
        >
          {ENQUIRY_FORM_COPY.submit}
        </button>
      </div>
    </div>
  );
}

/**
 * The contact block: channels beside the form.
 *
 * The artwork's split is 570:1250 — the form gets the room, because it is what
 * the page is for and the channel card is three short lists. Below `lg` the
 * card sits above the form rather than beside it.
 */
function Contact() {
  return (
    <Panel className="mt-[var(--nl-section-gap)]">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,570fr)_minmax(0,1250fr)]">
        <ContactChannels />
        <EnquiryForm />
      </div>
    </Panel>
  );
}

export function LabsGetStarted() {
  return (
    <div className="px-4 pb-6 pt-4 lg:px-[50px] lg:pt-5">
      <Hero />
      <Contact />
      <Testimonials />
      <Faq />
    </div>
  );
}
