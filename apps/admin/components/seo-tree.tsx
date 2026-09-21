import Link from 'next/link';

import {
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
 * The three-level disclosure both SEO screens render: topic → page → keywords.
 *
 * WHY <details>, NOT REACT STATE. Every node here is independently open or
 * closed and nothing else on the page reacts to it, which is exactly what
 * <details> is. Using it keeps both screens server components — no hydration
 * for a table that is only ever read — and gets keyboard support, the
 * disclosure role and find-in-page expansion for free. React state would cost
 * a client boundary and reimplement all four.
 *
 * The two screens differ only in `variant`: Keywords leads with the research
 * numbers, Roadmap leads with title and status. Same tree, same roll-ups.
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

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0 text-[#787c82] transition-transform group-open:rotate-90"
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
      <p className="px-4 py-3 text-sm text-[#50575e]">
        No keywords on this page yet.
      </p>
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
// Level 2 — a page
// ---------------------------------------------------------------------------

function PageRow({
  node,
  variant,
  isPillar,
}: {
  node: SeoPageNode;
  variant: SeoTreeVariant;
  isPillar: boolean;
}) {
  const { page, metrics, intent } = node;

  return (
    <details
      className={`group border-b border-[#f0f0f1] last:border-0 ${
        isPillar ? 'border-l-2 border-l-[var(--color-wp-nav-active)]' : ''
      }`}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-2.5 hover:bg-[#f6f7f7]">
        <Chevron />

        <span className="min-w-0 flex-1 truncate text-sm">
          {page.title}
          {page.primary_keyword ? (
            <span className="ml-2 text-xs text-[#787c82]">{page.primary_keyword}</span>
          ) : null}
        </span>

        {variant === 'roadmap' ? (
          <span
            className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[page.status]}`}
          >
            {SEO_STATUS_LABELS[page.status]}
          </span>
        ) : null}

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

        {variant === 'roadmap' ? <PageDetail node={node} /> : null}
      </div>
    </details>
  );
}

/**
 * The roadmap's extra panel: what has actually been written for this page.
 *
 * Only on the roadmap variant. On the Keywords screen a page is a research
 * grouping and none of this exists yet, so the panel would be four empty
 * headings on every row.
 */
function PageDetail({ node }: { node: SeoPageNode }) {
  const { page } = node;
  const hasMeta = page.meta_title || page.meta_description;

  if (!page.brief && !page.outline && !hasMeta && !page.post_id) return null;

  return (
    <div className="space-y-3 border-t border-[#f0f0f1] px-4 pt-3 text-sm">
      {page.brief ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[#787c82]">
            Brief
          </h4>
          <p className="mt-1 whitespace-pre-wrap text-[#3c434a]">{page.brief}</p>
        </div>
      ) : null}

      {page.outline ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[#787c82]">
            Outline
          </h4>
          <p className="mt-1 whitespace-pre-wrap text-[#3c434a]">{page.outline}</p>
        </div>
      ) : null}

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
  const pageCount = (pillar ? 1 : 0) + subs.length;
  const published = statusCounts.published;

  return (
    <details className="group rounded border border-[#dcdcde] bg-white" open={false}>
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-[#f6f7f7]">
        <Chevron />

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
          {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          {variant === 'roadmap' ? ` · ${published} published` : null}
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
        {pageCount === 0 ? (
          <p className="px-4 py-3 text-sm text-[#50575e]">
            No pages in this topic yet.
          </p>
        ) : (
          <>
            {pillar ? (
              <>
                <p className="border-b border-[#f0f0f1] bg-[#fbfbfc] px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-[#787c82]">
                  Pillar page
                </p>
                <PageRow node={pillar} variant={variant} isPillar />
              </>
            ) : null}

            {subs.length > 0 ? (
              <>
                <p className="border-b border-[#f0f0f1] bg-[#fbfbfc] px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-[#787c82]">
                  {pillar ? `Subpages: ${subs.length}` : `Pages: ${subs.length}`}
                </p>
                {subs.map((sub) => (
                  <PageRow
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
        are the working pile — research that has not been assigned to a page —
        and a screen that omits them quietly loses the work.
      */}
      {tree.unassigned.length > 0 ? (
        <details className="group rounded border border-dashed border-[#c3c4c7] bg-white">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-[#f6f7f7]">
            <Chevron />
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
