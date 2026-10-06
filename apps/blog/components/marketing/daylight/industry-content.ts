import type { FundingSlug } from '../brand';

/**
 * Copy for the industry pages, /industries/<slug>.
 *
 * ONE RECORD PER INDUSTRY, and the page is a template over it — the same
 * arrangement LOAN_PAGES and ft/loan-product.tsx use for the nine products.
 * Denis asked to build one and then spin up more; "more" turned out to be
 * exactly that, five times over, with no new component and no new route: since
 * 2026-10-06 app/industries/[industry] builds its params straight off this
 * array.
 *
 * ADDING ONE IS THREE EDITS, and a test fails on each if it is missed: a record
 * here, an entry in INDUSTRIES in ../brand.ts so the menus link to it, and a
 * path in CODED_SITES in @blog/core so the sitemap and the admin can see it.
 * A fourth, the glyph, only if the `icon` key is new.
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

  {
    slug: 'construction-business',
    navLabel: 'Construction Business',
    description:
      'Funding for contractors, builders and trades — equipment, materials, crew wages ' +
      'and the long gap between finishing the work and being paid for it.',
    hero: {
      heading: 'Funding For The Gap Between Draws.',
      blurb:
        'General contractors, subcontractors and specialty trades carry the cost of a job ' +
        'for weeks before a draw clears, and the machine that stops costs more by the hour ' +
        'than it does to fix. Funding sized to that gap, with a decision in hours.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What Contractors Actually Borrow For.',
      body:
        'Almost all of it comes down to the same thing in different clothes: the money goes ' +
        'out at the start of a job and comes back at the end, and the distance between those ' +
        'two points is where a contractor lives.',
      items: [
        {
          icon: 'equipment',
          title: 'The machine that went down mid-job',
          body:
            'An excavator, a lift or a truck out of service stops a crew, not just a task. ' +
            'Equipment finance covers the replacement against the asset itself, so the ' +
            'schedule slips by days rather than by a season.',
        },
        {
          icon: 'cash-flow',
          title: 'Thirty, sixty, ninety days to the draw',
          body:
            'The work is signed off and the invoice is in, and the money still arrives a ' +
            'quarter later. Retainage holds back more of it again until the job closes out.',
        },
        {
          icon: 'payroll',
          title: 'Crew wages before the invoice clears',
          body:
            'Labour is paid weekly whatever the pay application is doing. On a long job that ' +
            'is months of wages funded out of your own working capital.',
        },
        {
          icon: 'inventory',
          title: 'Materials bought at today’s price',
          body:
            'Lumber, steel, concrete and fixtures are paid for up front, often at a price ' +
            'that moved since the bid. The customer pays for them much later.',
        },
        {
          icon: 'expand',
          title: 'A job bigger than your float',
          body:
            'The contract you want is the one that needs more cash on day one than the last ' +
            'three put together. Turning it down for that reason is how a firm stays its ' +
            'current size.',
        },
        {
          icon: 'hiring',
          title: 'A second crew for a second contract',
          body:
            'Two jobs running at once means two sets of hands, tools and trucks, in place ' +
            'before either one bills.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to a contractor. These are the ones the shape of the problem tends ' +
        'to point at — and an advisor will say plainly if a different one fits better.',
      slugs: [
        'equipment-financing',
        'receivables-financing',
        'working-capital',
        'line-of-credit',
        'bridge-loans',
      ],
    },
  },

  {
    slug: 'agriculture',
    navLabel: 'Agriculture',
    description:
      'Funding for farms, ranches and growers — inputs, machinery, seasonal labour and the ' +
      'twelve months of costs that sit between one harvest and the next.',
    hero: {
      heading: 'Funding That Spans The Season.',
      blurb:
        'Row crop, livestock, orchard or greenhouse, the arithmetic is the same: every cost ' +
        'lands before the only cheque of the year does. Funding built around that cycle, with ' +
        'a decision in hours rather than a visit in a fortnight.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What Farms Actually Borrow For.',
      body:
        'Not the unexpected so much as the entirely expected, arriving in the wrong order — ' +
        'everything a season costs is spent before the season pays.',
      items: [
        {
          icon: 'inventory',
          title: 'Seed, fertiliser, feed and fuel',
          body:
            'Inputs are bought months ahead of anything coming off the field, and the best ' +
            'price is usually the one that wants paying earliest.',
        },
        {
          icon: 'equipment',
          title: 'A machine that cannot wait for spring',
          body:
            'A combine, a tractor or an irrigation system that fails does not fail ' +
            'conveniently. Equipment finance covers it against the asset, so a breakdown is ' +
            'not a lost planting.',
        },
        {
          icon: 'cash-flow',
          title: 'One payday, twelve months of costs',
          body:
            'Income arrives in a few weeks of the year and the bills arrive in all of them. ' +
            'The gap between the two is the single most expensive thing about farming.',
        },
        {
          icon: 'expand',
          title: 'Acreage that came up for lease',
          body:
            'Land next door comes available once a decade, on somebody else’s timetable, and ' +
            'it has to be taken long before it grows anything.',
        },
        {
          icon: 'payroll',
          title: 'Seasonal labour at peak',
          body:
            'Planting and harvest need a crew for a few intense weeks, paid in that window ' +
            'rather than out of what the crop eventually fetches.',
        },
        {
          icon: 'consolidate',
          title: 'A season of operating debt, tidied up',
          body:
            'Input accounts, a machinery note and a card balance on three different schedules ' +
            'is a lot of calendar for one business to track.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to a farm business. These are the ones the shape of the problem ' +
        'tends to point at — and an advisor will say plainly if a different one fits better.',
      slugs: [
        'line-of-credit',
        'equipment-financing',
        'working-capital',
        'inventory-financing',
        'sba-loans',
      ],
    },
  },

  {
    slug: 'accounting',
    navLabel: 'Accounting',
    description:
      'Funding for accounting and bookkeeping firms — staffing busy season, buying a ' +
      'retiring practitioner’s book, software, and the months between billing and collecting.',
    hero: {
      heading: 'Funding Built Around Busy Season.',
      blurb:
        'CPA firms, bookkeepers, tax preparers and payroll bureaus earn most of a year in a ' +
        'few months and pay for it across all twelve. Funding that fits a practice rather than ' +
        'a shopfront, with a decision in hours.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What Accounting Firms Actually Borrow For.',
      body:
        'A practice has almost no inventory and almost no equipment, which is exactly why it ' +
        'borrows: nearly every cost is people, and people are paid monthly whatever the ' +
        'billing cycle is doing.',
      items: [
        {
          icon: 'payroll',
          title: 'Staffing up before the season starts',
          body:
            'Seasonal preparers and reviewers are hired, trained and paid in advance of the ' +
            'work they do, which is itself billed after it is done.',
        },
        {
          icon: 'cash-flow',
          title: 'Billed in April, collected in July',
          body:
            'Fees go out at the end of an engagement and settle on the client’s habits, not ' +
            'your terms. A practice can have a record year and a thin summer.',
        },
        {
          icon: 'expand',
          title: 'Buying a retiring practitioner’s book',
          body:
            'The most reliable way a firm grows is acquiring clients from someone winding ' +
            'down — and that is paid for at the start, out of fees that arrive over years.',
        },
        {
          icon: 'equipment',
          title: 'The software and hardware refresh',
          body:
            'Tax, practice management, document and security tools renew annually, usually ' +
            'together, usually before the season they are bought for.',
        },
        {
          icon: 'hiring',
          title: 'Keeping staff between seasons',
          body:
            'The hard part is not hiring for March, it is paying good people through ' +
            'September so they are still there next March.',
        },
        {
          icon: 'marketing',
          title: 'Winning clients in the quiet months',
          body:
            'Advisory work, a niche practice area or a local campaign is built in the off ' +
            'months and pays back in the busy ones.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to an accounting practice. These are the ones the shape of the ' +
        'problem tends to point at — and an advisor will say plainly if a different one fits ' +
        'better.',
      slugs: [
        'line-of-credit',
        'working-capital',
        'sba-loans',
        'receivables-financing',
        'business-loans',
      ],
    },
  },

  {
    slug: 'auto-repair',
    navLabel: 'Auto Repair',
    description:
      'Funding for independent repair shops, body shops and tyre centres — diagnostic ' +
      'equipment, parts on the shelf, another bay, and accounts that pay on their own terms.',
    hero: {
      heading: 'Funding That Keeps The Bays Full.',
      blurb:
        'An independent shop earns by the hour a lift is working and loses by the hour it is ' +
        'not. Funding for the tools, parts and space that decide how many cars a week you can ' +
        'take, with a decision in hours.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What Repair Shops Actually Borrow For.',
      body:
        'Capacity, almost all of it. A shop turns work away for want of a tool, a part or a ' +
        'bay, and every one of those is bought long before the jobs it unlocks are invoiced.',
      items: [
        {
          icon: 'equipment',
          title: 'The tool for the cars you turn away',
          body:
            'A scan platform, an alignment rack, ADAS calibration or EV service gear decides ' +
            'which half of the cars on your street you can work on at all.',
        },
        {
          icon: 'inventory',
          title: 'Parts on the shelf, not on order',
          body:
            'A common part in stock is a car out the same day. The same part ordered in is a ' +
            'bay occupied for two days and a customer who waits.',
        },
        {
          icon: 'expand',
          title: 'A fourth bay, or a second lift',
          body:
            'Capacity is physical. Adding it means a build-out and a quiet month of ' +
            'disruption, paid for before a single extra car comes through.',
        },
        {
          icon: 'cash-flow',
          title: 'Fleet and warranty accounts',
          body:
            'Commercial fleets, dealers and warranty companies are good work and slow money. ' +
            'The parts and the labour were paid for weeks before the remittance lands.',
        },
        {
          icon: 'hiring',
          title: 'A technician you cannot afford to lose',
          body:
            'A qualified tech is the scarcest thing in the trade, and keeping one usually ' +
            'costs more than the week’s tickets justify on their own.',
        },
        {
          icon: 'marketing',
          title: 'Filling the bays in a slow month',
          body:
            'A local campaign, a service offer or a maintenance plan works, and it works on a ' +
            'lag — spent now, booked later.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to a repair shop. These are the ones the shape of the problem tends ' +
        'to point at — and an advisor will say plainly if a different one fits better.',
      slugs: [
        'equipment-financing',
        'inventory-financing',
        'working-capital',
        'merchant-cash-advance',
        'line-of-credit',
      ],
    },
  },

  {
    slug: 'chiropractor',
    navLabel: 'Chiropractor',
    description:
      'Funding for chiropractic and allied practices — tables and imaging, a second ' +
      'treatment room, an associate, and insurance reimbursements that arrive when they arrive.',
    hero: {
      heading: 'Funding That Grows The Practice.',
      blurb:
        'A chiropractic practice is a room, a table and an hour of a practitioner’s time, and ' +
        'every one of those is a fixed cost against a schedule that moves. Funding sized to a ' +
        'practice, with a decision in hours.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What Practices Actually Borrow For.',
      body:
        'The costs that decide how many patients a week you can see, and the delay between ' +
        'seeing them and being paid for it.',
      items: [
        {
          icon: 'equipment',
          title: 'A table, a laser, a decompression unit',
          body:
            'Treatment equipment is what a practice can offer, and it is bought outright long ' +
            'before the visits it enables are billed.',
        },
        {
          icon: 'cash-flow',
          title: 'Reimbursements on somebody else’s clock',
          body:
            'Insurers pay weeks after the visit and sometimes pay less than was billed. Rent ' +
            'and wages do not wait for the remittance advice.',
        },
        {
          icon: 'expand',
          title: 'A second treatment room',
          body:
            'More capacity means a fit-out, more equipment and a lease — committed to in full ' +
            'and filled gradually.',
        },
        {
          icon: 'payroll',
          title: 'Front desk and an associate',
          body:
            'The practice stops being one person’s diary the day it has staff, and they are ' +
            'paid from the first week rather than from the first full schedule.',
        },
        {
          icon: 'marketing',
          title: 'Keeping the schedule full',
          body:
            'New patient acquisition, a local campaign or a retention programme is spending ' +
            'now against appointments later.',
        },
        {
          icon: 'consolidate',
          title: 'The costs of opening, on one schedule',
          body:
            'A build-out loan, an equipment note and a card balance on three different ' +
            'calendars is a lot of admin for a practice with no finance department.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to a practice. These are the ones the shape of the problem tends to ' +
        'point at — and an advisor will say plainly if a different one fits better.',
      slugs: [
        'equipment-financing',
        'working-capital',
        'sba-loans',
        'line-of-credit',
        'merchant-cash-advance',
      ],
    },
  },
];

/** Lookup by slug, for the route and its metadata. */
export function industryBySlug(slug: string): IndustryPage | null {
  return INDUSTRY_PAGES.find((page) => page.slug === slug) ?? null;
}
