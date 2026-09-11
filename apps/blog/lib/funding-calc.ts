/**
 * The maths behind /calc — Nanotom Capital's business funding calculator.
 *
 * Deliberately a plain module with no React in it. Everything here is a pure
 * function of its arguments, which is what makes the pricing testable
 * (`__tests__/funding-calc.test.ts`) without rendering anything, and what keeps
 * the client bundle to one component rather than a state library.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * READ THIS BEFORE CHANGING A NUMBER
 *
 * Two kinds of value live in this file and they are not interchangeable:
 *
 *  1. PUBLISHED FACTS — the product ranges and the three minimum requirements.
 *     Every one of these is something the business already states on the live
 *     site (see ft/content.ts): $1,500,000 on the line of credit, $50,000 to
 *     $750,000 on the interest-only facility, 52 weeks interest-only, 30 days in
 *     business, 551 FICO, $15K–$5M overall. Changing one of these means the
 *     calculator and the homepage disagree, so change both.
 *
 *  2. ILLUSTRATIVE PRICING — everything in `PRICING` below. These are plausible
 *     small-business finance rates, NOT Nanotom's rate card, because no rate
 *     card was supplied. They are isolated in one exported constant precisely so
 *     an advisor can hand over the real table and one object gets replaced. The
 *     page says so in as many words, and it must keep saying so for as long as
 *     the numbers here are invented: a lender quoting figures it will not honour
 *     is a compliance problem, not a design detail.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type Cadence = 'weekly' | 'monthly';

/**
 * How a facility is priced and repaid. This drives every branch in `calculate`,
 * so a new product is usually a new row in PRODUCTS rather than new code.
 *
 *  - `amortizing`  fixed instalments against a declining balance
 *  - `revolving`   the same, but only on the share of the line actually drawn
 *  - `factor`      a fixed multiple of the advance, repaid in equal instalments
 *  - `interest-only` interest for a while, then it amortizes
 */
export type ProductKind = 'amortizing' | 'revolving' | 'factor' | 'interest-only';

export type CreditBand = 'excellent' | 'good' | 'fair' | 'challenged' | 'below-minimum';

/** How comfortably the scenario sits inside guidelines. Not an approval. */
export type Fit = 'strong' | 'workable' | 'stretch' | 'ineligible';

export type Product = {
  id: string;
  /** Matches the nav label, so the two never describe the same thing differently. */
  name: string;
  /** Two or three words on the tile, above the name. */
  kicker: string;
  blurb: string;
  kind: ProductKind;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  defaultTermMonths: number;
  cadence: Cadence;
  /** The funding-solutions page for this product. Every one of these resolves. */
  href: string;
};

/**
 * The five facilities in the site's own navigation, in the order the nav lists
 * them, with the line of credit first because it is the product the homepage
 * leads with.
 *
 * The prototype this was built from also had an invoice-financing product. It is
 * NOT here: nothing on the live site offers invoice financing, and a calculator
 * is the wrong place to announce a product line. The homepage's "6 funding
 * types" is the only thing that now over-counts what this page can price; five
 * real products beat six where one is invented. Add it here — with a
 * /funding-solutions page to link to — if the business does offer it.
 *
 * Amount and term ranges: the line of credit's ceiling and the interest-only
 * facility's floor, ceiling and 52-week interest-only period are the site's
 * published figures. The rest sit inside the site's published $15K–$5M envelope
 * and are conventional for each product type; they are the ones to check against
 * a real credit box first.
 */
/*
 * Typed as a non-empty tuple, not `readonly Product[]`, so `PRODUCTS[0]` is a
 * Product rather than `Product | undefined` under `noUncheckedIndexedAccess`.
 * It is the fallback for an unrecognised product id in half a dozen places, and
 * the alternative is a non-null assertion at every one of them.
 */
export const PRODUCTS: readonly [Product, ...Product[]] = [
  {
    id: 'loc',
    name: 'Line of Credit',
    kicker: 'Revolving',
    blurb:
      'Draw what you need, when you need it, and pay interest only on the balance in use.',
    kind: 'revolving',
    minAmount: 25_000,
    maxAmount: 1_500_000,
    minTermMonths: 12,
    maxTermMonths: 36,
    defaultTermMonths: 24,
    cadence: 'weekly',
    href: '/funding-solutions/line-of-credit',
  },
  {
    id: 'term',
    name: 'Business Loans',
    kicker: 'Lump sum',
    blurb: 'A fixed amount funded once and repaid on a predictable monthly schedule.',
    kind: 'amortizing',
    minAmount: 15_000,
    maxAmount: 2_000_000,
    minTermMonths: 6,
    maxTermMonths: 60,
    defaultTermMonths: 24,
    cadence: 'monthly',
    href: '/funding-solutions/business-loans',
  },
  {
    id: 'rbf',
    name: 'Revenue-Based Financing',
    kicker: 'Interest-only option',
    blurb:
      'Pay only interest for up to 52 weeks, then amortize the balance over up to two years.',
    kind: 'interest-only',
    minAmount: 50_000,
    maxAmount: 750_000,
    minTermMonths: 12,
    maxTermMonths: 36,
    defaultTermMonths: 24,
    cadence: 'weekly',
    href: '/funding-solutions/revenue-based-financing',
  },
  {
    id: 'wc',
    name: 'Working Capital',
    kicker: 'Fast cash',
    blurb: 'Short-term capital for inventory, payroll and the gaps in between.',
    kind: 'factor',
    minAmount: 15_000,
    maxAmount: 500_000,
    minTermMonths: 3,
    maxTermMonths: 18,
    defaultTermMonths: 9,
    cadence: 'weekly',
    href: '/funding-solutions/working-capital',
  },
  {
    id: 'equipment',
    name: 'Equipment Financing',
    kicker: 'Asset-backed',
    blurb: 'Finance machinery, vehicles and technology against the equipment itself.',
    kind: 'amortizing',
    minAmount: 25_000,
    maxAmount: 5_000_000,
    minTermMonths: 24,
    maxTermMonths: 84,
    defaultTermMonths: 48,
    cadence: 'monthly',
    href: '/funding-solutions/equipment-financing',
  },
];

export const PRODUCT_BY_ID: Readonly<Record<string, Product>> = Object.fromEntries(
  PRODUCTS.map((product) => [product.id, product]),
);

/** The three minimums the homepage publishes, in one place. */
export const MINIMUMS = {
  fico: 551,
  monthsInBusiness: 1,
} as const;

/**
 * ILLUSTRATIVE PRICING — see the header. Replace wholesale with the real card.
 *
 * `rate` is the nominal annual interest rate used to size instalments. It is NOT
 * the APR the page shows: that is computed from the actual cash flows, net of
 * origination, so it always comes out at or above the rate here. Quoting the
 * rate and calling it the APR is the usual way a calculator understates cost by
 * two or three points.
 *
 * `factor` is a multiple of the advance, the way short-term working capital is
 * actually sold — $100,000 at 1.24 is $124,000 back, known on day one.
 */
export const PRICING = {
  /** Nominal annual rate by product and credit band. */
  rate: {
    loc: { excellent: 0.108, good: 0.152, fair: 0.214, challenged: 0.298 },
    term: { excellent: 0.092, good: 0.135, fair: 0.198, challenged: 0.286 },
    rbf: { excellent: 0.118, good: 0.164, fair: 0.228, challenged: 0.312 },
    equipment: { excellent: 0.074, good: 0.102, fair: 0.148, challenged: 0.196 },
  },
  /** Working capital's cost multiple by credit band. */
  factor: { excellent: 1.16, good: 1.24, fair: 1.34, challenged: 1.45 },
  /** Origination, deducted from proceeds. Equipment is cheaper: it is secured. */
  origination: {
    default: { excellent: 0.015, good: 0.02, fair: 0.03, challenged: 0.04 },
    equipment: { excellent: 0.01, good: 0.015, fair: 0.02, challenged: 0.025 },
  },
  /**
   * Added to the rate for a young business, and to the factor separately —
   * a factor is a multiple, so a percentage-point bump would mean something
   * different there.
   */
  seasoning: [
    { underMonths: 3, rate: 0.08, factor: 0.08 },
    { underMonths: 6, rate: 0.045, factor: 0.05 },
    { underMonths: 12, rate: 0.02, factor: 0.025 },
    { underMonths: 24, rate: 0.008, factor: 0 },
  ],
  /** Rates are capped so an extreme profile cannot produce an absurd quote. */
  maxRate: 0.45,
} as const;

export type PricedBand = Exclude<CreditBand, 'below-minimum'>;

/**
 * The bounds the rate control can be dragged between.
 *
 * Wider than anything the pricing table produces on purpose: the control exists
 * so a visitor can put in a number an advisor quoted them, or one a competitor
 * did, and a range that only spans our own table cannot hold either.
 */
export const RATE_RANGE = { min: 0.04, max: PRICING.maxRate, step: 0.001 } as const;
export const FACTOR_RANGE = { min: 1.05, max: 1.6, step: 0.01 } as const;

export type CalcInput = {
  productId: string;
  amount: number;
  termMonths: number;
  fico: number;
  monthsInBusiness: number;
  monthlyRevenue: number;
  /** Share of a revolving line assumed drawn. 0–1. Ignored by other products. */
  utilization: number;
  /** Interest-only opening period on revenue-based financing. */
  interestOnly: boolean;
  /**
   * An annual interest rate the visitor set for themselves, overriding the one
   * the pricing table models. Null means "use ours".
   *
   * Separate from `factorOverride` rather than one field read differently per
   * product, because the two are not the same kind of number: 1.24 is a
   * perfectly ordinary factor and a nonsensical interest rate, and switching
   * products would carry one across as the other.
   */
  rateOverride: number | null;
  /** The same, for the factor-priced product, where a rate means nothing. */
  factorOverride: number | null;
};

export type ScheduleRow = {
  period: number;
  payment: number;
  principal: number;
  /** Interest, or the factor fee spread evenly. "Cost" in the UI, for that reason. */
  cost: number;
  balance: number;
};

export type CalcResult = {
  product: Product;
  /** The amount after clamping into the product's range. */
  amount: number;
  amountAdjusted: boolean;
  termMonths: number;
  band: CreditBand;
  eligible: boolean;
  /** Why not, when `eligible` is false. Empty otherwise. */
  blockers: string[];
  /** Things worth saying that do not stop an application. */
  notes: string[];
  fit: Fit;

  /** Capital actually in use — the drawn share of a line, or the full amount. */
  principal: number;
  originationFee: number;
  netFunded: number;

  /** The first (and usually only) instalment. */
  payment: number;
  /** What the instalment becomes after an interest-only period, if there is one. */
  laterPayment: number | null;
  cadence: Cadence;
  nPayments: number;

  totalPayback: number;
  totalCost: number;
  /** Nominal annual rate used to size instalments. Null for factor pricing. */
  rate: number | null;
  /** Whether the rate or factor above is the visitor's, rather than modelled. */
  pricingIsCustom: boolean;
  /** Computed from the cash flows, net of origination. Always shown. */
  apr: number;
  /** Cost multiple, for factor-priced products. Null otherwise. */
  factorRate: number | null;

  schedule: ScheduleRow[];
  weeklyEquivalent: number;
  monthlyEquivalent: number;
  /** Instalment as a share of monthly revenue. 0 when revenue is unknown. */
  paymentToRevenue: number;
  narrative: string;
};

export function creditBand(fico: number): CreditBand {
  if (fico >= 720) return 'excellent';
  if (fico >= 680) return 'good';
  if (fico >= 620) return 'fair';
  if (fico >= MINIMUMS.fico) return 'challenged';
  return 'below-minimum';
}

export function clampAmount(product: Product, amount: number): number {
  return Math.min(product.maxAmount, Math.max(product.minAmount, Math.round(amount)));
}

export function clampTerm(product: Product, months: number): number {
  return Math.min(product.maxTermMonths, Math.max(product.minTermMonths, Math.round(months)));
}

function periodsPerYear(cadence: Cadence): number {
  return cadence === 'weekly' ? 52 : 12;
}

/**
 * A term in months as a whole number of payment periods.
 *
 * Weekly terms are 52 periods a year rather than 4 a month: four weeks is 28
 * days, so "4 payments a month" quietly loses four weekly payments a year and
 * understates both the payback and the APR.
 */
function termToPeriods(months: number, cadence: Cadence): number {
  return cadence === 'weekly' ? Math.max(1, Math.round((months / 12) * 52)) : Math.max(1, months);
}

function seasoningBump(monthsInBusiness: number, key: 'rate' | 'factor'): number {
  for (const step of PRICING.seasoning) {
    if (monthsInBusiness < step.underMonths) return step[key];
  }
  return 0;
}

/**
 * Origination as a share of the capital in use.
 *
 * Zero on factor-priced products, and that is not an oversight: a factor rate
 * already contains the whole cost of the money — 1.24 means $124,000 back on
 * $100,000, fee included. Charging origination on top of it would count the same
 * cost twice and overstate both the payback and the APR.
 */
function originationRate(product: Product, band: PricedBand): number {
  if (product.kind === 'factor') return 0;
  const table =
    product.id === 'equipment' ? PRICING.origination.equipment : PRICING.origination.default;
  return table[band];
}

function annualRate(product: Product, band: PricedBand, monthsInBusiness: number): number {
  const table =
    PRICING.rate[product.id as keyof typeof PRICING.rate] ?? PRICING.rate.term;
  return Math.min(PRICING.maxRate, table[band] + seasoningBump(monthsInBusiness, 'rate'));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * The band to price at, for a file that has not been checked for eligibility.
 *
 * The rate control has to show a number even while the FICO slider is below the
 * minimum — it is a control on the same panel, and blanking it as the visitor
 * drags past 551 reads as a bug. The weakest priced column is the honest thing
 * to show there, and `calculate` still refuses to price the scenario.
 */
function pricedBand(fico: number): PricedBand {
  const band = creditBand(fico);
  return band === 'below-minimum' ? 'challenged' : band;
}

/**
 * The rate the pricing table models for a file — what the rate control shows
 * until the visitor moves it, and what "reset to our estimate" goes back to.
 *
 * Exported because the control needs the same number `calculate` would use, and
 * a second copy of `table[band] + seasoning` in the component is exactly how the
 * displayed rate and the priced rate drift apart.
 */
export function modelledRate(product: Product, fico: number, monthsInBusiness: number): number {
  return annualRate(product, pricedBand(fico), monthsInBusiness);
}

/** The same, for the factor-priced product. */
export function modelledFactor(fico: number, monthsInBusiness: number): number {
  return PRICING.factor[pricedBand(fico)] + seasoningBump(monthsInBusiness, 'factor');
}

/** The rate to price at: the visitor's if they set one, otherwise the table's. */
function resolvedRate(product: Product, band: PricedBand, input: CalcInput): number {
  if (input.rateOverride == null) return annualRate(product, band, input.monthsInBusiness);
  return clamp(input.rateOverride, RATE_RANGE.min, RATE_RANGE.max);
}

/** The standard annuity instalment. Falls back to straight-line at a zero rate. */
function instalment(principal: number, rate: number, periods: number, ppy: number): number {
  if (periods <= 0) return principal;
  const periodRate = rate / ppy;
  if (Math.abs(periodRate) < 1e-12) return principal / periods;
  const growth = (1 + periodRate) ** periods;
  return (principal * periodRate * growth) / (growth - 1);
}

function amortize(
  principal: number,
  payment: number,
  rate: number,
  periods: number,
  ppy: number,
  offset = 0,
): ScheduleRow[] {
  const periodRate = rate / ppy;
  const rows: ScheduleRow[] = [];
  let balance = principal;

  for (let i = 1; i <= periods; i++) {
    const cost = balance * periodRate;
    // The final instalment clears whatever rounding has left behind, so the
    // balance lands on exactly zero rather than a few cents either side.
    const principalPaid = i === periods ? balance : Math.min(balance, payment - cost);
    balance = Math.max(0, balance - principalPaid);
    rows.push({ period: i + offset, payment: principalPaid + cost, principal: principalPaid, cost, balance });
  }

  return rows;
}

/**
 * The internal rate of return on the borrower's actual cash flows, annualised —
 * money in on day one, instalments out — which is what an APR is.
 *
 * Bisection rather than Newton's method: it cannot diverge, cannot need a
 * derivative that is wrong in a way nobody notices, and 100 iterations of a
 * halving interval is exact to well past the precision anyone displays. Speed is
 * irrelevant — this runs a handful of times per keystroke on a page with no
 * other work to do.
 */
export function impliedApr(netFunded: number, payments: readonly number[], ppy: number): number {
  if (netFunded <= 0 || payments.length === 0) return 0;

  const npv = (periodRate: number) =>
    payments.reduce((total, payment, i) => total + payment / (1 + periodRate) ** (i + 1), 0) -
    netFunded;

  // Nothing to solve for when the payments never repay the advance.
  if (npv(0) <= 0) return 0;

  let low = 0;
  let high = 1;
  while (npv(high) > 0 && high < 1e6) high *= 2;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    if (npv(mid) > 0) low = mid;
    else high = mid;
  }

  return ((low + high) / 2) * ppy;
}

/**
 * How comfortably a scenario sits, given everything else checks out.
 *
 * Affordability is the dominant term — an instalment the business cannot cover
 * out of revenue is the thing that sinks a file that looks fine on paper. The
 * second term is the size of the ask against a year of revenue, which is what
 * stops a 30-day-old business asking for a million dollars from reading as a
 * "strong" match on the strength of a good FICO alone.
 */
function fitFor(params: {
  paymentToRevenue: number;
  band: CreditBand;
  monthsInBusiness: number;
  amount: number;
  monthlyRevenue: number;
}): Fit {
  if (params.band === 'below-minimum') return 'ineligible';

  const annualRevenue = params.monthlyRevenue * 12;
  const askRatio = annualRevenue > 0 ? params.amount / annualRevenue : Number.POSITIVE_INFINITY;
  const strongBand = params.band === 'excellent' || params.band === 'good';

  if (
    params.paymentToRevenue <= 0.12 &&
    strongBand &&
    params.monthsInBusiness >= 12 &&
    askRatio <= 0.35
  ) {
    return 'strong';
  }

  if (params.paymentToRevenue <= 0.22 && params.monthsInBusiness >= 3 && askRatio <= 0.6) {
    return 'workable';
  }

  return 'stretch';
}

/** The scenario when the file cannot be priced at all. */
function ineligible(
  product: Product,
  amount: number,
  termMonths: number,
  band: CreditBand,
  blockers: string[],
  notes: string[],
  amountAdjusted: boolean,
): CalcResult {
  return {
    product,
    amount,
    amountAdjusted,
    termMonths,
    band,
    eligible: false,
    blockers,
    notes,
    fit: 'ineligible',
    principal: amount,
    originationFee: 0,
    netFunded: amount,
    payment: 0,
    laterPayment: null,
    cadence: product.cadence,
    nPayments: 0,
    totalPayback: 0,
    totalCost: 0,
    rate: null,
    pricingIsCustom: false,
    apr: 0,
    factorRate: null,
    schedule: [],
    weeklyEquivalent: 0,
    monthlyEquivalent: 0,
    paymentToRevenue: 0,
    narrative:
      'This scenario sits outside the published minimums, so there is nothing to price yet. ' +
      'The DIY programs cover credit repair and business credit — most people come back ' +
      'inside guidelines.',
  };
}

export function calculate(input: CalcInput): CalcResult {
  const product = PRODUCT_BY_ID[input.productId] ?? PRODUCTS[0];
  const amount = clampAmount(product, input.amount);
  const termMonths = clampTerm(product, input.termMonths);
  const band = creditBand(input.fico);
  const amountAdjusted = amount !== Math.round(input.amount);

  const notes: string[] = [];
  if (amountAdjusted) {
    notes.push(
      `${product.name} runs from ${money(product.minAmount)} to ${money(product.maxAmount)}, ` +
        `so the amount is shown at ${money(amount)}.`,
    );
  }

  const blockers: string[] = [];
  if (input.fico < MINIMUMS.fico) {
    blockers.push(`Personal FICO® is below the ${MINIMUMS.fico} minimum.`);
  }
  if (input.monthsInBusiness < MINIMUMS.monthsInBusiness) {
    blockers.push('A business needs at least 30 days of trading history.');
  }

  if (blockers.length > 0) {
    return ineligible(product, amount, termMonths, band, blockers, notes, amountAdjusted);
  }

  // Past the gate, so the band is one the pricing table has a column for.
  const priced = band as PricedBand;
  const cadence = product.cadence;
  const ppy = periodsPerYear(cadence);

  /*
   * Custom pricing, when the visitor has moved the rate control. Clamped to the
   * control's own range so a hand-edited URL or a stale value cannot produce a
   * 900% quote, and tracked separately so the copy can say whose number it is —
   * "the 12% rate you set" and "an estimated 12% rate" are different claims, and
   * only one of them is ours to make.
   */
  const pricingIsCustom =
    product.kind === 'factor' ? input.factorOverride != null : input.rateOverride != null;

  /** How the copy names the rate — ours is an estimate, theirs is not. */
  const ratePhrase = (value: number) =>
    pricingIsCustom ? `the ${percent(value)} rate you set` : `an estimated ${percent(value)} rate`;

  let principal = amount;
  let rate: number | null = null;
  let factorRate: number | null = null;
  let payment = 0;
  let laterPayment: number | null = null;
  let schedule: ScheduleRow[] = [];
  let narrative = '';

  if (product.kind === 'factor') {
    // Priced as a multiple, not a rate: total cost is fixed on day one and the
    // instalment is simply the payback split evenly across the term.
    factorRate =
      input.factorOverride == null
        ? PRICING.factor[priced] + seasoningBump(input.monthsInBusiness, 'factor')
        : clamp(input.factorOverride, FACTOR_RANGE.min, FACTOR_RANGE.max);
    const periods = termToPeriods(termMonths, cadence);
    const payback = amount * factorRate;
    payment = payback / periods;

    const costEach = (payback - amount) / periods;
    const principalEach = amount / periods;
    let balance = amount;
    schedule = Array.from({ length: periods }, (_, i) => {
      const principalPaid = i === periods - 1 ? balance : principalEach;
      balance = Math.max(0, balance - principalPaid);
      return { period: i + 1, payment, principal: principalPaid, cost: costEach, balance };
    });

    narrative =
      `Working capital is sold as a factor rate, not an interest rate: ` +
      `${pricingIsCustom ? 'the ' : ''}${factorRate.toFixed(2)}${pricingIsCustom ? ' you set' : ''} × ` +
      `${money(amount)} means ${money(payback)} back in total, fixed on the day you fund. ` +
      'The APR beside it is what that works out to once the payments are spread across the term.';
  } else if (product.kind === 'interest-only') {
    rate = resolvedRate(product, priced, input);
    const periodRate = rate / ppy;

    // The published shape: interest-only for up to 52 weeks, then the balance
    // amortizes over what is left of the term (the site's "rollover
    // amortization option up to 2 years").
    const ioMonths = input.interestOnly ? Math.min(12, termMonths - 1) : 0;
    const ioPeriods = ioMonths > 0 ? termToPeriods(ioMonths, cadence) : 0;
    const amortPeriods = Math.max(1, termToPeriods(termMonths, cadence) - ioPeriods);

    const ioPayment = amount * periodRate;
    const amortPayment = instalment(amount, rate, amortPeriods, ppy);

    const ioRows: ScheduleRow[] = Array.from({ length: ioPeriods }, (_, i) => ({
      period: i + 1,
      payment: ioPayment,
      principal: 0,
      cost: ioPayment,
      balance: amount,
    }));

    schedule = [...ioRows, ...amortize(amount, amortPayment, rate, amortPeriods, ppy, ioPeriods)];
    payment = ioPeriods > 0 ? ioPayment : amortPayment;
    laterPayment = ioPeriods > 0 ? amortPayment : null;

    narrative =
      ioPeriods > 0
        ? `Interest only for ${ioMonths} months — ${money(ioPayment)} a ${cadenceUnit(cadence)} on ` +
          `${money(amount)} — then ${money(amortPayment)} as the balance amortizes over the remaining ` +
          `${termMonths - ioMonths} months. Nothing is repaid against the principal until the ` +
          'amortization period starts.'
        : `Modelled as a fully amortizing facility at ${ratePhrase(rate)}, collected weekly. ` +
          'Turn on interest-only above to see the cash-flow shape the product is known for.';
  } else {
    // Amortizing, and revolving — which is the same instalment maths applied to
    // the drawn share of the line rather than to the whole limit.
    const drawn =
      product.kind === 'revolving'
        ? amount * Math.min(1, Math.max(0.05, input.utilization))
        : amount;
    principal = drawn;
    rate = resolvedRate(product, priced, input);
    const periods = termToPeriods(termMonths, cadence);
    payment = instalment(drawn, rate, periods, ppy);
    schedule = amortize(drawn, payment, rate, periods, ppy);

    narrative =
      product.kind === 'revolving'
        ? `Assumes ${percent(input.utilization, 0)} of a ${money(amount)} line is drawn — ` +
          `${money(drawn)} in use. Undrawn credit costs nothing, and paying the balance down ` +
          'frees it to draw again.'
        : /*
           * Not `product.name` here: the names are plural to match the nav
           * ("Business Loans"), which reads as "a fully amortizing business
           * loans" in a sentence. The panel's heading names the product
           * directly above this line anyway.
           */
          `A fully amortizing loan at ${ratePhrase(rate)} over ${termMonths} months. Every ` +
          'instalment is the same; the split between principal and interest moves toward ' +
          'principal as the balance falls.';
  }

  const originationFee = principal * originationRate(product, priced);
  const netFunded = Math.max(0, principal - originationFee);
  const totalPayback = schedule.reduce((total, row) => total + row.payment, 0);
  const totalCost = Math.max(0, totalPayback - principal);
  const apr = impliedApr(
    netFunded,
    schedule.map((row) => row.payment),
    ppy,
  );

  // The instalment converted to the other cadence, so a weekly product and a
  // monthly one can be compared without the reader doing arithmetic. 52/12 —
  // never 4 — for the reason termToPeriods gives.
  const weeklyEquivalent = cadence === 'weekly' ? payment : (payment * 12) / 52;
  const monthlyEquivalent = cadence === 'monthly' ? payment : (payment * 52) / 12;
  const paymentToRevenue =
    input.monthlyRevenue > 0 ? monthlyEquivalent / input.monthlyRevenue : 0;

  if (paymentToRevenue > 0.25) {
    notes.push(
      'The instalment is more than a quarter of monthly revenue. A smaller amount or a longer ' +
        'term usually underwrites more easily.',
    );
  }
  if (input.monthsInBusiness < 12) {
    notes.push(
      'Under a year of trading history, so pricing carries a seasoning premium. It comes off as ' +
        'the business ages.',
    );
  }

  return {
    product,
    amount,
    amountAdjusted,
    termMonths,
    band,
    eligible: true,
    blockers,
    notes,
    fit: fitFor({
      paymentToRevenue,
      band,
      monthsInBusiness: input.monthsInBusiness,
      amount,
      monthlyRevenue: input.monthlyRevenue,
    }),
    principal,
    originationFee,
    netFunded,
    payment,
    laterPayment,
    cadence,
    nPayments: schedule.length,
    totalPayback,
    totalCost,
    rate,
    pricingIsCustom,
    apr,
    factorRate,
    schedule,
    weeklyEquivalent,
    monthlyEquivalent,
    paymentToRevenue,
    narrative,
  };
}

/* ---------------------------------------------------------------------------
 * The plain loan — what the calculator's simple mode prices
 * ------------------------------------------------------------------------- */

/** What a plain loan can be sized at. Inside the site's published envelope. */
export const PLAIN_RANGE = {
  amount: { min: 15_000, max: 5_000_000, step: 5_000 },
  termMonths: { min: 3, max: 84 },
} as const;

/**
 * The rate the simple view opens on.
 *
 * Derived from the pricing table's own mid column rather than being a second
 * invented number — but note what it is NOT: it is a starting position for a
 * slider, not a rate anyone has been offered. With no credit profile and no
 * product chosen there is nothing to price a rate FROM, so the simple view
 * never calls this an estimate for the visitor; it is a number to drag.
 */
export const PLAIN_DEFAULT_RATE = PRICING.rate.term.good;

/**
 * The fields a priced facility and a plain loan have in common.
 *
 * Exists so the cost meter, the chart and the schedule table are written once
 * and rendered by both views. `CalcResult` satisfies it structurally, so there
 * is nothing to convert at the call site.
 */
export type LoanShape = {
  principal: number;
  totalPayback: number;
  totalCost: number;
  cadence: Cadence;
  schedule: ScheduleRow[];
};

export type PlainInput = {
  amount: number;
  termMonths: number;
  /** Always the visitor's own — see PLAIN_DEFAULT_RATE. */
  rate: number;
};

export type PlainLoan = {
  principal: number;
  rate: number;
  termMonths: number;
  cadence: Cadence;
  payment: number;
  nPayments: number;
  totalPayback: number;
  totalCost: number;
  schedule: ScheduleRow[];
};

/**
 * A plain amortizing loan: this much, over this long, at this rate.
 *
 * Deliberately a SEPARATE function from `calculate` rather than the same one
 * with the profile fields hidden. The simple view is not the underwriting model
 * with its questions collapsed — it is the arithmetic every loan calculator on
 * the internet does, and the difference is the honest part:
 *
 *   - No origination, so no gap between the loan and what lands in the account.
 *     A fee is a function of the credit band, and there is no band here.
 *   - No credit band, no seasoning, no eligibility gate. Nothing was asked, so
 *     nothing is judged, and no scenario is refused.
 *   - Monthly, because a term in months and a payment in weeks is exactly the
 *     kind of detail the simple view exists to keep out of the way.
 *
 * Which means its APR equals its rate, so the simple view shows one number
 * instead of two. Everything the advanced view adds — the fee, the band, the
 * weekly cadence, the products that are not amortizing loans at all — is what
 * makes those two numbers differ there.
 */
export function plainLoan(input: PlainInput): PlainLoan {
  const principal = clamp(
    Math.round(input.amount),
    PLAIN_RANGE.amount.min,
    PLAIN_RANGE.amount.max,
  );
  const termMonths = clamp(
    Math.round(input.termMonths),
    PLAIN_RANGE.termMonths.min,
    PLAIN_RANGE.termMonths.max,
  );
  const rate = clamp(input.rate, RATE_RANGE.min, RATE_RANGE.max);

  const payment = instalment(principal, rate, termMonths, 12);
  const schedule = amortize(principal, payment, rate, termMonths, 12);
  const totalPayback = schedule.reduce((total, row) => total + row.payment, 0);

  return {
    principal,
    rate,
    termMonths,
    cadence: 'monthly',
    payment,
    nPayments: schedule.length,
    totalPayback,
    totalCost: Math.max(0, totalPayback - principal),
    schedule,
  };
}

/**
 * The same scenario priced across every product, for the comparison table.
 *
 * The term is re-clamped per product rather than carried across: 48 months is a
 * normal equipment term and impossible on working capital, so a shared term
 * would silently price several rows at their ceiling and make the comparison
 * meaningless.
 *
 * A rate the visitor set is dropped here for the same reason, and it is the
 * subtler one: a rate belongs to a product. Applying 12% to all five would make
 * every row a function of term alone and quietly turn the one screen that says
 * "these products cost different amounts" into one that says they do not. Each
 * row is priced from the table; the panel says so when an override is on.
 */
export function compareAll(input: CalcInput): CalcResult[] {
  return PRODUCTS.map((product) =>
    calculate({
      ...input,
      productId: product.id,
      termMonths: clampTerm(product, input.termMonths),
      rateOverride: null,
      factorOverride: null,
    }),
  );
}

/* ---------------------------------------------------------------------------
 * Formatting
 *
 * Here rather than in the component because the narratives above are built from
 * the same helpers, and a page that says "$150,000" in one sentence and
 * "$150000" in the next looks broken.
 * ------------------------------------------------------------------------- */

export function money(value: number, digits = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
}

/** Money at cents, for schedule rows where the pennies are the point. */
export function moneyExact(value: number): string {
  return money(value, 2);
}

/** A short form for axis ticks and slider bounds: $15k, $1.5M. */
export function moneyCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    const millions = value / 1_000_000;
    return `$${millions.toFixed(millions % 1 === 0 ? 0 : 1)}M`;
  }
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${Math.round(value)}`;
}

export function percent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function cadenceAdverb(cadence: Cadence): string {
  return cadence === 'weekly' ? 'weekly' : 'monthly';
}

export function cadenceUnit(cadence: Cadence): string {
  return cadence === 'weekly' ? 'week' : 'month';
}

/** Months as the phrase people use: "8 months", "3 years", "4.5 years". */
export function tenure(months: number): string {
  if (months < 12) return `${months} mo`;
  const years = months / 12;
  return `${years.toFixed(months % 12 === 0 ? 0 : 1)} yr`;
}
