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
 * THREE LINES, AND THE FIRST ONE ROLLS. It was three static clauses — More
 * Calls / More Foot Traffic / More Revenue — which named two outcomes and
 * stopped. The rolling slot names fourteen in the space of one line, and the
 * two lines under it are the ones that do not change: sales, then revenue.
 *
 * READ AS A LADDER, WHICH IS THE POINT OF THE ORDER. The rolling word is the
 * thing a marketing spend actually produces — a call, a booking, a quote
 * request — and the two fixed lines are what those turn into. Whichever word
 * is showing, the headline ends in the same place.
 *
 * `lead` + `rolling` is the first line, `headingLines` everything under it.
 * The roll is CSS, so the words are all in the markup at once — see
 * `RollingOutcome` in ./home.tsx and `.nl-roll` in app/globals.css.
 *
 * ADDING A WORD IS FREE; A LONG ONE IS NOT, AND IT COSTS EVERY OTHER WORD.
 * The slot is as wide as the longest entry whichever word is showing, so the
 * headline's type size is set by the longest line the roll can make — and that
 * size applies to the whole headline, all the time. Measured in the browser:
 * "More Estimate Requests" is 14.83em against "More Calls" at 6.90em, and it
 * is the 14.83 that holds the h1 to 67.8px at 1920 rather than the 83.7px the
 * card could otherwise take. Shorten the longest entry and every word gets
 * bigger; add a longer one and every word shrinks. Re-measure the clamp on the
 * h1 in ./home.tsx either way.
 */
export const HERO = {
  lead: 'More',
  /*
   * Plural throughout — the line reads "More <word>", and "More Quote Request"
   * does not.
   *
   * ORDERED SO THE SIMILAR ONES ARE NOT NEIGHBOURS. Three of these end in
   * "Requests" and four are about a booking; run consecutively they read as a
   * stutter rather than a list. "Calls" opens because it is the shortest and
   * the most concrete, and it is also the word the roll rests on wherever the
   * animation does not run — a reduced-motion setting, or a browser that never
   * starts it.
   */
  rolling: [
    'Calls',
    'Leads',
    'Store Visits',
    'Bookings',
    'Quote Requests',
    'Customers',
    'Appointments',
    'Reviews',
    'Estimate Requests',
    'Online Orders',
    'Reservations',
    'Service Requests',
    'Repeat Business',
    'Contracts',
  ],
  /**
   * Under the roll, and deliberately fixed: what every one of those outcomes
   * turns into. The call rides the LAST of these — see ./home.tsx — so adding
   * a line here moves it down with them.
   */
  headingLines: ['More Sales', 'More Revenue'],
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

export type Faq = {
  question: string;
  /**
   * Optional, and every entry has one today. It was optional because the
   * template supplied an answer for the first question and left four questions
   * hanging — and an accordion that opens onto nothing is a worse thing to
   * ship than a shorter list.
   */
  answer?: string;
};

/**
 * The questions a local business actually asks before it hires anybody.
 *
 * NOT THE TEMPLATE'S. Those were about mobile app development, third-party
 * APIs and cross-platform compatibility — a web shop's FAQ on a local
 * marketing agency's site, which is both wrong and slightly damning, since an
 * agency that sells web copy had five questions of somebody else's on every
 * page of its own.
 *
 * WHAT THE ANSWERS DO AND DO NOT SAY. Each one describes how the work behaves
 * — why ads are fast and search is slow, why a click costs what it costs —
 * rather than promising a result. Nothing here claims a ranking, a timeline
 * for a specific business, or a number this agency has hit.
 *
 * ⚠️ TWO OF THEM ARE POLICY, not description, and they are the business's to
 * confirm rather than mine to assert: who owns the accounts, and what
 * reporting a client gets. Both are written the way a good agency answers
 * them. If either is not how Nanotom Labs works, it is the answer that needs
 * changing, not the question.
 */
export const FAQS: readonly Faq[] = [
  {
    question: 'How soon will I see results?',
    answer:
      'It depends which service you are buying. Ads can produce calls in the first week, ' +
      'because you are paying for attention that already exists. Local search is slower — ' +
      'Google has to see a consistent profile, consistent listings and real reviews before ' +
      'rankings hold, and that is usually months rather than weeks. We tell you at the ' +
      'start which of the two your budget is buying.',
  },
  {
    question: 'Do I need a new website, or can you work with the one I have?',
    answer:
      'Either. If your site loads quickly, says plainly what you do, and is easy to call or ' +
      'book from on a phone, the money is better spent getting people to it. If it does ' +
      'not, no amount of traffic fixes that — so we say which of the two you are looking ' +
      'at before anything is booked.',
  },
  {
    question: 'How much should I be spending on ads?',
    answer:
      'Enough to buy more clicks than it takes your market to produce a lead, which varies ' +
      'by trade and by city — a plumbing click and an attorney click are not the same ' +
      'price. We work back from what a customer is worth to you and what the auction ' +
      'currently costs, rather than starting from a monthly figure and hoping.',
  },
  {
    /* ⚠️ POLICY — see the note above. */
    question: 'Who owns the website, the ad account and the Google profile?',
    answer:
      'You do. Accounts are set up in your name with us added as a user, so if we part ' +
      'ways you keep the history, the data and everything built for you. An agency that ' +
      'holds your ad account holds your business.',
  },
  {
    /* ⚠️ POLICY — see the note above. */
    question: 'How will I know it is working?',
    answer:
      'Calls and form fills are tracked back to the channel that produced them, so the ' +
      'question gets answered in leads rather than impressions. You get a report you can ' +
      'read in two minutes, and the dashboards underneath it are yours to open whenever ' +
      'you like.',
  },
  {
    question: 'What do you need from me to get started?',
    answer:
      'Access to whatever already exists — the site, the Google profile, any ad accounts — ' +
      'and an honest description of what a good customer looks like and what one is worth ' +
      'to you. Photographs of your actual work help more than anything we could write.',
  },
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
