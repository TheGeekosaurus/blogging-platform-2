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

/**
 * The three marks the "difference" rows need that ft/icons.tsx has no
 * equivalent for. The fourth row reuses CashFlowIcon, whose two-way arrow is
 * already the glyph that section wants for speed.
 *
 * Drawn on the same 24-unit grid at the same 1.6 stroke, so they sit in a row
 * with it without looking like a second icon set.
 */

/** A dial, for the credit-score row. */
export function GaugeIcon({ className }: IconProps) {
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
      <path d="M3.5 18a9 9 0 1 1 17 0" />
      <path d="m12 14 4.2-4.2" />
      <circle cx="12" cy="15.4" r="1.4" />
    </svg>
  );
}

/** A padlock, for the data row. */
export function LockIcon({ className }: IconProps) {
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
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <path d="M12 14.4v2.2" />
    </svg>
  );
}

/** One person, for the support row. */
export function PersonIcon({ className }: IconProps) {
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
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

/* --- Nav glyphs -----------------------------------------------------------
 *
 * The two industries in NAV have no mark in ft/icons.tsx, whose set is built
 * around what funding is spent ON rather than who spends it. Everything the
 * funding menu needs is already there and is reused; only these two are drawn.
 */

/**
 * Working Capital — a wallet.
 *
 * ft/icons.tsx has no mark for money on hand. Its nearest candidates are drawn
 * for the "what can you do with funding" grid and say the wrong thing beside a
 * product name: PayrollIcon is two people and reads as "team", InventoryIcon is
 * stacked boxes and reads as "stock". Working capital is neither of those, it
 * is the cash that covers them.
 */
export function WalletIcon({ className }: IconProps) {
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
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H17v3" />
      <path d="M3 7.5V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2.5" />
      <path d="M21 14.5v-3a1 1 0 0 0-1-1h-3.2a2.5 2.5 0 0 0 0 5H20a1 1 0 0 0 1-1Z" />
    </svg>
  );
}

/** Food Business — an awning over a counter. */
export function StorefrontIcon({ className }: IconProps) {
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
      <path d="M4 9.5h16" />
      <path d="M4.8 4.5h14.4l1.3 5H3.5l1.3-5Z" />
      <path d="M5 9.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
      <path d="M9.5 20v-5.5h5V20" />
    </svg>
  );
}

/** Construction Business — a hard hat. */
export function HardHatIcon({ className }: IconProps) {
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
      <path d="M4 15.5a8 8 0 0 1 16 0" />
      <path d="M9.6 8.2V4.8h4.8v3.4" />
      <path d="M3 15.5h18a1 1 0 0 1 1 1v1.2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1.2a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
