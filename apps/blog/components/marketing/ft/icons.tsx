/*
 * Icons for the /home-v2 design.
 *
 * The seven BRAND icons below are the template's own marks, exported as SVG
 * straight from the Figma file (node ids in each comment) rather than redrawn or
 * regenerated — so they are geometrically exact, ~300-900 bytes each, and need
 * no image request.
 *
 * Each is two-tone in the source: a #FFD11A accent half and a #404040 dim half.
 * Both are re-pointed at CSS custom properties here, so the whole set follows
 * `--ft-accent` / `--ft-icon-dim` and re-colouring the page never means editing
 * path data. That is also why they are not `currentColor`: the dim half has to
 * stay independent of the accent, and `currentColor` only carries one value.
 *
 * The small UI icons at the bottom are hand-drawn on a 24-unit grid. They are
 * generic shapes (arrow, heart, star…) where matching the template exactly buys
 * nothing, and a shared stroke width matters more than provenance.
 */

type IconProps = { className?: string };

const ACCENT = 'var(--ft-accent)';
const DIM = 'var(--ft-icon-dim)';

/** Figma 226:11526 — hero tile 1. */
export function SparkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 50 50" fill="none" className={className} aria-hidden="true">
      <path d="M28.9275 34.4167H21.1219V50H28.9275V34.4167Z" fill={ACCENT} />
      <path d="M28.9275 0H21.1219V15.5833H28.9275V0Z" fill={ACCENT} />
      <path d="M34.4097 21.0945V28.9001H49.993V21.0945H34.4097Z" fill={ACCENT} />
      <path d="M0 21.1016L0 28.9072H15.5833V21.1016H0Z" fill={ACCENT} />
      <path
        d="M34.4245 28.8769L28.9051 34.3962L39.9241 45.4151L45.4434 39.8958L34.4245 28.8769Z"
        fill={DIM}
      />
      <path
        d="M10.0906 4.54558L4.57129 10.0649L15.5903 21.0839L21.1096 15.5646L10.0906 4.54558Z"
        fill={DIM}
      />
      <path
        d="M28.8859 15.5885L34.4053 21.1078L45.4242 10.0888L39.9049 4.56949L28.8859 15.5885Z"
        fill={DIM}
      />
      <path
        d="M4.55723 39.9197L10.0765 45.439L21.0955 34.42L15.5762 28.9007L4.55723 39.9197Z"
        fill={DIM}
      />
    </svg>
  );
}

/** Figma 226:11598 — hero tile 2. */
export function CloverIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 50 50" fill="none" className={className} aria-hidden="true">
      <path
        d="M25 35C25 40.5228 29.4772 45 35 45C40.5228 45 45 40.5228 45 35C45 29.4772 40.5228 25 35 25H25V35Z"
        fill={ACCENT}
      />
      <path
        d="M25 15C25 9.47715 20.5228 5 15 5C9.47715 5 5 9.47715 5 15C5 20.5228 9.47715 25 15 25H25V15Z"
        fill={ACCENT}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M35 5C29.4772 5 25 9.47715 25 15V25H35C40.5228 25 45 20.5228 45 15C45 9.47715 40.5228 5 35 5ZM40 15C40 17.7614 37.7614 20 35 20C32.2386 20 30 17.7614 30 15C30 12.2386 32.2386 10 35 10C37.7614 10 40 12.2386 40 15Z"
        fill={DIM}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15 45C20.5228 45 25 40.5228 25 35V25H15C9.47715 25 5 29.4772 5 35C5 40.5228 9.47715 45 15 45ZM20 35C20 37.7614 17.7614 40 15 40C12.2386 40 10 37.7614 10 35C10 32.2386 12.2386 30 15 30C17.7614 30 20 32.2386 20 35Z"
        fill={DIM}
      />
    </svg>
  );
}

/** Figma 226:11865 — hero tile 3. */
export function LeafIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 50 50" fill="none" className={className} aria-hidden="true">
      <path d="M5 5H25C36.0457 5 45 13.9543 45 25H25C13.9543 25 5 16.0457 5 5Z" fill={ACCENT} />
      <path d="M5 25H25C36.0457 25 45 33.9543 45 45H25C13.9543 45 5 36.0457 5 25Z" fill={DIM} />
    </svg>
  );
}

/** Figma 226:11875 — the "blog" feature block. */
export function OrbitIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <path
        d="M54 54C64.6731 51.4308 72 46.1265 72 40C72 33.8735 64.6731 28.5692 54 26C55.098 30.2126 55.716 34.9676 55.716 40C55.716 45.0324 55.098 49.7874 54 54Z"
        fill={DIM}
      />
      <path
        d="M26 54C15.3269 51.4308 8 46.1265 8 40C8 33.8735 15.3269 28.5692 26 26C24.902 30.2126 24.284 34.9676 24.284 40C24.284 45.0324 24.902 49.7874 26 54Z"
        fill={DIM}
      />
      <path
        d="M26 54C28.5692 64.6731 33.8735 72 40 72C46.1265 72 51.4308 64.6731 54 54C49.7874 55.098 45.0324 55.716 40 55.716C34.9676 55.716 30.2126 55.098 26 54Z"
        fill={ACCENT}
      />
      <path
        d="M26 26C28.5692 15.3269 33.8735 8 40 8C46.1265 8 51.4308 15.3269 54 26C49.7874 24.902 45.0324 24.284 40 24.284C34.9676 24.284 30.2126 24.902 26 26Z"
        fill={ACCENT}
      />
    </svg>
  );
}

/** Figma 27:234 — the "research" feature block. Wider than tall, unlike the rest. */
export function PrismIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 93 80" fill="none" className={className} aria-hidden="true">
      <path d="M21.4603 55.2679V80H70.9759V55.2679H21.4603Z" fill={ACCENT} />
      <path
        d="M70.9656 55.2465L92.3835 42.8805L67.6258 2.81499e-05L46.2078 12.3661L70.9656 55.2465Z"
        fill={DIM}
      />
      <path
        d="M46.1758 12.3996L24.7578 0.0335693L3.8147e-05 42.914L21.418 55.2801L46.1758 12.3996Z"
        fill={DIM}
      />
    </svg>
  );
}

/** Figma 226:11881 — the first resource block. */
export function CrescentIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <path
        d="M38 46C38 34.4899 71.5265 14.0014 69.9458 21.6794C66.6426 37.7247 66.6426 54.2753 69.9458 70.3206C71.5265 77.9986 38 57.5101 38 46Z"
        fill={ACCENT}
      />
      <path
        d="M42 34C42 45.5101 8.47352 65.9986 10.0542 58.3206C13.3574 42.2753 13.3574 25.7247 10.0542 9.67936C8.47353 2.00136 42 22.4899 42 34Z"
        fill={DIM}
      />
    </svg>
  );
}

/** Figma 226:11889 — the second resource block. */
export function FacetIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" className={className} aria-hidden="true">
      <path d="M40 8V72L12 56V24L40 8Z" fill={ACCENT} />
      <path d="M68 8V72L40 56V24L68 8Z" fill={DIM} />
    </svg>
  );
}

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

export function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9Z" />
    </svg>
  );
}
