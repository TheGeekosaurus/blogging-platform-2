/**
 * Brand constants for the Nanotom Capital marketing site.
 *
 * Copy is still transcribed verbatim from the live HighLevel pages; the LAYOUT is
 * the 2026 ink+gold refresh, so this is a redesign of the presentation and a
 * straight port of the words. Copy lives next to the markup that uses it; only
 * values shared across several pages (nav, contact details, asset paths) are here.
 */

/**
 * Images stay on HighLevel's CDN by explicit decision. Measured 2026-09-01: all
 * are already WebP, already Cloudflare edge-cached (`cf-cache-status: HIT`,
 * `cache-control: max-age=15780000`), and 5-36 KB each. Re-hosting them would
 * add a build step and save nothing.
 *
 * They are rendered with plain <img>, not next/image: the files are already
 * optimised, so routing them through Next's optimiser would burn image-
 * optimisation quota to re-encode a WebP into a WebP.
 */
const CDN = 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/Hq8fXA7z9KgVOYhqLqCD/media';
const CDN_GCS = 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://storage.googleapis.com/msgsndr/Hq8fXA7z9KgVOYhqLqCD/media';

/** Preconnected in the root layout so the CDN handshake overlaps HTML parsing. */
export const IMAGE_ORIGIN = 'https://images.leadconnectorhq.com';

/**
 * The 2026 hero background: a muted looping video behind the headline.
 *
 * Self-hosted, and NOT hotlinked like the images above — the account's CDN
 * cannot serve it. Every other asset here goes through
 * `images.leadconnectorhq.com/image/f_webp/...`, which is an IMAGE pipeline:
 * handed an `.mp4` it answers `{"errorCode":400,"message":"Invalid file type"}`,
 * so the original URL silently never loaded and the `poster` showed instead.
 *
 * The origin does serve the file directly, but at 1920x1080 / 7832 kb/s it is
 * 42 MB — around 220 s on a slow 4G connection, against 12 KB of HTML and
 * 169 KB of JS for everything else on the page. Committed here re-encoded to
 * 1280x720 at 24 fps (h264, crf 34, faststart, no audio track): 3.0 MB, 92.9%
 * smaller, and visually indistinguishable under the hero's 90%-to-35% black
 * gradient. Compared frames before settling on it; 960px was visibly softer for
 * only 500 KB more saved.
 *
 * Re-encode with, from the repo root:
 *   ffmpeg -i original.mp4 -vf "scale=1280:-2,fps=24" -an \
 *     -c:v libx264 -preset slow -crf 34 -profile:v main -level 4.0 \
 *     -pix_fmt yuv420p -movflags +faststart \
 *     apps/blog/public/marketing/hero-loop.mp4
 */
export const HERO_VIDEO = '/marketing/hero-loop.mp4';

export const IMAGES = {
  heroBackground: `${CDN}/689eaeb0c6ba4e046393cc98.png`,
  featuredOn: [
    `${CDN_GCS}/68cf739b7629a15f8821fd6e.png`,
    `${CDN_GCS}/68cf741c4f886faffab37112.png`,
    `${CDN_GCS}/68cf74257629a1505b220569.png`,
    `${CDN_GCS}/68cf7430beb0270f40dce6fb.png`,
    `${CDN_GCS}/68cf74c1beb02706f1dceea3.png`,
    `${CDN_GCS}/68cf74ca074b8d30f6ac635c.png`,
  ],
} as const;

/**
 * Self-hosted in `public/marketing/`, unlike the hotlinked images above.
 *
 * The two photos reached this codebase as already-exported files with no known
 * source on the account's CDN. The logo is a different case and worth recording
 * accurately: it IS on the CDN, at
 * `.../media/6a0d11e0e29a8860a545eff5.png`, served as a 36 KB WebP, versus the
 * 193 KB PNG committed here. Self-hosting it is still the better call — it is in
 * the header of every page, so it should not depend on a third party staying up
 * — and `next/image` re-encodes it anyway, so nothing near 193 KB is ever sent.
 */
export const LOCAL_IMAGES = {
  logo: '/marketing/nanotom-capital-logo.png',
  appPhone: '/marketing/photo-app-phone.png',
  cityTower: '/marketing/photo-city-tower.png',
} as const;

export const CONTACT = {
  phone: '(855) 598-9916',
  phoneHref: 'tel:+18555989916',
  address: '1286 University Ave, San Diego, CA 92103',
  legalEntity: 'Nanotom LLC',
} as const;

/*
 * SOCIAL is gone rather than fixed.
 *
 * It listed instagram.com, facebook.com, linkedin.com and youtube.com — the
 * networks' own home pages, not this company's profiles, carried over from the
 * HighLevel template. A footer icon that takes a visitor to Instagram's logged-out
 * splash page is worse than no icon, so the row is removed until real profile
 * URLs exist. Add them back here and restore the block in site-footer.tsx.
 */

export type NavItem = {
  label: string;
  href?: string;
  external?: boolean;
  children?: readonly NavItem[];
};

/**
 * The main navigation.
 *
 * Every dropdown entry used to be href-less — HighLevel's placeholder for a menu
 * item whose page was never built — and rendered as greyed-out text. They now
 * point at real paths, all of which resolve: the ones without content yet are
 * served as noindex stubs by the pages catch-all (see STUB_PAGES below), so
 * there are no dead links in the header.
 *
 * The Loan Calculator is no longer an external link to the calc subdomain. It is
 * /calc on this domain, proxied by a rewrite in next.config.ts, so the header,
 * the hero and the CTA card all point at one path. The subdomain still works and
 * is deliberately left up — retiring it belongs with the other redirects at
 * domain transfer, not here.
 */
export const NAV: readonly NavItem[] = [
  {
    label: 'Funding Solutions',
    href: '/funding-solutions',
    children: [
      { label: 'Business Loans', href: '/funding-solutions/business-loans' },
      { label: 'Line of Credit', href: '/funding-solutions/line-of-credit' },
      { label: 'Revenue-Based Financing', href: '/funding-solutions/revenue-based-financing' },
      { label: 'Working Capital', href: '/funding-solutions/working-capital' },
      { label: 'Equipment Financing', href: '/funding-solutions/equipment-financing' },
    ],
  },
  {
    label: 'Industries',
    href: '/industries',
    children: [
      { label: 'Food Business', href: '/industries/food-business' },
      { label: 'Construction Business', href: '/industries/construction-business' },
    ],
  },
  { label: 'Loan Calculator', href: '/calc' },
  { label: 'Programs', href: '/programs' },
] as const;

/**
 * Paths that must resolve but have no content yet.
 *
 * Served by the pages catch-all as a heading and nothing else, `noindex` so an
 * empty page never reaches the index. Deliberately NOT eight new route files:
 * every one of these is destined to become a real database page, and the moment
 * someone publishes a page at the same path it wins, because the catch-all only
 * falls back to this map when the lookup finds nothing. So the stub disappears
 * on its own — nobody has to remember to delete a route.
 *
 * The value is the <h1>, which matches the nav label that leads here.
 */
export const STUB_PAGES: Readonly<Record<string, string>> = {
  /*
   * Not a new nav item — /programs is linked from the header and from the
   * requirements callout on the homepage, and was returning 404 in production
   * when this was written. A heading-only stub is not a fix for that, it just
   * stops the bleeding; it still needs real content.
   *
   * `get-funded` used to sit here for the same reason and no longer does: it is
   * a coded route now (app/get-funded/page.tsx).
   */
  programs: 'Programs',

  'funding-solutions': 'Funding Solutions',
  'funding-solutions/business-loans': 'Business Loans',
  'funding-solutions/line-of-credit': 'Line of Credit',
  'funding-solutions/revenue-based-financing': 'Revenue-Based Financing',
  'funding-solutions/working-capital': 'Working Capital',
  'funding-solutions/equipment-financing': 'Equipment Financing',
  industries: 'Industries',
  'industries/food-business': 'Food Business',
  'industries/construction-business': 'Construction Business',
};

/** Footer policy row. Every one of these is a real, live page. */
export const POLICY_LINKS = [
  { label: 'Cancellation & Refund Policy', href: '/cancellation-and-refund-policy' },
  { label: 'Anti Spam Policy', href: '/anti-spam-policy' },
  { label: 'DMCA Policy', href: '/dmca-policy' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Earnings Disclaimer', href: '/earnings-disclaimer' },
  { label: 'Terms Of Use', href: '/terms-of-use' },
] as const;

export const CTA_HREF = '/get-funded';

/**
 * The HighLevel qualification survey embedded on the homepage.
 *
 * Note the host: this account is on a WHITE-LABELLED HighLevel domain, so the
 * embed lives at link.mailsengr.com, not api.leadconnectorhq.com. Both happen to
 * serve this survey, but the white-label host is the one HighLevel generated for
 * the account and the one its cookie-consent config is keyed to.
 *
 * Committed rather than read from an environment variable on purpose: the id is
 * public — it is in the HTML of the live site — so treating it as configuration
 * bought nothing and added a Vercel step that could be forgotten, plus a
 * placeholder state that reads as a bug rather than as missing config.
 */
/**
 * The SocialJuice review wall, embedded on the homepage.
 *
 * Identifiers live here rather than inline in the component, for the same reason
 * SURVEY does: they are account-specific values that two pages now share, and a
 * wall id buried in JSX is one nobody finds when it changes.
 *
 * Public by nature — the wall is a public page and these strings are in the HTML
 * of the live site — so committed rather than made configuration.
 */
export const REVIEWS = {
  wallUrl: 'https://embed.socialjuice.io/wall/9690?s=nntm-capital',
  resizerSrc: 'https://embed.socialjuice.io/js/iframeResizer.min.js',
  /** Preconnected in the root layout, like IMAGE_ORIGIN above. */
  origin: 'https://embed.socialjuice.io',
  /**
   * Reserved until the resizer reports the wall's real height, so the sections
   * below it do not jump. iframeResizer overwrites it via inline style.
   */
  initialHeight: 575,
  /** Where "View All Testimonials" goes — the public wall, not the embed. */
  collectUrl: 'https://collect.socialjuice.io/p/nntm-capital/wall',
} as const;

export const SURVEY = {
  host: 'https://link.mailsengr.com',
  kind: 'survey',
  id: 'iMvBFKUm0M5CxTrlVGOf',
  /**
   * Height reserved before the survey reports its real size, so the sections
   * below it do not jump. form_embed.js overwrites it via inline style.
   */
  initialHeight: 1100,
} as const;
