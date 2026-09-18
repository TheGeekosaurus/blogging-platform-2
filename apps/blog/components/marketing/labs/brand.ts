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
 * The contact page, and where the header's button goes.
 *
 * It pointed at ENQUIRY_ANCHOR until this page existed, which was the right
 * call while the homepage's form was the only one — a button that scrolls is
 * better than a button that 404s. Now there is a page built for the job, with
 * the same form plus the ways to reach the business that an anchor cannot
 * carry.
 */
export const GET_STARTED_PATH = '/get-started';

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
 * WHY CAREERS, BLOGS AND HOME ARE NOT HERE. All three were in the template's
 * bar and all three were dropped by decision, not by oversight: there are no
 * openings to list, the blog is not the front door this site wants, and the
 * wordmark to the left of this bar already links to '/' — a Home item beside it
 * is a second control for the same destination. /blog still renders and is
 * still in the sitemap (the footer's Blogs column links into it), so nothing is
 * unreachable; it is only off the primary bar.
 *
 * That leaves four items where the design has seven, which is also what keeps
 * the desktop bar inside 1024px without wrapping.
 */
export const NAV: readonly NavItem[] = [
  { label: 'Services', href: '/services' },
  { label: 'Projects' },
  { label: 'About' },
  { label: 'Get Started', href: GET_STARTED_PATH, cta: true },
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
  icon: 'linkedin' | 'facebook' | 'instagram' | 'youtube';
  name: string;
  blurb: string;
  href: string;
};

/**
 * The four footer cards.
 *
 * Nanotom Labs' own accounts — every handle reads `nanotomlabs`. Capital's
 * (`nanotomcapital`) went in first by mistake and were corrected; the two
 * businesses share an owner, which is exactly what makes the handles easy to
 * mix up, so check the brand in the URL rather than the shape of it.
 *
 * They replace the template's placeholder Instagram/Twitter/Dribbble/Behance,
 * which had no destinations at all. Every one opens in a new tab — the card is
 * a link off-site, and the design gives it the same up-right arrow it gives
 * every other outbound control.
 *
 * The blurbs are deliberately plain. The template's described a portfolio of
 * web projects that does not exist yet; these say what the account is for
 * without claiming anything is already on it.
 */
export const SOCIAL_CARDS: readonly SocialCard[] = [
  {
    icon: 'linkedin',
    name: 'LinkedIn',
    blurb: 'Company news, and what we are learning about local search.',
    href: 'https://www.linkedin.com/company/nanotom-labs/',
  },
  {
    icon: 'facebook',
    name: 'Facebook',
    blurb: 'Updates, offers, and what is working in local marketing right now.',
    href: 'https://www.facebook.com/nanotomlabs/',
  },
  {
    icon: 'instagram',
    name: 'Instagram',
    blurb: 'A look at the work, and the people behind it.',
    href: 'https://www.instagram.com/nanotomlabs',
  },
  {
    icon: 'youtube',
    name: 'YouTube',
    blurb: 'Walkthroughs and breakdowns of the tactics we use.',
    href: 'https://www.youtube.com/@NanotomLabs',
  },
];

export const LEGAL_LINKS: readonly FooterLink[] = [
  { label: 'Terms & Conditions' },
  { label: 'Privacy Policy' },
];

/**
 * The copyright line, with the year taken from the clock rather than typed.
 *
 * It read 2024 — the template's — until someone noticed, which is the whole
 * problem with writing a year down: it is wrong for eleven months of every
 * year and nothing complains. Both Labs pages are statically generated, so
 * this resolves at BUILD time; a deploy in January fixes it, and a site that
 * has not been deployed since last year shows last year, which is what the
 * notice means anyway.
 */
export const COPYRIGHT = `© ${new Date().getFullYear()} Nanotom Labs. All rights reserved.`;
