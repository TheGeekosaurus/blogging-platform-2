/**
 * Nanotom Labs' icons, inline rather than from a package.
 *
 * The design's glyphs are simple line marks, and every one of them is smaller
 * than the import machinery would be — an icon library would ship a runtime
 * and a font or sprite sheet to draw shapes that are a dozen path commands
 * each. Inline SVG also keeps them server-rendered, which matters because the
 * header and footer are server components with no client bundle at all.
 *
 * All of them inherit `currentColor`, so a caller sets the colour by setting
 * text colour. None carries a title: they sit beside their own text label
 * everywhere they are used, so they are decorative and marked aria-hidden by
 * the components that place them.
 */

type IconProps = { className?: string };

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/**
 * The arrow used in every circular button on the page — nav links, "Book A
 * Call", "Open Project", "View All", the image-card overlay.
 */
export function ArrowUpRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path d="M8 16 16 8M9.5 8H16v6.5" {...STROKE} />
    </svg>
  );
}

/** The hero's "Start a Project" mark, which points right rather than up-right. */
export function ArrowRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path d="M5 12h13M13 7l5 5-5 5" {...STROKE} />
    </svg>
  );
}

/**
 * The FAQ toggle. One glyph for both states: `.nl-faq details[open]` rotates it
 * 45° so the plus becomes a cross, which is why there is no separate minus.
 */
export function Plus({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path d="M12 6v12M6 12h12" {...STROKE} />
    </svg>
  );
}

function WebDesign({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path d="m4.5 19.5 3-1 9.9-9.9a2.1 2.1 0 0 0-3-3L4.5 15.5z" {...STROKE} />
      <path d="m13.5 5.5 3 3" {...STROKE} />
    </svg>
  );
}

function MobileApp({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <rect x="7" y="3" width="10" height="18" rx="2.5" {...STROKE} />
      <path d="M11 6h2M12 17.5h.01" {...STROKE} />
    </svg>
  );
}

function WebDevelopment({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path d="m9 8-4 4 4 4M15 8l4 4-4 4" {...STROKE} />
    </svg>
  );
}

function DigitalMarketing({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <rect x="3.5" y="12" width="4" height="8" rx="1" {...STROKE} />
      <rect x="10" y="8" width="4" height="12" rx="1" {...STROKE} />
      <rect x="16.5" y="4" width="4" height="16" rx="1" {...STROKE} />
    </svg>
  );
}

function Klothink({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path d="M9 4 5 6.5V10l2 .5V20h10v-9.5l2-.5V6.5L15 4a3 3 0 0 1-6 0z" {...STROKE} />
    </svg>
  );
}

function Fitness({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path d="M4 12h2M18 12h2M7.5 8.5v7M16.5 8.5v7M7.5 12h9" {...STROKE} />
    </svg>
  );
}

/**
 * The Zenith Fitness App project mark: a five-pointed spark.
 *
 * Filled rather than stroked, which is what the artwork shows — every other
 * glyph here is a line mark, and these two project marks are the exception
 * rather than an inconsistency introduced here.
 */
function Spark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        d="M12 2.6c.5 0 .8.3 1 .7l1.9 4.4 4.7.5c.9.1 1.2 1.2.6 1.8l-3.6 3.2 1 4.7c.2.9-.8 1.6-1.6 1.1L12 16.5l-4 2.5c-.8.5-1.8-.2-1.6-1.1l1-4.7-3.6-3.2c-.6-.6-.3-1.7.6-1.8l4.7-.5L11 3.3c.2-.4.5-.7 1-.7z"
        fill="currentColor"
      />
      <path d="m14.4 15.4 3.9 4" {...STROKE} strokeWidth={2} />
    </svg>
  );
}

/** The A-Aura Ecommerce project mark: a balloon with a knotted tail. */
function Balloon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        d="M12 2.5a6.5 6.5 0 0 1 6.5 6.5c0 3.6-2.9 6.5-6.5 6.5S5.5 12.6 5.5 9A6.5 6.5 0 0 1 12 2.5z"
        fill="currentColor"
      />
      <path d="M12 15.5V18" {...STROKE} strokeWidth={2} />
      <path d="M10.6 19.4h2.8" {...STROKE} strokeWidth={2} />
      <path d="M9 7.5a3.4 3.4 0 0 1 2.4-2.3" stroke="#0f0f0f" fill="none" strokeWidth={1.4} strokeLinecap="round" opacity={0.35} />
    </svg>
  );
}

function Instagram({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" {...STROKE} />
      <circle cx="12" cy="12" r="4" {...STROKE} />
      <path d="M16.8 7.2h.01" {...STROKE} strokeWidth={2.2} />
    </svg>
  );
}

function Twitter({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        d="M20 6.4a6.4 6.4 0 0 1-1.9.5 3.3 3.3 0 0 0 1.4-1.8 6.6 6.6 0 0 1-2.1.8 3.3 3.3 0 0 0-5.6 3A9.3 9.3 0 0 1 5 5.5a3.3 3.3 0 0 0 1 4.4 3.3 3.3 0 0 1-1.5-.4 3.3 3.3 0 0 0 2.6 3.3 3.3 3.3 0 0 1-1.5.1 3.3 3.3 0 0 0 3.1 2.3A6.6 6.6 0 0 1 4 16.6a9.3 9.3 0 0 0 5 1.5c6 0 9.4-5 9.2-9.6A6.7 6.7 0 0 0 20 6.4z"
        {...STROKE}
      />
    </svg>
  );
}

function Dribbble({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <circle cx="12" cy="12" r="8.5" {...STROKE} />
      <path d="M5 8.5c5 .6 9.6-.4 12.6-2.4M4.2 13.7c4.6-1.4 9.6-.4 12.6 3.6M8.6 4.3c3.4 3.6 5.6 8.4 6.2 15" {...STROKE} />
    </svg>
  );
}

function Behance({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path d="M3 6.5h4.4a2.4 2.4 0 0 1 0 4.8H3zM3 11.3h4.9a2.6 2.6 0 0 1 0 5.2H3z" {...STROKE} />
      <path d="M14 13.4h6.5a3.2 3.2 0 0 0-6.4-.5 3.2 3.2 0 0 0 5.9 2M15 7h4.5" {...STROKE} />
    </svg>
  );
}

/** Service icons, keyed by `Service['icon']` in ./content.ts. */
export const SERVICE_ICONS = {
  'web-design': WebDesign,
  'mobile-app': MobileApp,
  'web-development': WebDevelopment,
  'digital-marketing': DigitalMarketing,
} as const;

/** Success-story icons, keyed by `SuccessStory['icon']`. */
export const STORY_ICONS = {
  klothink: Klothink,
  fitness: Fitness,
} as const;

/** Project marks on /services, keyed by `Work['icon']` in ./services-content.ts. */
export const WORK_ICONS = {
  spark: Spark,
  balloon: Balloon,
} as const;

/** Footer social icons, keyed by `SocialCard['icon']` in ./brand.ts. */
export const SOCIAL_ICONS = {
  instagram: Instagram,
  twitter: Twitter,
  dribbble: Dribbble,
  behance: Behance,
} as const;
