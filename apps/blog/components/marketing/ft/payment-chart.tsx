'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  cadenceUnit,
  money,
  moneyCompact,
  moneyExact,
  type Cadence,
  type ScheduleRow,
} from '@/lib/funding-calc';

/*
 * Where each instalment goes, period by period.
 *
 * Hand-drawn SVG, not a charting library. Recharts (what the prototype used)
 * would be the first runtime dependency this app has ever added, for one chart
 * with two series and no zoom, brush or animation — and it ships a client-side
 * layout engine to draw rectangles whose coordinates are four lines of
 * arithmetic. The whole thing below is smaller than the library's import.
 *
 * ONE VALUE AXIS, deliberately. The obvious next idea is to overlay the falling
 * balance on the same plot, and it is a trap: a $150,000 balance and a $700
 * instalment on one scale flattens the instalments to nothing, and giving the
 * balance its own right-hand axis lets any two shapes be made to "cross"
 * wherever the scales happen to put them. The balance is a column in the
 * schedule table instead, where it can be read exactly.
 *
 * COLOUR. Two steps of one gold ramp — brand gold for principal, a darker bronze
 * for the cost — rather than two hues. It keeps the page's ink-and-gold palette
 * intact, and as an ordinal pair it clears the lightness-step and surface-
 * contrast checks that a gold-and-grey pair fails (grey reads as "no data"
 * rather than as a category). Identity never rests on colour alone regardless:
 * there is a legend, a tooltip and the table.
 */

/** Principal — brand gold, the same accent the rest of the page uses. */
const PRINCIPAL_FILL = 'var(--ft-accent)';
/** Cost of capital — the dark step of the same ramp. 3.46:1 on the card. */
const COST_FILL = '#8a6a28';

/*
 * Plot geometry, in CSS pixels.
 *
 * The SVG is drawn at its MEASURED width — one user unit to one pixel — rather
 * than at a fixed viewBox scaled to fit. A scaled viewBox scales its text with
 * everything else, and this chart lives in a panel that is ~890px on a desktop
 * and ~310px on a phone: one 11px label is either 13px or 5px, and nothing in
 * SVG holds a font size still while its coordinate system moves. Measuring
 * costs a ResizeObserver and keeps every label at the size it was chosen at.
 */
const FALLBACK_WIDTH = 720;
/**
 * Below this the plot is shorter and drops to fewer columns.
 *
 * 400, not 480: the simple view's result panel is around 445px of chart on a
 * desktop, and at 480 it was being treated as a phone — sampling 13 periods out
 * of a 24-month schedule it had room to draw in full. A phone is nearer 310.
 */
const NARROW = 400;
const PAD = { top: 16, right: 8, bottom: 34, left: 52 };

/** Columns are capped rather than filling their slot — the air is the design. */
const MAX_COLUMN = 24;
/** The surface-coloured gap that separates the two segments of a column. */
const SEGMENT_GAP = 2;
/**
 * Most columns the plot will draw before it starts sampling periods — fewer on
 * a phone, where 26 of them leaves about six pixels each and the two segments
 * stop being distinguishable from the gap between them.
 */
const MAX_COLUMNS = 26;
const MAX_COLUMNS_NARROW = 13;

type Sample = { row: ScheduleRow };

/**
 * At most MAX_COLUMNS periods, evenly spaced, always including the first and
 * last. Sampled rather than aggregated: a bucket summing four weekly payments
 * would put $2,800 columns on an axis labelled "weekly payment".
 */
function sample(rows: readonly ScheduleRow[], limit: number): Sample[] {
  if (rows.length <= limit) {
    return rows.map((row) => ({ row }));
  }

  const step = (rows.length - 1) / (limit - 1);
  const picked = new Map<number, ScheduleRow>();
  for (let i = 0; i < limit; i++) {
    const row = rows[Math.round(i * step)];
    if (row) picked.set(row.period, row);
  }
  // The last period always makes the cut: it is the one that clears the balance.
  const last = rows.at(-1);
  if (last) picked.set(last.period, last);

  return [...picked.values()]
    .sort((a, b) => a.period - b.period)
    .map((row) => ({ row }));
}

/** Axis ticks at a round interval — 0 / 250 / 500, never 0 / 237 / 474. */
function ticksFor(max: number): number[] {
  if (max <= 0) return [0];
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? magnitude * 10;

  const ticks: number[] = [];
  for (let value = 0; value <= max + step / 2; value += step) ticks.push(value);
  return ticks;
}

/** A column with its top corners rounded and its foot square on the baseline. */
function columnPath(x: number, y: number, width: number, height: number, radius: number): string {
  const r = Math.max(0, Math.min(radius, width / 2, height));
  return [
    `M${x},${y + height}`,
    `V${y + r}`,
    `a${r},${r} 0 0 1 ${r},${-r}`,
    `h${width - r * 2}`,
    `a${r},${r} 0 0 1 ${r},${r}`,
    `V${y + height}`,
    'Z',
  ].join(' ');
}

export function PaymentChart({
  schedule,
  cadence,
}: {
  schedule: readonly ScheduleRow[];
  cadence: Cadence;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);

  /*
   * The first paint uses FALLBACK_WIDTH — there is no element to measure during
   * SSR — and the observer corrects it before the browser paints anything the
   * reader sees, because the effect runs on mount and the state change is
   * batched into the same commit.
   */
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new ResizeObserver(([entry]) => {
      const measured = entry?.contentRect.width ?? 0;
      if (measured > 0) setWidth(Math.round(measured));
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  const columnLimit = width < NARROW ? MAX_COLUMNS_NARROW : MAX_COLUMNS;
  const samples = useMemo(() => sample(schedule, columnLimit), [schedule, columnLimit]);
  const firstSample = samples[0];
  const lastSample = samples.at(-1);

  const height = width < NARROW ? 190 : 260;
  const plot = {
    width: Math.max(1, width - PAD.left - PAD.right),
    height: Math.max(1, height - PAD.top - PAD.bottom),
  };

  if (!firstSample || !lastSample) {
    return (
      <p className="py-10 text-center text-sm text-[var(--ft-muted)]">
        There is no payment schedule to chart for this scenario.
      </p>
    );
  }

  const unit = cadenceUnit(cadence);
  const peak = Math.max(...samples.map((s) => s.row.payment));
  const ticks = ticksFor(peak);
  const axisMax = ticks[ticks.length - 1] || 1;

  const band = plot.width / samples.length;
  const columnWidth = Math.min(MAX_COLUMN, band * 0.62);
  const scale = (value: number) => (value / axisMax) * plot.height;
  const baseline = PAD.top + plot.height;

  const active = hovered == null ? null : samples[hovered];
  const sampled = schedule.length > samples.length;

  return (
    <figure className="m-0">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="text-sm font-medium text-[var(--ft-ink)]">
          Where each payment goes
        </span>
        <span className="text-xs text-[var(--ft-subtle)]">
          {sampled
            ? `every ${unit} — ${samples.length} of ${schedule.length} shown`
            : `per ${unit}, all ${schedule.length}`}
        </span>
      </figcaption>

      <div ref={frameRef} className="relative mt-3">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block max-w-full"
          role="img"
          aria-label={`Payment composition by ${unit}: principal and cost of capital for each of ${schedule.length} payments. The same figures are in the schedule table.`}
          onPointerLeave={() => setHovered(null)}
          onPointerMove={(event) => {
            const box = event.currentTarget.getBoundingClientRect();
            const index = Math.floor((event.clientX - box.left - PAD.left) / band);
            setHovered(index >= 0 && index < samples.length ? index : null);
          }}
        >
          {/* Gridlines and ticks: hairline, solid, one step off the surface. */}
          {ticks.map((tick) => {
            const y = baseline - scale(tick);
            return (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={PAD.left + plot.width}
                  y2={y}
                  stroke="var(--ft-line)"
                  strokeWidth="1"
                />
                <text
                  x={PAD.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="var(--ft-subtle)"
                  fontSize="11"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {moneyCompact(tick)}
                </text>
              </g>
            );
          })}

          {samples.map((item, index) => {
            const x = PAD.left + index * band + (band - columnWidth) / 2;
            const principalHeight = scale(item.row.principal);
            const costHeight = scale(item.row.cost);
            const isHovered = hovered === index;

            /*
             * The gap is taken out of the LOWER segment, so the two segments
             * still add up to the column's true height at the top. Taking it
             * from the upper one would shorten the total by 2px per column.
             */
            const principalDrawn = Math.max(0, principalHeight - (costHeight > 0 ? SEGMENT_GAP : 0));

            return (
              <g key={item.row.period}>
                {/*
                  The wash marks the hovered band. A flat fill, not a gradient
                  fading to the baseline: the column covers the middle of the
                  band, so only the slivers either side of it are ever visible,
                  and a fade makes the lower half of those slivers invisible
                  exactly where the eye looks for the highlight.
                */}
                {isHovered && (
                  <rect
                    x={PAD.left + index * band}
                    y={PAD.top}
                    width={band}
                    height={plot.height}
                    fill="var(--ft-accent)"
                    opacity="0.12"
                  />
                )}

                {principalHeight > 0.5 && (
                  <path
                    d={columnPath(
                      x,
                      baseline - principalDrawn,
                      columnWidth,
                      principalDrawn,
                      costHeight > 0.5 ? 0 : 4,
                    )}
                    fill={PRINCIPAL_FILL}
                  />
                )}

                {costHeight > 0.5 && (
                  <path
                    d={columnPath(
                      x,
                      baseline - principalHeight - costHeight,
                      columnWidth,
                      costHeight,
                      4,
                    )}
                    fill={COST_FILL}
                  />
                )}
              </g>
            );
          })}

          {/* The baseline sits above the marks so columns end on a clean edge. */}
          <line
            x1={PAD.left}
            y1={baseline}
            x2={PAD.left + plot.width}
            y2={baseline}
            stroke="var(--ft-line)"
            strokeWidth="1"
          />

          {/*
            Only the first and last period are labelled. A tick under every
            column at this width is a grey smear, and the tooltip names the
            period the reader actually cares about.
          */}
          <text
            x={PAD.left}
            y={height - 12}
            fill="var(--ft-subtle)"
            fontSize="11"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {`${unit} ${firstSample.row.period}`}
          </text>
          <text
            x={PAD.left + plot.width}
            y={height - 12}
            textAnchor="end"
            fill="var(--ft-subtle)"
            fontSize="11"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {`${unit} ${lastSample.row.period}`}
          </text>
        </svg>

        {active && (
          <div
            className="pointer-events-none absolute -top-1 z-10 rounded-lg border border-[var(--ft-line)] bg-[var(--ft-bg)] px-2.5 py-2 text-[0.6875rem] shadow-xl"
            style={{
              /*
               * Follows the column, and flips to its left once past centre so it
               * never runs off the card's right edge. Pinned to the top of the
               * plot rather than to the pointer: a panel that tracks vertically
               * covers the marks it is describing.
               */
              left: `${((hovered! + 0.5) / samples.length) * 100}%`,
              transform:
                (hovered! + 0.5) / samples.length > 0.55
                  ? 'translateX(calc(-100% - 10px))'
                  : 'translateX(10px)',
            }}
          >
            <p className="font-medium capitalize text-[var(--ft-ink)]">
              {unit} {active.row.period}
            </p>
            <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 tabular-nums">
              <dt className="flex items-center gap-1.5 text-[var(--ft-muted)]">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: PRINCIPAL_FILL }}
                />
                Principal
              </dt>
              <dd className="text-right text-[var(--ft-ink)]">
                {moneyExact(active.row.principal)}
              </dd>
              <dt className="flex items-center gap-1.5 text-[var(--ft-muted)]">
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: COST_FILL }}
                />
                Cost
              </dt>
              <dd className="text-right text-[var(--ft-ink)]">{moneyExact(active.row.cost)}</dd>
              <dt className="text-[var(--ft-muted)]">Balance</dt>
              <dd className="text-right text-[var(--ft-ink)]">{money(active.row.balance)}</dd>
            </dl>
          </div>
        )}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--ft-muted)]">
        <LegendKey fill={PRINCIPAL_FILL}>Principal repaid</LegendKey>
        <LegendKey fill={COST_FILL}>Cost of capital</LegendKey>
      </ul>
    </figure>
  );
}

function LegendKey({ fill, children }: { fill: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="inline-block h-2.5 w-2.5 rounded-sm"
        style={{ background: fill }}
      />
      {children}
    </li>
  );
}
