/**
 * Copy for the Nanotom Labs Industries page.
 *
 * NONE OF THIS IS THE TEMPLATE'S, and none of it is a claim. Every entry
 * describes HOW the same four services are aimed at a given trade — which
 * search a customer types, which channel they arrive through, what counts as a
 * conversion — rather than asserting that this agency has clients in it.
 *
 * That distinction is the whole design of this file. "We rank plumbers" is a
 * claim about a client list; "a plumbing customer searches at the moment the
 * pipe bursts and calls the first business that answers" is a description of
 * the market, and it is both true and the more useful sentence. Nothing here
 * needs replacing before launch — unlike the three blocks on /about.
 *
 * NO PHOTOGRAPHS. The frame this section is built from puts one on top of each
 * card. There are no photographs of this agency's work in these trades, and a
 * stock photo of a smiling dentist is the same lie the team portraits are, at
 * lower resolution. Each card carries its industry's line mark on a tinted
 * tile instead — the shape of the design, none of the fiction. `image` is
 * there for when real ones exist.
 */

export type Industry = {
  /** Key into INDUSTRY_ICONS in ./icons.tsx. */
  icon: 'home-services' | 'construction' | 'dental' | 'restaurant' | 'legal' | 'auto';
  title: string;
  body: string;
  /**
   * A photograph for the card's tile, once there is a real one. Absent today,
   * and the tile falls back to the icon — see the note above.
   */
  image?: { src: string; alt: string };
  /**
   * Its own page, once one exists. Absent today, so the card's call renders as
   * nothing rather than as a link to a page that is not there — the rule the
   * nav's unbuilt items and the project tiles both follow.
   */
  href?: string;
};

export const INDUSTRIES: readonly Industry[] = [
  {
    icon: 'home-services',
    title: 'Home Services',
    body:
      'Plumbers, electricians, HVAC and roofers. The customer is searching at the moment ' +
      'something has gone wrong and calls whoever answers first, so the work is ranking for ' +
      '"near me" and making the phone number impossible to miss.',
  },
  {
    icon: 'construction',
    title: 'Construction & Trades',
    body:
      'Contractors, scaffolding, concrete and remodelling. The jobs are large and the ' +
      'decision is slow, so the site has to carry proof — past work, licences, insurance — ' +
      'and the ads have to reach the person specifying the job, not the one browsing.',
  },
  {
    icon: 'dental',
    title: 'Dental & Medical',
    body:
      'Practices competing inside a few square miles, where the map pack is most of the ' +
      'decision. Reviews, hours, insurance and a booking flow that works on a phone matter ' +
      'more than anything on the homepage.',
  },
  {
    icon: 'restaurant',
    title: 'Restaurants & Hospitality',
    body:
      'Where people decide in minutes and search on a phone. Menus that load, a Google ' +
      'profile that is current, and social ads timed to the hours you actually need to ' +
      'fill rather than spread across the week.',
  },
  {
    icon: 'legal',
    title: 'Legal & Professional',
    body:
      'Attorneys, accountants, agencies and consultants. Clicks are expensive and most of ' +
      'them are not clients, so the job is qualifying before the call — clear practice ' +
      'areas, honest expectations, and a form that asks the right two questions.',
  },
  {
    icon: 'auto',
    title: 'Auto Services',
    body:
      'Repair shops, body shops, tyres and detailing. Half the searches are urgent and half ' +
      'are price comparison; the site has to answer both, and the ads have to stop paying ' +
      'for the ones already going somewhere else.',
  },
];

/**
 * The hero.
 *
 * TWO LINES, the first sharing its row with the call. "Marketing Built" is
 * short enough to leave the call its place at the 62px ceiling the other
 * heroes use — see the measured note in ./home.tsx.
 */
export const INDUSTRIES_HERO = {
  headingLines: ['Marketing Built', 'For Your Trade'],
  cta: 'Get Started',
  body:
    'The four services are the same everywhere. What changes is which search a customer ' +
    'types, how long they take to decide, and what counts as a lead — so that is what we ' +
    'build around, trade by trade.',
} as const;

/** The stat grid's trailing tile, which scrolls to the list rather than away. */
export const INDUSTRIES_STATS_CTA = 'Know More';

/** The id it points at, and the heading it lands on. */
export const INDUSTRIES_ANCHOR = 'industries';

export const INDUSTRIES_SECTIONS = {
  industries: 'Industries We Work With',
} as const;

export const INDUSTRIES_LINKS = {
  /** The section header's link, which goes somewhere that exists. */
  ourServices: 'Our Services',
  /** A card's own call, rendered only for an industry that has a page. */
  readMore: 'Read More',
} as const;
