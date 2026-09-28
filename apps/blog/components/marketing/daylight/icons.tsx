/*
 * Daylight's own icons.
 *
 * Only marks the dark design does not already have. Everything in ft/icons.tsx
 * is single-tone on a 24-unit grid at a 1.6 stroke and takes its colour from
 * whatever `text-*` class it carries, so it works unchanged here — these follow
 * the same rules rather than introducing a second drawing convention.
 */

type IconProps = { className?: string };

/**
 * A tick inside a ring, for the reassurance row under the hero's CTA.
 *
 * Distinct from ft/icons.tsx's CheckIcon, which is a bare tick used inside
 * comparison tables where the row itself supplies the frame. Here the mark
 * stands alone beside a short claim and needs its own.
 *
 * The stroke is 1.6 to match the file it sits beside, not CheckIcon's 2.2:
 * that heavier weight is there to survive being small in a dense table, and at
 * this size next to body text it reads as a different icon set.
 */
export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.2 2.7 2.7L16 9.6" />
    </svg>
  );
}
