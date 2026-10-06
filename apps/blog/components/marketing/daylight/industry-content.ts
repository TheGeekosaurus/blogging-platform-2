import type { FundingSlug } from '../brand';

/**
 * Copy for the industry pages, /industries/<slug>.
 *
 * ONE RECORD PER INDUSTRY, and the page is a template over it — the same
 * arrangement LOAN_PAGES and ft/loan-product.tsx use for the nine products.
 * Denis asked to build one and then spin up more; "more" is an entry in this
 * file and a route, not another component.
 *
 * WHAT AN INDUSTRY PAGE MAY AND MAY NOT SAY. It is allowed to be specific
 * about the TRADE — what a kitchen costs to re-equip, why a seasonal menu ties
 * up cash, which of the nine products that shape of problem usually wants. It
 * is NOT allowed to be specific about this business's record in that trade:
 * there is no "we have funded 180 restaurants" here and there should not be,
 * because nobody has counted. The same rule the testimonials and the funding
 * figures already follow.
 *
 * The products a page recommends are slugs, resolved against FUNDING_PROGRAMS
 * at render. That makes them compile-checked — a renamed product breaks the
 * build rather than silently dropping out of the list — and it means each card
 * is drawn from the same copy as the index and the product page itself, so an
 * industry page cannot describe a product a fourth way.
 */
export type IndustryPage = {
  readonly slug: string;
  /** Short name — the nav label, and the <title>. */
  readonly navLabel: string;
  /** Feeds <meta name="description">. */
  readonly description: string;
  /**
   * NO EYEBROW AND NO STATS HERE. Denis asked for "our Hero section same as
   * main, new headline on the left side", and same-as-main means the shared
   * ./hero.tsx — which draws its own badge from HERO.stats and its own figure
   * row underneath. The heading and the standfirst are the only two things
   * that differ per industry, so they are the only two fields.
   */
  readonly hero: {
    readonly heading: string;
    readonly blurb: string;
  };
  /** What the money actually goes on in this trade. */
  readonly needs: {
    readonly label: string;
    readonly heading: string;
    readonly body: string;
    readonly items: readonly {
      /** Key into the glyph map in ./industry.tsx. */
      readonly icon: string;
      readonly title: string;
      readonly body: string;
    }[];
  };
  /** Which of the nine this trade usually wants, and why. */
  readonly products: {
    readonly label: string;
    readonly heading: string;
    readonly body: string;
    readonly slugs: readonly FundingSlug[];
  };
};

export const INDUSTRY_PAGES: readonly IndustryPage[] = [
  {
    slug: 'food-business',
    navLabel: 'Food Business',
    description:
      'Funding for restaurants, cafés, caterers and food producers — equipment, ' +
      'inventory, payroll through a slow season and the cost of opening a second site.',
    hero: {
      heading: 'Funding That Keeps The Kitchen Open.',
      blurb:
        'Restaurants, cafés, caterers, bakeries and food producers run on thin margins ' +
        'and uneven weeks, and the equipment that makes the money is the equipment that ' +
        'breaks. Funding sized to how the trade actually works, with a decision in hours.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What Food Businesses Actually Borrow For.',
      body:
        'Not one big thing — a handful of recurring ones, most of which arrive with no ' +
        'notice and all of which have to be paid before the revenue they create turns up.',
      items: [
        {
          icon: 'equipment',
          title: 'The walk-in that failed on a Friday',
          body:
            'Refrigeration, ovens, fryers and dishwashers do not fail politely. Equipment ' +
            'finance covers a replacement against the asset itself, so a breakdown is a ' +
            'two-day problem rather than a two-week one.',
        },
        {
          icon: 'inventory',
          title: 'Stock ahead of a season',
          body:
            'A holiday menu, a festival contract or a wholesale order has to be bought ' +
            'before any of it sells. That is weeks of cash out before the first plate goes ' +
            'out of the pass.',
        },
        {
          icon: 'payroll',
          title: 'Payroll through a quiet month',
          body:
            'January after December, or a wet fortnight in a seaside town. The staff who ' +
            'make the good months possible have to be paid through the thin ones.',
        },
        {
          icon: 'expand',
          title: 'A fit-out or a second site',
          body:
            'Taking a lease, building out a kitchen and trading at a loss for the first ' +
            'quarter is the normal shape of a second location, and it is funded long before ' +
            'it pays.',
        },
        {
          icon: 'marketing',
          title: 'Getting people through the door',
          body:
            'Delivery platform commissions, a local campaign, photography for a new menu — ' +
            'marketing spend that works, but works on a lag.',
        },
        {
          icon: 'cash-flow',
          title: 'The gap on catering invoices',
          body:
            'Corporate and event clients pay on their terms, not yours. The food was bought ' +
            'and the staff were paid weeks before that invoice settles.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to a food business. These are the ones the shape of the problem ' +
        'tends to point at — and an advisor will say plainly if a different one fits better.',
      slugs: [
        'equipment-financing',
        'working-capital',
        'merchant-cash-advance',
        'inventory-financing',
        'line-of-credit',
      ],
    },
  },
];

/** Lookup by slug, for the route and its metadata. */
export function industryBySlug(slug: string): IndustryPage | null {
  return INDUSTRY_PAGES.find((page) => page.slug === slug) ?? null;
}
