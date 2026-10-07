import Link from 'next/link';

import {
  clusterLabel,
  formatVolume,
  kdBand,
  KD_BAND_LABELS,
  SEO_PRIORITY_LABELS,
  SEO_STATUS_LABELS,
  type IntentMix,
  type KdBand,
  type SeoKeywordRow,
  type SeoPageNode,
  type SeoPagePriority,
  type SeoPageStatus,
  type SeoTopicNode,
  type SeoTree,
} from '@blog/core';

import { SeoPriorityPicker } from './seo-priority-picker';

/**
 * The three-level disclosure both SEO screens render.
 *
 * WHY <details>, NOT REACT STATE. Every node here is independently open or
 * closed and nothing else on the page reacts to it, which is exactly what
 * <details> is. Using it keeps both screens server components — no hydration
 * for a table that is only ever read — and gets keyboard support, the
 * disclosure role and find-in-page expansion for free. React state would cost
 * a client boundary and reimplement all four.
 *
 * The middle level is the same row of the same table on both screens, but it is
 * not the same THING, and the two variants no longer pretend otherwise:
 *
 *   research  topic → cluster → keywords. A cluster is named by its head term,
 *             carries the research numbers, and has no title because nothing
 *             has been written yet.
 *   roadmap   topic → page → keywords. A page is named by its working title,
 *             carries its status, and carries no research numbers — by the time
 *             something is briefed, the volume that justified it is settled and
 *             repeating it on every row is just noise between you and the work.
 */

export type SeoTreeVariant = 'research' | 'roadmap';

/*
 * The four right-hand columns on a Keywords row.
 *
 * One constant rather than the same widths typed into both the summary and the
 * header above it: a header that is two rem out from the figures it labels is
 * worse than no header, and nothing in a typecheck or a test would catch it.
 * The leading spacer matches the chevron so the first column starts where the
 * label does.
 */
const COL = {
  // w-20, not w-16: "Keywords" is wider than 4rem at this size, and a flex
  // child will not shrink below its content, so the header was shouldering
  // into the Intent column next to it.
  count: 'w-20 text-right',
  intent: 'w-28',
  kd: 'w-16 text-right',
  volume: 'w-16 text-right',
} as const;

const KD_DOT: Record<KdBand, string> = {
  'very-easy': 'bg-emerald-600',
  easy: 'bg-emerald-400',
  possible: 'bg-amber-400',
  difficult: 'bg-orange-500',
  hard: 'bg-red-500',
};

const STATUS_STYLES: Record<SeoPageStatus, string> = {
  researched: 'chip-neutral',
  briefed: 'chip-brand',
  drafted: 'chip-warning',
  published: 'chip-success',
};

/*
 * Priority chips are OUTLINED where status chips are filled.
 *
 * The two sit side by side on the same row, and every fill that reads as
 * "urgent" was already spoken for — amber is Drafted, slate is Researched, red
 * is a hard keyword three columns along. Distinguishing them by weight instead
 * of hue means the pair never has to be told apart by colour memory, and the
 * row still has exactly one solid chip on it.
 */
const PRIORITY_STYLES: Record<SeoPagePriority, string> = {
  high: 'border-[rgba(234,84,85,0.45)] bg-surface text-[#cc191a]',
  medium: 'border-line bg-surface text-ink-muted',
  low: 'border-line bg-surface text-ink-muted',
};

/**
 * Renders nothing for an unranked page.
 *
 * A "Not ranked" chip on every untouched row would be eighty-three chips saying
 * nothing, and it would make the ranked ones harder to spot — which is the only
 * reason the chip exists.
 */
function PriorityChip({ priority }: { priority: SeoPagePriority | null }) {
  if (!priority) return null;
  return (
    <span
      className={`shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]}`}
    >
      <span className="sr-only">Priority: </span>
      {SEO_PRIORITY_LABELS[priority]}
    </span>
  );
}

/*
 * Intent colours, matched to the four enum values in 0013_seo.sql. Chosen to
 * read left-to-right as the funnel does — learn, compare, buy — with
 * navigational in grey because it is rarely a page you would choose to build.
 */
const INTENT_STYLES: { key: keyof IntentMix; label: string; className: string }[] = [
  { key: 'informational', label: 'Informational', className: 'bg-indigo-400' },
  { key: 'commercial', label: 'Commercial', className: 'bg-amber-400' },
  { key: 'transactional', label: 'Transactional', className: 'bg-emerald-400' },
  { key: 'navigational', label: 'Navigational', className: 'bg-ink-faint' },
];

function KdDot({ kd }: { kd: number | null }) {
  const band = kdBand(kd);
  if (band === null) return <span className="text-ink-muted">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      {kd}
      <span
        className={`inline-block h-2 w-2 rounded-full ${KD_DOT[band]}`}
        aria-hidden="true"
      />
      <span className="sr-only">{KD_BAND_LABELS[band]}</span>
    </span>
  );
}

/**
 * The stacked intent bar.
 *
 * Renders nothing when no keyword on the page carries an intent, rather than an
 * empty grey track — a bar that looks the same whether intent is unknown or
 * evenly split would be actively misleading, and unknown is the common case
 * until something classifies them.
 */
function IntentBar({ mix }: { mix: IntentMix }) {
  const total = INTENT_STYLES.reduce((sum, i) => sum + mix[i.key], 0);
  if (total === 0) return <span className="text-xs text-ink-muted">—</span>;

  const parts = INTENT_STYLES.filter((i) => mix[i.key] > 0);
  const title = parts.map((i) => `${i.label} ${mix[i.key]}`).join(' · ');

  return (
    <span className="flex h-1.5 w-28 overflow-hidden rounded-full" title={title}>
      {parts.map((i) => (
        <span
          key={i.key}
          className={i.className}
          style={{ width: `${(mix[i.key] / total) * 100}%` }}
        />
      ))}
      <span className="sr-only">{title}</span>
    </span>
  );
}

/*
 * NAMED GROUPS, one per nesting level.
 *
 * A bare `group-open:` matches when ANY ancestor `.group` is open, and these
 * disclosures are three deep — so opening a topic rotated every chevron
 * underneath it, and a collapsed page sat there pointing down as though it were
 * already expanded. Naming the level each chevron belongs to is the fix.
 *
 * The strings are whole literals rather than an interpolation because Tailwind
 * finds classes by scanning the source for them.
 */
const CHEVRON_ROTATE = {
  topic: 'group-open/topic:rotate-90',
  page: 'group-open/page:rotate-90',
  section: 'group-open/section:rotate-90',
} as const;

function Chevron({ level }: { level: keyof typeof CHEVRON_ROTATE }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform ${CHEVRON_ROTATE[level]}`}
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Level 3 — the keyword table
// ---------------------------------------------------------------------------

function KeywordTable({ keywords }: { keywords: SeoKeywordRow[] }) {
  if (keywords.length === 0) {
    return (
      <p className="px-4 py-3 text-sm text-ink-muted">No keywords here yet.</p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
          <th className="py-2 pl-4 pr-3 font-medium">Keyword</th>
          <th className="w-24 px-3 py-2 text-right font-medium">KD</th>
          <th className="w-24 px-3 py-2 text-right font-medium">Volume</th>
          <th className="w-32 px-3 py-2 font-medium">Intent</th>
        </tr>
      </thead>
      <tbody>
        {keywords.map((k) => (
          <tr key={k.id} className="border-b border-line-soft last:border-0">
            <td className="py-2 pl-4 pr-3">
              {k.keyword}
              {k.is_primary ? (
                <span className="chip chip-brand ml-2">primary</span>
              ) : null}
            </td>
            <td className="px-3 py-2 text-right">
              <KdDot kd={k.kd} />
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              {formatVolume(k.volume)}
            </td>
            <td className="px-3 py-2 text-xs capitalize text-ink-muted">
              {k.intent ?? '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Level 2a — a cluster, on the Keywords screen
// ---------------------------------------------------------------------------

/**
 * A group of terms, named by the term that leads it.
 *
 * No page title anywhere: at this stage the clusters come out of the keyword
 * research and the titles do not exist yet, so showing one meant showing a
 * placeholder. The numbers stay — they are the entire reason to look at this
 * screen.
 */
function ClusterRow({ node, isPillar }: { node: SeoPageNode; isPillar: boolean }) {
  const { metrics, intent } = node;

  return (
    <details
      className={`seo-node group/page ${isPillar ? 'seo-node-pillar' : ''}`}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-control px-4 py-2.5 hover:bg-brand-softer">
        <Chevron level="page" />

        <span className="min-w-0 flex-1 truncate text-sm">{clusterLabel(node)}</span>

        <span
          className={`hidden shrink-0 text-xs tabular-nums text-ink-muted sm:block ${COL.count}`}
        >
          {metrics.keywordCount} kw
        </span>
        <span className={`hidden shrink-0 sm:block ${COL.intent}`}>
          <IntentBar mix={intent} />
        </span>
        <span className={`shrink-0 text-sm ${COL.kd}`}>
          <KdDot kd={metrics.kd} />
        </span>
        <span className={`shrink-0 text-sm tabular-nums ${COL.volume}`}>
          {formatVolume(metrics.volume)}
        </span>
      </summary>

      {/* Tinted, so the expanded table reads as the inside of this card rather
          than as another card stacked under it. */}
      <div className="rounded-b-control border-t border-line-soft bg-canvas pb-2">
        <KeywordTable keywords={node.keywords} />
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// Level 2b — a page, on the Roadmap screen
// ---------------------------------------------------------------------------

/**
 * Title and status, and nothing else.
 *
 * The research numbers are gone from this row on purpose. A page reaches the
 * roadmap because someone decided it was worth writing; re-deciding that on
 * every glance is not what the screen is for, and four columns of figures in
 * front of a status badge made it hard to read the one thing that changes. They
 * are all still a click away.
 */
function PageRow({ node, isPillar }: { node: SeoPageNode; isPillar: boolean }) {
  const { page } = node;

  return (
    <details
      className={`seo-node group/page ${isPillar ? 'seo-node-pillar' : ''}`}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-control px-4 py-2.5 hover:bg-brand-softer">
        <Chevron level="page" />

        <span className="min-w-0 flex-1 truncate text-sm">{page.title}</span>

        <PriorityChip priority={page.priority} />

        <span className={`chip shrink-0 ${STATUS_STYLES[page.status]}`}>
          {SEO_STATUS_LABELS[page.status]}
        </span>
      </summary>

      <div className="rounded-b-control border-t border-line-soft bg-canvas pb-2">
        <PageDetail node={node} />
      </div>
    </details>
  );
}

/**
 * A long field, folded away behind its own heading.
 *
 * Briefs and outlines run to hundreds of words. Printed in full they pushed the
 * next page in the topic off the screen, which defeats a roadmap — the point of
 * it is seeing the queue.
 */
function Section({ title, body }: { title: string; body: string }) {
  return (
    <details className="group/section">
      <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-xs font-semibold uppercase tracking-wide text-ink-muted hover:text-ink">
        <Chevron level="section" />
        {title}
      </summary>
      <p className="mt-1 whitespace-pre-wrap pl-5.5 text-ink">{body}</p>
    </details>
  );
}

/** What has actually been settled for this page, once it is expanded. */
function PageDetail({ node }: { node: SeoPageNode }) {
  const { page } = node;
  const hasMeta = page.meta_title || page.meta_description;

  /*
   * The head term, which used to sit inline beside the title on the row above.
   * It belongs here: it is reference, not status, and on a row it competed with
   * the title for the same line and lost half of itself to truncation.
   */
  const primary =
    node.keywords.find((k) => k.is_primary)?.keyword ?? page.primary_keyword;

  return (
    <div className="space-y-3 px-4 pt-3 text-sm">
      <SeoPriorityPicker pageId={page.id} priority={page.priority} />

      {primary ? (
        <p>
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Primary keyword
          </span>{' '}
          <span className="text-ink">{primary}</span>
        </p>
      ) : null}

      {page.brief ? <Section title="Brief" body={page.brief} /> : null}
      {page.outline ? <Section title="Outline" body={page.outline} /> : null}

      {hasMeta ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Meta
          </h4>
          {page.meta_title ? (
            <p className="mt-1 text-ink">{page.meta_title}</p>
          ) : null}
          {page.meta_description ? (
            <p className="text-ink-muted">{page.meta_description}</p>
          ) : null}
        </div>
      ) : null}

      <div className="border-t border-line-soft pt-2">
        <KeywordTable keywords={node.keywords} />
      </div>

      {page.post_id ? (
        <p>
          <Link href={`/posts/${page.post_id}`}>Open the post →</Link>
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Level 1 — a topic
// ---------------------------------------------------------------------------

function TopicRow({ node, variant }: { node: SeoTopicNode; variant: SeoTreeVariant }) {
  const { topic, pillar, subs, metrics, statusCounts, priorityCounts } = node;
  const childCount = (pillar ? 1 : 0) + subs.length;
  const research = variant === 'research';

  // "Clusters" on the research screen, "pages" on the roadmap — the same rows,
  // but only one of them describes something anyone has agreed to build.
  const noun = research
    ? childCount === 1
      ? 'cluster'
      : 'clusters'
    : childCount === 1
      ? 'page'
      : 'pages';

  return (
    <details className="card group/topic overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-brand-softer">
        <Chevron level="topic" />

        <span className="min-w-0 flex-1">
          <span className="text-sm font-semibold">
            {topic ? topic.name : 'No topic'}
          </span>
          {topic?.pillar ? (
            <span className="ml-2 text-xs text-ink-muted">{topic.pillar}</span>
          ) : null}
          {!topic ? (
            <span className="ml-2 text-xs text-ink-muted">
              their topic was deleted
            </span>
          ) : null}
        </span>

        <span className="shrink-0 text-xs text-ink-muted">
          {childCount} {noun}
          {research ? null : ` · ${statusCounts.published} published`}
        </span>

        {/* Only when there is some, and only on the roadmap: this is the one
            thing a closed topic needs to be able to say. */}
        {!research && priorityCounts.high > 0 ? (
          <span className="chip chip-danger shrink-0">
            {priorityCounts.high} high
          </span>
        ) : null}

        <span className="hidden shrink-0 text-xs text-ink-muted sm:block">
          Total volume{' '}
          <span className="font-medium tabular-nums">
            {formatVolume(metrics.volume)}
          </span>
        </span>

        <span className="shrink-0 text-xs text-ink-muted">
          Avg KD <KdDot kd={metrics.kd} />
        </span>
      </summary>

      {/*
        Tinted, so the children read as cards sitting ON the topic rather than
        as rows inside it — which is the whole point of the change.

        A branch PER GROUP rather than one spanning both: the group label sits
        between them, and a connector running through a heading reads as a
        mistake rather than as structure.
      */}
      <div className="border-t border-line bg-canvas pb-3">
        {childCount === 0 ? (
          <p className="px-4 py-3 text-sm text-ink-muted">
            {research ? 'No clusters in this topic yet.' : 'No pages in this topic yet.'}
          </p>
        ) : (
          <>
            {pillar ? (
              <>
                <GroupHead
                  label={research ? 'Pillar' : 'Pillar page'}
                  research={research}
                />
                <div className="seo-branch">
                  <ChildRow node={pillar} variant={variant} isPillar />
                </div>
              </>
            ) : null}

            {subs.length > 0 ? (
              <>
                <GroupHead
                  label={
                    pillar
                      ? `${research ? 'Supporting' : 'Subpages'}: ${subs.length}`
                      : `${research ? 'Clusters' : 'Pages'}: ${subs.length}`
                  }
                  research={research}
                />
                <div className="seo-branch">
                  {subs.map((sub) => (
                    <ChildRow
                      key={sub.page.id}
                      node={sub}
                      variant={variant}
                      isPillar={false}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </details>
  );
}

/**
 * The label above a branch, and on the Keywords screen the column headers.
 *
 * The headers are only on the research variant because the Roadmap has no
 * numeric columns to head — they were taken off those rows deliberately, and a
 * lone "Status" heading over one chip is decoration.
 */
function GroupHead({ label, research }: { label: string; research: boolean }) {
  return (
    <p className="seo-group-head">
      {/* Spacer matching the chevron, so the label starts where a row's label
          does rather than four pixels left of it. */}
      <span aria-hidden="true" className="w-3.5 shrink-0" />
      <span className="min-w-0 flex-1">{label}</span>

      {research ? (
        <>
          <span className={`hidden shrink-0 sm:block ${COL.count}`}>Keywords</span>
          <span className={`hidden shrink-0 sm:block ${COL.intent}`}>Intent</span>
          <span className={`shrink-0 ${COL.kd}`}>KD</span>
          <span className={`shrink-0 ${COL.volume}`}>Volume</span>
        </>
      ) : null}
    </p>
  );
}

function ChildRow({
  node,
  variant,
  isPillar,
}: {
  node: SeoPageNode;
  variant: SeoTreeVariant;
  isPillar: boolean;
}) {
  return variant === 'research' ? (
    <ClusterRow node={node} isPillar={isPillar} />
  ) : (
    <PageRow node={node} isPillar={isPillar} />
  );
}

// ---------------------------------------------------------------------------

export function SeoTreeView({
  tree,
  variant,
}: {
  tree: SeoTree;
  variant: SeoTreeVariant;
}) {
  return (
    <div className="space-y-3">
      {tree.topics.map((node) => (
        <TopicRow
          key={node.topic?.id ?? 'no-topic'}
          node={node}
          variant={variant}
        />
      ))}

      {/*
        Unclustered keywords sit at the bottom rather than being hidden. They
        are the working pile — research that has not been assigned to a cluster
        — and a screen that omits them quietly loses the work.
      */}
      {tree.unassigned.length > 0 ? (
        <details className="card group/topic overflow-hidden border border-dashed border-line">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-brand-softer">
            <Chevron level="topic" />
            <span className="flex-1 text-sm font-semibold">Not yet clustered</span>
            <span className="text-xs text-ink-muted">
              {tree.unassigned.length}{' '}
              {tree.unassigned.length === 1 ? 'keyword' : 'keywords'}
            </span>
          </summary>
          <div className="border-t border-line bg-canvas pb-2">
            <KeywordTable keywords={tree.unassigned} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
