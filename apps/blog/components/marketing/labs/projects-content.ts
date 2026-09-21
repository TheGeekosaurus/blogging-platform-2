import type { Work } from './content';

/**
 * The individual project pages, one entry per case study.
 *
 * ⚠️ EVERY WORD BELOW IS A PLACEHOLDER, AND THE PROJECT NAMES A REAL COMPANY.
 *
 * This is the most dangerous file on the site. A case study says "we did this
 * work, for this named business, and these were the results" — published with
 * invented copy it is a false claim about somebody else's company, not merely
 * filler. The template's testimonials are at least obviously stock; a page
 * titled with a client's real name and city is not.
 *
 * So nothing here asserts an outcome. The brief describes the engagement in
 * the most general terms available, the feature cards describe how Nanotom
 * Labs works rather than what this project achieved, and there are no metrics
 * at all — no percentage lifts, no call counts, no revenue. Fill every field
 * marked below with what actually happened.
 *
 * THIS PAGE IS NOW REACHABLE. The homepage's project galleries link to it, by
 * decision — so the placeholder copy is in front of visitors rather than
 * waiting behind an unlinked URL. It stays `noindex` (see the metadata in
 * app/projects/[slug]/page.tsx) and out of the sitemap until the case study is
 * written, and that is the only thing still holding it back from search.
 *
 * The hero image is the real one. The showcase panel's `technologies`, `team`
 * and `image` are still the Figma template's, reused so the layout renders.
 * They describe nothing real.
 *
 * WHY A REGISTRY rather than a file per project: the page is one layout with
 * different content, so a second project should be a row here and nothing
 * else. `app/projects/[slug]/page.tsx` builds one static page per entry and
 * `CODED_SITES` in @blog/core lists them, which is what puts them in the
 * sitemap and the admin.
 */

export type ProjectFeature = {
  /** Key into PROJECT_FEATURE_ICONS in ./icons.tsx. */
  icon: 'planning' | 'tailored' | 'user-centric' | 'delivery';
  title: string;
  body: string;
};

export type Project = {
  /**
   * The URL segment, and the whole SEO decision.
   *
   * `golden-scaffold-los-angeles-ca` rather than `golden-scaffold`: this is a
   * local-marketing agency's case study, and the queries worth ranking for are
   * the ones a nearby business types — "scaffolding company los angeles", the
   * client's name plus its city. The city and state earn their length here in
   * a way they would not on a product page. It also keeps a second Golden
   * Scaffold in another city from colliding.
   */
  slug: string;
  /** The <title> and the admin's label. */
  title: string;
  /** Meta description. Written for the search result, not for the page. */
  description: string;

  hero: {
    /** First line sits beside the call; the rest stack under it. */
    headingLines: readonly string[];
    cta: string;
    body: string;
    image: { src: string; alt: string };
    /** The pill over the image's bottom-left corner. */
    tag: string;
  };

  featuresTitle: string;
  features: readonly ProjectFeature[];

  showcaseTitle: string;
  /** The three-column panel, the same shape /services renders. */
  showcase: Work;
};

/**
 * The four "key features" cards.
 *
 * ABOUT HOW THE WORK IS DONE, not about what this project achieved — which is
 * the template's own framing ("Key Features of Our Projects") and the only
 * honest one available until the real outcomes are known. Shared across
 * projects for now; move them into `Project` the moment two projects need to
 * say different things.
 */
export const PROJECT_FEATURES: readonly ProjectFeature[] = [
  {
    icon: 'planning',
    title: 'Strategic Planning',
    body:
      'Every project begins with research into the local market and the searches customers ' +
      'are already making, so the work is aimed at demand that exists.',
  },
  {
    icon: 'tailored',
    title: 'Customized Solutions',
    body:
      'No two local businesses compete for the same thing. The site, the listings and the ' +
      'ad spend are built around this one.',
  },
  {
    icon: 'user-centric',
    title: 'User-Centric Approach',
    body:
      'Designed around the person trying to call, book or get a quote — on a phone, in a ' +
      'hurry, often for the first time.',
  },
  {
    icon: 'delivery',
    title: 'Timely Delivery',
    body:
      'Agreed milestones and a date, so the work lands when it was said it would rather ' +
      'than whenever it is finished.',
  },
];

export const GOLDEN_SCAFFOLD: Project = {
  slug: 'golden-scaffold-los-angeles-ca',
  title: 'Golden Scaffold — Los Angeles, CA',
  /* ⚠️ PLACEHOLDER — rewrite once the engagement is described. */
  description:
    'A local search and web project for Golden Scaffold, a scaffolding contractor in Los ' +
    'Angeles, California.',

  hero: {
    /* ⚠️ PLACEHOLDER headline. It names the client and the city and claims nothing. */
    headingLines: ['Golden Scaffold', 'Los Angeles, CA'],
    cta: 'Start a Project',
    /* ⚠️ PLACEHOLDER brief. Replace with what the engagement actually covered. */
    body:
      'A scaffolding contractor serving the Los Angeles area. This page will carry the ' +
      'brief, the work and the outcome once they are written up.',
    /*
     * REAL, unlike almost everything else in this entry: a collage of pages
     * from the site that was built. It is also the tile that heads three of
     * the homepage galleries — one file, referenced from ../content.ts.
     *
     * Replaced the template's a-aura artwork, which showed a different
     * product entirely. That mattered more here than elsewhere: the homepage
     * tiles now link to this page, so a visitor who clicks a picture of the
     * Golden Scaffold site would have landed on somebody else's.
     */
    image: {
      src: '/nntm-labs/project-golden-scaffold.webp',
      alt: 'Pages from the Golden Scaffold website, a Los Angeles scaffolding contractor',
    },
    tag: 'Local SEO/GEO',
  },

  featuresTitle: 'Key Features of Our Projects',
  features: PROJECT_FEATURES,

  showcaseTitle: 'Project Showcase',
  showcase: {
    /* ⚠️ Every field below is the template's placeholder data. */
    icon: 'spark',
    title: 'Golden Scaffold',
    category: 'Local SEO/GEO',
    timeTaken: 'To be confirmed',
    body:
      'The scope, the timeline and what changed will be written up here once the ' +
      'engagement is documented.',
    image: {
      src: '/nntm-labs/work-zenith.webp',
      alt: 'Placeholder artwork standing in for the Golden Scaffold project',
    },
    technologies: ['Google Business Profile', 'Local SEO', 'Google Ads'],
    team: [
      '/nntm-labs/team-1.webp',
      '/nntm-labs/team-3.webp',
      '/nntm-labs/team-6.webp',
    ],
  },
};

/** Every project page, keyed by slug. Add a row to add a page. */
export const PROJECTS: readonly Project[] = [GOLDEN_SCAFFOLD];

export function projectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}

/** The path a project page lives at. One place, so a rename cannot desync. */
export function projectPath(project: Project): string {
  return `/projects/${project.slug}`;
}
