/**
 * Copy for the NNTM Labs homepage.
 *
 * THIS IS THE FIGMA TEMPLATE'S PLACEHOLDER COPY, VERBATIM — the opposite of
 * Capital's ft/content.ts, which carries real claims taken off a live site.
 * The brief was a faithful replica of the design, so every string here is the
 * template's, transcribed from the PDF export rather than retyped: the
 * "NextGen" misspelling in the footer copyright, the truncated
 * "that leave a lasting." in the first service, and "FAQˇs" in the footer are
 * all the artwork's own.
 *
 * WHAT MUST CHANGE BEFORE THIS SERVES REAL TRAFFIC. Three blocks below name
 * people and companies who are not NNTM Labs' customers:
 *   - TESTIMONIALS: four named individuals with job titles and stock portraits
 *   - SUCCESS_STORIES: two client engagements with described outcomes
 *   - SERVICES[].price: four price points
 * Published as-is on a real domain these read as endorsements and case studies
 * that did not happen, and the prices commit the business to numbers nobody
 * chose. Replace or remove them before the site goes live.
 *
 * The layouts read every string from here, so re-copywriting never means
 * touching markup.
 */

export const HERO = {
  headingLines: ['Our Comprehensive', 'Digital Solutions'],
  cta: 'Start a Project',
  body:
    'At NexGen, we offer a comprehensive suite of digital solutions designed to propel ' +
    'your business to new heights in the digital realm. With a team of skilled ' +
    'professionals, cutting-edge technologies, and a passion for innovation',
  /** Overlays on the hero image card. */
  imageCta: 'View Blog',
  imageTag: 'Web Development.',
  imageAlt: 'A robotic hand holding a glowing wireframe sphere',
} as const;

/**
 * The strip beneath the hero.
 *
 * Rendered twice inside the marquee track so the loop closes seamlessly — see
 * `.nl-marquee` in globals.css. The design shows it mid-scroll, which is why
 * the first and last entries are clipped in the export rather than missing.
 */
export const SERVICE_MARQUEE: readonly string[] = [
  'Hosting',
  'Website Design',
  'Branding',
  'Website Development',
  'Mobile App Development',
  'Digital Marketing',
];

export const SOCIAL_MARQUEE = 'Follow Us on Social Media';

export type Service = {
  /** Key into the icon map in ./icons.tsx. */
  icon: 'web-design' | 'mobile-app' | 'web-development' | 'digital-marketing';
  title: string;
  body: string;
  price: string;
  /** Heading over the paired gallery, desktop only. */
  projectsTitle: string;
  /** Two per service; paths under /public/nntm-labs. */
  projects: readonly { src: string; alt: string }[];
};

export const SERVICES: readonly Service[] = [
  {
    icon: 'web-design',
    title: 'Web Design',
    body:
      'Our Web Design service is all about creating visually stunning and user-friendly ' +
      'websites that leave a lasting.',
    price: 'Starts From $1,500',
    projectsTitle: 'Web Design Projects',
    projects: [
      { src: '/nntm-labs/project-web-design-1.webp', alt: 'A fitness brand web design' },
      { src: '/nntm-labs/project-web-design-2.webp', alt: 'A property listing web design' },
    ],
  },
  {
    icon: 'mobile-app',
    title: 'Mobile App Development',
    body:
      'With our Mobile App Development service, we harness the power of mobile technology ' +
      'to create cutting-edge applications that engage your customers on-the-go.',
    price: 'Starts From $2,500',
    projectsTitle: 'Mobile App Development Projects',
    projects: [
      { src: '/nntm-labs/project-mobile-app-1.webp', alt: 'A mobile app interface' },
      { src: '/nntm-labs/project-mobile-app-2.webp', alt: 'A mobile commerce interface' },
    ],
  },
  {
    icon: 'web-development',
    title: 'Web Development',
    body:
      'Our Web Development service is focused on turning your website into a powerful ' +
      'digital asset. We utilize the latest technologies and industry best practices to ' +
      'build websites.',
    price: 'Starts From $1,800',
    projectsTitle: 'Web Development Projects',
    projects: [
      { src: '/nntm-labs/project-web-development-1.webp', alt: 'A dashboard web application' },
      { src: '/nntm-labs/project-web-development-2.webp', alt: 'A data-heavy web application' },
    ],
  },
  {
    icon: 'digital-marketing',
    title: 'Digital Marketing',
    body:
      "In the digital age, marketing is a critical aspect of your business's success. Our " +
      "Digital Marketing service employs data-driven strategies to enhance your brand's " +
      'visibility',
    price: 'Starts From $1,200',
    projectsTitle: 'Digital Marketing Projects',
    projects: [
      { src: '/nntm-labs/project-digital-marketing-1.webp', alt: 'A marketing campaign layout' },
      { src: '/nntm-labs/project-digital-marketing-2.webp', alt: 'A campaign analytics layout' },
    ],
  },
];

/** Labels shared by both success stories, in the design's order. */
export const STORY_TABS = ['Challenge', 'Solution', 'Results'] as const;

export type SuccessStory = {
  /** Key into the icon map in ./icons.tsx. */
  icon: 'klothink' | 'fitness';
  client: string;
  industry: string;
  service: string;
  /** The design shows the Solution tab selected on both cards. */
  activeTab: (typeof STORY_TABS)[number];
  body: string;
};

export const SUCCESS_STORIES: readonly SuccessStory[] = [
  {
    icon: 'klothink',
    client: 'Klothink',
    industry: 'E-commerce',
    service: 'Design & Development',
    activeTab: 'Solution',
    body:
      'Our team conducted a thorough analysis of their target audience and business ' +
      'objectives. We designed a modern and intuitive website with seamless navigation ' +
      'and a mobile-responsive layout. Additionally, we integrated an efficient checkout ' +
      'process and optimized the site for search engines.',
  },
  {
    icon: 'fitness',
    client: 'Fitness Tracker App',
    industry: 'Health & Fitness',
    service: 'Mobile App Development',
    activeTab: 'Solution',
    body:
      'Leveraging our expertise in app development, we built an interactive mobile app ' +
      'with user-friendly features. The app allowed users to set personalized fitness ' +
      'goals, track their progress, and share achievements on social media platforms. ' +
      'Real-time data synchronization enabled users to access their data on multiple ' +
      'devices.',
  },
];

export type Testimonial = {
  quote: string;
  body: string;
  name: string;
  role: string;
  avatar: string;
};

/**
 * Four on desktop, three on mobile — the fourth is dropped in the mobile
 * frame, so it is hidden rather than the list being truncated here.
 */
export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote: 'NexGen turned our business around!',
    body:
      'Their digital marketing strategies helped us reach new customers and increase our ' +
      'revenue by 30% within just a few months. Highly recommended!',
    name: 'Sarah Thompson',
    role: 'CEO of BlueBloom',
    avatar: '/nntm-labs/avatar-sarah-thompson.webp',
  },
  {
    quote: 'NexGen turned our business around!',
    body:
      'Their digital marketing strategies helped us reach new customers and increase our ' +
      'revenue by 30% within just a few months. Highly recommended!',
    name: 'Wade Warren',
    role: 'Art Director',
    avatar: '/nntm-labs/avatar-wade-warren.webp',
  },
  {
    quote: 'Working with NexGen was a pleasure.',
    body:
      "Their web design team created a stunning website that perfectly captured our " +
      "brand's essence. The feedback from our customers has been overwhelmingly positive.",
    name: 'Lisa Williams',
    role: 'CEO Of HealthTech',
    avatar: '/nntm-labs/avatar-lisa-williams.webp',
  },
  {
    quote: "NexGen's web design team brought our vision to life.",
    body:
      'Their responsive design ensures our website looks stunning on all devices, ' +
      'contributing to increased user engagement.',
    name: 'Jennifer Lee',
    role: 'COO of Foodie Haven',
    avatar: '/nntm-labs/avatar-jennifer-lee.webp',
  },
];

export type Faq = { question: string; answer?: string };

/**
 * Only the first carries an answer in the design; the rest are shown closed.
 * Kept that way rather than invented, because inventing answers would put
 * claims about delivery and capability into the business's mouth.
 */
export const FAQS: readonly Faq[] = [
  {
    question: 'How long does it take to complete a web development project?',
    answer:
      "The timeline varies depending on the project's complexity and requirements. Our " +
      'team strives to deliver projects on time while maintaining the highest quality ' +
      'standards.',
  },
  { question: 'Can you handle large-scale mobile app development projects?' },
  { question: 'Can you integrate third-party APIs into our mobile app?' },
  { question: 'How do you ensure cross-platform compatibility for mobile apps?' },
  { question: 'What is your approach to user experience (UX) design?' },
];

export const ENQUIRY_FORM = {
  heading: 'Ask your question',
  name: { label: 'Name', placeholder: 'Enter your name' },
  email: { label: 'Email', placeholder: 'Enter your email' },
  question: { label: 'Your Question', placeholder: 'Enter Your Question Here .....' },
  submit: 'Send Your Message',
} as const;

export const CLOSING_CTA = {
  heading: 'Ready to Transform Your Digital Presence?',
  body:
    'Take the first step towards digital success with NexGen by your side. Our team of ' +
    'experts is eager to craft tailored solutions that drive growth for your business.',
  cta: 'Get in Touch',
} as const;

export const NEWSLETTER = {
  eyebrow: 'Newsletter',
  heading: 'Subscribe To our Newsletter',
  placeholder: 'Enter your email',
} as const;

/** Section headings, so the page component holds no bare strings. */
export const SECTIONS = {
  services: 'Our Services',
  successStories: 'Success Stories',
  testimonials: 'Testimonials',
  faq: 'Frequently Asked Questions',
} as const;

export const LINKS = {
  viewAll: 'View All',
  allTestimonials: 'ALL Testimonials',
  bookACall: 'Book A Call',
  openProject: 'Open Project',
  visitWebsite: 'Visit Website',
  /** Mobile only: replaces the project gallery the desktop layout shows. */
  viewAllProjects: 'View all Projects',
} as const;
