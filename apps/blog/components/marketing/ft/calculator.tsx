'use client';

import Link from 'next/link';
import { useId, useMemo, useRef, useState } from 'react';

import { CONTACT, CTA_HREF } from '../brand';
import { ArrowUpRightIcon } from './icons';
import { PaymentChart } from './payment-chart';
import {
  MINIMUMS,
  PRODUCTS,
  PRODUCT_BY_ID,
  cadenceAdverb,
  cadenceUnit,
  calculate,
  clampAmount,
  clampTerm,
  compareAll,
  money,
  moneyCompact,
  moneyExact,
  percent,
  tenure,
  type CalcInput,
  type CalcResult,
  type Fit,
  type Product,
} from '@/lib/funding-calc';

/*
 * The calculator itself — the only client component on /calc.
 *
 * ONE client boundary, holding all of the state. The alternative shape (a store,
 * or a component per control) was what the prototype did and it buys nothing
 * here: every input feeds one pure `calculate` call, there is no state anywhere
 * else on the page, and nothing outside this subtree needs to read it. So the
 * page stays a server component that renders its copy statically and hands the
 * interactive panel to the client.
 *
 * Nothing is submitted, stored or sent anywhere. That is a promise the page
 * makes in as many words ("no credit pull, no email, nothing saved"), so it is
 * worth saying here too: if this ever grows a fetch, that copy has to change.
 */

/**
 * The opening scenario — a real-looking file rather than zeroes.
 *
 * An empty calculator asks the visitor to do work before it shows them
 * anything; a populated one shows the shape of an answer immediately and
 * invites them to correct it. The values are a mid-market file: good credit,
 * three years trading, and a line of credit, which is the product the homepage
 * leads with.
 */
const DEFAULTS: CalcInput = {
  productId: 'loc',
  amount: 150_000,
  termMonths: 24,
  fico: 680,
  monthsInBusiness: 36,
  monthlyRevenue: 80_000,
  utilization: 0.6,
  interestOnly: true,
};

type TabId = 'breakdown' | 'schedule' | 'compare' | 'fit';

const TABS: readonly { id: TabId; label: string }[] = [
  { id: 'breakdown', label: 'Breakdown' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'compare', label: 'Compare' },
  { id: 'fit', label: 'Do I qualify?' },
];

const FIT_LABEL: Record<Fit, { label: string; className: string }> = {
  strong: {
    label: 'Strong match',
    className: 'border-[var(--ft-accent)]/40 bg-[var(--ft-accent)]/10 text-[var(--ft-accent)]',
  },
  workable: {
    label: 'Workable',
    className: 'border-[var(--ft-line)] bg-[var(--ft-card-raised)] text-[var(--ft-ink)]',
  },
  stretch: {
    label: 'A stretch',
    className: 'border-[var(--ft-line)] bg-[var(--ft-card-raised)] text-[var(--ft-muted)]',
  },
  ineligible: {
    label: 'Outside guidelines',
    className: 'border-[var(--ft-line)] bg-[var(--ft-card-raised)] text-[var(--ft-muted)]',
  },
};

export function Calculator() {
  const [input, setInput] = useState<CalcInput>(DEFAULTS);
  const [tab, setTab] = useState<TabId>('breakdown');

  const product = PRODUCT_BY_ID[input.productId] ?? PRODUCTS[0];
  const result = useMemo(() => calculate(input), [input]);
  const comparison = useMemo(() => compareAll(input), [input]);

  function set<K extends keyof CalcInput>(key: K, value: CalcInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  /*
   * Switching product re-clamps the amount and term into the new product's
   * range. Without this, moving from equipment financing (48 months, up to $5M)
   * to working capital (18 months, up to $500K) would leave the sliders showing
   * values the product cannot do — `calculate` clamps them anyway, so the
   * controls and the answer would disagree on screen.
   */
  function selectProduct(next: Product) {
    setInput((current) => ({
      ...current,
      productId: next.id,
      amount: clampAmount(next, current.amount),
      termMonths: clampTerm(next, current.termMonths),
    }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start">
      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="min-w-0 rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-card)] p-5 sm:p-7">
        <StepLabel step={1}>Choose a facility</StepLabel>

        <div
          role="radiogroup"
          aria-label="Funding product"
          className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
          {PRODUCTS.map((option) => {
            const selected = option.id === product.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => selectProduct(option)}
                className={`min-w-0 rounded-xl border px-3 py-3 text-left transition-colors ${
                  selected
                    ? 'border-[var(--ft-accent)] bg-[var(--ft-accent)]/10'
                    : 'border-[var(--ft-line)] bg-[var(--ft-card-raised)] hover:border-[var(--ft-accent)]/40'
                }`}
              >
                <span className="block text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-[var(--ft-accent)]">
                  {option.kicker}
                </span>
                <span className="mt-1 block text-sm font-medium leading-snug text-[var(--ft-ink)]">
                  {option.name}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[var(--ft-muted)]">
          {product.blurb}{' '}
          <Link
            href={product.href}
            className="text-[var(--ft-accent)] underline decoration-[var(--ft-accent)]/40 underline-offset-4 hover:decoration-[var(--ft-accent)]"
          >
            More about {product.name.toLowerCase()}
          </Link>
        </p>

        <div className="my-7 h-px bg-[var(--ft-line)]" />

        <StepLabel step={2}>Size the facility</StepLabel>

        <div className="mt-5 space-y-6">
          <Slider
            label={product.kind === 'revolving' ? 'Credit limit' : 'Amount'}
            value={input.amount}
            display={money(input.amount)}
            min={product.minAmount}
            max={product.maxAmount}
            step={product.minAmount >= 50_000 ? 5_000 : 1_000}
            format={moneyCompact}
            onChange={(value) => set('amount', value)}
          />

          <Slider
            label={product.kind === 'revolving' ? 'Repayment term' : 'Term'}
            value={input.termMonths}
            display={tenure(input.termMonths)}
            min={product.minTermMonths}
            max={product.maxTermMonths}
            step={1}
            format={(months) => tenure(months)}
            onChange={(value) => set('termMonths', value)}
          />

          {product.kind === 'revolving' && (
            <Slider
              label="How much of the line you draw"
              value={Math.round(input.utilization * 100)}
              display={percent(input.utilization, 0)}
              min={10}
              max={100}
              step={5}
              format={(value) => `${value}%`}
              hint="Undrawn credit costs nothing — the payment below is on the drawn balance."
              onChange={(value) => set('utilization', value / 100)}
            />
          )}

          {product.kind === 'interest-only' && (
            <Switch
              label="Interest-only for the first year"
              hint="Pay interest only for 52 weeks, then amortize the balance."
              checked={input.interestOnly}
              onChange={(value) => set('interestOnly', value)}
            />
          )}
        </div>

        <div className="my-7 h-px bg-[var(--ft-line)]" />

        <StepLabel step={3}>Your business</StepLabel>

        <div className="mt-5 space-y-6">
          <Slider
            label="Personal FICO® score"
            value={input.fico}
            display={String(input.fico)}
            min={500}
            max={850}
            step={5}
            format={String}
            hint={`${MINIMUMS.fico} is the minimum. We look past the score when the rest of the file is strong.`}
            onChange={(value) => set('fico', value)}
          />

          <Slider
            label="Time in business"
            value={input.monthsInBusiness}
            display={tenure(input.monthsInBusiness)}
            min={0}
            max={120}
            step={1}
            format={(months) => (months >= 12 ? `${Math.round(months / 12)} yr` : `${months} mo`)}
            onChange={(value) => set('monthsInBusiness', value)}
          />

          <Slider
            label="Average monthly revenue"
            value={input.monthlyRevenue}
            display={money(input.monthlyRevenue)}
            min={5_000}
            max={500_000}
            step={1_000}
            format={moneyCompact}
            onChange={(value) => set('monthlyRevenue', value)}
          />
        </div>

        <button
          type="button"
          onClick={() => setInput(DEFAULTS)}
          className="mt-7 text-xs font-medium text-[var(--ft-muted)] underline underline-offset-4 transition-colors hover:text-[var(--ft-ink)]"
        >
          Reset to the example scenario
        </button>
      </div>

      {/* ── Result ───────────────────────────────────────────────────────── */}
      <div className="min-w-0 rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-card)] p-5 sm:p-7 lg:sticky lg:top-28">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ft-accent)]">
              Your estimate
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-headline)] text-xl font-medium text-[var(--ft-ink)]">
              {product.name}
            </h2>
          </div>
          <span
            className={`rounded-lg border px-3 py-1 text-xs font-medium ${FIT_LABEL[result.fit].className}`}
          >
            {FIT_LABEL[result.fit].label}
          </span>
        </div>

        {result.eligible ? (
          <Headline result={result} />
        ) : (
          <div className="mt-6 rounded-xl border border-[var(--ft-line)] bg-[var(--ft-card-raised)] p-4">
            <p className="text-sm font-medium text-[var(--ft-ink)]">
              This one is outside the published minimums.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ft-muted)]">
              {result.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-[var(--ft-muted)]">
              The{' '}
              <Link
                href="/programs"
                className="text-[var(--ft-accent)] underline decoration-[var(--ft-accent)]/40 underline-offset-4"
              >
                DIY programs
              </Link>{' '}
              cover credit repair, business credit and budgeting — most people come back inside
              guidelines.
            </p>
          </div>
        )}

        {result.eligible && (
          <>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <Stat label="Net funded" value={money(result.netFunded)} />
              <Stat label="Total payback" value={money(result.totalPayback)} />
              <Stat
                label={result.factorRate ? 'Factor rate' : 'Est. rate'}
                value={
                  result.factorRate
                    ? result.factorRate.toFixed(2)
                    : percent(result.rate ?? 0)
                }
              />
              <Stat label="Est. APR" value={percent(result.apr)} hint="Includes fees" />
            </div>

            <p className="mt-5 text-sm leading-relaxed text-[var(--ft-muted)]">
              {result.narrative}
            </p>
          </>
        )}

        {result.notes.length > 0 && (
          <ul className="mt-4 space-y-2">
            {result.notes.map((note) => (
              <li
                key={note}
                className="flex gap-2 text-xs leading-relaxed text-[var(--ft-subtle)]"
              >
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--ft-accent)]" />
                {note}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={CTA_HREF}
            className="flex-1 rounded-md bg-[var(--ft-accent)] px-6 py-3.5 text-center text-[0.9375rem] font-bold text-white transition-colors hover:bg-[var(--color-gold-hover)]"
          >
            Get Funded
          </Link>
          <a
            href={CONTACT.phoneHref}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-[var(--ft-line)] px-6 py-3.5 text-center text-[0.9375rem] text-[var(--ft-muted)] transition-colors hover:border-[var(--ft-accent)] hover:text-[var(--ft-ink)]"
          >
            {CONTACT.phone}
            <ArrowUpRightIcon className="h-4 w-4 text-[var(--ft-accent)]" />
          </a>
        </div>

        {result.eligible && (
          <div className="mt-8">
            <Tabs current={tab} onChange={setTab} />

            <div
              id={`calc-panel-${tab}`}
              role="tabpanel"
              aria-labelledby={`calc-tab-${tab}`}
              tabIndex={0}
              className="mt-5 focus-visible:outline-none"
            >
              {tab === 'breakdown' && <Breakdown result={result} />}
              {tab === 'schedule' && <Schedule result={result} />}
              {tab === 'compare' && (
                <Compare rows={comparison} activeId={product.id} onSelect={selectProduct} />
              )}
              {tab === 'fit' && <Qualify input={input} result={result} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * The result's headline
 * ------------------------------------------------------------------------- */

function Headline({ result }: { result: CalcResult }) {
  const unit = cadenceUnit(result.cadence);

  return (
    <div className="mt-6">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--ft-muted)]">
        Estimated {cadenceAdverb(result.cadence)} payment
      </p>
      <p className="mt-1 font-[family-name:var(--font-headline)] text-[clamp(2.75rem,7vw,4rem)] font-medium leading-none text-[var(--ft-accent)]">
        {money(result.payment)}
      </p>
      <p className="mt-3 text-sm text-[var(--ft-muted)]">
        {result.cadence === 'weekly'
          ? `${money(result.monthlyEquivalent)} a month equivalent`
          : `${money(result.weeklyEquivalent)} a week equivalent`}
        {' · '}
        {result.nPayments} payments
        {result.laterPayment != null && (
          <>
            {' · '}
            <span className="text-[var(--ft-ink)]">
              {money(result.laterPayment)} a {unit} once it amortizes
            </span>
          </>
        )}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Tab panels
 * ------------------------------------------------------------------------- */

function Breakdown({ result }: { result: CalcResult }) {
  /*
   * Where the instalment steps up, for the payments row. Derived from the
   * schedule rather than carried on the result: it is the first period that
   * repays any principal, which is exactly what "the interest-only period ends"
   * means, and nothing else needs the number.
   */
  const stepsAt = result.laterPayment == null ? 0 : result.schedule.findIndex((row) => row.principal > 0);

  return (
    <div>
      <CostSplit result={result} />

      <div className="mt-7">
        <PaymentChart schedule={result.schedule} cadence={result.cadence} />
      </div>

      <dl className="mt-7 space-y-2 text-sm">
        <DetailRow term="Capital in use" value={money(result.principal)} />
        <DetailRow
          term="Origination fee"
          value={result.originationFee > 0 ? `− ${money(result.originationFee)}` : 'None'}
        />
        <DetailRow term="Lands in your account" value={money(result.netFunded)} />
        <DetailRow
          term="Payments"
          value={
            stepsAt > 0
              ? `${stepsAt} × ${moneyExact(result.payment)}, then ${result.nPayments - stepsAt} × ` +
                `${moneyExact(result.laterPayment ?? 0)}`
              : `${result.nPayments} × ${moneyExact(result.payment)}, ${cadenceAdverb(result.cadence)}`
          }
        />
        <DetailRow
          term="Share of monthly revenue"
          value={result.paymentToRevenue > 0 ? percent(result.paymentToRevenue) : '—'}
        />
      </dl>
    </div>
  );
}

/**
 * Principal against cost, as a meter.
 *
 * The one figure people actually take away — "what does the money cost" — and a
 * proportion is read faster from a filled bar than from two dollar amounts they
 * have to subtract.
 */
function CostSplit({ result }: { result: CalcResult }) {
  const total = result.totalPayback || 1;
  const principalShare = Math.min(1, result.principal / total);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-sm font-medium text-[var(--ft-ink)]">Cost of capital</span>
        <span className="text-sm tabular-nums text-[var(--ft-muted)]">
          <span className="text-[var(--ft-ink)]">{money(result.totalCost)}</span> on{' '}
          {money(result.principal)} borrowed
        </span>
      </div>

      <div className="mt-2 flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        <div
          className="h-full rounded-l-full bg-[var(--ft-accent)]"
          style={{ width: `${principalShare * 100}%` }}
        />
        <div className="h-full flex-1 rounded-r-full" style={{ background: '#8a6a28' }} />
      </div>

      <p className="mt-2 text-xs text-[var(--ft-subtle)]">
        {percent(1 - principalShare, 0)} of everything you repay is the cost of the money.
      </p>
    </div>
  );
}

function Schedule({ result }: { result: CalcResult }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? result.schedule.slice(0, 60) : result.schedule.slice(0, 12);
  const remaining = result.schedule.length - rows.length;
  const unit = result.cadence === 'weekly' ? 'Week' : 'Month';

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Payment schedule: principal, cost and remaining balance for each payment.
          </caption>
          <thead>
            <tr className="border-b border-[var(--ft-line)] text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--ft-subtle)]">
              <th scope="col" className="py-2 font-medium">
                {unit}
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Payment
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Principal
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Cost
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Balance
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((row) => (
              <tr key={row.period} className="border-b border-[var(--ft-line)]/60">
                <th scope="row" className="py-2 font-normal text-[var(--ft-muted)]">
                  {row.period}
                </th>
                <td className="py-2 text-right text-[var(--ft-ink)]">{moneyExact(row.payment)}</td>
                <td className="py-2 text-right text-[var(--ft-muted)]">
                  {moneyExact(row.principal)}
                </td>
                <td className="py-2 text-right text-[var(--ft-muted)]">{moneyExact(row.cost)}</td>
                <td className="py-2 text-right text-[var(--ft-muted)]">{money(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {remaining > 0 && (
        <p className="mt-3 text-xs text-[var(--ft-subtle)]">
          {expanded ? (
            `${remaining} more payments follow the same pattern; the last one clears the balance.`
          ) : (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="underline underline-offset-4 hover:text-[var(--ft-ink)]"
            >
              Show more — {result.schedule.length} payments in total
            </button>
          )}
        </p>
      )}
    </div>
  );
}

function Compare({
  rows,
  activeId,
  onSelect,
}: {
  rows: CalcResult[];
  activeId: string;
  onSelect: (product: Product) => void;
}) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            The same request priced across every funding option.
          </caption>
          <thead>
            <tr className="border-b border-[var(--ft-line)] text-[0.6875rem] uppercase tracking-[0.1em] text-[var(--ft-subtle)]">
              <th scope="col" className="py-2 font-medium">
                Facility
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Payment
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Total cost
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Est. APR
              </th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((row) => {
              const active = row.product.id === activeId;
              return (
                <tr
                  key={row.product.id}
                  className={`border-b border-[var(--ft-line)]/60 ${
                    active ? 'bg-[var(--ft-accent)]/5' : ''
                  }`}
                >
                  <th scope="row" className="py-2.5 font-normal">
                    <button
                      type="button"
                      onClick={() => onSelect(row.product)}
                      aria-current={active ? 'true' : undefined}
                      className={`text-left transition-colors hover:text-[var(--ft-accent)] ${
                        active ? 'text-[var(--ft-accent)]' : 'text-[var(--ft-ink)]'
                      }`}
                    >
                      {row.product.name}
                      <span className="mt-0.5 block text-xs tabular-nums text-[var(--ft-subtle)]">
                        {money(row.principal)} · {tenure(row.termMonths)}
                        {row.principal !== row.amount && ` drawn of ${money(row.amount)}`}
                      </span>
                    </button>
                  </th>
                  <td className="py-2.5 text-right text-[var(--ft-ink)]">
                    {row.eligible ? (
                      <>
                        {money(row.payment)}
                        <span className="block text-xs text-[var(--ft-subtle)]">
                          {row.laterPayment == null
                            ? cadenceAdverb(row.cadence)
                            : `${cadenceAdverb(row.cadence)}, then ${money(row.laterPayment)}`}
                        </span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-2.5 text-right text-[var(--ft-muted)]">
                    {row.eligible ? money(row.totalCost) : '—'}
                  </td>
                  <td className="py-2.5 text-right text-[var(--ft-muted)]">
                    {row.eligible ? percent(row.apr) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[var(--ft-subtle)]">
        Each row prices the same request against that product&rsquo;s own limits, so the capital and
        term under its name are what it could actually put to work — that is the figure the payment
        beside it is on, and it is why the rows differ. Tap a name to switch the calculator to it.
      </p>
    </div>
  );
}

function Qualify({ input, result }: { input: CalcInput; result: CalcResult }) {
  const checks = [
    {
      ok: input.fico >= MINIMUMS.fico,
      label: `Personal FICO® of ${MINIMUMS.fico} or better`,
      detail:
        input.fico >= MINIMUMS.fico
          ? `Yours is ${input.fico}, which prices in the ${result.band} band.`
          : `Yours is ${input.fico}. The DIY credit programs are built for this.`,
    },
    {
      ok: input.monthsInBusiness >= MINIMUMS.monthsInBusiness,
      label: 'At least 30 days in business',
      detail:
        input.monthsInBusiness >= 12
          ? `${tenure(input.monthsInBusiness)} of trading history.`
          : `${input.monthsInBusiness} month${input.monthsInBusiness === 1 ? '' : 's'} of trading history — under a year carries a seasoning premium.`,
    },
    {
      ok: result.paymentToRevenue > 0 && result.paymentToRevenue <= 0.22,
      label: 'The payment fits the revenue',
      detail:
        result.paymentToRevenue > 0
          ? `${percent(result.paymentToRevenue)} of ${money(input.monthlyRevenue)} a month. Under 22% underwrites comfortably.`
          : 'Add your monthly revenue to check this one.',
    },
    {
      ok: null,
      label: 'An approved industry',
      detail:
        'Most industries qualify. An advisor confirms yours on the call — it is the one thing this calculator cannot check for you.',
    },
  ];

  return (
    <ul className="space-y-2">
      {checks.map((check) => (
        <li
          key={check.label}
          className="flex gap-3 rounded-xl border border-[var(--ft-line)] bg-[var(--ft-card-raised)] p-3"
        >
          <span
            aria-hidden="true"
            className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[0.625rem] ${
              check.ok === null
                ? 'border border-[var(--ft-line)] text-[var(--ft-subtle)]'
                : check.ok
                  ? 'bg-[var(--ft-accent)] text-[var(--ft-bg)]'
                  : 'border border-[var(--ft-muted)] text-[var(--ft-muted)]'
            }`}
          >
            {check.ok === null ? '?' : check.ok ? '✓' : '–'}
          </span>
          <div>
            <p className="text-sm font-medium text-[var(--ft-ink)]">
              {check.label}
              <span className="sr-only">
                {check.ok === null ? ' — checked by an advisor' : check.ok ? ' — met' : ' — not met'}
              </span>
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--ft-muted)]">{check.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------------------
 * Controls
 * ------------------------------------------------------------------------- */

function StepLabel({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ft-accent)]">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--ft-accent)]/40 text-[0.625rem]">
        {step}
      </span>
      {children}
    </p>
  );
}

/**
 * A labelled range input.
 *
 * A native `<input type="range">`, styled in globals.css, rather than a custom
 * thumb on a div: it is draggable, arrow-key steppable, announced correctly and
 * touch-friendly for free, and every hand-rolled slider gives at least one of
 * those up. The visible value doubles as the accessible one via
 * `aria-valuetext`, so a screen reader hears "$150,000" rather than "150000".
 */
function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  format,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  hint?: string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm text-[var(--ft-muted)]">
          {label}
        </label>
        <output
          htmlFor={id}
          className="font-[family-name:var(--font-headline)] text-base font-medium tabular-nums text-[var(--ft-ink)]"
        >
          {display}
        </output>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        onChange={(event) => onChange(Number(event.target.value))}
        /*
         * The track's gold fill stops here. WebKit has no pseudo-element for the
         * filled portion, so it is a gradient whose stop this variable moves;
         * Firefox ignores it and uses ::-moz-range-progress instead.
         */
        style={{ '--range-fill': `${fill}%` } as React.CSSProperties}
        className="mt-2.5 w-full"
      />

      <div className="flex justify-between text-[0.6875rem] tabular-nums text-[var(--ft-subtle)]">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>

      {hint ? <p className="mt-1.5 text-xs text-[var(--ft-subtle)]">{hint}</p> : null}
    </div>
  );
}

function Switch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--ft-line)] bg-[var(--ft-card-raised)] px-4 py-3">
      <span>
        <span className="block text-sm text-[var(--ft-ink)]">{label}</span>
        <span className="mt-0.5 block text-xs text-[var(--ft-subtle)]">{hint}</span>
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[var(--ft-accent)]' : 'bg-[var(--ft-line)]'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-1 h-5 w-5 rounded-full transition-transform ${
            checked
              ? 'translate-x-6 bg-[var(--ft-bg)]'
              : 'translate-x-1 bg-[var(--ft-muted)]'
          }`}
        />
      </button>
    </div>
  );
}

/**
 * The result panel's tabs.
 *
 * Arrow keys move between them because that is what the tab pattern requires:
 * only the selected tab is in the page's tab order, so without this a keyboard
 * user can reach the tablist and then cannot reach three of its four tabs.
 */
function Tabs({ current, onChange }: { current: TabId; onChange: (tab: TabId) => void }) {
  const listRef = useRef<HTMLDivElement>(null);

  function onKeyDown(event: React.KeyboardEvent) {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (delta === 0) return;

    event.preventDefault();
    const index = TABS.findIndex((tab) => tab.id === current);
    const next = TABS[(index + delta + TABS.length) % TABS.length];
    if (!next) return;

    onChange(next.id);
    listRef.current?.querySelector<HTMLButtonElement>(`#calc-tab-${next.id}`)?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Estimate detail"
      onKeyDown={onKeyDown}
      /* Two columns on a phone: four tabs in one row wrap to a stray third. */
      className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--ft-line)] bg-[var(--ft-card-raised)] p-1 sm:flex"
    >
      {TABS.map((tab) => {
        const selected = tab.id === current;
        return (
          <button
            key={tab.id}
            id={`calc-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`calc-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:flex-1 ${
              selected
                ? 'bg-[var(--ft-bg)] text-[var(--ft-ink)]'
                : 'text-[var(--ft-muted)] hover:text-[var(--ft-ink)]'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Small pieces
 * ------------------------------------------------------------------------- */

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-[var(--ft-line)] bg-[var(--ft-card-raised)] px-3.5 py-3">
      <p className="text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-[var(--ft-subtle)]">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-headline)] text-lg font-medium tabular-nums text-[var(--ft-ink)]">
        {value}
      </p>
      {hint ? <p className="text-[0.6875rem] text-[var(--ft-subtle)]">{hint}</p> : null}
    </div>
  );
}

function DetailRow({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--ft-line)]/60 pb-2">
      <dt className="text-[var(--ft-muted)]">{term}</dt>
      <dd className="text-right tabular-nums text-[var(--ft-ink)]">{value}</dd>
    </div>
  );
}
