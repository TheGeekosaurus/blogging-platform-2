/**
 * Brand constants for the Nanotom Capital marketing site.
 *
 * Everything here was transcribed from the live HighLevel pages so the port is a
 * port, not a redesign. Copy lives next to the markup that uses it; only values
 * shared across several pages (nav, contact details, image URLs) are here.
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

export const IMAGES = {
  logo: `${CDN}/6a0d11e0e29a8860a545eff5.png`,
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

export const CONTACT = {
  phone: '(855) 598-9916',
  phoneHref: 'tel:+18555989916',
  address: '1286 University Ave, San Diego, CA 92103',
  legalEntity: 'Nanotom LLC',
} as const;

export const SOCIAL = [
  { label: 'Instagram', href: 'https://www.instagram.com/' },
  { label: 'Facebook', href: 'https://www.facebook.com/' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  { label: 'YouTube', href: 'https://www.youtube.com/' },
] as const;

export type NavItem = {
  label: string;
  href?: string;
  external?: boolean;
  children?: readonly NavItem[];
};

/**
 * The live nav's "Funding Solutions" and "Industries" dropdown items all point
 * at `#new-menu-item` — HighLevel's placeholder for a menu entry whose page was
 * never built. Rather than ship seven dead links, those entries carry no href
 * and render as plain text. Give them real pages and add the href.
 */
export const NAV: readonly NavItem[] = [
  {
    label: 'Funding Solutions',
    children: [
      { label: 'Business Loans' },
      { label: 'Line of Credit' },
      { label: 'Revenue-Based Financing' },
      { label: 'Working Capital' },
      { label: 'Equipment Financing' },
    ],
  },
  {
    label: 'Industries',
    children: [{ label: 'Food Business' }, { label: 'Construction Business' }],
  },
  { label: 'Loan Calculator', href: 'https://calc.nanotomcapital.com/', external: true },
  { label: 'Programs', href: '/programs' },
] as const;

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
