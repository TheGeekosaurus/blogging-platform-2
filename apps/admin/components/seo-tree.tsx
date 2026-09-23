import Link from 'next/link';

import {
  clusterLabel,
  formatVolume,
  kdBand,
  KD_BAND_LABELS,
  SEO_STATUS_LABELS,
  type IntentMix,
  type KdBand,
  type SeoKeywordRow,
  type SeoPageNode,
  type SeoPageStatus,
  type SeoTopicNode,
  type SeoTree,
} from '@blog/core';

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

const KD_DOT: Record<KdBand, string> = {
  'very-easy': 'bg-emerald-600',
  easy: 'bg-emerald-400',
  possible: 'bg-amber-400',
  difficult: 'bg-orange-500',
  hard: 'bg-red-500',
};

const STATUS_STYLES: Record<SeoPageStatus, string> = {
  researched: 'bg-slate-200 text-slate-700',
  briefed: 'bg-sky-100 text-sky-900',
  drafted: 'bg-amber-100 text-amber-900',
  published: 'bg-emerald-100 text-emerald-900',
};

/*
 * Intent colours, matched to the four enum values in 0013_seo.sql. Chosen to
 * read left-to-right as the funnel does — learn, compare, buy — with
 * navigational in grey because it is rarely a page you would choose to build.
 */
const INTENT_STYLES: { key: keyof IntentMix; label: string; className: string }[] = [
  { key: 'informational', label: 'Informational', className: 'bg-indigo-400' },
  { key: 'commercial', label: 'Commercial', className: 'bg-amber-400' },
  { key: 'transactional', label: 'Transactional', className: 'bg-emerald-400' },
  { key: 'navigational', label: 'Navigational', className: 'bg-slate-400' },
];

function KdDot({ kd }: { kd: number | null }) {
  const band = kdBand(kd);
  if (band === null) return <span className="text-[#8c8f94]">—</span>;
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
  if (total === 0) return <span className="text-xs text-[#8c8f94]">—</span>;

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
      className={`h-3.5 w-3.5 shrink-0 text-[#787c82] transition-transform ${CHEVRON_ROTATE[level]}`}
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
      <p className="px-4 py-3 text-sm text-[#50575e]">No keywords here yet.</p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[#dcdcde] text-left text-xs uppercase tracking-wide text-[#787c82]">
          <th className="py-2 pl-4 pr-3 font-medium">Keyword</th>
          <th className="w-24 px-3 py-2 text-right font-medium">KD</th>
          <th className="w-24 px-3 py-2 text-right font-medium">Volume</th>
          <th className="w-32 px-3 py-2 font-medium">Intent</th>
        </tr>
      </thead>
      <tbody>
        {keywords.map((k) => (
          <tr key={k.id} className="border-b border-[#f0f0f1] last:border-0">
            <td className="py-2 pl-4 pr-3">
              {k.keyword}
              {k.is_primary ? (
                <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-[0.6875rem] font-medium text-indigo-900">
                  primary
                </span>
              ) : null}
            </td>
            <td className="px-3 py-2 text-right">
              <KdDot kd={k.kd} />
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              {formatVolume(k.volume)}
            </td>
            <td className="px-3 py-2 text-xs capitalize text-[#50575e]">
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
      className={`group/page border-b border-[#f0f0f1] last:border-0 ${
        isPillar ? 'border-l-2 border-l-[var(--color-wp-nav-active)]' : ''
      }`}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 hover:bg-[#f6f7f7]">
        <Chevron level="page" />

        <span className="min-w-0 flex-1 truncate text-sm">{clusterLabel(node)}</span>

        <span className="hidden w-16 shrink-0 text-right text-xs tabular-nums text-[#50575e] sm:block">
          {metrics.keywordCount} kw
        </span>
        <span className="hidden w-28 shrink-0 sm:block">
          <IntentBar mix={intent} />
        </span>
        <span className="w-16 shrink-0 text-right text-sm">
          <KdDot kd={metrics.kd} />
        </span>
        <span className="w-16 shrink-0 text-right text-sm tabular-nums">
          {formatVolume(metrics.volume)}
        </span>
      </summary>

      <div className="bg-[#fbfbfc] pb-2">
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
      className={`group/page border-b border-[#f0f0f1] last:border-0 ${
        isPillar ? 'border-l-2 border-l-[var(--color-wp-nav-active)]' : ''
      }`}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 hover:bg-[#f6f7f7]">
        <Chevron level="page" />

        <span className="min-w-0 flex-1 truncate text-sm">{page.title}</span>

        <span
          className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[page.status]}`}
        >
          {SEO_STATUS_LABELS[page.status]}
        </span>
      </summary>

      <div className="bg-[#fbfbfc] pb-2">
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
      <summary className="flex cursor-pointer list-none items-center gap-2 py-1 text-xs font-semibold uppercase tracking-wide text-[#787c82] hover:text-[#3c434a]">
        <Chevron level="section" />
        {title}
      </summary>
      <p className="mt-1 whitespace-pre-wrap pl-5.5 text-[#3c434a]">{body}</p>
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
      {primary ? (
        <p>
          <span className="text-xs font-semibold uppercase tracking-wide text-[#787c82]">
            Primary keyword
          </span>{' '}
          <span className="text-[#3c434a]">{primary}</span>
        </p>
      ) : null}

      {page.brief ? <Section title="Brief" body={page.brief} /> : null}
      {page.outline ? <Section title="Outline" body={page.outline} /> : null}

      {hasMeta ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[#787c82]">
            Meta
          </h4>
          {page.meta_title ? (
            <p className="mt-1 text-[#3c434a]">{page.meta_title}</p>
          ) : null}
          {page.meta_description ? (
            <p className="text-[#50575e]">{page.meta_description}</p>
          ) : null}
        </div>
      ) : null}

      <div className="border-t border-[#f0f0f1] pt-2">
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
  const { topic, pillar, subs, metrics, statusCounts } = node;
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
    <details className="group/topic rounded border border-[#dcdcde] bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-[#f6f7f7]">
        <Chevron level="topic" />

        <span className="min-w-0 flex-1">
          <span className="text-sm font-semibold">
            {topic ? topic.name : 'No topic'}
          </span>
          {topic?.pillar ? (
            <span className="ml-2 text-xs text-[#787c82]">{topic.pillar}</span>
          ) : null}
          {!topic ? (
            <span className="ml-2 text-xs text-[#787c82]">
              their topic was deleted
            </span>
          ) : null}
        </span>

        <span className="shrink-0 text-xs text-[#50575e]">
          {childCount} {noun}
          {research ? null : ` · ${statusCounts.published} published`}
        </span>

        <span className="hidden shrink-0 text-xs text-[#50575e] sm:block">
          Total volume{' '}
          <span className="font-medium tabular-nums">
            {formatVolume(metrics.volume)}
          </span>
        </span>

        <span className="shrink-0 text-xs text-[#50575e]">
          Avg KD <KdDot kd={metrics.kd} />
        </span>
      </summary>

      <div className="border-t border-[#dcdcde]">
        {childCount === 0 ? (
          <p className="px-4 py-3 text-sm text-[#50575e]">
            {research ? 'No clusters in this topic yet.' : 'No pages in this topic yet.'}
          </p>
        ) : (
          <>
            {pillar ? (
              <>
                <p className="border-b border-[#f0f0f1] bg-[#fbfbfc] px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-[#787c82]">
                  {research ? 'Pillar' : 'Pillar page'}
                </p>
                <ChildRow node={pillar} variant={variant} isPillar />
              </>
            ) : null}

            {subs.length > 0 ? (
              <>
                <p className="border-b border-[#f0f0f1] bg-[#fbfbfc] px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-[#787c82]">
                  {pillar
                    ? `${research ? 'Supporting' : 'Subpages'}: ${subs.length}`
                    : `${research ? 'Clusters' : 'Pages'}: ${subs.length}`}
                </p>
                {subs.map((sub) => (
                  <ChildRow
                    key={sub.page.id}
                    node={sub}
                    variant={variant}
                    isPillar={false}
                  />
                ))}
              </>
            ) : null}
          </>
        )}
      </div>
    </details>
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
    <div className="space-y-2">
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
        <details className="group/topic rounded border border-dashed border-[#c3c4c7] bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-[#f6f7f7]">
            <Chevron level="topic" />
            <span className="flex-1 text-sm font-semibold">Not yet clustered</span>
            <span className="text-xs text-[#50575e]">
              {tree.unassigned.length}{' '}
              {tree.unassigned.length === 1 ? 'keyword' : 'keywords'}
            </span>
          </summary>
          <div className="border-t border-[#dcdcde] bg-[#fbfbfc] pb-2">
            <KeywordTable keywords={tree.unassigned} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
