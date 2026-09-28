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
