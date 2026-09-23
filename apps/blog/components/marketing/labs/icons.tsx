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

/** The stat grid's "Reach Us" tile, which scrolls DOWN the page, not away. */
export function ArrowDown({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path d="M12 5v13M7 13l5 5 5-5" {...STROKE} />
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

/** Website Design: the pen the template already used, kept. */
function WebsiteDesign({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path d="m4.5 19.5 3-1 9.9-9.9a2.1 2.1 0 0 0-3-3L4.5 15.5z" {...STROKE} />
      <path d="m13.5 5.5 3 3" {...STROKE} />
    </svg>
  );
}

/** Local SEO/GEO: a map pin, which is what ranking on Maps looks like. */
function LocalSeo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path d="M12 21.5s6.5-6 6.5-11a6.5 6.5 0 1 0-13 0c0 5 6.5 11 6.5 11z" {...STROKE} />
      <circle cx="12" cy="10.5" r="2.5" {...STROKE} />
    </svg>
  );
}

/** Google Ads: a magnifier, for the customer already searching. */
function GoogleAds({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <circle cx="10.5" cy="10.5" r="6" {...STROKE} />
      <path d="m15 15 5 5" {...STROKE} />
    </svg>
  );
}

/** Facebook & Instagram Ads: a megaphone. */
function SocialAds({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path d="M4 10v4a1 1 0 0 0 1 1h2.5L14 19V5L7.5 9H5a1 1 0 0 0-1 1z" {...STROKE} />
      <path d="M17.5 9a4 4 0 0 1 0 6" {...STROKE} />
      <path d="M7.5 15v3.5a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1V17" {...STROKE} />
    </svg>
  );
}

/**
 * Golden Scaffold's mark: two standards, two ledgers and a diagonal brace.
 *
 * It replaced the template's t-shirt glyph, which belonged to Klothink — the
 * invented clothing brand that used to hold this success-story slot.
 */
function Scaffold({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path d="M5 4v16M19 4v16M4 8.5h16M4 15.5h16M5 8.5l14 7" {...STROKE} />
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

function Facebook({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        d="M13.5 21v-8h2.7l.4-3h-3.1V8.2c0-.9.3-1.5 1.5-1.5H16.7V4c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.3v3H10v8z"
        fill="currentColor"
      />
    </svg>
  );
}

function LinkedIn({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" {...STROKE} />
      <path d="M8 10.5v6M8 7.6h.01" {...STROKE} />
      <path d="M11.8 16.5v-6M11.8 13a2.4 2.4 0 0 1 4.8 0v3.5" {...STROKE} />
    </svg>
  );
}

function YouTube({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" {...STROKE} />
      <path d="m10.5 9.5 4.5 2.5-4.5 2.5z" {...STROKE} />
    </svg>
  );
}

/** Strategic Planning: a clipboard of steps. */
function Planning({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <rect x="4.5" y="4" width="15" height="16.5" rx="2.5" {...STROKE} />
      <path d="M9 3h6v3H9z" {...STROKE} />
      <path d="M8.5 11h7M8.5 15h4" {...STROKE} />
    </svg>
  );
}

/** Customized Solutions: a star, for the one-off. */
function Tailored({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path
        d="M12 3.2 14.3 9l6.2.5-4.7 4 1.4 6-5.2-3.2L6.8 19.5l1.4-6-4.7-4L9.7 9z"
        {...STROKE}
      />
    </svg>
  );
}

/** User-Centric Approach: a person. */
function UserCentric({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <circle cx="12" cy="8.5" r="3.5" {...STROKE} />
      <path d="M5 20a7 7 0 0 1 14 0" {...STROKE} />
    </svg>
  );
}

/** Timely Delivery: a clock. */
function Delivery({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <circle cx="12" cy="12" r="8.5" {...STROKE} />
      <path d="M12 7v5.3l3.3 2" {...STROKE} />
    </svg>
  );
}

/** Project-page feature icons, keyed by `ProjectFeature['icon']`. */
export const PROJECT_FEATURE_ICONS = {
  planning: Planning,
  tailored: Tailored,
  'user-centric': UserCentric,
  delivery: Delivery,
} as const;

/** Service icons, keyed by `Service['icon']` in ./content.ts. */
export const SERVICE_ICONS = {
  'website-design': WebsiteDesign,
  'local-seo': LocalSeo,
  'google-ads': GoogleAds,
  'social-ads': SocialAds,
} as const;

/**
 * The award mark: a medal on a ribbon.
 *
 * Stroked like every other glyph here rather than filled like the two project
 * marks, because it sits in the same 44px tile the service icons use and a
 * solid shape at that size reads as a blob.
 */
function Medal({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      <path d="M8.5 3 11 8M15.5 3 13 8" {...STROKE} />
      <circle cx="12" cy="14.5" r="6" {...STROKE} />
      <path d="m12 11.5 1 2.2 2.3.3-1.7 1.6.4 2.4-2-1.2-2 1.2.4-2.4-1.7-1.6 2.3-.3z" {...STROKE} />
    </svg>
  );
}

/** The single mark the awards cards share — see ./about-content.ts. */
export const AwardMedal = Medal;

/** Success-story icons, keyed by `SuccessStory['icon']`. */
export const STORY_ICONS = {
  scaffold: Scaffold,
  fitness: Fitness,
} as const;

/** Project marks on /services, keyed by `Work['icon']` in ./services-content.ts. */
export const WORK_ICONS = {
  spark: Spark,
  balloon: Balloon,
} as const;

/** Footer social icons, keyed by `SocialCard['icon']` in ./brand.ts. */
export const SOCIAL_ICONS = {
  linkedin: LinkedIn,
  facebook: Facebook,
  instagram: Instagram,
  youtube: YouTube,
} as const;
