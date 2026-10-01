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

import { FUNDING_PROGRAMS, type FundingSlug } from '../brand';

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
      note: '$15K to $5M across 9 funding types',
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

/**
 * THE NINE CORE FUNDING OPTIONS, as the homepage cards and the
 * /funding-solutions list.
 *
 * ⚠ READ THE NOTE ON FIGURES BELOW BEFORE CHANGING A NUMBER HERE. ⚠
 *
 * Built FROM FUNDING_PROGRAMS rather than written as its own list, which is the
 * whole point of this rewrite. Before it, four surfaces each kept their own
 * idea of what the business funds — see the note above FUNDING_PROGRAMS in
 * ../brand — and the homepage led with two named programs from one lender where
 * the menu listed categories. Keying the copy to the slug makes that
 * impossible: a program with no card does not compile, and a card with no
 * program has nowhere to go.
 *
 * The CTA href is the program's, not the card's. Four of the nine have a
 * dedicated page; the other five link to their own section of
 * /funding-solutions, for the route-segment reason set out in ../brand. Neither
 * fact is visible here on purpose — this file is copy, and where a product
 * lives is navigation.
 *
 * WHAT LEFT. The first two cards used to be "The Ultimate Revolving Line of
 * Credit" and "Pay Only The Interest For Up To A Year" — BANKROLL's two
 * programs, carrying that lender's real and verified terms. Denis called them
 * "just specifications", which is exactly right: they are one lender's version
 * of a line of credit, not a kind of funding a business shops for. Their terms
 * are still live at /funding-solutions/line-of-credit and
 * /funding-solutions/revenue-based-financing and nothing here deletes them.
 */

/* ---------------------------------------------------------------------------
 * ⚠⚠ WHICH FIGURES BELOW ARE REAL ⚠⚠
 *
 * This matters more than it used to, because the list went from four products
 * to nine and only two of the four were ever verified.
 *
 * VERIFIED — the business's own programs:
 *   line-of-credit          $1,500,000 limit, 36-month terms, no payoff fee.
 *                           BANKROLL's actual sheet.
 *
 * PUBLISHED BY A THIRD PARTY — not ours to set, and checkable:
 *   sba-loans               The 7(a) ceiling, the maturity limits, the rate cap
 *                           and the Express ceiling are the SBA's published
 *                           program rules, not a range invented here. They are
 *                           the SAFEST numbers on this page. They are also the
 *                           reason this card says "weeks, not hours" — an SBA
 *                           file genuinely does not fund the same day, and the
 *                           rest of the site's same-day promise must not be
 *                           read onto it.
 *
 * INDUSTRY-STANDARD RANGES — Denis asked for these explicitly on 2026-10-01
 * when the alternative was nine menu items pointing at empty pages. They are
 * how each category is normally sized and written, chosen to sit inside limits
 * this site already states ($15,000 to $5,000,000 in the hero, 551 FICO and 30
 * days in business in REQUIREMENTS), so nothing contradicts anything. That
 * makes them plausible. It does not make them Nanotom's:
 *
 *   working-capital       equipment-financing     merchant-cash-advance
 *   business-loans        inventory-financing     receivables-financing
 *   bridge-loans
 *
 * These are advertised terms for credit products, on pages that take live
 * applications. Check every one against the real lender sheets and cut anything
 * that cannot be honoured.
 *
 * ONE FIGURE IS DELIBERATELY UNFLATTERING. The merchant cash advance card says
 * in its own last point that it is the most expensive money on the page and to
 * compare it against a term loan first, and its stat row on /funding-solutions
 * spends a box saying the price is a factor rate rather than an APR. Neither is
 * a hedge to be tidied away in a copy pass: an MCA is the one product here
 * whose cost is not a rate, and a reader comparing it against the other eight
 * without knowing that will misjudge it by a wide margin.
 * ------------------------------------------------------------------------- */

type FundingCard = {
  readonly title: string;
  readonly body: string;
  /** Each point leads with a bolded label, so they are split rather than parsed. */
  readonly points: readonly { readonly label: string; readonly body: string }[];
  /** An italic aside beside the CTA. Null on every card today. */
  readonly tag: string | null;
};

/**
 * Keyed by slug, so TypeScript requires exactly the nine in FUNDING_PROGRAMS —
 * no more, no fewer. Adding a program without copy, or copy without a program,
 * is a build failure rather than a page that silently shows eight.
 */
const FUNDING_CARDS: Readonly<Record<FundingSlug, FundingCard>> = {
  'working-capital': {
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
  },

  /*
   * THE CATEGORY, not BANKROLL. This card used to be "The Ultimate Revolving
   * Line of Credit" and named that lender in its first sentence, which is why
   * the homepage and the menu read as two different companies. The figures are
   * still BANKROLL's, because they are the line this business actually places
   * and they are the only verified numbers on the page — what changed is that
   * the card now describes what a line of credit IS, and the program's name and
   * its specifics stay on /funding-solutions/line-of-credit.
   */
  'line-of-credit': {
    title: 'A Credit Line That Refills As You Repay',
    body:
      'An approved limit you draw from, pay down, and draw from again — with interest ' +
      'charged only on the balance you actually have out. The money is in place before you ' +
      'need it, so a slow month does not start with an application.',
    points: [
      { label: 'Revolving Limit', body: 'Approvals up to $1,500,000, reusable as you repay' },
      {
        label: 'Interest On What You Use',
        body: 'Nothing accrues on the part of the limit you leave alone',
      },
      { label: 'Draw On Demand', body: 'Funds move to your account without a new application' },
      { label: 'Predictable Payments', body: 'Fixed weekly payments over terms up to 36 months' },
      { label: 'No Early Payoff Fee', body: 'Clear the balance whenever it suits you' },
      {
        label: 'Open It Before You Need It',
        body: 'Lines are easiest to approve while trading is good',
      },
    ],
    tag: null,
  },

  /*
   * The SBA's rules, not ours. Every figure here is published by the agency and
   * can be checked against sba.gov; see the note above. The last point exists
   * because the rest of this site promises a same-day decision and this is the
   * one product where that is not true — leaving it out would make the site's
   * general claim into a specific false one.
   */
  'sba-loans': {
    title: 'The Longest Terms Available Anywhere',
    body:
      'Loans partly guaranteed by the U.S. Small Business Administration, which caps what a ' +
      'lender may charge and allows terms no conventional product matches. The trade is ' +
      'time: an SBA file takes weeks rather than hours, and asks for the paperwork to match.',
    points: [
      { label: 'Up To $5,000,000', body: "The 7(a) program's ceiling" },
      {
        label: 'Terms To 25 Years',
        body: 'Ten years for working capital and equipment, twenty-five for real estate',
      },
      {
        label: 'Capped Rates',
        body: 'The SBA limits the spread a lender may add over the base rate',
      },
      { label: 'Less Cash Down', body: 'Usually less equity up front than a conventional loan' },
      {
        label: 'SBA Express',
        body: 'Up to $500,000 on a shorter review, where speed matters more than size',
      },
      {
        label: 'Weeks, Not Hours',
        body: 'The one option here that is not a same-day decision — plan the timeline in',
      },
    ],
    tag: null,
  },

  'equipment-financing': {
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
  },

  /*
   * The honest version. An MCA is the easiest money on this page to get and the
   * most expensive to carry, and the single thing a borrower most often gets
   * wrong is reading a factor rate as an interest rate. The last point says so
   * in the card rather than in a footnote, and it should survive any copy pass
   * that tries to make the nine read evenly.
   */
  'merchant-cash-advance': {
    title: 'An Advance Against Sales You Have Not Made Yet',
    body:
      'Not a loan — a purchase of a slice of your future receipts, repaid automatically as a ' +
      'share of what comes in. The payment rises and falls with the business, which is the ' +
      'point, and the total cost is agreed up front rather than accruing.',
    points: [
      { label: 'Revenue-Led Approval', body: 'Recent deposits decide it; credit history rarely does' },
      { label: 'Sized To Your Volume', body: 'From $5,000 to $500,000 against card and bank receipts' },
      {
        label: 'Repaid As A Share Of Sales',
        body: 'A holdback of roughly 5% to 20% of daily takings',
      },
      { label: 'Slow Weeks Cost Less', body: 'The payment moves with revenue, not against it' },
      { label: 'Funded In Days', body: 'Among the fastest options here once statements are in' },
      {
        label: 'Priced As A Factor, Not An APR',
        body:
          'A fixed total cost set before you sign. It is the most expensive money on this ' +
          'page — compare it against a term loan first.',
      },
    ],
    tag: null,
  },

  /*
   * "Business Loans", not "Term Loans". Denis's list used the second name and
   * he chose to keep the first, which is also the page that already exists at
   * this slug — so the figures below are condensed from LOAN_PAGES'
   * business-loans entry and must stay in step with it.
   */
  'business-loans': {
    title: 'A Lump Sum Now, On Terms You Can Plan Around',
    body:
      'A fixed amount up front and a fixed schedule to repay it — the simplest way to fund ' +
      'something whose cost you already know. The amount, the term and the payment are all ' +
      'settled before you sign, so there is nothing to discover later.',
    points: [
      { label: 'Sized To The Job', body: 'From $15,000 to $5,000,000' },
      { label: 'Terms To 60 Months', body: 'Longer than most revenue-led options run' },
      { label: 'The Payment Does Not Move', body: 'Fixed weekly or monthly, first to last' },
      {
        label: 'Nothing Left Open',
        body: 'The balance only goes down — no facility to manage afterwards',
      },
      {
        label: 'Trading History Counts',
        body: 'Approval leans on how the business performs, not on FICO alone',
      },
      { label: 'Pay Ahead, Pay Less', body: 'Settling early reduces what the loan costs overall' },
    ],
    tag: null,
  },

  'inventory-financing': {
    title: 'Buy The Stock Before The Season Needs It',
    body:
      'Funding secured by the goods it buys, so you can take a bulk price, cover a long lead ' +
      'time, or fill the shelves ahead of a season without draining the account that pays ' +
      'the staff.',
    points: [
      { label: 'The Stock Is The Security', body: 'The inventory itself collateralises the facility' },
      { label: 'Scaled To Turnover', body: 'From $25,000 to $1,000,000' },
      { label: 'Advance Against Cost', body: "Typically 50% to 80% of the inventory's cost" },
      { label: 'Timed To Your Season', body: 'Terms from 3 to 24 months, matched to when stock sells' },
      { label: 'Revolving Available', body: 'Repay as goods sell and draw again for the next order' },
      {
        label: 'Take The Bulk Price',
        body: 'Volume discounts usually outrun what the facility costs',
      },
    ],
    tag: null,
  },

  'receivables-financing': {
    title: 'Get Paid Now For Invoices Due Later',
    body:
      'Your unpaid business-to-business invoices, advanced as cash instead of waiting out a ' +
      '30-, 60- or 90-day term. The facility grows as your sales do, because the limit is ' +
      'set by your receivables rather than by a fixed approval.',
    points: [
      { label: '80% To 90% Up Front', body: 'The balance, less the fee, lands when your customer pays' },
      {
        label: "Your Customer's Credit, Not Yours",
        body: 'Underwriting looks hardest at who owes you the money',
      },
      {
        label: 'A Limit That Grows',
        body: 'More invoices means more available funding, with no new application',
      },
      { label: 'Priced Per 30 Days', body: 'Typically 1% to 3% of face value for each 30 days out' },
      {
        label: 'No New Debt On The Books',
        body: 'You are advancing money already owed to you, not borrowing against it',
      },
      { label: 'B2B Only', body: 'It needs commercial invoices — consumer sales do not qualify' },
    ],
    tag: null,
  },

  'bridge-loans': {
    title: 'Cover The Gap Between One Deal And The Next',
    body:
      'Short-term money for a timing problem rather than a cash flow one — a purchase that ' +
      'must close before a sale completes, a refinance still in underwriting, a contract ' +
      'that needs funding before the first payment arrives.',
    points: [
      { label: 'Closes Fast', body: 'Days, rather than the weeks a conventional facility takes' },
      { label: '3 To 24 Months', body: 'Built to be repaid and retired, not carried' },
      { label: 'Interest-Only Common', body: 'Keeps the monthly cost down until the exit lands' },
      {
        label: 'Secured Against An Asset',
        body: 'Property, equipment or receivables carry the risk',
      },
      { label: 'Sized To The Gap', body: 'From $50,000 to $5,000,000' },
      {
        label: 'Needs A Clear Exit',
        body:
          'You are underwritten on how it gets repaid, so the sale, refinance or contract ' +
          'has to be real and dated',
      },
    ],
    tag: null,
  },
};

export const FUNDING_OPTIONS = {
  label: 'The Nanotom Capital Advantage',
  heading: 'Funding Options Built To Work For You.',
  /**
   * In FUNDING_PROGRAMS order, which is Denis's order. Each card carries its
   * program's `slug`, `icon`, `label` and `href` as well as its copy, so a
   * consumer never has to join the two lists back together itself — which is
   * what /funding-solutions used to do, keyed on the CTA's URL.
   */
  cards: FUNDING_PROGRAMS.map((program) => ({
    ...program,
    ...FUNDING_CARDS[program.slug],
    cta: { label: 'Learn More', href: program.href },
  })),
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

/**
 * A customer review, as it is displayed.
 *
 * `score` is out of five and is rendered as stars, so a four is drawn as four
 * filled and one empty rather than rounded up — the one four-star review here
 * says the funding took four days instead of two, and rounding that away is how
 * a review section stops being believed.
 */
export type Review = {
  name: string;
  company: string;
  /** Only some reviewers gave one. Rendered before the company when present. */
  title?: string;
  score: 1 | 2 | 3 | 4 | 5;
  quote: string;
};

export const TESTIMONIALS = {
  label: 'Testimonials',
  heading: 'What Others Are Saying',
  cta: 'View All Testimonials',

  /*
   * THESE ARE REAL REVIEWS AND THEY ARE QUOTED EXACTLY.
   *
   * Copied out of the SocialJuice wall this section used to embed
   * (embed.socialjuice.io/wall/9690), which stays the collection point and is
   * still where the section's link goes — the widget is gone, the account is
   * not. Every string below is the reviewer's own, typos and all: "reccomend"
   * and "straight forward" are how they were written. DO NOT TIDY THEM. A
   * corrected customer review is no longer a customer review, and the small
   * roughness is most of why a real one reads as real.
   *
   * ADDING ONE means copying it from the wall, not writing it. The layout puts
   * three across and centres a short last row, so any count sits properly.
   */
  reviews: [
    {
      name: 'Imran A.',
      company: 'Apex Logistics Group',
      score: 5,
      quote:
        'Our experience was positive. We appreciated the transparency on costs and the ' +
        'no-collateral requirement. Overall, they delivered on what they promised. Got ' +
        '$75k in less than a week.',
    },
    {
      name: 'Shelly R.',
      company: 'Midtown Craft Coffee',
      score: 4,
      quote:
        'Application process was easy and the rep (I think her name was Morgan?) was super ' +
        'helpful. Took a bit longer than I expected to finalize (4 days instead of 2), but ' +
        'in the end it worked out. Might try again if terms improve.',
    },
    {
      name: 'Jared P.',
      company: 'JP Woodworks',
      score: 5,
      quote:
        'Fast, no BS. Got funded in like 36 hrs. Helped me cover payroll during a slow ' +
        'week. Would reccomend.',
    },
    {
      name: 'Carlos D.',
      company: 'Fenix Automotive Services',
      title: 'Co-founder',
      score: 5,
      quote:
        'At first I was a bit skeptical\u2014too many funding companies out there making big ' +
        'promises. But these guys actually delivered. The rate was a little higher than I ' +
        'hoped but no hidden fees and very straight forward process.',
    },
    {
      name: 'Tina M.',
      company: 'Bayleaf Boutique',
      title: 'Owner',
      score: 5,
      quote:
        'Honestly, didn\u2019t know what to expect but this company came thru in a big way. We ' +
        'were short on cashflow before a big inventory push and they got us approved fast. ' +
        'Funds hit the next morning. Super grateful and def using them again.',
    },
  ] satisfies readonly Review[],
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
 * THE HEADLINE AND THE BAND BELOW IT NOW CARRY A COUNT, which they could not
 * before. The homepage tile claimed six funding types, the nav listed five and
 * this page showed four, so any number in a heading would have been
 * contradicted by the list under it. All four surfaces read FUNDING_PROGRAMS
 * now — nine of them — and a test fails if a heading's number and that array's
 * length disagree. Say a number only while that stays true.
 * ------------------------------------------------------------------------- */

export const LOANS = {
  hero: {
    eyebrow: 'Funding Solutions',
    heading: 'Every Way To Fund Your Business. One Application.',
    /*
     * "Most come back the same day", not "get a decision the same day". The
     * list this sentence introduces now includes SBA loans, which take weeks —
     * a blanket same-day promise over a list containing one is a general claim
     * turned into a specific false one. The SBA card says so itself; this says
     * it before a reader gets there.
     */
    body:
      'Nine ways to fund a business, side by side — working capital, lines of credit, SBA ' +
      'loans, equipment finance and five more. Apply once, in minutes, and most come back ' +
      'the same day, with approvals from $15,000 to $5,000,000.',
  },

  /*
   * The grey header band over the product list, the same one the homepage puts
   * over each of its sections.
   *
   * THE NUMBER IN THIS HEADING IS LOAD-BEARING. It is only safe because one
   * array now feeds the menu, the footer, the homepage cards and the list under
   * this band; the moment a tenth program is added it is wrong, so a test
   * asserts the word here against FUNDING_PROGRAMS.length and fails instead.
   */
  optionsHead: {
    label: 'Our Funding Options',
    heading: 'All Nine, Side By Side.',
  },

  /** The pill on the first product in the list. Only the first one gets it. */
  featuredLabel: 'Featured',
  /** Label above the one-line "what this is good at" on every product. */
  bestForLabel: 'Best for',
} as const;

type ProductDetail = {
  /** Reworded from the card's `tag` where it had one — see the note below. */
  bestFor: string;
  /** The section's own heading, above the card's description. */
  lead: string;
  stats: readonly { readonly label: string; readonly value: string }[];
};

/**
 * The extra copy /funding-solutions needs beyond the card, keyed by slug.
 *
 * NO `icon` ANY MORE. It used to be declared here as well as on the nav entry,
 * which meant a product could carry one glyph in the header's dropdown and a
 * different one on its own section of this page. Both now read
 * FUNDING_PROGRAMS, so there is one answer. Keying this record by `FundingSlug`
 * rather than by the CTA's URL is the same move: the URL changes when a product
 * gains its own page, and pairing copy to a thing that moves is how the pairing
 * breaks.
 *
 * The stats are CONDENSED FROM THE CARD'S POINTS and have to agree with them.
 * The source is prose — a point reads "Approvals up to $1,500,000", not a
 * number a component can box — so each figure here restates one specific point
 * of its own card. Change one, change both. Three per product, and never a
 * figure the section's `lead` already gives, so the row adds facts rather than
 * repeating them.
 *
 * WHICH OF THESE NUMBERS ARE REAL is set out at length above FUNDING_CARDS.
 * Short version: the line of credit's are BANKROLL's own, the SBA's are the
 * agency's published rules, and the other seven products' are industry-standard
 * ranges Denis approved as a stopgap. Treat the seven as unverified.
 */
export const LOAN_PRODUCTS: Readonly<Record<FundingSlug, ProductDetail>> = {
  'working-capital': {
    bestFor: 'Covering payroll, inventory and invoice gaps',
    lead: 'One lump sum, a fixed payoff, and a payment matched to your cash cycle.',
    stats: [
      { label: 'Amounts', value: '$15,000 to $2,000,000' },
      { label: 'Terms', value: '3 to 36 months' },
      { label: 'Funding', value: 'Same day' },
    ],
  },
  'line-of-credit': {
    /*
     * The card's tag for this product used to read "Great for keeping funds on
     * hand" as a standalone pill. Under a "Best for" label that becomes "Best
     * for: Great for…", so the phrase is reworded here rather than the card
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
  'sba-loans': {
    bestFor: 'The longest term and the lowest payment',
    lead: 'A federal guarantee, a capped rate, and a term no conventional loan will match.',
    stats: [
      { label: 'Approval up to', value: '$5,000,000' },
      { label: 'Terms', value: 'Up to 25 years' },
      /* Not a stat so much as a warning, and it belongs in the row with the
         other two: a reader comparing these boxes across nine products is
         exactly the reader who would otherwise assume same-day. */
      { label: 'Decision', value: 'Weeks, not hours' },
    ],
  },
  'equipment-financing': {
    bestFor: 'Buying the asset the work depends on',
    lead: 'The equipment secures the loan, so it earns while you pay for it.',
    stats: [
      { label: 'Terms', value: '12 to 84 months' },
      { label: 'Application only', value: 'Under $250,000' },
      { label: 'Funding', value: 'Often within two days' },
    ],
  },
  'merchant-cash-advance': {
    bestFor: "Turning tomorrow's sales into today's cash",
    lead: 'Fast, revenue-led, and repaid as a share of what comes in.',
    stats: [
      { label: 'Amounts', value: '$5,000 to $500,000' },
      { label: 'Holdback', value: '5% to 20% of receipts' },
      /*
       * THIS ROW REPLACED "Funding: Within days", which the `lead` already
       * says, and it is the most important box on this page.
       *
       * /funding-solutions is where someone sets nine products beside each
       * other and reads the stat rows across. Every other product's cost is an
       * interest rate; this one's is a factor, and a reader who carries the
       * habit across — 1.35 read as 35% a year rather than 35% of the
       * principal, full stop — will badly underestimate it. The card's sixth
       * point says so in prose, but the Daylight homepage renders only the
       * first point and this page renders none of them, so without this box the
       * warning reaches almost nobody.
       */
      { label: 'Priced as', value: 'A factor rate, not an APR' },
    ],
  },
  'business-loans': {
    bestFor: 'A cost you know before you sign',
    lead: 'A fixed amount, a fixed schedule, and a payment that never moves.',
    stats: [
      { label: 'Amounts', value: '$15,000 to $5,000,000' },
      { label: 'Terms', value: '3 to 60 months' },
      { label: 'Repayment', value: 'Fixed weekly or monthly' },
    ],
  },
  'inventory-financing': {
    bestFor: 'Stocking up ahead of the season',
    lead: 'The goods secure the facility, so the shelves fill without draining the account.',
    stats: [
      { label: 'Amounts', value: '$25,000 to $1,000,000' },
      { label: 'Advance', value: '50% to 80% of cost' },
      { label: 'Terms', value: '3 to 24 months' },
    ],
  },
  'receivables-financing': {
    bestFor: 'Not waiting out a 60-day invoice',
    lead: 'Your unpaid invoices, advanced as cash, on a limit that grows as sales do.',
    stats: [
      { label: 'Advance', value: '80% to 90% up front' },
      { label: 'Fee', value: '1% to 3% per 30 days' },
      { label: 'Qualifies on', value: "Your customer's credit" },
    ],
  },
  'bridge-loans': {
    bestFor: 'A timing gap, not a cash flow one',
    lead: 'Short-term money that closes fast and retires on a known exit.',
    stats: [
      { label: 'Amounts', value: '$50,000 to $5,000,000' },
      { label: 'Terms', value: '3 to 24 months' },
      { label: 'Structure', value: 'Interest-only available' },
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
 * The soft-credit-check answer under `will-applying-affect-my-credit` was
 * flagged here as unverified when it arrived with the paste — nothing in this
 * repo or on the live GoHighLevel site supported it, and a representation about
 * how consumer credit is pulled, on a page taking live applications, is exactly
 * what a borrower relies on. IT IS NOW SOURCED: Denis supplied the funding
 * disclaimer in site-footer.tsx, which states "Each application is subject to a
 * soft credit check that will not affect credit scores" as the business's own
 * position. The two have to agree — if that disclaimer is ever amended, this
 * answer is the other place the claim is made.
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
       * The claim this repeats is the footer disclaimer's — see the note at the
       * top of this block. Change one and change the other.
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

/* ---------------------------------------------------------------------------
 * The individual funding product pages, /funding-solutions/<slug>
 *
 * Structure follows the brief: hero, "What is X", "Why choose X", "How does X
 * work", a compare widget, then the three shared bands. Fora Financial's
 * product pages were the reference for the SHAPE, as they were for the hero and
 * the three steps. The words are ours.
 *
 * ⚠⚠ READ THIS BEFORE TOUCHING ANY NUMBER BELOW. ⚠⚠
 *
 * Only TWO of these five products have terms this business has confirmed:
 *
 *   line-of-credit            BANKROLL's real terms. Safe.
 *   revenue-based-financing   The real interest-only program. Safe.
 *
 * The other three DO NOT:
 *
 *   working-capital       industry-standard ranges, flagged unverified since
 *   equipment-financing   they were written for FUNDING_OPTIONS above.
 *   business-loans        NOTHING existed for this one. There is no card in
 *                         FUNDING_OPTIONS, no figure anywhere in this repo and
 *                         nothing on the live GoHighLevel site to take one
 *                         from. Its amounts, terms and schedule below are
 *                         written to be internally consistent with what the
 *                         site already claims ("$15,000 to $5,000,000" in the
 *                         hero, 551 FICO, 30 days in business) and nothing more.
 *
 * A carousel card carrying an unverified range is one thing. A DEDICATED
 * PRODUCT PAGE is the page that ranks, the page a borrower reads before
 * applying, and the page a term gets quoted from. Three of these five are
 * currently that page built on figures nobody has checked. Check every number
 * for working-capital, equipment-financing and business-loans against the real
 * lender sheets and cut anything that cannot be honoured.
 * ------------------------------------------------------------------------- */

/** The one qualifying line, shared, so five pages cannot drift apart on it. */
const ENTRY_REQUIREMENT = 'From 551 FICO® and 30 days in business';

/** The row set the Quick Stats card and the compare widget both read. */
export type LoanFacts = {
  readonly amount: string;
  readonly term: string;
  readonly repayment: string;
  readonly fundingTime: string;
  readonly requirements: string;
  readonly pros: readonly string[];
  readonly cons: readonly string[];
};

export type LoanPage = {
  /** Path segment under /funding-solutions/. */
  readonly slug: string;
  /** Short name, used in the compare tabs and the <title>. */
  readonly navLabel: string;
  readonly hero: { readonly eyebrow: string; readonly heading: string; readonly blurb: string };
  readonly whatIs: { readonly heading: string; readonly body: string };
  readonly whyChoose: { readonly heading: string; readonly body: string };
  readonly how: { readonly heading: string; readonly body: string };
  readonly facts: LoanFacts;
  /** Feeds <meta name="description">. */
  readonly description: string;
};

/** Labels for the Quick Stats rows and the compare columns. */
export const FACT_LABELS = {
  amount: 'Amount',
  term: 'Term',
  repayment: 'Repayment',
  fundingTime: 'Funding Time',
  requirements: 'Requirements',
  pros: 'Pros',
  cons: 'Cons',
} as const;

export const LOAN_PAGE_HEADS = {
  compare: 'Compare This Against Our Other Options',
  compareLead:
    'Pick another program and the two sit side by side — amounts, terms, what each is good at, ' +
    'and what it costs you to choose it.',
  compareThis: 'This program',
  compareAgainst: 'Compare against',
  quickStats: 'Quick Stats',
} as const;

export const LOAN_PAGES: readonly LoanPage[] = [
  /* ----------------------------------------------------------------------- */
  {
    slug: 'business-loans',
    navLabel: 'Business Loans',
    description:
      'A fixed sum up front and a fixed schedule to repay it. Small business loans from ' +
      '$15,000 to $5,000,000, with a decision often the same day.',
    hero: {
      eyebrow: 'Business Loans',
      heading: 'A Lump Sum Now, On Terms You Can Plan Around.',
      blurb:
        'A fixed amount up front and a fixed schedule to repay it. The simplest way to fund ' +
        'something whose cost you already know — an expansion, a hire, a piece of work you ' +
        'have priced — with the payment settled before you sign.',
    },
    whatIs: {
      heading: 'What Is a Small Business Loan?',
      body:
        'A small business loan is a fixed sum advanced to your business up front and repaid ' +
        'over an agreed term on a set schedule. The amount, the term and the payment are all ' +
        'settled before you sign, so the cost is known on day one. It is the right shape when ' +
        'you know what you are spending and when — unlike a line of credit, which exists for ' +
        'the costs you cannot schedule.',
    },
    whyChoose: {
      heading: 'Why Choose a Business Loan',
      body:
        'Because you can plan against it. The payment does not move, the balance only goes ' +
        'down, and there is no facility left open to manage. Approval leans on how the ' +
        'business actually trades rather than on a credit file alone, so a short history or a ' +
        'thin score does not end the conversation.',
    },
    how: {
      heading: 'How Does a Small Business Loan Work?',
      body:
        'You apply with a few details about the business and an advisor reviews your revenue ' +
        'and time in trading. You receive an offer setting out the amount, the term and the ' +
        'payment. Accept and sign, and the full amount is disbursed in a single transfer — ' +
        'often the same day. Repayments run on the agreed schedule to the end of the term, ' +
        'and paying ahead reduces what you pay overall.',
    },
    facts: {
      amount: '$15,000 to $5,000,000',
      term: '3 to 60 months',
      repayment: 'Fixed weekly or monthly',
      fundingTime: 'As soon as the same day',
      requirements: ENTRY_REQUIREMENT,
      pros: [
        'One lump sum, at a cost you know before signing',
        'Nothing left open to manage once it lands',
        'Longer terms than most revenue-led options',
      ],
      cons: [
        'The whole balance accrues from day one, spent or not',
        'A new need means a new application',
        'Larger amounts ask for more documentation',
      ],
    },
  },

  /* ----------------------------------------------------------------------- */
  {
    slug: 'line-of-credit',
    navLabel: 'Line of Credit',
    description:
      "Draw what you need, pay down when cash flow allows, draw again. BANKROLL's revolving " +
      'business line of credit, with approvals up to $1,500,000.',
    hero: {
      eyebrow: 'Line of Credit',
      heading: 'A Credit Line That Refills As You Repay.',
      blurb:
        'Draw what you need, pay down when cash flow allows, and draw again — up to ' +
        '$1,500,000, with interest charged only on the amount you actually have out.',
    },
    whatIs: {
      heading: 'What Is a Business Line of Credit?',
      body:
        'A business line of credit is an approved limit you can draw from, repay, and draw ' +
        'from again. Where a term loan hands over a lump sum on a fixed schedule, a line of ' +
        'credit lets you take only what you need when you need it, and you pay interest only ' +
        'on the amount currently drawn. Repay a draw and that credit is available again, ' +
        'without reapplying.',
    },
    whyChoose: {
      heading: 'Why Choose the BANKROLL Revolving Line of Credit',
      body:
        'Because the money is in place before you need it. Approvals run to $1,500,000, draws ' +
        'and paydowns of $5,000 or more are unlimited through the one-year revolving period, ' +
        'payments are fixed weekly so they are predictable, and clearing the balance early ' +
        'carries no fee. You decide when to borrow, how much to repay, and when to stop.',
    },
    how: {
      heading: 'How Does a Business Line of Credit Work?',
      body:
        'You are approved for a maximum limit. When a need arises you draw against it and the ' +
        'funds transfer to your account. Interest applies to the drawn balance only, not the ' +
        'full limit, and there are no minimum finance charges on money you have not used. As ' +
        'you repay, the available credit restores to the original limit and you can draw again ' +
        'without a new application, over terms up to 36 months.',
    },
    facts: {
      amount: 'Up to $1,500,000',
      term: 'Up to 36 months',
      repayment: 'Fixed weekly',
      fundingTime: 'As soon as the same day',
      requirements: ENTRY_REQUIREMENT,
      pros: [
        'Reusable — repaid credit restores to the limit',
        'Interest only on what you draw, no minimum finance charges',
        'Unlimited draws and paydowns of $5,000+',
        'Early payoff any time, without a fee',
      ],
      cons: [
        'An open facility is easier to lean on than a closed one',
        'Payments are weekly rather than monthly',
        'An approved limit is not a guarantee every draw clears',
      ],
    },
  },

  /* ----------------------------------------------------------------------- */
  {
    slug: 'revenue-based-financing',
    navLabel: 'Revenue-Based Financing',
    description:
      'Up to $750,000 with interest-only payments for as long as 52 weeks, plus a built-in ' +
      'line of credit. Priced against how your business trades, not your score alone.',
    hero: {
      eyebrow: 'Revenue-Based Financing',
      heading: 'Pay Only The Interest, For Up To A Year.',
      blurb:
        'Up to $750,000 with interest-only payments for as long as 52 weeks, and a built-in ' +
        'credit line you can keep drawing against while the principal waits.',
    },
    whatIs: {
      heading: 'What Is Revenue-Based Financing?',
      body:
        'Revenue-based financing is capital priced against how your business actually trades ' +
        'rather than against a credit score alone. This program takes that further: for up to ' +
        'a full year the payment covers interest only, so repaying principal is not competing ' +
        'with cash flow while the money is still doing its work. A built-in line of credit ' +
        'sits alongside it for whatever comes up in the meantime.',
    },
    whyChoose: {
      heading: 'Why Choose Interest-Only Financing',
      body:
        'Because it buys time at the point where time is worth the most. Start from $50,000 ' +
        'rather than $150,000, pay interest only for up to 52 weeks, and draw a further ' +
        '$25,000 or more whenever you need it during that period. If the ramp takes longer ' +
        'than planned, a built-in rollover amortizes the balance over as much as two more ' +
        'years instead of leaving you to refinance.',
    },
    how: {
      heading: 'How Does Revenue-Based Financing Work?',
      body:
        'You are approved for a total amount and take an initial draw, in one transfer or ' +
        'across several consecutive business days. Your credit line is the difference between ' +
        'the approval and that first draw, and you pull from it in increments of $25,000 or ' +
        'more. Through the interest-only period your payment covers interest alone. At the end ' +
        'of it the balance either clears or rolls into an amortizing term of up to two years.',
    },
    facts: {
      amount: 'Up to $750,000',
      term: '52 weeks interest-only, rollover to 2 years',
      repayment: 'Interest-only, then amortizing',
      fundingTime: 'As soon as the same day',
      requirements: ENTRY_REQUIREMENT,
      pros: [
        'Interest-only payments for up to a year',
        'Built-in credit line for further draws',
        'Entry point from $50,000',
        'Rollover option instead of a refinance',
      ],
      cons: [
        'Interest-only means the principal is still there at the end',
        'Further draws come in $25,000 increments',
        'Total cost is higher than amortizing from day one',
      ],
    },
  },

  /* ----------------------------------------------------------------------- */
  {
    slug: 'working-capital',
    navLabel: 'Working Capital',
    description:
      'A lump sum with a fixed, predictable payoff, built for payroll, inventory and the gap ' +
      'between invoicing and getting paid. Revenue-led underwriting, same-day funding.',
    hero: {
      eyebrow: 'Working Capital',
      heading: 'Cover The Gap Between Doing The Work And Getting Paid.',
      blurb:
        'A lump sum up front with a fixed, predictable payoff — built for payroll, inventory, ' +
        'and the weeks between sending an invoice and being paid for it.',
    },
    whatIs: {
      heading: 'What Is Working Capital Financing?',
      body:
        'Working capital financing covers the day-to-day cost of running the business rather ' +
        'than a single purchase. It is the money that makes payroll, restocks the shelves and ' +
        'keeps suppliers current while your own invoices are still outstanding. It is sized ' +
        'against how you trade rather than against an asset, and the term is short by design: ' +
        'it is bridging a timing gap, not funding a decade.',
    },
    whyChoose: {
      heading: 'Why Choose Working Capital From Nanotom Capital',
      body:
        'Because approval looks at how the business performs rather than only at your credit ' +
        'file — recent deposits carry more weight than a FICO score. Payments are matched to ' +
        'your cash cycle, daily, weekly or monthly, and settling ahead of schedule reduces the ' +
        'interest you pay instead of triggering a penalty.',
    },
    how: {
      heading: 'How Does Working Capital Financing Work?',
      body:
        'You apply with a few details and recent bank statements. An advisor sizes the advance ' +
        'against your deposits and agrees a term and a payment rhythm that fits how money ' +
        'actually moves through the business. The full amount transfers in one payment, often ' +
        'the same day your file is complete, and repayments run on that schedule until the ' +
        'balance clears. Nothing stays open afterwards.',
    },
    facts: {
      amount: '$15,000 to $2,000,000',
      term: '3 to 36 months',
      repayment: 'Daily, weekly or monthly',
      fundingTime: 'Same day once your file is complete',
      requirements: ENTRY_REQUIREMENT,
      pros: [
        'Revenue-led underwriting rather than credit-led',
        'Payment rhythm matched to your cash cycle',
        'Early payoff reduces the interest you pay',
        'No open balance left to manage',
      ],
      cons: [
        'Short terms mean larger individual payments',
        'Daily or weekly schedules need steady receipts',
        'Sized against deposits, so a slow quarter caps it',
      ],
    },
  },

  /* ----------------------------------------------------------------------- */
  {
    slug: 'equipment-financing',
    navLabel: 'Equipment Financing',
    description:
      'Finance the machine, vehicle or system your business runs on. The equipment secures ' +
      'the loan, most requests under $250,000 are application-only.',
    hero: {
      eyebrow: 'Equipment Financing',
      heading: 'Let The Equipment Pay For Itself.',
      blurb:
        'Finance the machine, vehicle or system the business runs on. The equipment secures ' +
        'the loan, so approval leans on what you are buying rather than on what you already own.',
    },
    whatIs: {
      heading: 'What Is Equipment Financing?',
      body:
        'Equipment financing is a loan secured by the thing it buys. Because the asset is the ' +
        'collateral, there is no blanket lien across the rest of the business, and underwriting ' +
        'leans on the equipment itself rather than on the balance sheet behind it. The term is ' +
        'matched to the working life of the asset, so the equipment is earning while you are ' +
        'still paying for it.',
    },
    whyChoose: {
      heading: 'Why Choose Equipment Financing',
      body:
        'Because it leaves the rest of the business unencumbered. The equipment secures the ' +
        'loan on its own — new or used, from a dealer, a private party or an auction. Most ' +
        'requests under $250,000 are application-only, with no financial statements to produce, ' +
        'and most financed equipment qualifies for a Section 179 write-off.',
    },
    how: {
      heading: 'How Does Equipment Financing Work?',
      body:
        'You identify the equipment and the seller, and apply with the invoice or quote. ' +
        'Underwriting looks at the asset and at your trading history; on most requests under ' +
        '$250,000 no financial statements are needed. Once approved, funds go to the seller and ' +
        'the equipment is delivered, with the loan secured against it and nothing else. ' +
        'Repayments run 12 to 84 months, matched to how long the asset will be earning.',
    },
    facts: {
      amount: 'Matched to the invoice',
      term: '12 to 84 months',
      repayment: 'Fixed monthly',
      fundingTime: 'Often within two business days',
      requirements: ENTRY_REQUIREMENT,
      pros: [
        'Self-collateralizing — no blanket lien on other assets',
        'Application-only on most requests under $250,000',
        'New, used, dealer, private party or auction',
        'Most financed equipment is Section 179 eligible',
      ],
      cons: [
        'Only pays for equipment, not general spend',
        'The asset can be repossessed on default',
        'Terms track the asset’s life rather than your preference',
      ],
    },
  },
];
