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
 * WHAT MUST CHANGE BEFORE THIS SERVES REAL TRAFFIC. Two blocks below describe
 * engagements that did not happen:
 *   - WORKS: two named client projects, with categories, durations, technology
 *     stacks and five staff portraits each
 *   - SERVICE_CARDS[].price: four price points
 * Published as-is on a real domain the first reads as a portfolio of work
 * Nanotom Labs did not do, and the second commits the business to numbers
 * nobody chose. The stat band and the testimonials this page also renders
 * carry the same problem and the same note in ./content.ts. Replace or remove
 * all of it before the site goes live.
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

export type Reason = { title: string; body: string };

/**
 * The four "reasons to choose" cards.
 *
 * Every one of them ends in a "Learn More" control that the design gives no
 * destination — there is no page behind any of the four — so they render
 * unlinked. See DiscLink in ./primitives.tsx.
 */
export const REASONS: readonly Reason[] = [
  {
    title: 'Expertise in Cutting-Edge Technologies',
    body:
      'Nanotom Labs ensures your projects are powered by state-of-the-art technologies, ' +
      'guaranteeing innovation and future-proof solutions.',
  },
  {
    title: 'Proven Track Record of Success',
    body:
      'Nanotom Labs demonstrates a consistent ability to meet and exceed client ' +
      'expectations, providing reliable and effective web solutions tailored to diverse ' +
      'needs.',
  },
  {
    title: 'Client-Centric Approach',
    body:
      'At Nanotom Labs, we prioritize understanding our clients’ unique requirements, ' +
      'fostering transparent communication throughout the development process.',
  },
  {
    title: 'Dedicated Team of Professionals',
    body:
      'Our professionals bring a wealth of expertise to the table, ensuring the delivery of ' +
      'top-notch, scalable, and secure web solutions for your business.',
  },
];

export type ServiceCard = {
  /** Key into SERVICE_ICONS in ./icons.tsx. */
  icon: 'web-design' | 'mobile-app' | 'web-development' | 'digital-marketing';
  title: string;
  body: string;
  price: string;
};

/**
 * The 2x2 service grid.
 *
 * The same four services the homepage lists, in a different presentation: the
 * homepage pairs each with a project gallery in a full-width row, this page
 * shows them as four equal 880x395 cards. Deliberately its own list rather
 * than a re-render of SERVICES, because that type carries `projects` and
 * `projectsTitle` that this layout has nowhere to put — sharing it would mean
 * a shape where half the fields are dead on one of the two pages.
 */
export const SERVICE_CARDS: readonly ServiceCard[] = [
  {
    icon: 'web-design',
    title: 'Web Design',
    body:
      'Our Web Design service is all about creating visually stunning and user-friendly ' +
      'websites that leave a lasting.',
    price: 'Starts From $1,500',
  },
  {
    icon: 'mobile-app',
    title: 'Mobile App Development',
    body:
      'With our Mobile App Development service, we harness the power of mobile technology ' +
      'to create cutting-edge applications that engage your customers on-the-go.',
    price: 'Starts From $2,500',
  },
  {
    icon: 'web-development',
    title: 'Web Development',
    body:
      'Our Web Development service is focused on turning your website into a powerful ' +
      'digital asset. We utilize the latest technologies and industry best practices to ' +
      'build websites.',
    price: 'Starts From $1,800',
  },
  {
    icon: 'digital-marketing',
    title: 'Digital Marketing',
    body:
      'In the digital age, marketing is a critical aspect of your business’s success. Our ' +
      'Digital Marketing service employs data-driven strategies to enhance your brand’s ' +
      'visibility',
    price: 'Starts From $1,200',
  },
];

export type Work = {
  /** Key into WORK_ICONS in ./icons.tsx. */
  icon: 'spark' | 'balloon';
  title: string;
  category: string;
  timeTaken: string;
  body: string;
  image: { src: string; alt: string };
  technologies: readonly string[];
  /**
   * Five portraits per project, under /public/nntm-labs.
   *
   * They carry no names, in the design or here. Naming them would attach real
   * faces — these are the template's stock portraits — to a staff list that
   * does not exist, so they are decorative and take alt="".
   */
  team: readonly string[];
};

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
  reasons: 'Reasons to Choose Nanotom Labs for Your Digital Journey',
  works: 'Our Works',
} as const;

/** Labels unique to this page. */
export const SERVICES_LINKS = {
  learnMore: 'Learn More',
  allWorks: 'ALL Works',
  details: 'Details',
  technologiesUsed: 'Technologies Used',
  teamMembers: 'Team Members',
  category: 'Category',
  timeTaken: 'Time Taken',
} as const;
