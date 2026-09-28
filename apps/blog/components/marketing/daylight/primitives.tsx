import Link from 'next/link';

import { ArrowUpRightIcon } from '../ft/icons';

/*
 * Daylight's own small pieces.
 *
 * Only what the dark design cannot lend. Chip and GhostButton paint from --ft-*
 * tokens and already come out light under `.dl-surface`, so they are imported
 * from ft/primitives and re-exported rather than copied.
 *
 * SectionHead is NOT among them any more. It draws a full-bleed banner across
 * the page above its section, which is the FutureTech template's device and the
 * thing Denis asked to remove — see SectionIntro below.
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

export { CONTAINER, Chip, GhostButton } from '../ft/primitives';
import { Chip, GhostButton } from '../ft/primitives';
export { CtaButton } from '../cta-button';

/**
 * The solid navy button, for a secondary action that still has to be found.
 *
 * It replaces GhostButton on the funding cards. A ghost button is a bordered
 * outline over --ft-card, which on this palette is a near-white panel on a
 * near-white page: at the bottom of a long card it was the faintest thing in
 * the section, and "Learn More" is the only way into four product pages.
 *
 * Navy at 12.86:1 against its white label, in the same rounded rectangle the
 * header's button uses — the live site's shape for every button. Gold stays
 * the primary action and navy the secondary one, so the two never compete
 * for the same click.
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
    'inline-flex shrink-0 items-center gap-2.5 rounded-md bg-[var(--ft-ink)] px-6 py-3 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-[#123a8f]';
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
 * The gold disc with an ink arrow, on the three destination cards.
 *
 * It went cyan for a round, on the argument that gold was reserved for the one
 * warm call to action. Gold is the call-to-action colour everywhere now — the
 * header, the hero card, the section buttons — so the disc rejoining it makes
 * the card's affordance read as the same thing as every other action on the
 * page rather than as a fourth accent.
 *
 * Still a disc, not a rounded rectangle: it is an affordance mark inside a link
 * whose whole card is the target, not a button of its own, and the dark design
 * draws it the same way.
 *
 * The arrow is ink at 8.69:1. The dark design paints --ft-bg into it, which is
 * white here and would be 2.13:1.
 */
export function ArrowDisc() {
  return (
    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--dl-gold)] text-[#1a1205] transition-transform group-hover:-translate-y-0.5">
      <ArrowUpRightIcon className="h-[18px] w-[18px]" />
    </span>
  );
}

/**
 * A section's opening, without the banner.
 *
 * SectionHead — still in ft/primitives, still what the dark homepage uses —
 * paints a full-bleed band across the page and puts the chip, the heading and
 * any action inside it. Denis asked for those headers to move down into the
 * sections they introduce and for the bands to go, so this is the same content
 * with no ground of its own: it inherits whatever the section it opens is
 * standing on.
 *
 * WHICH IS WHY THE HEADING TAKES NO COLOUR HERE. It reads --ft-ink, so a
 * section that re-points that token gets the right heading automatically —
 * which is exactly what the use-of-funds section does to put a white heading on
 * the artwork. Hard-coding a colour would have made that section a special
 * case; leaving it to the token makes it just another ground.
 */
export function SectionIntro({
  label,
  heading,
  cta,
  ctaHref,
  ctaExternal,
  id,
  className = '',
}: {
  label: string;
  heading: string;
  cta?: string;
  ctaHref?: string;
  ctaExternal?: boolean;
  id?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-16 ${className}`}
    >
      <div className="flex flex-col items-start gap-4">
        <Chip>{label}</Chip>
        <h2
          id={id}
          className="max-w-[26ch] font-[family-name:var(--font-headline)] text-[clamp(1.875rem,4vw,2.875rem)] font-medium leading-[1.12] text-[var(--ft-ink)]"
        >
          {heading}
        </h2>
      </div>
      {cta ? (
        <GhostButton href={ctaHref} external={ctaExternal}>
          {cta}
        </GhostButton>
      ) : null}
    </div>
  );
}
