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
 * The gold disc with a dark arrow, on the three CTA tiles.
 *
 * Gold as a FILL, which is the treatment that stays legal on white — and the
 * arrow inside it is ink at 8.69:1. The dark design's version paints --ft-bg
 * into the arrow, which is white here and would put a 2.13:1 mark in the middle
 * of every tile.
 */
export function ArrowDisc() {
  return (
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--dl-gold)] text-[#1a1205] transition-transform group-hover:-translate-y-0.5">
      <ArrowUpRightIcon className="h-[18px] w-[18px]" />
    </span>
  );
}
