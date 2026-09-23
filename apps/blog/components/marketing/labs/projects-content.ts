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
 * The hero image and the showcase's are the real ones — the same collage, and
 * the same file the homepage's galleries use. What is still unwritten is the
 * showcase's before-and-after, which is the part that would state a result.
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
  /** The three-column panel, the same shape the homepage and /services render. */
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

/** Written once: the entry's own slug, and the path its showcase links to. */
const SLUG = 'golden-scaffold-los-angeles-ca';

export const GOLDEN_SCAFFOLD: Project = {
  slug: SLUG,
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
  /*
   * ALSO THE FIRST ENTRY IN WORKS, which the homepage and /services render —
   * see ../content.ts. Defined here because this is the project's file, and
   * because a second copy of a client's name, category and artwork is a thing
   * that drifts rather than a thing that stays in step.
   */
  showcase: {
    icon: 'scaffold',
    title: 'Golden Scaffold',
    category: 'Website, Local SEO & Google Ads',
    /* ⚠️ PLACEHOLDER. */
    timeTaken: 'To be confirmed',
    body:
      'A commercial scaffolding contractor serving Los Angeles and Orange County, with the ' +
      'website, the local search work and the ad campaigns run together.',
    image: {
      src: '/nntm-labs/project-golden-scaffold.webp',
      alt: 'Pages from the Golden Scaffold website, a Los Angeles scaffolding contractor',
    },
    href: `/projects/${SLUG}`,
    /*
     * ⚠️ BOTH PANELS ARE PLACEHOLDER, and visibly so. This is the half of the
     * panel that says what changed, which is exactly the claim that cannot be
     * invented about a named company — see the warning at the top of this file.
     */
    panels: {
      before: {
        heading: 'Before',
        body:
          'Where this business stood before the work began goes here — the figures it can ' +
          'evidence.',
      },
      after: {
        heading: 'After',
        body:
          'What the website, the local search work and the ad campaigns changed goes here, ' +
          'once the results are written up.',
      },
    },
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
