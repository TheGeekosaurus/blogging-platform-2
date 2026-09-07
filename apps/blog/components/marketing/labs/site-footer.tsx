import Link from 'next/link';

import {
  COPYRIGHT,
  FOOTER_COLUMNS,
  LEGAL_LINKS,
  SOCIAL_CARDS,
  type FooterLink,
} from './brand';
import { SOCIAL_MARQUEE } from './content';
import { NEWSLETTER } from './content';
import { ArrowUpRight, SOCIAL_ICONS } from './icons';
import { Marquee } from './primitives';

/**
 * Nanotom Labs' footer, including the social marquee that runs above it.
 *
 * The marquee lives here rather than on the homepage because it is chrome: it
 * sits between the last section and the footer on every frame in the design,
 * so a page that forgot to render it would have the footer butt straight
 * against its content.
 *
 * LAYOUT. Desktop is two tracks — four social cards in a 2×2 on the left,
 * link columns above the newsletter on the right — in roughly a 3:5 split,
 * measured off the frame (social cards span x=89–660, the link area
 * x=867–1820).
 *
 * Mobile drops the social cards entirely and reflows the links to 2×2. That is
 * the mobile artboard's own decision, not a simplification: the cards carry
 * blurbs that would stack into a very tall column for four links nobody has
 * asked for yet. Hidden with `hidden lg:grid` rather than removed, so the
 * desktop layout still matches the design exactly.
 */

function FooterLinkItem({ link }: { link: FooterLink }) {
  const label = (
    <span className="inline-flex flex-wrap items-center gap-2">
      {link.label}
      {link.badge ? (
        <span className="nl-label rounded-[var(--nl-radius-badge)] bg-[var(--nl-raised)] px-2 py-0.5 text-[10px] text-[var(--nl-muted)]">
          {link.badge}
        </span>
      ) : null}
    </span>
  );

  if (!link.href) {
    return <li className="text-sm text-[var(--nl-muted)]">{label}</li>;
  }

  return (
    <li>
      <Link
        href={link.href}
        className="text-sm text-[var(--nl-body)] transition-colors hover:text-[var(--nl-ink)]"
      >
        {label}
      </Link>
    </li>
  );
}

function SocialCards() {
  return (
    <div className="hidden min-w-0 grid-cols-2 content-start gap-5 xl:grid">
      {SOCIAL_CARDS.map((card) => {
        const Icon = SOCIAL_ICONS[card.icon];

        return (
          <div
            key={card.name}
            className="flex flex-col justify-between gap-6 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5"
          >
            <div className="flex items-start justify-between">
              <span className="grid size-11 place-items-center rounded-[var(--nl-radius-control)] bg-[var(--nl-raised)] text-[var(--nl-accent)]">
                <Icon className="size-5" />
              </span>
              <ArrowUpRight className="size-5 text-[var(--nl-muted)]" />
            </div>

            <div>
              <p className="nl-heading text-xl">{card.name}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--nl-muted)]">
                {card.blurb}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Newsletter() {
  return (
    <div className="rounded-[var(--nl-radius-card-lg)] bg-[var(--nl-card)] p-5 lg:p-7">
      <p className="nl-label text-xs text-[var(--nl-muted)]">{NEWSLETTER.eyebrow}</p>

      <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <p className="nl-heading text-lg lg:text-2xl">{NEWSLETTER.heading}</p>

        {/*
         * Presentational only — there is no list to subscribe to yet, so the
         * field is disabled rather than posting nowhere. A form that silently
         * discards an address is worse than one that is visibly not ready.
         */}
        <div className="flex w-full min-w-0 items-center gap-3 rounded-[var(--nl-radius-card-lg)] border border-[var(--nl-line)] bg-[var(--nl-raised)] py-2 pl-5 pr-2 lg:w-[380px] lg:max-w-full lg:shrink">
          <label htmlFor="nl-newsletter" className="sr-only">
            {NEWSLETTER.placeholder}
          </label>
          <input
            id="nl-newsletter"
            type="email"
            disabled
            placeholder={NEWSLETTER.placeholder}
            className="w-full bg-transparent text-sm text-[var(--nl-body)] outline-none placeholder:text-[var(--nl-muted)]"
          />
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--nl-accent)] text-[#0f0f0f]"
          >
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function LabsFooter() {
  return (
    <footer className="px-4 pb-4 lg:px-[50px] lg:pb-6">
      <Marquee
        items={Array.from({ length: 6 }, () => SOCIAL_MARQUEE)}
        durationSeconds={55}
        className="mt-[var(--nl-section-gap)] rounded-[var(--nl-radius-control)] bg-[var(--nl-card)] py-4 lg:py-5"
      />

      {/*
        * No outer panel. The artwork puts the footer's cards straight on the
        * page ground — a 2x2 of social cards on the left (364px each) beside a
        * stack of links, newsletter and legal on the right (1053px), which is
        * where the 748:1053 split below comes from. An enclosing panel would
        * add a tone the design does not have and swallow the gaps between the
        * cards.
        */}
      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,748fr)_minmax(0,1053fr)]">
        <SocialCards />

        <div className="grid min-w-0 content-start gap-5">
          <div className="grid min-w-0 grid-cols-2 gap-8 rounded-[var(--nl-radius-block)] bg-[var(--nl-card)] p-5 lg:p-7 xl:grid-cols-4">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.heading} className="min-w-0">
                <p className="nl-heading text-sm lg:text-base">{column.heading}</p>
                <ul className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <FooterLinkItem key={link.label} link={link} />
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Newsletter />

          {/* The legal row is its own card in the artwork, not loose text. */}
          <div className="flex flex-col gap-3 rounded-[var(--nl-radius-card-lg)] bg-[var(--nl-card)] px-5 py-5 text-sm text-[var(--nl-muted)] lg:flex-row lg:items-center lg:justify-between lg:px-7">
            <p>{COPYRIGHT}</p>
            <ul className="flex flex-col gap-3 lg:flex-row lg:gap-10">
              {LEGAL_LINKS.map((link) => (
                <FooterLinkItem key={link.label} link={link} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
