import type { Work } from './content';

/**
 * Copy unique to the Nanotom Labs Services page.
 *
 * Same provenance and the same warning as ./content.ts: THIS IS THE FIGMA
 * TEMPLATE'S PLACEHOLDER COPY, transcribed from the PDF export rather than
 * retyped, with every "NexGen" replaced by "Nanotom Labs". The truncated
 * "that leave a lasting." and the missing full stop after "brand's visibility"
 * are the artwork's own.
 *
 * A separate module from ./content.ts because that file is the homepage's, and
 * the two pages share only what ./sections.tsx renders. The strings both pages
 * use — SECTIONS, LINKS, STATS, TESTIMONIALS, FAQS, ENQUIRY_FORM, CLOSING_CTA
 * — stay in ./content.ts and are imported from there, so a wording change
 * reaches both pages in one edit.
 *
 * WHAT MUST CHANGE BEFORE THIS SERVES REAL TRAFFIC. WORKS below describes two
 * named client projects that did not happen — categories, durations, technology
 * stacks and five staff portraits each — and reads as a portfolio of work
 * Nanotom Labs did not do. The stat band and the testimonials this page also
 * renders carry the same problem, and the same note in ./content.ts. Replace or
 * remove all of it before the site goes live.
 */

export const SERVICES_HERO = {
  headingLines: ['Digital Solutions', 'That Drive Success'],
  cta: 'Start a Project',
  body:
    'At Nanotom Labs, we believe in the transformative power of digital solutions. Our team ' +
    'of experts is dedicated to helping businesses like yours thrive in the fast-paced ' +
    'digital landscape.',
  /** The project screenshot beside the copy, and its caption bar. */
  image: {
    src: '/nntm-labs/project-estatein.webp',
    alt: 'The Estatein property site, shown as a grid of its screens',
  },
  imageTitle: 'Estatein Real Estate',
  imageTag: 'Web Development.',
} as const;

/*
 * The "reasons to choose" cards are NOT here either. They moved to the
 * HOMEPAGE — they answer "why you" rather than "what do you sell", which a
 * visitor asks before the service list rather than after it. See REASONS in
 * ./content.ts.
 */

/*
 * The four services are NOT here. They live in ./content.ts, because the
 * homepage renders the same four with a project gallery beside each — the two
 * pages differ in layout, not in what the services are. They were briefly
 * duplicated, which meant a copy tweak had to land in two files or the pages
 * quietly disagreed.
 */

export const WORKS: readonly Work[] = [
  {
    icon: 'spark',
    title: 'Zenith Fitness App',
    category: 'Mobile App Development',
    timeTaken: '6 months',
    body:
      'An all-in-one health and wellness app that offers personalized fitness plans, ' +
      'nutrition guidance, and virtual workout classes.',
    image: {
      src: '/nntm-labs/work-zenith.webp',
      alt: 'Screens from the Zenith fitness app, laid out on an angle',
    },
    technologies: ['React Native', 'Firebase', 'Redux', 'REST API', 'MongoDB'],
    team: [
      '/nntm-labs/team-1.webp',
      '/nntm-labs/team-2.webp',
      '/nntm-labs/team-3.webp',
      '/nntm-labs/team-4.webp',
      '/nntm-labs/team-5.webp',
    ],
  },
  {
    icon: 'balloon',
    title: 'A-Aura Ecommerce',
    category: 'Web Design & Development',
    timeTaken: '3 months',
    body:
      'A complete overhaul of a corporate website to enhance its brand identity and user ' +
      'experience.',
    image: {
      src: '/nntm-labs/work-a-aura.webp',
      alt: 'Pages from the A-Aura commerce site, laid out on an angle',
    },
    technologies: ['WordPress', 'PHP', 'HTML5', 'CSS3', 'JavaScript'],
    team: [
      '/nntm-labs/team-6.webp',
      '/nntm-labs/team-7.webp',
      '/nntm-labs/team-8.webp',
      '/nntm-labs/team-9.webp',
      '/nntm-labs/team-2.webp',
    ],
  },
];

/** Section headings unique to this page. */
export const SERVICES_SECTIONS = {
  works: 'Our Works',
} as const;

/** Labels unique to this page. The WorkPanel's own live in ./content.ts. */
export const SERVICES_LINKS = {
  allWorks: 'ALL Works',
} as const;
