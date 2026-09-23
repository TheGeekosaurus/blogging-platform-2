/**
 * Copy for the Nanotom Labs About page.
 *
 * ⚠️ THREE OF THE FIVE BLOCKS BELOW ARE THE TEMPLATE'S, AND THEY ARE THE KIND
 * A VISITOR IS ENTITLED TO BELIEVE. An About page is where a business states
 * facts about itself, so placeholder copy here does not read as placeholder —
 * it reads as a claim:
 *
 *   TEAM         four people who do not work here, with the template's stock
 *                portraits and its invented names and titles
 *   MILESTONES   four dated events that did not happen on those dates
 *   AWARDS       four awards that were not given, by bodies that did not give
 *                them — the worst of the three, because an award names a third
 *                party who can say otherwise
 *
 * Each is its own array, and `./about.tsx` renders NOTHING for an empty one.
 * So the way to make this page honest today is to empty the arrays; the way to
 * make it good is to fill them with what is true. Both are edits to this file
 * alone.
 *
 * WHAT IS ALREADY TRUE: the hero (the business's own positioning, claiming
 * nothing it cannot show) and the stat grid, which reads the same STATS the
 * homepage bands across its width — figures the business stands behind.
 */

/**
 * The hero.
 *
 * NOT THE TEMPLATE'S COPY. The frame says "Elevating Brands In The Digital
 * Age", which is an agency saying nothing in particular; this says who the
 * work is for. It also claims nothing — no count, no outcome, no superlative —
 * which is what lets it sit above three blocks that are still placeholder.
 *
 * TWO LINES, and the first one has to share its row with the call: at the 62px
 * ceiling those other heroes use, the first line has about 842px inside a
 * 1111px card, which "Local Businesses" clears at roughly 640px. A longer
 * first line pushes the call onto its own row and the composition goes with
 * it — see the measured note in ./home.tsx.
 */
export const ABOUT_HERO = {
  headingLines: ['Local Businesses', 'Deserve Better Marketing'],
  cta: 'Get Started',
  body:
    'Nanotom Labs is a marketing team for businesses whose customers live nearby. We build ' +
    'the website, earn the rankings and run the ads — and we judge the work by the calls, ' +
    'bookings and quote requests it brings in, not by impressions.',
} as const;

/** The stat grid's trailing tile, which scrolls to the team rather than away. */
export const ABOUT_STATS_CTA = 'Know More';

/** The id that tile points at, and the heading it lands on. */
export const TEAM_ANCHOR = 'team';

export type TeamMember = {
  name: string;
  role: string;
  /** A 220x220 cut-out with an alpha channel; the accent behind shows through. */
  portrait: string;
  /**
   * Profiles, if there are any. Absent by default and absent on purpose: the
   * design puts three social discs under every face, and a disc that goes
   * nowhere is a control that looks operable and is not. Give a member links
   * and the row appears under that member alone.
   */
  links?: readonly { name: 'linkedin' | 'facebook' | 'instagram'; href: string }[];
};

/**
 * ⚠️ FOUR PEOPLE WHO DO NOT WORK HERE.
 *
 * The names, the titles and the faces are the Figma template's. Published,
 * this is not filler — it is a staff list, and the faces belong to whoever
 * modelled for the stock library. Replace every entry with real colleagues, or
 * empty the array and the section disappears.
 *
 * The portraits are the cut-outs the /services work panels use as small
 * avatars, at the size they were exported (220px). They are the right shape
 * for this card — a figure standing on an accent ground — which is why no new
 * asset was added for a section whose whole content is placeholder.
 */
export const TEAM: readonly TeamMember[] = [
  { name: 'John Smith', role: 'Co-Founder & CEO', portrait: '/nntm-labs/team-1.webp' },
  { name: 'Sarah Adams', role: 'Head of Design', portrait: '/nntm-labs/team-4.webp' },
  { name: 'Emily Johnson', role: 'Lead Web Developer', portrait: '/nntm-labs/team-5.webp' },
  { name: 'William Lee', role: 'Lead Backend Developer', portrait: '/nntm-labs/team-9.webp' },
];

export type Milestone = { date: string; title: string; body: string };

/**
 * ⚠️ FOUR DATED EVENTS THAT DID NOT HAPPEN ON THOSE DATES.
 *
 * The template's, with its company name swapped out. A date is a checkable
 * claim, which is what separates this from the hero copy above it. The 2010
 * entry does at least agree with the "10+ Years Of Experience" figure in the
 * stat band — that agreement is a coincidence of the template's numbers, not
 * evidence for either.
 */
export const MILESTONES: readonly Milestone[] = [
  {
    date: 'September 2023',
    title: 'Global Recognition For Innovation',
    body:
      'In 2023, our agency gained global acclaim for innovative solutions, setting new ' +
      'standards in the ever-evolving digital landscape.',
  },
  {
    date: 'March 2019',
    title: 'Industry Leadership Acknowledged',
    body:
      'Recognized as an industry leader in 2019, our agency received prestigious awards, ' +
      'affirming our commitment to excellence and client satisfaction.',
  },
  {
    date: 'August 2015',
    title: 'Expansion Into New Markets',
    body:
      'Expanding horizons in 2015, our agency successfully entered new markets, establishing ' +
      'a wider presence and serving clients on a broader scale.',
  },
  {
    date: 'January 2010',
    title: 'Where It Started',
    body:
      'In 2010, our agency was born, establishing the core principles that have guided us ' +
      'through a decade of work.',
  },
];

export type Award = { date: string; title: string; body: string };

/**
 * ⚠️ FOUR AWARDS THAT WERE NOT GIVEN. EMPTY THIS FIRST.
 *
 * Of the three placeholder blocks on this page, this is the one that names
 * somebody else: an award implies a body that gave it and a year it was given
 * in, both checkable and neither true. A visitor can shrug off marketing prose;
 * "Best Digital Marketing Campaign, July 2022" is a specific statement that
 * happens to be false, and it is exactly the sort of claim a competitor or a
 * regulator reads literally.
 *
 * Keep it only while this page is unpublished scaffolding. The array is empty-
 * able and ./about.tsx drops the whole section when it is.
 */
export const AWARDS: readonly Award[] = [
  {
    date: 'October 2017',
    title: 'Digital Excellence Award',
    body:
      'Recognition for outstanding contributions to the digital industry, celebrating our ' +
      'ability to deliver web design and development that push the boundaries of creativity ' +
      'and functionality.',
  },
  {
    date: 'March 2019',
    title: 'Top Local Marketing Agency',
    body:
      'Recognized as a top local marketing agency by industry peers, highlighting our ' +
      'proficiency in delivering campaigns that reach customers close to home.',
  },
  {
    date: 'July 2022',
    title: 'Best Digital Marketing Campaign',
    body:
      'Awarded for an exceptional digital marketing campaign with outstanding results, ' +
      'showcasing data-driven strategies and targeted efforts that achieved remarkable ' +
      'growth for our clients.',
  },
  {
    date: 'November 2024',
    title: 'Innovative Tech Startup Award',
    body:
      'Recognition of our pioneering efforts as a technology business, acknowledging our ' +
      'commitment to exploring and implementing new tools in the digital space.',
  },
];

/** Section headings, so the layout holds no bare strings. */
export const ABOUT_SECTIONS = {
  team: 'Meet The Minds Behind Nanotom Labs',
  milestones: 'Our Achievements',
  awards: 'Awards & Recognitions',
} as const;

export const ABOUT_LINKS = {
  allMembers: 'All Members',
  /** The label on each award's date pill, before the date itself. */
  date: 'Date',
} as const;
