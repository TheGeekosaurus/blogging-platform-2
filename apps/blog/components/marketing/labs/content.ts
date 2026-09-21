/**
 * Copy for the Nanotom Labs homepage.
 *
 * THIS IS THE FIGMA TEMPLATE'S PLACEHOLDER COPY, VERBATIM — the opposite of
 * Capital's ft/content.ts, which carries real claims taken off a live site.
 * The brief was a faithful replica of the design, so every string here is the
 * template's, transcribed from the PDF export rather than retyped — the
 * truncated "that leave a lasting." in the first service and "FAQˇs" in the
 * footer are the artwork's own, not typos introduced here.
 *
 * THE COMPANY NAME IS NOT the template's. Every "NexGen" is now "Nanotom
 * Labs"; the copyright line still carries the template's 2024, which is worth
 * correcting when the real copy lands.
 *
 * WHAT MUST CHANGE BEFORE THIS SERVES REAL TRAFFIC. Three blocks below name
 * people and companies who are not Nanotom Labs' customers:
 *   - TESTIMONIALS: four named individuals with job titles and stock portraits
 *   - SUCCESS_STORIES: the second story is still a template engagement; the
 *     first names a real client and says nothing about the work yet
 *   - SERVICES[].projects: the five remaining template screenshots, presented
 *     as this agency's work
 * (STATS is no longer among them — those figures are the business's own now.)
 * Published as-is on a real domain these read as endorsements, case studies and
 * a portfolio that did not happen. Replace or remove them before the site goes
 * live. (The four invented price points that used to sit here are gone.)
 *
 * The layouts read every string from here, so re-copywriting never means
 * touching markup.
 */

import { GOLDEN_SCAFFOLD, projectPath } from './projects-content';

/*
 * That import goes one way only. ./projects-content.ts imports `Work` back out
 * of this file, but as `import type`, which the compiler erases — so there is
 * no cycle at runtime. Keep it that way: if that file ever needs a VALUE from
 * here, move the shared piece into a third module rather than closing the loop.
 */

/**
 * THE HOMEPAGE HERO IS NOT THE TEMPLATE'S COPY. Everything else in this file
 * still is; this block is the business's own positioning, and it says what
 * Nanotom Labs sells rather than what the Figma file said.
 *
 * THREE LINES, not the template's two. The headline is three parallel clauses
 * — "More X. More Y. More Z." — and stacking them is both the natural
 * typographic treatment and the only one that keeps the type large: set as two
 * lines it needs 1098px beside a 237px call inside a 1111px card, which forces
 * the headline down to ~46px. Broken in three, the first line is short enough
 * to sit beside the call at the full size. `headingLines` is read as "the
 * first line shares its row with the call, the rest stack", so adding or
 * removing a line here needs no markup change.
 */
export const HERO = {
  headingLines: ['More Calls', 'More Foot Traffic', 'More Revenue'],
  cta: 'Get Started',
  body:
    'At Nanotom Labs, we help local businesses dominate their market with a high-converting ' +
    'website, top Google rankings, and ads that actually bring people through the door.',
  /**
   * Overlays on the hero image card.
   *
   * The template also put a "Web Development." pill in the opposite corner.
   * It is gone: it labelled the image as a portfolio thumbnail, and this image
   * is not one.
   */
  imageCta: 'Services',
  imageAlt:
    'A glowing map pin standing over a wireframe city, beneath five gold review stars',
} as const;

export const SOCIAL_MARQUEE = 'Follow Us on Social Media';

/**
 * The stat band under the hero.
 *
 * From the template's HOME frame rather than the Services one this page is
 * built from, so it is an addition to the replica, not a correction to it.
 *
 * THE FIGURES ARE THE BUSINESS'S OWN. They replaced the template's invented
 * ones, which included a "100% Happy Clients" and a follower count — the kind
 * of claim that turns into a consumer-protection problem rather than a design
 * one. These are still public claims about results, so they need to be numbers
 * the business can evidence; keep them current, and change them here rather
 * than in either layout.
 */
export type Stat = { label: string; value: string };

export const STATS: readonly Stat[] = [
  { label: 'Clients', value: '150+' },
  { label: 'Ad Spend', value: '$8M+' },
  { label: 'Inbound Calls', value: '47K+' },
  { label: 'Quote Requests', value: '6K+' },
  { label: 'Years Of Experience', value: '10+' },
];

/** The band's trailing tile, which is a call rather than a figure. */
export const STATS_CTA = 'Know More';

export type Service = {
  /** Key into the icon map in ./icons.tsx. */
  icon: 'website-design' | 'local-seo' | 'google-ads' | 'social-ads';
  title: string;
  body: string;
  /** Two per service; paths under /public/nntm-labs. */
  projects: readonly {
    src: string;
    alt: string;
    /**
     * Where the tile's "Open Project" goes. Optional, and absent on every
     * tile that has no case study behind it — those render the control
     * unlinked rather than as an <a> to nowhere (see ArrowLink in
     * ./primitives.tsx).
     */
    href?: string;
  }[];
};

/**
 * The heading over a service's project gallery.
 *
 * Derived, not stored. It used to be a `projectsTitle` field, which meant the
 * galleries kept the OLD service names when the services were rewritten —
 * "Mobile App Development Projects" sat beside Local SEO/GEO for a while. The
 * heading is the service's name plus a word; there was never a second fact to
 * record.
 */
export function projectsTitle(service: Service): string {
  return `${service.title} Projects`;
}

/**
 * The four services, and the ONE list of them.
 *
 * Both pages read this: the homepage renders each as a row with its project
 * gallery beside it, /services renders the same four as a 2x2 grid of cards.
 * They were briefly two lists — the card half was duplicated in
 * ./services-content.ts — which meant a copy tweak had to be made twice or the
 * two pages quietly disagreed. The gallery fields are the only thing the
 * second layout does not use.
 *
 * THE COPY IS THE BUSINESS'S OWN, replacing the Figma template's placeholder
 * services (Web Design / Mobile App Development / Web Development / Digital
 * Marketing) and the four invented prices that sat under them.
 *
 * THE FIRST TILE OF THE FIRST THREE GALLERIES IS REAL — the Golden Scaffold
 * site, and the only image here that shows work this agency did. It is the same
 * picture in all three because it is the same engagement: that client bought
 * the website, the local search and the ads. It is also the only tile with a
 * destination, the case study at ./projects-content.ts.
 *
 * THE OTHER FIVE ARE STILL THE TEMPLATE'S — stock screens, not Nanotom Labs'
 * work, shown under each service's own name. Replace them before this serves
 * real traffic; a portfolio of work you did not do is the same problem as a
 * testimonial from someone who is not a customer.
 */
export const SERVICES: readonly Service[] = [
  {
    icon: 'website-design',
    title: 'Website Design',
    body:
      "A fast, professional website that's built to convert. We handle design, copy, mobile " +
      'optimization, and everything in between — so you look credible and customers feel ' +
      'confident calling you.',
    projects: [
      {
        src: '/nntm-labs/project-golden-scaffold.webp',
        alt: GOLDEN_SCAFFOLD.hero.image.alt,
        href: projectPath(GOLDEN_SCAFFOLD),
      },
      { src: '/nntm-labs/project-web-design-2.webp', alt: 'A property listing web design' },
    ],
  },
  {
    icon: 'local-seo',
    title: 'Local SEO/GEO',
    body:
      'We get you ranking on Google Maps and organic search for the keywords your customers ' +
      'are already typing. More visibility means more traffic without paying for every click.',
    projects: [
      {
        src: '/nntm-labs/project-golden-scaffold.webp',
        alt: GOLDEN_SCAFFOLD.hero.image.alt,
        href: projectPath(GOLDEN_SCAFFOLD),
      },
      { src: '/nntm-labs/project-mobile-app-2.webp', alt: 'A mobile commerce interface' },
    ],
  },
  {
    icon: 'google-ads',
    title: 'Google Ads',
    body:
      'Reach customers who are actively searching for exactly what you offer. We manage your ' +
      'campaigns, optimize your budget, and focus on leads — not just clicks.',
    projects: [
      {
        src: '/nntm-labs/project-golden-scaffold.webp',
        alt: GOLDEN_SCAFFOLD.hero.image.alt,
        href: projectPath(GOLDEN_SCAFFOLD),
      },
      { src: '/nntm-labs/project-web-development-2.webp', alt: 'A data-heavy web application' },
    ],
  },
  {
    icon: 'social-ads',
    title: 'Facebook & Instagram Ads',
    body:
      'Build awareness and generate leads in your local area with targeted social ads. Great ' +
      'for promotions, new customer acquisition, and staying top-of-mind in your community.',
    projects: [
      { src: '/nntm-labs/project-digital-marketing-1.webp', alt: 'A marketing campaign layout' },
      { src: '/nntm-labs/project-digital-marketing-2.webp', alt: 'A campaign analytics layout' },
    ],
  },
];

/**
 * The strip beneath the hero.
 *
 * DERIVED FROM SERVICES, not typed out. It used to be its own list and drifted
 * the moment the services changed: the hero went on advertising Branding,
 * Hosting and Mobile App Development for a business that sells none of them,
 * directly above a section listing the four it does. A list that has to agree
 * with another list will eventually not.
 *
 * Repeated so one copy is WIDER THAN THE CARD. `Marquee` renders `items` twice
 * and travels exactly -50%, which is seamless only if a single copy is at
 * least as wide as its container — four short labels are about 900px inside an
 * 1167px card, so the strip would run out and show a gap before the second
 * copy arrived. Doubling the run is the fix; the duplicate is inside one copy,
 * so the loop still closes.
 */
export const SERVICE_MARQUEE: readonly string[] = [
  ...SERVICES.map((service) => service.title),
  ...SERVICES.map((service) => service.title),
];

/**
 * The success stories' tabs.
 *
 * The template ships Challenge / Solution / Results and supplies copy for
 * Solution only. These are Before / After instead — a deliberate change, so a
 * story can show the numbers on either side of the engagement rather than
 * three prose panels. `After` is the default because it is the outcome, which
 * is what the section is selling.
 */
export const STORY_TABS = ['Before', 'After'] as const;

export type StoryTab = (typeof STORY_TABS)[number];

/** Which panel opens with the page. The outcome, not the starting point. */
export const DEFAULT_STORY_TAB: StoryTab = 'After';

export type StoryPanel = { heading: string; body: string };

export type SuccessStory = {
  /** Key into the icon map in ./icons.tsx. */
  icon: 'scaffold' | 'fitness';
  client: string;
  industry: string;
  service: string;
  /** Keyed by tab, lowercased — see `panelFor` in home.tsx. */
  panels: Record<Lowercase<StoryTab>, StoryPanel>;
};

export const SUCCESS_STORIES: readonly SuccessStory[] = [
  /*
   * A REAL CLIENT, WITH NOTHING SAID ABOUT THE WORK YET.
   *
   * This slot held Klothink, the template's invented e-commerce engagement. The
   * client is now Golden Scaffold, which is a real company — so the template's
   * "after" prose could not come with it. That copy described a checkout
   * redesign for a clothing shop; attached to a named scaffolding contractor it
   * would not be placeholder text, it would be a false account of an engagement
   * that has a real other party to contradict it.
   *
   * So both panels are visibly unwritten, and the ⚠️ warning at the top of
   * ./projects-content.ts applies here word for word. Fill them with the real
   * before-and-after — the figures the business can evidence — or drop the
   * story until they exist.
   */
  {
    icon: 'scaffold',
    client: 'Golden Scaffold',
    industry: 'Scaffolding',
    /*
     * All three services, which is why the same project heads the Website
     * Design, Local SEO/GEO and Google Ads galleries above.
     */
    service: 'Website, Local SEO, Google Ads',
    panels: {
      before: {
        heading: 'Before',
        body: 'Baseline figures for this engagement go here — where the numbers stood before the work began.',
      },
      after: {
        heading: 'After',
        body:
          'What the website, the local search work and the ad campaigns changed goes here, ' +
          'once the results are written up.',
      },
    },
  },
  {
    icon: 'fitness',
    client: 'Fitness Tracker App',
    industry: 'Health & Fitness',
    service: 'Mobile App Development',
    panels: {
      before: {
        heading: 'Before',
        body: 'Baseline figures for this engagement go here — where the numbers stood before the work began.',
      },
      after: {
        heading: 'After',
        body:
          'Leveraging our expertise in app development, we built an interactive mobile app ' +
          'with user-friendly features. The app allowed users to set personalized fitness ' +
          'goals, track their progress, and share achievements on social media platforms. ' +
          'Real-time data synchronization enabled users to access their data on multiple ' +
          'devices.',
      },
    },
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
    quote: 'Nanotom Labs turned our business around!',
    body:
      'Their digital marketing strategies helped us reach new customers and increase our ' +
      'revenue by 30% within just a few months. Highly recommended!',
    name: 'Sarah Thompson',
    role: 'CEO of BlueBloom',
    avatar: '/nntm-labs/avatar-sarah-thompson.webp',
  },
  {
    quote: 'Nanotom Labs turned our business around!',
    body:
      'Their digital marketing strategies helped us reach new customers and increase our ' +
      'revenue by 30% within just a few months. Highly recommended!',
    name: 'Wade Warren',
    role: 'Art Director',
    avatar: '/nntm-labs/avatar-wade-warren.webp',
  },
  {
    quote: 'Working with Nanotom Labs was a pleasure.',
    body:
      "Their web design team created a stunning website that perfectly captured our " +
      "brand's essence. The feedback from our customers has been overwhelmingly positive.",
    name: 'Lisa Williams',
    role: 'CEO Of HealthTech',
    avatar: '/nntm-labs/avatar-lisa-williams.webp',
  },
  {
    quote: "Nanotom Labs' web design team brought our vision to life.",
    body:
      'Their responsive design ensures our website looks stunning on all devices, ' +
      'contributing to increased user engagement.',
    name: 'Jennifer Lee',
    role: 'COO of Foodie Haven',
    avatar: '/nntm-labs/avatar-jennifer-lee.webp',
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
    'Take the first step towards digital success with Nanotom Labs by your side. Our team of ' +
    'experts is eager to craft tailored solutions that drive growth for your business.',
  cta: 'Get in Touch',
} as const;

export const NEWSLETTER = {
  eyebrow: 'Newsletter',
  heading: 'Subscribe To our Newsletter',
  placeholder: 'Enter your email',
} as const;

export type Reason = { title: string; body: string };

/**
 * The four "reasons to choose" cards, on the HOMEPAGE.
 *
 * They were the Services page's, from the template's frame, and moved here by
 * decision: they answer "why you" rather than "what do you sell", which is a
 * question a visitor asks before the service list, not after it. So they sit
 * above Our Services rather than below anything.
 *
 * Every card ends in a "Learn More" control that has no destination — there is
 * no page behind any of the four — so it renders unlinked rather than as a
 * link that 404s. See DiscLink in ./primitives.tsx.
 *
 * STILL THE TEMPLATE'S COPY, generic agency claims about expertise and track
 * record. The heading names the local-business audience now; the four cards
 * under it do not yet.
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
      'At Nanotom Labs, we prioritize understanding our clients\u2019 unique requirements, ' +
      'fostering transparent communication throughout the development process.',
  },
  {
    title: 'Dedicated Team of Professionals',
    body:
      'Our professionals bring a wealth of expertise to the table, ensuring the delivery of ' +
      'top-notch, scalable, and secure web solutions for your business.',
  },
];

/** Section headings, so the page component holds no bare strings. */
export const SECTIONS = {
  reasons: 'Reasons to Choose Nanotom Labs for Your Local Business',
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
  learnMore: 'Learn More',
  /* The shared WorkPanel's labels — see ./sections.tsx. */
  details: 'Details',
  technologiesUsed: 'Technologies Used',
  teamMembers: 'Team Members',
  category: 'Category',
  timeTaken: 'Time Taken',
} as const;
