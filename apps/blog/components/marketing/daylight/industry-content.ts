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

  {
    slug: 'beauty-wellness',
    navLabel: 'Beauty & Wellness',
    description:
      'Funding for salons, spas, barbers, med spas and studios — chairs and equipment, a ' +
      'fit-out, retail stock, and the quiet weeks between the busy ones.',
    hero: {
      heading: 'Funding That Fills The Chair.',
      blurb:
        'Salons, barbershops, spas, med spas and studios sell time in a room, and the room ' +
        'costs the same whether it is booked or not. Funding for the equipment and the space ' +
        'that decide how much of it you can sell, with a decision in hours.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What Salons And Spas Actually Borrow For.',
      body:
        'Everything that raises the ceiling on a week — more stations, better equipment, ' +
        'more hands — is paid for in full long before the bookings it makes room for.',
      items: [
        {
          icon: 'equipment',
          title: 'Chairs, beds and devices',
          body:
            'Styling stations, treatment beds, laser and body-contouring devices are the ' +
            'services you can offer. Equipment finance covers them against the asset itself.',
        },
        {
          icon: 'expand',
          title: 'A fit-out or a second location',
          body:
            'Taking a lease, building out the floor and trading quietly for a first quarter ' +
            'is the normal shape of a second site, and it is funded long before it pays.',
        },
        {
          icon: 'inventory',
          title: 'Retail and back-bar stock',
          body:
            'Colour, product and the retail shelf are bought by the case and sold by the ' +
            'bottle, which is weeks of cash sitting in a cupboard.',
        },
        {
          icon: 'hiring',
          title: 'A stylist or therapist worth keeping',
          body:
            'Good people arrive with a following and leave with it. Holding on to one often ' +
            'costs more than their column brings in for the first few months.',
        },
        {
          icon: 'marketing',
          title: 'Filling the diary',
          body:
            'New-client offers, local campaigns and the photography that makes them work are ' +
            'spent now and booked later.',
        },
        {
          icon: 'cash-flow',
          title: 'The weeks between the busy ones',
          body:
            'January after December, or the fortnight after a wedding season. Rent and wages ' +
            'do not move with the diary.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to a salon or spa. These are the ones the shape of the problem ' +
        'tends to point at — and an advisor will say plainly if a different one fits better.',
      slugs: [
        'equipment-financing',
        'merchant-cash-advance',
        'working-capital',
        'line-of-credit',
        'business-loans',
      ],
    },
  },

  {
    slug: 'dental',
    navLabel: 'Dental',
    description:
      'Funding for dental practices — chairs, imaging and CAD/CAM, a build-out, an ' +
      'associate, and the gap between treating a patient and being paid for it.',
    hero: {
      heading: 'Funding Sized To A Practice.',
      blurb:
        'A dental practice is the most equipment-heavy small business there is, and almost ' +
        'none of it can be bought out of a month’s collections. Funding for chairs, ' +
        'imaging and the room they stand in, with a decision in hours.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What Dental Practices Actually Borrow For.',
      body:
        'Capital equipment and capacity, mostly — and the long, predictable delay between ' +
        'the chair being occupied and the money arriving.',
      items: [
        {
          icon: 'equipment',
          title: 'Chairs, imaging and the mill',
          body:
            'An operatory, a cone beam scanner or a CAD/CAM unit is a five- or six-figure ' +
            'decision. Equipment finance covers it against the asset, over its working life.',
        },
        {
          icon: 'expand',
          title: 'Another operatory, or a second practice',
          body:
            'Capacity is physical: a build-out, the equipment to fill it, and a quarter of ' +
            'disruption before a single extra patient is seen.',
        },
        {
          icon: 'cash-flow',
          title: 'Insurance pays on its own clock',
          body:
            'Claims settle weeks after treatment and sometimes for less than was billed. ' +
            'Staff, lab bills and rent do not wait for the remittance.',
        },
        {
          icon: 'payroll',
          title: 'Hygienists, assistants and front desk',
          body:
            'A practice is a payroll with a surgery attached. The team is paid monthly ' +
            'whatever the collections cycle is doing.',
        },
        {
          icon: 'marketing',
          title: 'New patients, and keeping them',
          body:
            'Implant and cosmetic work is won months before it is done, through campaigns ' +
            'and recall programmes paid for up front.',
        },
        {
          icon: 'consolidate',
          title: 'Practice, equipment and build-out notes',
          body:
            'An acquisition loan, two equipment notes and a build-out balance on four ' +
            'different schedules is a lot of calendar for a practice with no finance team.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to a dental practice. These are the ones the shape of the problem ' +
        'tends to point at — and an advisor will say plainly if a different one fits better.',
      slugs: [
        'equipment-financing',
        'sba-loans',
        'working-capital',
        'line-of-credit',
        'receivables-financing',
      ],
    },
  },

  {
    slug: 'electrical',
    navLabel: 'Electrical',
    description:
      'Funding for electrical contractors — vans and tooling, materials at today’s ' +
      'price, licensed crew, and the long wait on a progress payment.',
    hero: {
      heading: 'Funding Between The Invoice And The Payment.',
      blurb:
        'Electrical contractors buy the material, pay the crew and energise the job months ' +
        'before the final payment clears. Funding sized to that gap, with a decision in ' +
        'hours rather than a meeting in a fortnight.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What Electrical Contractors Actually Borrow For.',
      body:
        'The same story in different sizes: everything a job costs is spent at the front of ' +
        'it, and everything a job earns arrives at the back.',
      items: [
        {
          icon: 'inventory',
          title: 'Copper, gear and switchboards',
          body:
            'Wire, conduit, panels and fittings are bought up front and at a price that has ' +
            'usually moved since the quote went in.',
        },
        {
          icon: 'equipment',
          title: 'Vans, lifts and test gear',
          body:
            'A fitted van, a scissor lift or a thermal camera is what lets a crew work ' +
            'independently — bought once, earning for years.',
        },
        {
          icon: 'cash-flow',
          title: 'Progress payments and retention',
          body:
            'A pay application approved this month settles next quarter, and retention holds ' +
            'part of it back until the whole job is signed off.',
        },
        {
          icon: 'payroll',
          title: 'Licensed hands, paid weekly',
          body:
            'Journeymen and apprentices are paid every week of a job that bills in stages, ' +
            'which is months of wages carried out of working capital.',
        },
        {
          icon: 'expand',
          title: 'A contract bigger than the last three',
          body:
            'The job that grows the firm is the one that needs the most cash on day one, ' +
            'before a single stage is certified.',
        },
        {
          icon: 'hiring',
          title: 'A second crew',
          body:
            'Running two jobs at once means two sets of hands, vans and tools, all in place ' +
            'before either one bills.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to an electrical contractor. These are the ones the shape of the ' +
        'problem tends to point at — and an advisor will say plainly if a different one fits ' +
        'better.',
      slugs: [
        'receivables-financing',
        'equipment-financing',
        'line-of-credit',
        'working-capital',
        'bridge-loans',
      ],
    },
  },

  {
    slug: 'healthcare',
    navLabel: 'Healthcare',
    description:
      'Funding for medical practices, clinics and allied health — equipment, a build-out, ' +
      'staffing, and reimbursements that arrive long after the visit.',
    hero: {
      heading: 'Funding That Waits On The Payer, So You Do Not.',
      blurb:
        'Physician practices, clinics, imaging centres and allied health providers deliver ' +
        'care now and are paid for it on a schedule somebody else sets. Funding built around ' +
        'that delay, with a decision in hours.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What Practices Actually Borrow For.',
      body:
        'Two things, mostly: the equipment and space that set how many patients you can see, ' +
        'and the months between seeing them and being paid.',
      items: [
        {
          icon: 'cash-flow',
          title: 'Reimbursements on the payer’s clock',
          body:
            'Claims are submitted, adjusted, sometimes denied and resubmitted. The care was ' +
            'delivered and paid for long before any of that resolves.',
        },
        {
          icon: 'equipment',
          title: 'Diagnostic and treatment equipment',
          body:
            'Imaging, monitoring and procedure equipment is what a practice can offer, and ' +
            'it is bought outright against years of use.',
        },
        {
          icon: 'payroll',
          title: 'Clinical and admin staff',
          body:
            'Nurses, technicians, billing and front desk are paid every cycle whatever the ' +
            'accounts receivable are doing.',
        },
        {
          icon: 'expand',
          title: 'A second site, or more rooms',
          body:
            'A clinic grows by adding rooms and the people to staff them — committed to in ' +
            'full, filled gradually.',
        },
        {
          icon: 'marketing',
          title: 'Reaching patients',
          body:
            'Referral relationships, a service line launch or a local campaign is built in ' +
            'advance of the appointments it produces.',
        },
        {
          icon: 'consolidate',
          title: 'Several schedules, one payment',
          body:
            'Equipment notes, a build-out balance and a working capital line on separate ' +
            'calendars is admin a practice manager should not have to carry.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to a healthcare provider. These are the ones the shape of the ' +
        'problem tends to point at — and an advisor will say plainly if a different one fits ' +
        'better.',
      slugs: [
        'receivables-financing',
        'equipment-financing',
        'sba-loans',
        'working-capital',
        'line-of-credit',
      ],
    },
  },

  {
    slug: 'hvac',
    navLabel: 'HVAC',
    description:
      'Funding for heating and cooling contractors — trucks and tooling, equipment stocked ' +
      'ahead of a heatwave, seasonal crew, and the swing between peak and shoulder.',
    hero: {
      heading: 'Funding For A Business With Two Seasons.',
      blurb:
        'HVAC earns in July and January and pays rent in April and October. Funding built ' +
        'around a trade whose best week and worst week are three months apart, with a ' +
        'decision in hours.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What HVAC Contractors Actually Borrow For.',
      body:
        'Being ready for the season before it starts — because the week the phone rings is ' +
        'not the week to be ordering equipment or hiring.',
      items: [
        {
          icon: 'inventory',
          title: 'Units on the truck before the heatwave',
          body:
            'A condenser in your warehouse is a same-day install. The same unit ordered in ' +
            'is a customer who calls someone else.',
        },
        {
          icon: 'equipment',
          title: 'Trucks, recovery gear and tooling',
          body:
            'A fitted service van is a technician who can work alone, which is the whole ' +
            'economics of the trade.',
        },
        {
          icon: 'cash-flow',
          title: 'The shoulder months',
          body:
            'Spring and autumn pay for themselves and not much more, while payroll, rent and ' +
            'insurance run at full rate all twelve months.',
        },
        {
          icon: 'hiring',
          title: 'Technicians, hired before the rush',
          body:
            'Seasonal crew have to be hired, trained and paid ahead of the demand they are ' +
            'there to meet.',
        },
        {
          icon: 'expand',
          title: 'Adding commercial or new construction',
          body:
            'Bigger contracts want more equipment, more crew and more float on day one than ' +
            'residential service ever did.',
        },
        {
          icon: 'marketing',
          title: 'Maintenance plans and local demand',
          body:
            'Service agreements are the thing that smooths the year, and they are sold with ' +
            'campaigns paid for months in advance.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to an HVAC contractor. These are the ones the shape of the ' +
        'problem tends to point at — and an advisor will say plainly if a different one fits ' +
        'better.',
      slugs: [
        'line-of-credit',
        'inventory-financing',
        'equipment-financing',
        'working-capital',
        'merchant-cash-advance',
      ],
    },
  },

  {
    slug: 'insurance',
    navLabel: 'Insurance',
    description:
      'Funding for independent agencies and brokers — buying a book of business, ' +
      'producers, systems, and commissions that arrive long after the policy is written.',
    hero: {
      heading: 'Funding Against A Book Of Business.',
      blurb:
        'An independent agency grows by acquiring books and hiring producers, both of which ' +
        'cost everything up front and pay back over renewal years. Funding that understands ' +
        'that shape, with a decision in hours.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What Agencies Actually Borrow For.',
      body:
        'Agencies have almost no equipment and almost no stock. What they buy is future ' +
        'commission — and future commission has to be paid for today.',
      items: [
        {
          icon: 'expand',
          title: 'Buying a book, or a whole agency',
          body:
            'A retiring broker’s book is the most reliable growth there is, and it is ' +
            'paid for at closing out of renewals that arrive over years.',
        },
        {
          icon: 'hiring',
          title: 'Producers, before they produce',
          body:
            'A new producer is a salary, a desk and a ramp of several quarters before the ' +
            'book they build pays for any of it.',
        },
        {
          icon: 'cash-flow',
          title: 'Commission arrives in arrears',
          body:
            'Policies are written now and commissions settle on the carrier’s cycle, ' +
            'with contingents and profit-share landing a year later again.',
        },
        {
          icon: 'equipment',
          title: 'Agency management systems',
          body:
            'The management system, the comparative rater and the CRM renew annually and are ' +
            'the whole operating platform of the firm.',
        },
        {
          icon: 'marketing',
          title: 'Lead generation',
          body:
            'Quoting volume is bought — leads, campaigns, partnerships — and spent well ' +
            'before the policies it produces are bound.',
        },
        {
          icon: 'consolidate',
          title: 'Acquisition debt, tidied up',
          body:
            'Two or three book purchases on separate notes is a common shape for a growing ' +
            'agency and an awkward one to administer.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to an agency. These are the ones the shape of the problem tends ' +
        'to point at — and an advisor will say plainly if a different one fits better.',
      slugs: [
        'sba-loans',
        'business-loans',
        'working-capital',
        'line-of-credit',
        'receivables-financing',
      ],
    },
  },

  {
    slug: 'legal',
    navLabel: 'Legal',
    description:
      'Funding for law firms — case costs carried for years, payroll between settlements, ' +
      'lateral hires, and the systems a modern practice runs on.',
    hero: {
      heading: 'Funding That Carries The Case.',
      blurb:
        'Contingency and plaintiff firms fund experts, filings and years of work against a ' +
        'fee that arrives all at once, if it arrives. Funding built for a practice whose ' +
        'revenue is lumpy by design, with a decision in hours.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What Law Firms Actually Borrow For.',
      body:
        'A firm is people and case costs, and both are spent continuously against income ' +
        'that arrives in a handful of large, unpredictable events.',
      items: [
        {
          icon: 'cash-flow',
          title: 'Case costs, carried for years',
          body:
            'Experts, depositions, filing fees and investigators are paid as the matter ' +
            'runs, and recovered only at resolution.',
        },
        {
          icon: 'payroll',
          title: 'Payroll between settlements',
          body:
            'Associates, paralegals and staff are paid every month of a year that might have ' +
            'two significant fees in it.',
        },
        {
          icon: 'hiring',
          title: 'A lateral hire and their book',
          body:
            'A partner arriving with matters needs a salary and support long before those ' +
            'matters resolve under your name.',
        },
        {
          icon: 'marketing',
          title: 'Case acquisition',
          body:
            'Intake is bought — campaigns, referral relationships, directories — and spent ' +
            'well ahead of any fee it produces.',
        },
        {
          icon: 'equipment',
          title: 'Practice and document systems',
          body:
            'Case management, e-discovery and document platforms renew annually and are what ' +
            'a modern firm actually runs on.',
        },
        {
          icon: 'expand',
          title: 'Another office, or a practice area',
          body:
            'Opening somewhere new, or into a new area of law, is committed to in full and ' +
            'builds a caseload gradually.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to a law firm. These are the ones the shape of the problem tends ' +
        'to point at — and an advisor will say plainly if a different one fits better.',
      slugs: [
        'line-of-credit',
        'working-capital',
        'sba-loans',
        'business-loans',
        'bridge-loans',
      ],
    },
  },

  {
    slug: 'landscaping',
    navLabel: 'Landscaping',
    description:
      'Funding for landscapers and lawn care — mowers, trucks and trailers, crew through ' +
      'the winter, materials on an install, and a season that pays for a whole year.',
    hero: {
      heading: 'Funding Through The Off Season.',
      blurb:
        'Landscaping earns in three seasons and pays for four. Funding for the equipment ' +
        'that does the work and the months when there is less of it, with a decision in ' +
        'hours.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What Landscapers Actually Borrow For.',
      body:
        'Equipment and the calendar. Everything the work needs is bought before the season, ' +
        'and the season has to cover the months on either side of it.',
      items: [
        {
          icon: 'equipment',
          title: 'Mowers, trucks and trailers',
          body:
            'A crew is a truck, a trailer and what is on it. Equipment finance covers the ' +
            'package against the assets, over the years they work.',
        },
        {
          icon: 'cash-flow',
          title: 'Winter, on summer’s money',
          body:
            'Insurance, storage, loan payments and the core crew carry straight through the ' +
            'months when almost nothing is billed.',
        },
        {
          icon: 'inventory',
          title: 'Materials on a design-build',
          body:
            'Stone, plants, irrigation and lighting on an install are bought in full and ' +
            'invoiced at milestones, or at the end.',
        },
        {
          icon: 'payroll',
          title: 'Crew at peak',
          body:
            'Spring and summer need more hands than the rest of the year, hired and paid in ' +
            'the window where every week counts.',
        },
        {
          icon: 'expand',
          title: 'Adding a crew, or a service',
          body:
            'A second crew, snow and ice, or hardscaping each need their own trucks and ' +
            'equipment before they book a single job.',
        },
        {
          icon: 'marketing',
          title: 'Booking the season early',
          body:
            'Contracts for the year are won in late winter, with spending that happens ' +
            'before any of the revenue does.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to a landscaping business. These are the ones the shape of the ' +
        'problem tends to point at — and an advisor will say plainly if a different one fits ' +
        'better.',
      slugs: [
        'equipment-financing',
        'line-of-credit',
        'working-capital',
        'merchant-cash-advance',
        'business-loans',
      ],
    },
  },

  {
    slug: 'real-estate',
    navLabel: 'Real Estate',
    description:
      'Funding for brokerages, investors and property businesses — closing timing, ' +
      'renovation before a sale, commission paid at settlement, and carrying a portfolio.',
    hero: {
      heading: 'Funding That Moves At Closing Speed.',
      blurb:
        'Brokerages, investors and property operators work against dates somebody else sets ' +
        'and get paid at settlement. Funding that can move inside those windows, with a ' +
        'decision in hours.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What Property Businesses Actually Borrow For.',
      body:
        'Timing, almost entirely. The money in this trade is real and it is late, and the ' +
        'opportunities have dates on them.',
      items: [
        {
          icon: 'cash-flow',
          title: 'Commission arrives at settlement',
          body:
            'A brokerage pays its people, its marketing and its office every month against ' +
            'income that lands only when deals actually close.',
        },
        {
          icon: 'expand',
          title: 'A property on a deadline',
          body:
            'The acquisition worth having is the one that has to be funded before permanent ' +
            'financing can be arranged.',
        },
        {
          icon: 'equipment',
          title: 'Renovation before a sale or a let',
          body:
            'The work that lifts a price or a rent is paid for up front and recovered only ' +
            'at the far end of the transaction.',
        },
        {
          icon: 'marketing',
          title: 'Listings and lead generation',
          body:
            'Photography, staging, portals and campaigns are the cost of winning the ' +
            'instruction, spent months before any fee.',
        },
        {
          icon: 'hiring',
          title: 'Agents and support staff',
          body:
            'Recruiting producers means covering them through a pipeline that takes two or ' +
            'three quarters to mature.',
        },
        {
          icon: 'consolidate',
          title: 'Several short-term balances',
          body:
            'A portfolio assembled over a few years tends to carry several facilities on ' +
            'different clocks.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to a property business. These are the ones the shape of the ' +
        'problem tends to point at — and an advisor will say plainly if a different one fits ' +
        'better.',
      slugs: [
        'bridge-loans',
        'line-of-credit',
        'working-capital',
        'business-loans',
        'sba-loans',
      ],
    },
  },

  {
    slug: 'restaurants',
    navLabel: 'Restaurants',
    description:
      'Funding for dine-in restaurants and bars — front of house, kitchen equipment, ' +
      'payroll through a slow month, a refurbishment, and the cost of opening a second room.',
    hero: {
      heading: 'Funding For The Room, Not Just The Kitchen.',
      blurb:
        'A restaurant is a dining room, a payroll and a lease, and all three cost the same ' +
        'on a Tuesday as on a Saturday. Funding for the covers you can serve and the weeks ' +
        'when fewer people come, with a decision in hours.',
    },
    needs: {
      label: 'Use Cases',
      heading: 'What Restaurants Actually Borrow For.',
      body:
        'A dining room is a fixed cost against a variable night, and almost everything that ' +
        'improves it is paid for long before a single extra cover is served.',
      items: [
        {
          icon: 'payroll',
          title: 'A full roster on a quiet week',
          body:
            'Front and back of house are rostered against the week you hope for. A wet ' +
            'fortnight does not reduce the wage bill.',
        },
        {
          icon: 'equipment',
          title: 'The line, and the kit that runs it',
          body:
            'Ranges, refrigeration, dishwashers and the POS are what service depends on, and ' +
            'none of them fails at a convenient moment.',
        },
        {
          icon: 'expand',
          title: 'A refurbishment, or a second room',
          body:
            'A refit closes you for weeks and a second site trades at a loss for a quarter. ' +
            'Both are paid for in advance of either.',
        },
        {
          icon: 'inventory',
          title: 'Cellar, and a menu change',
          body:
            'A wine list, a seasonal menu or a festive period is bought in before any of it ' +
            'reaches a table.',
        },
        {
          icon: 'marketing',
          title: 'Covers on a Tuesday',
          body:
            'Delivery platform commissions, local campaigns and events are what fills the ' +
            'quiet half of the week, and they work on a lag.',
        },
        {
          icon: 'cash-flow',
          title: 'Rent, insurance and the slow season',
          body:
            'The lease is the single largest fixed cost in the business and it is indifferent ' +
            'to how last month went.',
        },
      ],
    },
    products: {
      label: 'Best Fit',
      heading: 'The Options This Trade Usually Wants.',
      body:
        'All nine are open to a restaurant. These are the ones the shape of the problem ' +
        'tends to point at — and an advisor will say plainly if a different one fits better.',
      slugs: [
        'merchant-cash-advance',
        'equipment-financing',
        'working-capital',
        'line-of-credit',
        'business-loans',
      ],
    },
  },
];

/** Lookup by slug, for the route and its metadata. */
export function industryBySlug(slug: string): IndustryPage | null {
  return INDUSTRY_PAGES.find((page) => page.slug === slug) ?? null;
}
