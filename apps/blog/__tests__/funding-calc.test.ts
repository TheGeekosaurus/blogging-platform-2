import { describe, expect, it } from 'vitest';

import {
  FACTOR_RANGE,
  MINIMUMS,
  PRICING,
  PRODUCTS,
  RATE_RANGE,
  calculate,
  clampAmount,
  clampTerm,
  compareAll,
  creditBand,
  impliedApr,
  modelledFactor,
  modelledRate,
  money,
  moneyCompact,
  percent,
  tenure,
  type CalcInput,
} from '../lib/funding-calc';

/**
 * The calculator's arithmetic.
 *
 * Worth testing properly rather than eyeballing on the page: these are money
 * figures a visitor will take to an advisor, and every one of them is wrong in a
 * way nobody notices until someone quotes it back. The published minimums and
 * ranges are asserted too — those are claims the homepage also makes, and this
 * is where the two would drift apart silently.
 */

/** A clean, comfortably-qualifying file. Tests vary one thing off this. */
const BASE: CalcInput = {
  productId: 'term',
  amount: 100_000,
  termMonths: 24,
  fico: 720,
  monthsInBusiness: 60,
  monthlyRevenue: 120_000,
  utilization: 0.6,
  interestOnly: false,
  rateOverride: null,
  factorOverride: null,
};

describe('credit bands', () => {
  it('puts a score below the published minimum outside every band', () => {
    expect(creditBand(MINIMUMS.fico - 1)).toBe('below-minimum');
    expect(creditBand(MINIMUMS.fico)).toBe('challenged');
  });

  it('climbs with the score', () => {
    expect(creditBand(619)).toBe('challenged');
    expect(creditBand(620)).toBe('fair');
    expect(creditBand(680)).toBe('good');
    expect(creditBand(720)).toBe('excellent');
  });
});

describe('eligibility', () => {
  it('prices nothing below the FICO minimum, and says why', () => {
    const result = calculate({ ...BASE, fico: 500 });

    expect(result.eligible).toBe(false);
    expect(result.fit).toBe('ineligible');
    expect(result.payment).toBe(0);
    expect(result.schedule).toEqual([]);
    expect(result.blockers.join(' ')).toContain(String(MINIMUMS.fico));
  });

  it('prices nothing for a business under 30 days old', () => {
    const result = calculate({ ...BASE, monthsInBusiness: 0 });

    expect(result.eligible).toBe(false);
    expect(result.blockers.join(' ')).toContain('30 days');
  });

  /*
   * The homepage promises to look past the credit score. A revenue floor the
   * business has never published would quietly contradict that, so low revenue
   * moves the FIT and never blocks the estimate.
   */
  it('never blocks on revenue alone', () => {
    const result = calculate({ ...BASE, monthlyRevenue: 4_000 });

    expect(result.eligible).toBe(true);
    expect(result.fit).toBe('stretch');
    expect(result.payment).toBeGreaterThan(0);
  });
});

describe('amortizing products', () => {
  const result = calculate(BASE);

  it('repays the principal exactly, and lands the balance on zero', () => {
    const principalRepaid = result.schedule.reduce((total, row) => total + row.principal, 0);

    expect(principalRepaid).toBeCloseTo(result.principal, 6);
    expect(result.schedule.at(-1)!.balance).toBeCloseTo(0, 6);
  });

  it('charges every payment and nothing more', () => {
    const paid = result.schedule.reduce((total, row) => total + row.payment, 0);

    expect(paid).toBeCloseTo(result.totalPayback, 6);
    expect(result.totalPayback - result.principal).toBeCloseTo(result.totalCost, 6);
  });

  it('shifts each payment toward principal as the balance falls', () => {
    const first = result.schedule[0]!;
    const last = result.schedule.at(-1)!;

    expect(first.cost).toBeGreaterThan(last.cost);
    expect(first.principal).toBeLessThan(last.principal);
  });

  it('gives a monthly product one payment per month', () => {
    expect(result.cadence).toBe('monthly');
    expect(result.nPayments).toBe(BASE.termMonths);
  });

  it('costs more over a longer term, and less per payment', () => {
    const longer = calculate({ ...BASE, termMonths: 48 });

    expect(longer.payment).toBeLessThan(result.payment);
    expect(longer.totalCost).toBeGreaterThan(result.totalCost);
  });

  it('prices a weaker credit band higher', () => {
    const weaker = calculate({ ...BASE, fico: 600 });

    expect(weaker.rate!).toBeGreaterThan(result.rate!);
    expect(weaker.payment).toBeGreaterThan(result.payment);
  });

  it('adds a seasoning premium under two years, and drops it after', () => {
    const young = calculate({ ...BASE, monthsInBusiness: 4 });
    const seasoned = calculate({ ...BASE, monthsInBusiness: 60 });

    expect(young.rate!).toBeGreaterThan(seasoned.rate!);
    expect(young.notes.join(' ')).toContain('seasoning premium');
  });

  it('caps the rate however bad the file is', () => {
    const worst = calculate({ ...BASE, fico: MINIMUMS.fico, monthsInBusiness: 1 });

    expect(worst.rate!).toBeLessThanOrEqual(PRICING.maxRate);
  });
});

describe('APR', () => {
  /*
   * The point of computing APR from the cash flows rather than reading the rate
   * off the table: origination comes out of the proceeds, so the borrower is
   * paying interest on money they never received.
   */
  it('exceeds the quoted rate once origination is taken out of the proceeds', () => {
    const result = calculate(BASE);

    expect(result.originationFee).toBeGreaterThan(0);
    expect(result.netFunded).toBeCloseTo(result.principal - result.originationFee, 6);
    expect(result.apr).toBeGreaterThan(result.rate!);
  });

  it('equals the rate when there is no fee', () => {
    // A flat annuity funded in full: the IRR is the nominal rate it was built
    // from, which is the sanity check the solver has to pass.
    const rate = 0.12;
    const periods = 36;
    const principal = 50_000;
    const periodRate = rate / 12;
    const payment =
      (principal * periodRate * (1 + periodRate) ** periods) / ((1 + periodRate) ** periods - 1);

    const solved = impliedApr(principal, Array.from({ length: periods }, () => payment), 12);

    expect(solved).toBeCloseTo(rate, 6);
  });

  it('is zero when the payments never repay the advance', () => {
    expect(impliedApr(100_000, [1_000, 1_000], 12)).toBe(0);
    expect(impliedApr(0, [500], 12)).toBe(0);
  });
});

describe('a rate the visitor sets', () => {
  it('prices at their rate instead of ours, and says whose it is', () => {
    const ours = calculate(BASE);
    const theirs = calculate({ ...BASE, rateOverride: 0.24 });

    expect(ours.pricingIsCustom).toBe(false);
    expect(theirs.pricingIsCustom).toBe(true);
    expect(theirs.rate).toBeCloseTo(0.24, 6);
    expect(theirs.payment).toBeGreaterThan(ours.payment);

    // The copy has to stop calling it an estimate the moment it stops being one.
    expect(ours.narrative).toContain('an estimated');
    expect(theirs.narrative).toContain('you set');
    expect(theirs.narrative).not.toContain('an estimated');
  });

  it('holds their rate steady while the credit profile moves', () => {
    const strong = calculate({ ...BASE, rateOverride: 0.18, fico: 800 });
    const weak = calculate({ ...BASE, rateOverride: 0.18, fico: 560, monthsInBusiness: 2 });

    expect(strong.rate).toBeCloseTo(0.18, 6);
    expect(weak.rate).toBeCloseTo(0.18, 6);
  });

  it('clamps a rate outside the control’s range', () => {
    expect(calculate({ ...BASE, rateOverride: 9 }).rate).toBeCloseTo(RATE_RANGE.max, 6);
    expect(calculate({ ...BASE, rateOverride: -1 }).rate).toBeCloseTo(RATE_RANGE.min, 6);
    expect(
      calculate({ ...BASE, productId: 'wc', factorOverride: 12 }).factorRate,
    ).toBeCloseTo(FACTOR_RANGE.max, 6);
  });

  it('takes a factor on the factor-priced product and a rate on the rest', () => {
    // The two overrides are separate fields, so switching products cannot carry
    // 1.24 across as a 124% interest rate or 0.18 across as a factor.
    const workingCapital = calculate({ ...BASE, productId: 'wc', rateOverride: 0.3 });
    const termLoan = calculate({ ...BASE, factorOverride: 1.4 });

    expect(workingCapital.pricingIsCustom).toBe(false);
    expect(termLoan.pricingIsCustom).toBe(false);
  });

  it('defaults the control to exactly what calculate would price at', () => {
    // The control reads modelledRate/modelledFactor; calculate reads the table.
    // A second copy of that arithmetic in the component is how the rate on the
    // slider and the rate in the schedule drift apart.
    for (const product of PRODUCTS) {
      const result = calculate({ ...BASE, productId: product.id });
      const modelled =
        product.kind === 'factor'
          ? modelledFactor(BASE.fico, BASE.monthsInBusiness)
          : modelledRate(product, BASE.fico, BASE.monthsInBusiness);

      expect(result.rate ?? result.factorRate, product.name).toBeCloseTo(modelled, 6);
    }
  });

  it('is dropped from the comparison, which prices every row from the table', () => {
    const rows = compareAll({ ...BASE, rateOverride: 0.42 });

    expect(rows.every((row) => !row.pricingIsCustom)).toBe(true);
    for (const row of rows) {
      if (row.rate != null) expect(row.rate, row.product.name).toBeLessThan(0.42);
    }
  });
});

describe('the revolving line', () => {
  it('prices the drawn balance, not the limit', () => {
    const half = calculate({ ...BASE, productId: 'loc', amount: 200_000, utilization: 0.5 });

    expect(half.amount).toBe(200_000);
    expect(half.principal).toBe(100_000);
    expect(half.narrative).toContain('50%');
  });

  it('costs more the more of the line is drawn', () => {
    const light = calculate({ ...BASE, productId: 'loc', amount: 200_000, utilization: 0.2 });
    const heavy = calculate({ ...BASE, productId: 'loc', amount: 200_000, utilization: 0.9 });

    expect(heavy.payment).toBeGreaterThan(light.payment);
  });

  /*
   * 52 payments a year, not 48. Treating a month as four weeks loses four
   * payments a year, which understates both the payback and the APR.
   */
  it('bills 52 times a year, not four times a month', () => {
    const result = calculate({ ...BASE, productId: 'loc', termMonths: 24 });

    expect(result.cadence).toBe('weekly');
    expect(result.nPayments).toBe(104);
  });
});

describe('factor-priced working capital', () => {
  const result = calculate({ ...BASE, productId: 'wc', amount: 100_000, termMonths: 12 });

  it('repays exactly the factor multiple', () => {
    expect(result.factorRate).not.toBeNull();
    expect(result.totalPayback).toBeCloseTo(result.amount * result.factorRate!, 6);
  });

  it('takes no origination fee on top of the factor', () => {
    // The factor already contains the whole cost of the money. Charging
    // origination as well would count it twice.
    expect(result.originationFee).toBe(0);
    expect(result.netFunded).toBe(result.principal);
  });

  it('charges the same amount every week', () => {
    const payments = new Set(result.schedule.map((row) => row.payment.toFixed(6)));

    expect(payments.size).toBe(1);
  });

  it('reports an APR far above the factor rate read as a percentage', () => {
    // 1.24 is not "24% APR": the balance is being repaid throughout, so the
    // borrower does not have the full advance for the full term. Anything that
    // shows 24% here is the bug this asserts against.
    expect(result.apr).toBeGreaterThan(result.factorRate! - 1);
  });
});

describe('the interest-only facility', () => {
  const io = calculate({ ...BASE, productId: 'rbf', amount: 200_000, termMonths: 24, interestOnly: true });
  const straight = calculate({
    ...BASE,
    productId: 'rbf',
    amount: 200_000,
    termMonths: 24,
    interestOnly: false,
  });

  it('repays no principal during the interest-only period', () => {
    const firstYear = io.schedule.slice(0, 52);

    expect(firstYear.every((row) => row.principal === 0)).toBe(true);
    expect(firstYear.every((row) => row.balance === io.principal)).toBe(true);
  });

  it('opens lower and steps up when it amortizes', () => {
    expect(io.laterPayment).not.toBeNull();
    expect(io.payment).toBeLessThan(io.laterPayment!);
    expect(io.payment).toBeLessThan(straight.payment);
  });

  it('costs more overall for the same money', () => {
    expect(io.totalCost).toBeGreaterThan(straight.totalCost);
  });

  it('still clears the balance by the last payment', () => {
    expect(io.schedule.at(-1)!.balance).toBeCloseTo(0, 6);
    expect(io.nPayments).toBe(straight.nPayments);
  });

  it('has no second payment when interest-only is off', () => {
    expect(straight.laterPayment).toBeNull();
  });
});

describe('product ranges', () => {
  it('clamps an out-of-range amount and says so', () => {
    const tooBig = calculate({ ...BASE, productId: 'wc', amount: 5_000_000 });

    expect(tooBig.amount).toBe(500_000);
    expect(tooBig.amountAdjusted).toBe(true);
    expect(tooBig.notes.join(' ')).toContain('Working Capital');
  });

  it('clamps the term into each product’s own range', () => {
    const equipment = PRODUCTS.find((product) => product.id === 'equipment')!;
    const workingCapital = PRODUCTS.find((product) => product.id === 'wc')!;

    expect(clampTerm(equipment, 6)).toBe(equipment.minTermMonths);
    expect(clampTerm(workingCapital, 60)).toBe(workingCapital.maxTermMonths);
    expect(clampAmount(workingCapital, 1_000)).toBe(workingCapital.minAmount);
  });

  it('keeps every product inside the $15K-$5M envelope the homepage publishes', () => {
    for (const product of PRODUCTS) {
      expect(product.minAmount, product.name).toBeGreaterThanOrEqual(15_000);
      expect(product.maxAmount, product.name).toBeLessThanOrEqual(5_000_000);
      expect(product.minAmount, product.name).toBeLessThan(product.maxAmount);
      expect(product.minTermMonths, product.name).toBeLessThan(product.maxTermMonths);
    }
  });

  /*
   * These two are stated on the live site, so they are not free to drift: the
   * line of credit's $1.5M ceiling and the interest-only facility's $50K floor
   * and $750K ceiling are in ft/content.ts as marketing claims.
   */
  it('matches the figures the homepage advertises', () => {
    const loc = PRODUCTS.find((product) => product.id === 'loc')!;
    const rbf = PRODUCTS.find((product) => product.id === 'rbf')!;

    expect(loc.maxAmount).toBe(1_500_000);
    expect(rbf.minAmount).toBe(50_000);
    expect(rbf.maxAmount).toBe(750_000);
  });

  it('points every product at a funding-solutions page that exists', async () => {
    const { STUB_PAGES } = await import('../components/marketing/brand');
    const paths = new Set(Object.keys(STUB_PAGES).map((path) => `/${path}`));

    for (const product of PRODUCTS) {
      expect(paths.has(product.href), `${product.name} -> ${product.href}`).toBe(true);
    }
  });
});

describe('the comparison table', () => {
  it('prices every product, each within its own limits', () => {
    const rows = compareAll({ ...BASE, amount: 600_000, termMonths: 36 });

    expect(rows).toHaveLength(PRODUCTS.length);

    for (const row of rows) {
      expect(row.amount, row.product.name).toBeLessThanOrEqual(row.product.maxAmount);
      expect(row.amount, row.product.name).toBeGreaterThanOrEqual(row.product.minAmount);
      expect(row.termMonths, row.product.name).toBeLessThanOrEqual(row.product.maxTermMonths);
      expect(row.payment, row.product.name).toBeGreaterThan(0);
    }
  });

  it('reports every row ineligible when the file is', () => {
    const rows = compareAll({ ...BASE, fico: 500 });

    expect(rows.every((row) => !row.eligible)).toBe(true);
  });
});

describe('fit', () => {
  it('reads a strong file as a strong match', () => {
    expect(calculate(BASE).fit).toBe('strong');
  });

  it('drops to a stretch when the payment eats the revenue', () => {
    const result = calculate({ ...BASE, monthlyRevenue: 15_000 });

    expect(result.fit).toBe('stretch');
    expect(result.notes.join(' ')).toContain('quarter of monthly revenue');
  });

  it('never reads a brand-new business as a strong match', () => {
    const result = calculate({ ...BASE, monthsInBusiness: 2 });

    expect(result.fit).not.toBe('strong');
  });
});

describe('formatting', () => {
  it('writes money the way the rest of the site does', () => {
    expect(money(150_000)).toBe('$150,000');
    expect(money(1234.5, 2)).toBe('$1,234.50');
  });

  it('compacts axis and slider bounds', () => {
    expect(moneyCompact(15_000)).toBe('$15k');
    expect(moneyCompact(1_500_000)).toBe('$1.5M');
    expect(moneyCompact(5_000_000)).toBe('$5M');
  });

  it('writes rates and tenures as people say them', () => {
    expect(percent(0.1523)).toBe('15.2%');
    expect(percent(0.6, 0)).toBe('60%');
    expect(tenure(9)).toBe('9 mo');
    expect(tenure(24)).toBe('2 yr');
    expect(tenure(18)).toBe('1.5 yr');
  });
});
