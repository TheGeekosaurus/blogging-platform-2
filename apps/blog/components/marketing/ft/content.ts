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
   * the trailing symbol alone — "2,300" in white, the "+" in gold.
   */
  stats: [
    { value: '2,300', unit: '+', label: 'businesses funded since 2012' },
    // The live homepage writes this '$36+ M'. Same figure, conventional order.
    { value: '$36M', unit: '+', label: 'provided in financing' },
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
  heading: 'Funding that moves at your speed.',
  steps: [
    {
      title: 'Complete the application.',
      body: 'Our streamlined process is designed to be completed in just minutes.',
    },
    {
      title: 'Get a decision.',
      body: 'Work with an expert loan advisor to choose the best option for you.',
    },
    {
      title: 'Receive your funds.',
      body: 'Sign your contract and get funds as soon as the same day.',
    },
  ],
} as const;

export const FUNDING_OPTIONS = {
  label: 'The Nanotom Capital Advantage',
  heading: 'Funding Options Built to Work for You.',
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
     * PLACEHOLDERS — REPLACE BEFORE THIS PAGE GOES ANYWHERE PUBLIC.
     *
     * Two lorem ipsum cards, added at Denis's request so the carousel can be
     * judged at four cards rather than two. They are real lorem ipsum, which
     * means they will read as finished copy to anyone skimming: this is the one
     * thing on the page that must not survive to launch, and the reason they are
     * flagged here rather than quietly blended in.
     *
     * Replacing them is this array and nothing else — the carousel takes however
     * many cards it is given.
     */
    {
      title: 'Lorem Ipsum Dolor Sit Amet',
      body:
        'Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore ' +
        'magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
      points: [
        { label: 'Lorem Ipsum', body: 'Dolor sit amet consectetur adipiscing' },
        { label: 'Sed Do Eiusmod', body: 'Tempor incididunt ut labore et dolore magna' },
        { label: 'Ut Enim Ad Minim', body: 'Veniam quis nostrud exercitation ullamco' },
        { label: 'Duis Aute Irure', body: 'Dolor in reprehenderit in voluptate velit esse' },
        { label: 'Excepteur Sint', body: 'Occaecat cupidatat non proident sunt in culpa' },
        { label: 'Qui Officia', body: 'Deserunt mollit anim id est laborum' },
      ],
      tag: null,
      cta: { label: 'Learn More', href: '/funding-solutions' },
    },
    {
      title: 'Nulla Pariatur Excepteur Sint',
      body:
        'Occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id ' +
        'est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem.',
      points: [
        { label: 'Accusantium Doloremque', body: 'Laudantium totam rem aperiam eaque ipsa' },
        { label: 'Quae Ab Illo', body: 'Inventore veritatis et quasi architecto beatae' },
        { label: 'Vitae Dicta Sunt', body: 'Explicabo nemo enim ipsam voluptatem quia' },
        { label: 'Voluptas Sit', body: 'Aspernatur aut odit aut fugit sed quia' },
        { label: 'Consequuntur Magni', body: 'Dolores eos qui ratione voluptatem sequi' },
        { label: 'Nesciunt Neque', body: 'Porro quisquam est qui dolorem ipsum quia' },
      ],
      tag: null,
      cta: { label: 'Learn More', href: '/funding-solutions' },
    },
  ],
} as const;

export const QUALIFIER = {
  label: 'Get Started',
  heading: 'Not Sure What Is Best for You?',
  points: [
    'Answer a few simple questions',
    'We will look at your particular situation',
    "We'll send you some recommendations",
  ],
} as const;

export const USE_CASES = {
  heading: 'What can you do with funding from Nanotom Capital?',
  body:
    'No matter your goal, our in-house loan advisors can help you choose a financing ' +
    'solution — no middleman or delays.',
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
  heading: 'Are we a match? Check our minimum requirements.',
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
    heading: 'Below 551, or under 30 days in business?',
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
  heading: 'From the Nanotom Capital Blog',
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
