/**
 * Copy for the homepage and /get-funded.
 *
 * This file is REAL COPY, not the Figma template's placeholder text. Every
 * string is Nanotom Capital's, taken from the live GoHighLevel site so the
 * migration changes presentation and not claims — the funding figures, the
 * product descriptions and the qualifying criteria are all things the business
 * says today, and none of them should be reworded here without checking.
 *
 * The layouts read every label, heading and body string from here, so
 * re-copywriting a page never means touching its markup.
 *
 * HEADLINE CAPITALISATION: every word of a section headline takes a capital,
 * short words included — "Funding Options Built To Work For You." The two
 * headlines carried over from the live GoHighLevel site ("Get The Capital Your
 * Business Needs To Grow", "We Can Secure The Capital You Need For Your
 * Business") are written that way, so it is the business's own style rather
 * than one imposed here. The rest had drifted into sentence case and were
 * brought into line.
 *
 * This applies to HEADLINES — page h1s, the grey bands' h2s, the FAQ heading.
 * It does NOT apply to the strings that are sentences: the numbered steps'
 * titles, the product leads on /funding-solutions, the FAQ questions. Those are
 * prose and Title Case would make them read as labels.
 *
 * This is now the single source for that copy. It used to carry a note saying
 * several blocks were duplicated from the older hand-built homepage component
 * deliberately, because that was the live page and this was a draft of its
 * replacement; the draft won and the old page is gone, so there is nowhere else
 * to keep in step.
 */

/** Every "Get Funded" on the page. */
export const APPLY_LABEL = 'Get Funded';

export const HERO = {
  eyebrow: 'Entrepreneurs & Business Owners',
  heading: 'Get The Capital Your Business Needs To Grow',
  body:
    "Whether you're a startup, established business, or real estate investor, access " +
    'flexible financing solutions to fuel your next big move.',
  /*
   * `unit` is split from `value` because the design puts the accent colour on
   * the trailing symbol alone — "300" in white, the "+" in gold.
   *
   * The figures were corrected downward by Denis from the 2,300 and $36M the
   * GoHighLevel homepage carried. Those came across in the first migration pass
   * and were never the business's own numbers.
   */
  stats: [
    { value: '300', unit: '+', label: 'businesses funded since 2012' },
    { value: '$6M', unit: '+', label: 'provided in financing' },
    { value: '4.7', unit: ' Stars', label: 'from happy customers' },
  ],
  /** `icon` keys map to the icons in ./icons via the map in the homepage. */
  tiles: [
    {
      icon: 'coins',
      title: 'Explore Funding Options',
      subtitle: 'Find Your Fit',
      note: '$15K to $5M across 6 funding types',
      href: '/funding-solutions',
    },
    {
      icon: 'calculator',
      title: 'Loan Calculator',
      subtitle: 'Run The Numbers',
      note: 'Estimate your payment in under 60 seconds',
      href: '/calc',
    },
    {
      icon: 'growth',
      title: 'DIY Programs',
      subtitle: 'Get Funding-Ready',
      note: 'Self-paced courses in credit repair, credit 101, and budgeting',
      href: '/programs',
    },
  ],
} as const;

export const HOW_IT_WORKS = {
  label: 'How It Works',
  heading: 'Funding That Moves At Your Speed.',
  /** Sits inside the dark band, over the numbered steps — not in the header. */
  stepsHeading: 'Three Steps To Funding Your Future',
  /*
   * The step bodies say the same three things Fora Financial's do, at the same
   * level of detail, at Denis's request — he sent their section as the model.
   * They are NOT their sentences, for the reason already settled for the hero
   * above: taking a competitor's strategy is fair, retyping their marketing
   * copy onto a page aimed at their market is not.
   *
   * Every claim here is one Nanotom already makes somewhere else on this site,
   * which is the other reason not to copy: their version promises "approval
   * status in as little as 4 hours" and a call from "a Capital Specialist".
   * Neither is ours. Nanotom's own numbers are "in minutes" for the
   * application and "as soon as the same day" for both the decision and the
   * money — same-day is the STRONGER claim, so nothing was watered down to
   * avoid theirs. "In-house loan advisor" is the title USE_CASES already uses.
   *
   * If the 4-hour figure or anything like it ever becomes a real service level
   * here, put it in — a specific number beats "the same day". Until then this
   * page promises only what the business has already committed to elsewhere.
   */
  steps: [
    {
      title: 'Complete the application.',
      body:
        'Answer a few questions about your business — it takes minutes — and an in-house ' +
        'loan advisor will call to talk through what you need.',
    },
    {
      title: 'Get a decision.',
      body:
        'Your advisor comes back with the options you actually qualify for, often the same ' +
        'day, and helps you weigh them side by side.',
    },
    {
      title: 'Receive your funds.',
      body:
        'Sign your contract and the money can land as soon as the same day — yours to put ' +
        'to work at whatever pace the business needs.',
    },
  ],
} as const;

export const FUNDING_OPTIONS = {
  label: 'The Nanotom Capital Advantage',
  heading: 'Funding Options Built To Work For You.',
  cards: [
    {
      title: 'The Ultimate Revolving Line of Credit',
      body:
        "Get the financial flexibility your business demands with BANKROLL's " +
        'industry-leading revolving credit line. Access up to $1,500,000 in capital with ' +
        'the freedom to draw funds when you need them and pay down principal when cash ' +
        'flow allows.',
      /** Each point leads with a bolded label, so they are split rather than parsed. */
      points: [
        { label: 'Massive Credit Limits', body: 'Approvals up to $1,500,000' },
        {
          label: 'True Flexibility',
          body: 'Unlimited draws and paydowns of $5,000+ during your 1-year revolving period',
        },
        { label: 'Predictable Payments', body: 'Fixed weekly payments over terms up to 36 months' },
        {
          label: 'Complete Control',
          body: 'You decide when to borrow, how much to pay, and when to pay off',
        },
        { label: 'No Penalties', body: 'Early payoff available anytime without fees' },
        {
          label: 'Smart Financing',
          body: 'Pay interest only on what you use, with no minimum finance charges',
        },
      ],
      tag: 'Great for keeping funds on hand',
      cta: { label: 'Learn More', href: '/funding-solutions/line-of-credit' },
    },
    {
      title: 'Pay Only The Interest For Up To A Year',
      body:
        'Access up to $750,000 with the ultimate cash flow solution. Pay only interest for ' +
        'up to one full year while enjoying unlimited access to additional funds through ' +
        'your built-in line of credit.',
      points: [
        { label: 'Lower Entry Point', body: 'Start with just $50,000 (reduced from $150,000)' },
        { label: 'Interest-Only Freedom', body: 'Pay only interest for up to 52 weeks' },
        {
          label: 'Built-In Line of Credit',
          body: 'Unlimited draws of $25,000+ during your interest-only period',
        },
        {
          label: 'Maximum Flexibility',
          body: 'Take your initial loan in multiple draws across consecutive business days',
        },
        {
          label: 'Safety Net Included',
          body: 'Built-in rollover amortization option up to 2 years',
        },
        {
          label: 'Smart Structure',
          body: 'Your credit line equals the difference between your approval and initial draw',
        },
      ],
      tag: null,
      /*
       * The interest-only product is the closest fit among the five funding
       * types in the nav; there is no dedicated page for it yet.
       */
      cta: { label: 'Learn More', href: '/funding-solutions/revenue-based-financing' },
    },

    /*
     * TERMS NOT YET CONFIRMED AGAINST NANOTOM'S LENDER SHEETS.
     *
     * These two replaced the lorem ipsum placeholders. They are the two funding
     * types the nav already promises that the carousel did not cover — the first
     * two cards are the line of credit and the interest-only product — so the
     * four now map onto four real /funding-solutions pages rather than repeating.
     *
     * The FIGURES, however, are industry-standard ranges taken from how the
     * category is normally written and sized, NOT from Nanotom's own programs.
     * Every number below is deliberately inside limits this site already states
     * elsewhere — the hero's "$15K to $5M", the 551 FICO and 30-days-in-business
     * minimums in REQUIREMENTS — so nothing here contradicts the page. That makes
     * them plausible, not verified.
     *
     * These are advertised terms for consumer-facing credit products on a page
     * that collects live applications. Check each figure against the real program
     * before this is treated as finished copy, and cut anything that cannot be
     * honoured. The first two cards are BANKROLL's actual terms and are safe.
     */
    {
      title: 'Equipment Financing That Pays for Itself',
      body:
        'Finance the machine, vehicle or system your business runs on and let it earn while ' +
        'you pay for it. The equipment secures the loan, so approvals lean on what you are ' +
        'buying rather than on the collateral you already own.',
      points: [
        { label: 'New or Used', body: 'Dealer, private-party and auction purchases all qualify' },
        {
          label: 'Application Only',
          body: 'No financial statements required on most requests under $250,000',
        },
        { label: 'Terms to Match the Asset', body: 'Repayment from 12 to 84 months' },
        {
          label: 'Self-Collateralizing',
          body: 'The equipment is the security — no blanket lien on other assets',
        },
        { label: 'Section 179 Eligible', body: 'Most financed equipment can be written off' },
        { label: 'Fast Turnaround', body: 'Approvals in hours, funding often within two days' },
      ],
      tag: null,
      cta: { label: 'Learn More', href: '/funding-solutions/equipment-financing' },
    },
    {
      title: 'Working Capital When Timing Is Everything',
      body:
        'A lump sum up front with a fixed, predictable payoff — built for payroll, inventory ' +
        'and the gaps between invoicing and getting paid. Approval looks at how your business ' +
        'actually performs, not only at your credit file.',
      points: [
        { label: 'Right-Sized Amounts', body: 'From $15,000 to $2,000,000' },
        { label: 'Short and Clear', body: 'Terms from 3 to 36 months, no open-ended balance' },
        {
          label: 'Payments That Fit',
          body: 'Daily, weekly or monthly, matched to your cash cycle',
        },
        { label: 'Revenue-Led Underwriting', body: 'Recent deposits carry more weight than FICO' },
        { label: 'Early Payoff Discounts', body: 'Settle ahead of schedule and pay less interest' },
        { label: 'Same-Day Funding', body: 'Available once your file is complete' },
      ],
      tag: null,
      cta: { label: 'Learn More', href: '/funding-solutions/working-capital' },
    },
  ],
} as const;

export const QUALIFIER = {
  label: 'Get Started',
  heading: 'Not Sure What Is Best For You?',
  points: [
    'Answer a few simple questions',
    'We will look at your particular situation',
    "We'll send you some recommendations",
  ],
} as const;

export const USE_CASES = {
  label: 'Use of Funds',
  heading: 'What Can You Do With Funding From Nanotom Capital?',
  items: [
    { icon: 'inventory', label: 'Purchase inventory' },
    { icon: 'payroll', label: 'Cover payroll' },
    { icon: 'expand', label: 'Expand or renovate' },
    { icon: 'marketing', label: 'Launch marketing campaigns' },
    { icon: 'cashflow', label: 'Stabilize cash flow' },
    { icon: 'equipment', label: 'Upgrade equipment' },
    { icon: 'hiring', label: 'Hire more employees' },
    { icon: 'consolidate', label: 'Consolidate business debt' },
  ],
} as const;

export const REQUIREMENTS = {
  heading: 'Are We A Match? Check Our Minimum Requirements.',
  /** Same value/unit split as the hero stats, for the same reason. */
  stats: [
    { lead: 'As little as', value: '30 Days', trail: 'in business' },
    { lead: 'Be on the approved', value: 'Industries', trail: 'list' },
    { lead: 'Minimum', value: '551', trail: 'personal FICO® score' },
  ],
  note: "We look beyond your credit score to say 'Yes' when others won't.",
  /*
   * The callout catches a visitor at the moment they read the numbers above and
   * count themselves out. It is the page's second conversion path, not a
   * footnote, which is why it gets its own panel rather than small print.
   */
  callout: {
    heading: 'Below 551, Or Under 30 Days In Business?',
    body:
      'Our DIY programs walk you through credit repair, business credit, and budgeting so ' +
      'you can come back approval-ready.',
    cta: { label: 'Browse Programs', href: '/programs' },
  },
} as const;

export const TESTIMONIALS = {
  label: 'Testimonials',
  heading: 'What Others Are Saying',
  cta: 'View All Testimonials',
} as const;

export const BLOG_SECTION = {
  label: 'Insights & Guides',
  heading: 'From The Nanotom Capital Blog',
  cta: 'View All Blogs',
} as const;

/* ---------------------------------------------------------------------------
 * /get-funded
 *
 * The whole page above the survey. The live GoHighLevel page has exactly these
 * three strings and then the form, and that is the point of it: it is the
 * destination of every "Get Funded" button on the site, so anything else here
 * is something between a visitor and the only thing we want them to do.
 *
 * NOT copied here, deliberately: "This information helps us match you with the
 * right solution..." and "We look beyond your credit score...". Both look like
 * page copy on the live site and both are actually the survey's own step
 * headings, rendered inside the iframe. Putting them on the page shows each
 * twice.
 * ------------------------------------------------------------------------- */

export const GET_FUNDED = {
  /* Cased like the hero eyebrow; `Chip` uppercases it. The trailing ellipsis is
     the live page's, kept so the line still reads as an opener rather than a
     claim about who qualifies. */
  eyebrow: 'For Business Owners, Startups, Entrepreneurs, and Growth-Focused Companies…',
  heading: 'We Can Secure The Capital You Need For Your Business',
  sub: 'And Build A Comprehensive Funding Strategy',
} as const;

/* ---------------------------------------------------------------------------
 * /calc — the loan calculator
 *
 * The numbers this page produces are NOT here: product ranges, pricing and the
 * minimums live in lib/funding-calc.ts, because they are arguments to the maths
 * rather than strings on a page. What is here is everything a copywriter should
 * be able to change without opening the calculator.
 *
 * The disclaimer is not decoration. Until a real rate card replaces the
 * illustrative one in lib/funding-calc.ts, this page shows a lender's estimates
 * that nobody has committed to honour, and it has to say so where it is read
 * rather than in a footer.
 * ------------------------------------------------------------------------- */

export const CALCULATOR = {
  /**
   * The page's only <h1>, and it is VISUALLY HIDDEN — the page opens straight on
   * the calculator, so this exists for crawlers and screen readers. See the note
   * in ft/loan-calculator.tsx.
   *
   * Which is why it reads as a label rather than as a line of marketing. The
   * hero that stood here said "See what funding costs before you apply." over a
   * standfirst, and that was the right copy for a heading someone reads. An
   * invisible one has a different job: it should say what the page is, in the
   * words someone would search for, and match the <title>. Nobody is being shown
   * one thing and told another — the page below it is exactly this.
   */
  heading: 'Business Loan Calculator',
  /**
   * The two views, and the line under each that says what it is for.
   *
   * Simple is the default, and the reason is the one Denis put his finger on:
   * the advanced view opens by asking which of five facilities you want, and
   * someone who does not yet know what they need reads that as a question they
   * have already failed. Simple asks the three things anyone can answer.
   */
  modes: {
    simple: {
      label: 'Simple',
      blurb: 'Three numbers, one payment. No questions about you or your business.',
      /** Sits under the simple panel, offering the rest without insisting. */
      upsell:
        'Want it priced against your actual business — the right facility, the fee, the APR, ' +
        'and whether it fits your revenue?',
      upsellAction: 'Switch to the advanced calculator',
    },
    advanced: {
      label: 'Advanced',
      blurb: 'Every facility we fund, priced against your credit profile and revenue.',
    },
  },
  /** The three things the page says about itself, under the panel. */
  assurances: [
    'No credit pull, no email, nothing saved',
    'Every product we fund, priced side by side',
    'Built on the same minimums our advisors use',
  ],
  disclaimer:
    'Illustrative estimates, not an offer of credit. Rates and fees shown are modelled from ' +
    'typical small-business finance pricing; your actual terms are set after underwriting with ' +
    'a Nanotom Capital advisor and may differ. Nothing on this page is a commitment to lend.',
  next: {
    heading: 'Numbers Look Workable?',
    body:
      'An advisor can tell you what the file actually prices at. The application is a few ' +
      'questions about the business, and funds can land as soon as the same day once you sign.',
  },
} as const;

/* ---------------------------------------------------------------------------
 * /funding-solutions — the loans page
 *
 * The hero's angle is deliberately borrowed from how Fora Financial frames
 * theirs, at Denis's request: compare every option in one place, apply once,
 * hear back fast. The WORDS are ours. Their headline is "Online Business
 * Financing, Without the Bank Wait", and writing a near-copy of a competitor's
 * tagline aimed at that competitor's market is not something to do by accident —
 * so this takes the strategy and leaves the phrasing.
 *
 * No count in the headline on purpose. The homepage's funding tile says "6
 * funding types", the nav lists five, and FUNDING_OPTIONS carries four; a
 * headline promising a number would be contradicted by the list beneath it
 * until those three agree.
 * ------------------------------------------------------------------------- */

export const LOANS = {
  hero: {
    eyebrow: 'Funding Solutions',
    heading: 'Every Way To Fund Your Business. One Application.',
    body:
      'Compare business loans, lines of credit, revenue-based financing, working capital ' +
      'and equipment finance side by side. Apply once, in minutes, and get a decision the ' +
      'same day — with approvals from $15,000 to $5,000,000.',
  },

  /*
   * The grey header band over the product list, the same one the homepage puts
   * over each of its sections.
   *
   * No count in it, for the reason given above the hero: the homepage tile says
   * six funding types, the nav lists five and there are four sections below
   * this band. A band reading "Four ways…" would be contradicted by the header
   * directly above it.
   */
  optionsHead: {
    label: 'Our Funding Options',
    heading: 'Compare Every Option We Fund.',
  },

  /** The pill on the first product in the list. Only the first one gets it. */
  featuredLabel: 'Featured',
  /** Label above the one-line "what this is good at" on every product. */
  bestForLabel: 'Best for',
} as const;

/**
 * The extra copy each funding product needs to fill a section on this page.
 *
 * WHAT IS NOT HERE, on purpose: the title, the description and the CTA. Those
 * are read from the matching FUNDING_OPTIONS card, so the homepage carousel and
 * this page cannot end up describing one product two different ways.
 *
 * WHY THE STATS ARE RESTATED ANYWAY. The source is prose — a card's points read
 * "Approvals up to $1,500,000" and "Repayment from 12 to 84 months", not
 * numbers a component can format into a box. Each figure below is condensed
 * from one specific point of its own card and has to agree with it: change one,
 * change both. Three per product, and never a figure the section's `lead`
 * already says, so the row adds facts instead of repeating them.
 *
 * The carousel on the homepage shows all six points of each card. This page
 * shows three figures instead, which is the difference between a teaser and a
 * reference — if these ever grow into the full six, the two become the same
 * block in two layouts and one of them should go.
 *
 * TERMS FOR EQUIPMENT FINANCING AND WORKING CAPITAL ARE STILL UNVERIFIED, for
 * the reason set out at length above their cards in FUNDING_OPTIONS: those two
 * products' figures are industry-standard ranges, not Nanotom's own program
 * sheets. The stats below inherit that exactly — they are condensations of
 * unverified numbers, so they are unverified too.
 *
 * `icon` keys map to the icons in ./icons via the map in funding-solutions.tsx,
 * the same indirection HERO.tiles uses, so this file stays free of JSX.
 */
type ProductDetail = {
  icon: 'coins' | 'growth' | 'equipment' | 'cashflow';
  /** Reworded from the card's `tag` where it has one — see the note below. */
  bestFor: string;
  /** The section's own heading, above the card's description. */
  lead: string;
  stats: readonly { readonly label: string; readonly value: string }[];
};

/**
 * Keyed by the product's own page, not by position.
 *
 * The Record's key type is the union of the cards' CTA hrefs, so adding a fifth
 * card to FUNDING_OPTIONS without writing its section copy is a compile error
 * rather than a product that silently vanishes from this page. Keying by index
 * would pair them by list order and mis-pair them the first time someone
 * reorders the carousel.
 *
 * Four entries, where the nav promises five funding types. BUSINESS LOANS is
 * the missing one: it has no card in FUNDING_OPTIONS, no figures anywhere in
 * this repo, and nothing on the live GoHighLevel site to take them from. It is
 * left out rather than written from the category's general shape, because this
 * page takes live credit applications and an invented term is a term somebody
 * gets held to. Add the card first, and this map will demand the copy.
 */
export const LOAN_PRODUCTS: Readonly<
  Record<(typeof FUNDING_OPTIONS.cards)[number]['cta']['href'], ProductDetail>
> = {
  '/funding-solutions/line-of-credit': {
    icon: 'coins',
    /*
     * The carousel's tag for this product reads "Great for keeping funds on
     * hand" as a standalone pill. Under a "Best for" label that becomes "Best
     * for: Great for…", so the phrase is reworded here rather than the tag
     * being changed under the homepage.
     */
    bestFor: 'Keeping funds on hand',
    lead: 'Draw what you need. Pay down when cash flow allows.',
    stats: [
      { label: 'Approval up to', value: '$1,500,000' },
      { label: 'Terms', value: 'Up to 36 months' },
      { label: 'Early payoff', value: 'No fees' },
    ],
  },
  '/funding-solutions/revenue-based-financing': {
    icon: 'growth',
    bestFor: 'Protecting cash flow while you ramp',
    lead: 'Pay interest only for up to a year, and draw more whenever you need it.',
    stats: [
      { label: 'Approval up to', value: '$750,000' },
      { label: 'Interest-only period', value: 'Up to 52 weeks' },
      { label: 'Rollover option', value: 'Up to 2 years' },
    ],
  },
  '/funding-solutions/equipment-financing': {
    icon: 'equipment',
    bestFor: 'Buying the asset the work depends on',
    lead: 'The equipment secures the loan, so it earns while you pay for it.',
    stats: [
      { label: 'Terms', value: '12 to 84 months' },
      { label: 'Application only', value: 'Under $250,000' },
      { label: 'Funding', value: 'Often within two days' },
    ],
  },
  '/funding-solutions/working-capital': {
    icon: 'cashflow',
    bestFor: 'Covering payroll, inventory and invoice gaps',
    lead: 'One lump sum, a fixed payoff, and a payment matched to your cash cycle.',
    stats: [
      { label: 'Amounts', value: '$15,000 to $2,000,000' },
      { label: 'Terms', value: '3 to 36 months' },
      { label: 'Funding', value: 'Same day' },
    ],
  },
};

/* ---------------------------------------------------------------------------
 * /blog — the index
 *
 * The template's frame is a news site: an oversized "Today's Headlines" hero, a
 * featured story, a three-up of recent ones, then the list. Same shapes here,
 * about funding.
 *
 * The heading keeps "Business Funding Insights" from the h1 this replaces. That
 * phrase was chosen for what the index can actually rank for, and the template's
 * colon construction adds the benefit half without losing it.
 * ------------------------------------------------------------------------- */

export const BLOG_INDEX = {
  eyebrow: 'The Blog',
  heading: 'Business Funding Insights: Know Before You Borrow',
  body:
    'Guides and breakdowns on how business lending actually works — what underwriters ' +
    'look at, what each product really costs over its term, and how to walk in ready. ' +
    'Written by the advisors who place these files.',
  /** Over the featured post. */
  featuredLabel: 'Latest',
  /** The labels on the featured post's three facts. */
  meta: {
    category: 'Category',
    date: 'Publication Date',
    author: 'Author',
  },
  readMore: 'Read More',
  /*
   * The band over the full list — the homepage's band without its CTA, since
   * that CTA points here.
   *
   * NOT the template's "Welcome to Our News Hub" / "Discover the World of
   * Headlines". Those are a news site's placeholder words and this file's whole
   * rule is that the copy is the business's own. What the band has to do is say
   * what the list under it is, which is every article in date order.
   */
  listHead: {
    label: 'Every Article',
    heading: 'The Full Archive, Newest First.',
  },
  older: 'Older posts',
} as const;

/* ---------------------------------------------------------------------------
 * The FAQ, on the homepage and /funding-solutions
 *
 * SOURCED FROM FORA FINANCIAL'S FAQ, at Denis's request — he sent their block
 * as the model, as he did for the hero and the three steps. Same treatment as
 * both of those: the questions and the substance are theirs, the sentences and
 * every FIGURE are ours. Three things had to change or the page would have been
 * wrong rather than merely borrowed:
 *
 *   - Their copy names "Fora Financial" three times. On Nanotom's own site.
 *   - It quotes a 570 credit minimum. REQUIREMENTS on this site says 551, and
 *     the homepage callout invites people BELOW 551 to the DIY programs. A 570
 *     here would turn away people the rest of the page is courting.
 *   - It promises a decision "in as little as 4 hours" and funds "as soon as 24
 *     hours later". Nanotom's own claim, in HOW_IT_WORKS and CALCULATOR, is the
 *     SAME DAY for both — stronger on funding, vaguer on the decision. Nothing
 *     was hedged to avoid their wording; if a 4-hour service level is ever real
 *     here, a specific number beats "the same day" and should go in.
 *
 * "Capital Specialist" is their job title too; ours is "in-house loan advisor",
 * the one USE_CASES already uses.
 *
 * ⚠ ONE CLAIM HERE IS UNVERIFIED AND IS THE RISKIEST STRING IN THIS FILE:
 * "reviewed with a soft credit check, which does not affect your credit score",
 * under `will-applying-affect-my-credit`. It came across with the rest of the
 * paste and nothing in this repo or on the live GoHighLevel site supports it.
 * It is not like the unconfirmed lender terms in FUNDING_OPTIONS: this is a
 * representation about how consumer credit is pulled, made on a page that takes
 * live applications, and it is exactly the kind of statement a borrower relies
 * on. CONFIRM IT WITH THE LENDERS OR CUT THE SENTENCE BEFORE LAUNCH.
 * ------------------------------------------------------------------------- */

/**
 * An answer, as a run of text and links.
 *
 * A plain string would do for six of the seven, but the intake answer has to
 * link out mid-sentence, and splitting it into `before`/`link`/`after` fields
 * is a shape that only fits one answer. Runs fit any of them.
 */
export type AnswerRun = string | { readonly text: string; readonly href: string };

export const FAQ = {
  heading: 'Frequently Asked Questions',
  body:
    "If your question is not answered here, ask us directly — an advisor will work " +
    'through it with you, and there is nothing to sign to have the conversation.',
  cta: { label: 'Ask a Question', href: 'tel:+18555989916' },
  items: [
    {
      id: 'what-is-online-business-financing',
      q: 'What is online business financing?',
      a: [
        'Capital your business applies for and receives through a digital lender rather ' +
          'than a bank branch. It covers structures like small business loans, lines of ' +
          'credit and revenue advances. The application, the document upload and the ' +
          'funding all happen online, which is why a decision comes back in hours rather ' +
          'than weeks.',
      ],
    },
    {
      id: 'how-does-it-work',
      q: 'How does online business financing work?',
      a: [
        'You submit an online application, an in-house loan advisor reviews your business ' +
          'and talks through what you actually need, and a decision comes back — often the ' +
          'same day. Once you accept an offer and sign, funds can land as soon as that same ' +
          'day. Nanotom Capital looks at your revenue, your time in business and your cash ' +
          'flow rather than at a credit score alone.',
      ],
    },
    {
      id: 'how-fast',
      q: 'How fast can I get funded?',
      a: [
        'Decisions often come back the same day once your documentation is in, and funds ' +
          'can land as soon as the day you sign. Timelines vary by program and by how ' +
          'quickly you can get documents to us.',
      ],
    },
    {
      id: 'credit-score',
      q: 'What credit score do I need?',
      a: [
        'Nanotom Capital works with businesses from a 551 personal FICO® score. A stronger ' +
          'score opens up more options, but credit is only one input — revenue consistency, ' +
          'time in business and overall cash flow all count, and some programs still work ' +
          'for businesses with less-than-perfect credit. Below 551, the ',
        { text: 'DIY programs', href: '/programs' },
        ' are built to get you back to approval-ready.',
      ],
    },
    {
      id: 'will-applying-affect-my-credit',
      q: 'Will applying affect my credit score?',
      /*
       * ⚠ THE UNVERIFIED CLAIM. See the warning at the top of this block before
       * changing anything here, and before this page goes live on the apex.
       */
      a: [
        'No. Applications are reviewed with a soft credit check, which does not affect your ' +
          'credit score. There is no cost to apply and no obligation to accept an offer.',
      ],
    },
    {
      id: 'what-can-i-use-it-for',
      q: 'What can I use the funds for?',
      a: [
        'Essentially any business purpose: payroll, inventory, equipment, renovations, ' +
          'marketing, expansion, or bridging the gap between invoicing and getting paid. ' +
          'Nanotom Capital does not restrict how you spread the capital across the business.',
      ],
    },
    {
      id: 'what-do-i-need-to-apply',
      q: 'What do I need to apply?',
      /* Denis's own words for this one, not adapted from anywhere. */
      a: [
        'Nothing, to start. The first step is just a form — nothing to gather and nothing ' +
          'to upload, and it is enough for our team to review. ',
        { text: 'Start the intake form', href: '/get-funded' },
        '. For a full application we will need proof of identity, your last three bank ' +
          'statements, and a signed merchant authorization.',
      ],
    },
  ],
} as const;
