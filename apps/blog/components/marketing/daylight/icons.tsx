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

/**
 * Agriculture — an ear of wheat on its stalk.
 *
 * STRAIGHT STROKES, NOT TEARDROPS. It was drawn once with curved florets
 * overlapping the stem, which is what an ear actually looks like and which at
 * the 20px the dropdown renders it collapsed into a blob — the curves closed up
 * against each other and the mark lost its silhouette. Three separated pairs of
 * straight grains read as wheat at that size and still do at 48.
 */
export function WheatIcon({ className }: IconProps) {
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
      <path d="M12 21V6.5" />
      <path d="M12 9.2 8.6 6.6M12 9.2l3.4-2.6" />
      <path d="M12 13.4 8.6 10.8M12 13.4l3.4-2.6" />
      <path d="M12 17.6 8.6 15M12 17.6l3.4-2.6" />
    </svg>
  );
}

/**
 * Accounting — a ledger, open at two columns of entries.
 *
 * NOT ft/icons.tsx's InvoiceIcon, although both are paper with ruling on them.
 * That mark is a single torn-off sheet and it already means receivables
 * financing in the funding menu one dropdown away; two menus on the same header
 * printing the same glyph for two different ideas is the thing to avoid. A book
 * with a spine reads as the practice rather than as one document.
 */
export function LedgerIcon({ className }: IconProps) {
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
      <path d="M3.5 5.2A1.2 1.2 0 0 1 4.7 4h5.1c1.2 0 2.2 1 2.2 2.2V20a2 2 0 0 0-2-2H4.7a1.2 1.2 0 0 1-1.2-1.2V5.2Z" />
      <path d="M20.5 5.2A1.2 1.2 0 0 0 19.3 4h-5.1A2.2 2.2 0 0 0 12 6.2V20a2 2 0 0 1 2-2h5.3a1.2 1.2 0 0 0 1.2-1.2V5.2Z" />
      <path d="M6 8.5h3.2M6 11.5h3.2M14.8 8.5H18M14.8 11.5H18" />
    </svg>
  );
}

/** Auto Repair — a car under a spanner. */
export function CarIcon({ className }: IconProps) {
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
      <path d="M4.2 17.2h15.6a1 1 0 0 0 1-1v-2.4a2 2 0 0 0-1.5-1.94l-1.4-.36-1.9-3.3a2 2 0 0 0-1.73-1H9.73a2 2 0 0 0-1.73 1l-1.9 3.3-1.4.36A2 2 0 0 0 3.2 13.8v2.4a1 1 0 0 0 1 1Z" />
      <path d="M5.4 11.5h13.2" />
      <circle cx="7.6" cy="17.2" r="1.8" />
      <circle cx="16.4" cy="17.2" r="1.8" />
    </svg>
  );
}

/** Chiropractor — a spine, seen from the side. */
export function SpineIcon({ className }: IconProps) {
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
      <path d="M13.4 3.2c-1.6 1.6-2.2 3-2 4.6.2 1.6 1 2.6 1 4.2 0 1.6-.8 2.6-1 4.2-.2 1.6.4 3 2 4.6" />
      <path d="M13.9 5.4H10.2M13.2 8.6H9.5M13.1 11.9H9.4M13.2 15.2H9.5M13.9 18.4H10.2" />
    </svg>
  );
}
