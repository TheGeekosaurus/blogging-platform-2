/**
 * Nanotom Labs' navigation and footer structure.
 *
 * Separated from ./content.ts the same way Capital separates brand.ts from
 * ft/content.ts: this file is about where things GO, content.ts is about what
 * they SAY. Re-pointing a link and re-copywriting a section are different jobs
 * and touch different files.
 *
 * WHERE THE LINKS GO TODAY. Three destinations exist: '/', '/services' and the
 * database-driven /blog. The rest are coded pages still to be built, so they
 * carry no href and render as plain text in the same style rather than as
 * links that 404. `__tests__/labs.test.ts` pins that: every href present must
 * resolve to a coded route, /blog, or an in-page anchor. Give an item an href
 * in the same change that adds its route — and add that route to CODED_SITES
 * in @blog/core, or it will be missing from the sitemap with nothing to tell
 * you.
 */

/**
 * The wordmark, hotlinked rather than stored.
 *
 * Same decision Capital already makes for its imagery, and the same CDN
 * (`images.leadconnectorhq.com`): the file is served as WebP at q_80 behind
 * Cloudflare, so committing a copy would add a build step and save nothing.
 * The root layout preconnects to that origin, because this is the first paint
 * in the header and its DNS+TLS handshake would otherwise sit on the critical
 * path.
 *
 * Rendered with a plain <img>, not next/image, for the reason Capital's README
 * gives: routing an already-optimised WebP through the optimiser spends quota
 * to re-encode it into the same thing. `intrinsic` is the file's real pixel
 * size — it is what reserves the right box before the image lands, so the
 * header does not reflow.
 */
export const LOGO = {
  src:
    'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/' +
    'u_https://assets.cdn.filesafe.space/BCQ9O5RVXWEILUOh7ic7/media/69c74eca7115ea7e6ac358f8.png',
  alt: 'Nanotom Labs',
  intrinsic: { width: 1200, height: 352 },
} as const;

/** Preconnected in the root layout — see LOGO above. */
export const LOGO_ORIGIN = 'https://images.leadconnectorhq.com';

/**
 * The homepage's own enquiry form, which every call to action points at until
 * there is a contact page.
 *
 * A dead "Contact Us" button is worse than an imperfect destination: this is
 * the site's only conversion path, and the form at the bottom of the homepage
 * is a real one that really submits. When /contact lands, change this constant
 * and every CTA follows.
 */
export const ENQUIRY_ANCHOR = '/#ask';

/**
 * The same form on /services, which carries its own copy of it.
 *
 * A separate constant rather than a bare '#ask': the calls that use it sit on
 * the Services page beside the form, and pointing them at the HOMEPAGE's form
 * would navigate away from the page the visitor is reading to reach an
 * identical field set. The site-wide chrome — the header's Contact Us, the
 * footer — keeps ENQUIRY_ANCHOR above, because it renders on every route and
 * has no single page to stay on.
 */
export const SERVICES_ENQUIRY_ANCHOR = '/services#ask';

export type NavItem = {
  label: string;
  /** Absent while the destination is unbuilt — rendered unlinked, not as a 404. */
  href?: string;
  /** The accent pill at the end of the bar. Exactly one item carries it. */
  cta?: boolean;
};

/**
 * WHY CAREERS AND BLOGS ARE NOT HERE. Both were in the template's bar and both
 * were dropped by decision, not by oversight: there are no openings to list,
 * and the blog is not the front door this site wants. /blog still renders and
 * is still in the sitemap — the footer's Blogs column links into it — so
 * nothing is unreachable; it is only off the primary bar.
 *
 * That leaves five items where the design has seven, which is also what keeps
 * the desktop bar inside 1024px without wrapping.
 */
export const NAV: readonly NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services' },
  { label: 'Projects' },
  { label: 'About' },
  { label: 'Contact Us', href: ENQUIRY_ANCHOR, cta: true },
];

export type FooterLink = {
  label: string;
  href?: string;
  /** The design badges two blog categories "Soon". Kept, because it is copy. */
  badge?: string;
};

export type FooterColumn = {
  heading: string;
  links: readonly FooterLink[];
};

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
  {
    heading: 'Home',
    links: [
      { label: 'Why Us' },
      { label: 'About Us' },
      { label: 'Testimonials', href: '/#testimonials' },
      { label: 'FAQˇs', href: '/#faq' },
    ],
  },
  {
    heading: 'Services',
    links: [
      { label: 'Web Development' },
      { label: 'App Development' },
      { label: 'Web Design' },
      { label: 'Digital Marketing' },
    ],
  },
  {
    heading: 'Projects',
    links: [
      { label: 'Klothink' },
      { label: 'Zenith' },
      { label: 'Novus' },
      { label: 'Apex' },
    ],
  },
  {
    heading: 'Blogs',
    links: [
      { label: 'Business', href: '/blog' },
      { label: 'Design', badge: 'Soon' },
      { label: 'Development', badge: 'Soon' },
    ],
  },
];

export type SocialCard = {
  /** Key into the icon map in ./icons.tsx. */
  icon: 'instagram' | 'twitter' | 'dribbble' | 'behance';
  name: string;
  blurb: string;
  href?: string;
};

/**
 * The four footer cards.
 *
 * No hrefs: these are the template's placeholder accounts, and linking them
 * would send visitors to profiles that are not Nanotom Labs'. They are dropped
 * entirely below the `lg` breakpoint, matching the mobile frame.
 */
export const SOCIAL_CARDS: readonly SocialCard[] = [
  {
    icon: 'instagram',
    name: 'INstagram',
    blurb: 'Share visually appealing snippets of our latest web projects.',
  },
  {
    icon: 'twitter',
    name: 'Twitter',
    blurb: "Tweet about interesting coding challenges you've overcome.",
  },
  {
    icon: 'dribbble',
    name: 'Dribbble',
    blurb: 'Showcase design elements of our web projects.',
  },
  {
    icon: 'behance',
    name: 'Behance',
    blurb: 'Create detailed presentations for our projects.',
  },
];

export const LEGAL_LINKS: readonly FooterLink[] = [
  { label: 'Terms & Conditions' },
  { label: 'Privacy Policy' },
];

/** The year is still the template's — see the note in content.ts. */
export const COPYRIGHT = '© 2024 Nanotom Labs. All rights reserved.';
