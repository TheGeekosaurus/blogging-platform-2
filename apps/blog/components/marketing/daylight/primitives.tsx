import Link from 'next/link';

import { ArrowUpRightIcon } from '../ft/icons';

/*
 * Daylight's own small pieces.
 *
 * Only what the dark design cannot lend. Everything in ft/primitives.tsx paints
 * from --ft-* tokens and already comes out light under `.dl-surface`, so Chip,
 * GhostButton and SectionHead are imported from there and re-exported rather
 * than copied — a copy would be two section headers that have to stay the same
 * section header, which is exactly what that file's own comment warns about.
 *
 * The CALL TO ACTION is shared too, and that one is worth spelling out. It
 * would have been easy to write a light twin of ../cta-button.tsx here, since
 * its white-on-gold label measures 2.13:1 and has to change. But a twin is a
 * second button to keep in step, and the shared one is already rendered inside
 * ft/shared-sections — the timeline's "Get Funded", the one under the funding
 * cards — which this page imports whole. A twin would have fixed the buttons
 * this file writes and left those two failing.
 *
 * So the fix is a marker class on the shared button and one rule in
 * globals.css, scoped to `.dl-surface`. Every CTA on this page gets an ink
 * label, including the ones inside components this file never touches, and the
 * live dark site is not moved at all.
 */

export { CONTAINER, Chip, GhostButton, SectionHead } from '../ft/primitives';
export { CtaButton } from '../cta-button';

/**
 * The solid navy button, for a secondary action that still has to be found.
 *
 * It replaces GhostButton on the funding cards. A ghost button is a bordered
 * outline over --ft-card, which on this palette is a near-white panel on a
 * near-white page: at the bottom of a long card it was the faintest thing in
 * the section, and "Learn More" is the only way into four product pages.
 *
 * Navy at 12.86:1 against its white label, and the same pill the header wore
 * before its button went gold — which is where Denis pointed for this. Gold
 * stays the primary action and navy is the secondary one, so the two never
 * compete for the same click.
 *
 * next/link for internal destinations, a plain anchor for off-site ones, for
 * the reason GhostButton does it: `trailingSlash: true` means an internal path
 * costs a 308 redirect as a bare <a>, and Link both skips that hop and
 * prefetches.
 */
export function SolidButton({
  children,
  href,
  external,
}: {
  children: React.ReactNode;
  href?: string;
  external?: boolean;
}) {
  const className =
    'inline-flex shrink-0 items-center gap-2.5 rounded-full bg-[var(--ft-ink)] px-6 py-3 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-[#123a8f]';
  const label = (
    <>
      {children}
      <ArrowUpRightIcon className="h-4 w-4" />
    </>
  );

  if (href && !external) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a
      href={href ?? '#'}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className={className}
    >
      {label}
    </a>
  );
}

/**
 * The cyan disc with a navy arrow, on the three destination cards.
 *
 * CYAN AND NOT GOLD, though it was gold first. The palette reserves gold for
 * the one warm call to action on a cool page, and a gold disc on every card
 * broke that rule three times over on a single row — and sat beside a teal icon
 * inside the same card, so each card carried two unrelated accents.
 *
 * Cyan as a FILL is the treatment that is legal on both grounds this disc
 * appears on: navy on #0AC4E0 is 6.12:1. The dark design's version paints
 * --ft-bg into the arrow, which would be white here and put a 2.10:1 mark in
 * the middle of every card.
 */
export function ArrowDisc() {
  return (
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--dl-pop)] text-[var(--dl-deep)] transition-transform group-hover:-translate-y-0.5">
      <ArrowUpRightIcon className="h-[18px] w-[18px]" />
    </span>
  );
}
