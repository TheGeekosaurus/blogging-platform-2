/*
 * Icons for the /home-v2 page.
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
