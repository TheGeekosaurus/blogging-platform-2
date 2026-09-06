/**
 * NNTM Labs' navigation and footer structure.
 *
 * Separated from ./content.ts the same way Capital separates brand.ts from
 * ft/content.ts: this file is about where things GO, content.ts is about what
 * they SAY. Re-pointing a link and re-copywriting a section are different jobs
 * and touch different files.
 *
 * WHERE THE LINKS GO TODAY. The design's nav promises seven destinations and
 * only two exist: '/' and the database-driven /blog. The rest are coded pages
 * still to be built, so they carry no href and render as plain text in the
 * same style rather than as links that 404. `__tests__/labs.test.ts` pins
 * that: every href present must resolve to a coded route, /blog, or an
 * in-page anchor. Give an item an href in the same change that adds its
 * route — and add that route to CODED_SITES in @blog/core, or it will be
 * missing from the sitemap with nothing to tell you.
 */

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

export type NavItem = {
  label: string;
  /** Absent while the destination is unbuilt — rendered unlinked, not as a 404. */
  href?: string;
  /** The coral pill at the end of the bar. Exactly one item carries it. */
  cta?: boolean;
};

export const NAV: readonly NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Services' },
  { label: 'Projects' },
  { label: 'About' },
  { label: 'Careers' },
  { label: 'Blogs', href: '/blog' },
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
 * would send visitors to profiles that are not NNTM Labs'. They are dropped
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

/** Verbatim from the design, misspelling included — see content.ts on copy. */
export const COPYRIGHT = '© 2024 NextGen. All rights reserved.';
