/*
 * Icons for the homepage.
 *
 * All hand-drawn on a 24-unit grid at a shared 1.6 stroke, and all single-tone,
 * so they take their colour from whatever `text-*` class is on them.
 *
 * The seven two-tone marks exported from the Figma template used to live here.
 * They went when the sections that used them did: the page is a funding site
 * now, and an abstract prism meant nothing next to "Cover payroll". They are in
 * git history if a use for them ever comes back.
 */

type IconProps = { className?: string };

/* ---------------------------------------------------------------------------
 * UI icons
 * ------------------------------------------------------------------------- */

/** The arrow every button and tile in this design ends with. */
export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

/**
 * One review star.
 *
 * FILLED, not stroked — the only solid mark in this file, because the template
 * draws its stars solid and a 1.6-stroke outline at 16px reads as a smudge. It
 * still takes its colour from `text-*` like the rest: `fill="currentColor"`
 * rather than a hardcoded gold, so an empty star is the same path in a dimmer
 * class and the two always line up exactly.
 */
export function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.6l2.9 5.88 6.49.95-4.7 4.58 1.11 6.46L12 17.42l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.95L12 2.6z" />
    </svg>
  );
}

/** Pro rows in the product comparison. */
export function CheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m4 12.5 5.2 5.2L20 7" />
    </svg>
  );
}

/** Con rows in the product comparison. Not a cross — these are trade-offs. */
export function MinusIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

/** The mark beside the FAQ heading. */
export function HelpIcon({ className }: IconProps) {
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
      <circle cx="12" cy="12" r="9.25" />
      <path d="M9.3 9.1a2.8 2.8 0 1 1 3.5 3.2c-.5.2-.8.7-.8 1.3v.6" />
      <path d="M12 17.2h.01" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
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
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Funding icons
 *
 * Drawn for the sections the template had no equivalent of. Same 24-unit grid
 * and 1.6 stroke as the UI icons above, so they sit together.
 * ------------------------------------------------------------------------- */

function Line({ children, className }: { children: React.ReactNode; className?: string }) {
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
      {children}
    </svg>
  );
}

/** Funding options — stacked coins. */
export function CoinsIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v5c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 11v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
    </Line>
  );
}

/** Loan calculator. */
export function CalculatorIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
    </Line>
  );
}

/** DIY programs — a rising chart, i.e. getting funding-ready. */
export function GrowthIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7.5 15 3.5-4 3 2.5L19 8" />
      <path d="M19 8h-3.5M19 8v3.5" />
    </Line>
  );
}

/* --- The eight "what you can do with funding" glyphs --------------------- */

export function InventoryIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z" />
      <path d="M3 12.5 12 17l9-4.5" />
      <path d="M3 16.5 12 21l9-4.5" />
    </Line>
  );
}

export function PayrollIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16.5 6.2a3.2 3.2 0 0 1 0 6" />
      <path d="M18 20a6 6 0 0 0-2.2-4.6" />
    </Line>
  );
}

export function ExpandIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M3 21h18" />
      <path d="M5 21V9l6-4 6 4v12" />
      <path d="M9.5 21v-4.5h5V21" />
    </Line>
  );
}

export function MarketingIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M4 10v4a1 1 0 0 0 1 1h2.5L14 19V5L7.5 9H5a1 1 0 0 0-1 1Z" />
      <path d="M17.5 9.5a4 4 0 0 1 0 5" />
      <path d="M20 7a7.5 7.5 0 0 1 0 10" />
    </Line>
  );
}

export function CashFlowIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M4 8h13" />
      <path d="m14 5 3 3-3 3" />
      <path d="M20 16H7" />
      <path d="m10 13-3 3 3 3" />
    </Line>
  );
}

export function EquipmentIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M14.5 5.5a4 4 0 0 0-5.4 5.4L4 16l4 4 5.1-5.1a4 4 0 0 0 5.4-5.4l-2.7 2.7-2.4-2.4 2.7-2.7Z" />
    </Line>
  );
}

export function HiringIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <circle cx="10" cy="8" r="3.2" />
      <path d="M4 20a6 6 0 0 1 12 0" />
      <path d="M18 7v6M15 10h6" />
    </Line>
  );
}

export function ConsolidateIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M4 5h5a3 3 0 0 1 3 3v8a3 3 0 0 0 3 3h5" />
      <path d="M4 19h5a3 3 0 0 0 3-3" />
      <path d="m17 13 3 3-3 3" />
    </Line>
  );
}

/* --- The funding-product glyphs ------------------------------------------
 *
 * Distinct from the eight above, which answer "what will the money be spent
 * on?" — these answer "what kind of money is it?". The two sets were allowed to
 * share marks until the core list grew to nine and the nearest stand-ins
 * started saying the wrong thing beside a product name: stacked boxes read as
 * "stock", which is right for Inventory Financing and wrong for everything
 * else.
 *
 * Keyed from FUNDING_PROGRAMS in ../brand and drawn by the maps in
 * ./funding-solutions.tsx and ../daylight/site-header.tsx. Both maps must cover
 * every key in that array; a test holds them to it.
 * ---------------------------------------------------------------------- */

/**
 * Working Capital — a wallet.
 *
 * Lives here rather than in daylight/icons.tsx, where it was first drawn for
 * the dropdown. It is a product mark, not a Daylight one, and the
 * /funding-solutions list needs it too — a glyph in the light theme's folder
 * that the dark theme's page imports is the wrong way round.
 */
export function WalletIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H17v3" />
      <path d="M3 7.5V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2.5" />
      <path d="M21 14.5v-3a1 1 0 0 0-1-1h-3.2a2.5 2.5 0 0 0 0 5H20a1 1 0 0 0 1-1Z" />
    </Line>
  );
}

/**
 * SBA Loans — a pediment over columns.
 *
 * The institutional building, which is what distinguishes an SBA loan from
 * every other row in the menu: the terms are set by a federal agency rather
 * than by the lender. ExpandIcon is also a building and is NOT reused here — it
 * is a house gable with a door, drawn for "expand the premises", and the two
 * sitting three rows apart in the same dropdown would read as the same idea.
 */
export function BankIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="m3 9 9-5 9 5" />
      <path d="M3.5 9.5h17" />
      <path d="M6 12v6M10 12v6M14 12v6M18 12v6" />
      <path d="M3 20.5h18" />
    </Line>
  );
}

/** Receivables Financing — an invoice with a line of figures. */
export function InvoiceIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M6 3h9l4 4v12.5l-2.2-1.4-2.3 1.4-2.3-1.4-2.3 1.4L5.7 18V4.3" />
      <path d="M15 3v4h4" />
      <path d="M8.5 10.5h7M8.5 14h4.5" />
    </Line>
  );
}

/**
 * Bridge Loans — a span on two piers.
 *
 * The literal reading of the name, and the literal one is right: a bridge loan
 * is the crossing between one financing and the next, so the mark carries the
 * product's whole idea rather than decorating it.
 */
export function BridgeIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M2 10h20" />
      <path d="M2 10v8M22 10v8" />
      <path d="M6 10v4M18 10v4" />
      <path d="M2 14c4.5 0 6.5-4 10-4s5.5 4 10 4" />
    </Line>
  );
}
