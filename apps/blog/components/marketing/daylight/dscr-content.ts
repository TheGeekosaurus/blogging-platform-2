/**
 * Copy for /calculators/dscr-calculator.
 *
 * DSCR IS NOT A PRODUCT NANOTOM OFFERS YET, and every line here is written
 * around that. Denis confirmed it is being added and is not live, so this page
 * is a tool first: it explains the metric, runs the numbers, and does not say
 * or imply that an application exists behind it. The CTA goes to an advisor and
 * to what the business funds today, not to the business-funding survey dressed
 * up as a DSCR intake.
 *
 * THE THRESHOLDS ARE MARKET CONVENTION, NOT OUR CRITERIA. 1.20-1.25 is what
 * DSCR lenders commonly look for; it is not a number this business has
 * published, because this business does not price this product. That is the
 * same rule lib/funding-calc.ts states at the top of the file for its pricing
 * table — a lender quoting figures it will not honour is a compliance problem,
 * and the page says so where a reader can see it rather than only here.
 *
 * When DSCR lending does go live, three things change together: this note, the
 * `notYet` band, and whatever the real entry criteria turn out to be.
 */

/** The hosted calculator — see ./calc-embed.tsx for how it is mounted. */
export const DSCR_EMBED = {
  slug: 'dscr-calculator-nntm-ein7x',
  origin: 'https://app.rebeliq.ai',
  /** The accessible name of the frame. The platform's loader hardcodes
      "Mortgage Calculator" for every calculator it mounts; this one is ours. */
  title: 'DSCR calculator for investment property',
} as const;

export const DSCR = {
  label: 'Free Tool',
  heading: 'DSCR Calculator For Investment Property',
  intro:
    'Work out the debt service coverage ratio on a rental property in a few seconds. ' +
    'Enter the rent it brings in, what it costs to run, and the payment on the loan — ' +
    'the calculator does the rest, and nothing you type is sent anywhere until you ask ' +
    'it to be.',

  formula: {
    heading: 'How DSCR Is Calculated',
    body:
      'DSCR is one division: the income a property produces, over what the loan on it ' +
      'costs for the year.',
    expression: 'DSCR = Net Operating Income ÷ Annual Debt Service',
    terms: [
      {
        term: 'Net operating income',
        body:
          'Gross rent for the year, minus what it costs to run the property — taxes, ' +
          'insurance, maintenance, management and an allowance for vacancy. It does not ' +
          'include the mortgage payment. That is the whole point: NOI is what the ' +
          'property earns before financing, so the ratio can measure financing against it.',
      },
      {
        term: 'Annual debt service',
        body:
          'Twelve months of payments on the loan. Some lenders count principal and ' +
          'interest only; others use PITIA, which folds in taxes, insurance and any ' +
          'association dues. The second gives a lower ratio on the same property, so it ' +
          'is worth knowing which one a lender means before comparing quotes.',
      },
    ],
  },

  reading: {
    heading: 'What The Number Means',
    rows: [
      {
        value: 'Below 1.00',
        body:
          'The property does not cover its own debt. The shortfall comes out of your ' +
          'pocket every month.',
      },
      {
        value: 'Exactly 1.00',
        body:
          'It breaks even. Every dollar of income goes to the loan, and nothing is left ' +
          'for a repair, a void month or a rate change.',
      },
      {
        value: '1.20 to 1.25',
        body:
          'The range DSCR lenders commonly ask for. It leaves roughly a fifth of income ' +
          'as cushion above the payment.',
      },
      {
        value: 'Above 1.25',
        body:
          'Comfortable cover. Stronger ratios tend to open up better pricing, more ' +
          'leverage, or both.',
      },
    ],
    /*
     * THE CAVEAT IS NOT SMALL PRINT. It is on the page, at body size, directly
     * under the numbers it qualifies — because the numbers above are market
     * convention and a reader has no way to know that otherwise.
     */
    caveat:
      'Those bands are what lenders in this market generally look for, not Nanotom ' +
      'Capital’s criteria — we do not price DSCR loans today. Treat them as a guide to ' +
      'how the ratio is read, and confirm the threshold with whoever is quoting you.',
  },

  example: {
    heading: 'A Worked Example',
    intro: 'A single rental at $3,500 a month:',
    rows: [
      { label: 'Gross annual rent', value: '$42,000', note: '$3,500 × 12' },
      {
        label: 'Operating expenses',
        value: '−$14,700',
        note: 'taxes, insurance, maintenance, management, vacancy — 35% here',
      },
      { label: 'Net operating income', value: '$27,300', note: 'what the property earns' },
      { label: 'Annual debt service', value: '−$22,200', note: '$1,850 × 12' },
    ],
    result: { label: 'DSCR', value: '1.23', note: '$27,300 ÷ $22,200' },
    body:
      'The property earns about 23% more than the loan costs. That clears the range most ' +
      'DSCR lenders ask for, with room for a bad month.',
  },

  faq: {
    heading: 'Questions About DSCR',
    items: [
      {
        q: 'What counts as an operating expense?',
        a:
          'Property taxes, insurance, maintenance and repairs, property management, ' +
          'utilities you pay rather than the tenant, HOA dues, and an allowance for ' +
          'vacancy. Not the mortgage — that belongs in debt service, and counting it ' +
          'twice is the most common way to get this calculation wrong.',
      },
      {
        q: 'Should I use principal and interest, or PITIA?',
        a:
          'Whichever the lender uses, which is worth asking before you compare offers. ' +
          'PITIA includes taxes, insurance and association dues in the payment, so it ' +
          'produces a lower ratio on the same property. Two quotes using different ' +
          'definitions are not comparable.',
      },
      {
        q: 'Can a property finance with a DSCR below 1.00?',
        a:
          'Sometimes. Some lenders go below 1.00 where there are compensating factors — a ' +
          'larger down payment, strong reserves, a borrower with a track record — and ' +
          'price for the risk. It is not the normal case, and the shortfall is still real ' +
          'money out of pocket each month.',
      },
      {
        q: 'Does DSCR replace a credit check?',
        a:
          'It does not replace one, though DSCR lending leans on the property rather than ' +
          'on personal income. Most lenders still look at credit and reserves; what they ' +
          'typically do not ask for is tax returns or proof of employment, which is why ' +
          'the product suits investors whose returns do not show the income a bank wants.',
      },
      {
        q: 'Is a higher DSCR always better?',
        a:
          'Better for approval and pricing, yes. But a very high ratio can also mean you ' +
          'have put in more cash than the deal needed, which drags on the return. The ' +
          'ratio measures safety, not whether the investment is a good one.',
      },
    ],
  },

  /*
   * The honest version of a call to action on a page for a product we do not
   * sell. It does not send a property investor into the business-funding
   * survey: it says what is true, offers a human, and points at what the
   * business actually funds today.
   */
  notYet: {
    heading: 'DSCR Financing Is Coming To Nanotom Capital',
    body:
      'It is not live yet, so there is nothing to apply for here. What we fund today is ' +
      'businesses — $15,000 to $5,000,000, with a decision the same day. If you are ' +
      'weighing a property and want to talk it through, an advisor will take the call.',
    primary: 'Talk To An Advisor',
    secondary: 'See What We Fund Today',
  },
} as const;
