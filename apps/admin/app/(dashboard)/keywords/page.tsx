import { formatVolume } from '@blog/core';

import { SeoTreeView } from '@/components/seo-tree';
import { requireCurrentSite } from '@/lib/current-site';
import { isSeoTreeEmpty, loadSeoTree, SEO_KEYWORD_LIMIT } from '@/lib/seo';

export const dynamic = 'force-dynamic';

/**
 * Keywords — the research, in full.
 *
 * Every keyword this site knows about, grouped by the page intended to own it:
 * topic → page → keywords. Nothing here has been committed to; a page appears
 * on the Roadmap screen once it has been briefed.
 *
 * Read-only for now, deliberately. The clustering decisions that populate these
 * tables are made against live SERPs — which page should own a term is settled
 * by who already ranks for it, not by dragging rows around — so an editing UI
 * here would invite exactly the guesswork the research exists to replace.
 */
export default async function KeywordsPage() {
  const site = await requireCurrentSite();
  const tree = await loadSeoTree(site.id, 'research');

  const pageCount = tree.topics.reduce(
    (sum, t) => sum + (t.pillar ? 1 : 0) + t.subs.length,
    0,
  );

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Keywords</h1>

      <p className="mt-2 max-w-2xl text-sm text-[#50575e]">
        Every keyword researched for this site, grouped by the page meant to own
        it. A page moves to the <strong>Roadmap</strong> once it has a brief.
      </p>

      {isSeoTreeEmpty(tree) ? (
        <p className="mt-6 text-sm text-[#50575e]">
          No keyword research yet for {site.name}.
        </p>
      ) : (
        <>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#787c82]">
                Keywords
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {tree.metrics.keywordCount.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#787c82]">
                Total volume
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {formatVolume(tree.metrics.volume)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#787c82]">
                Topics
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {tree.topics.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#787c82]">
                Pages planned
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {pageCount}
              </dd>
            </div>
          </dl>

          {/*
            Said out loud because the two headline numbers above depend on it:
            a keyword with no volume contributes nothing to the total and
            nothing to the weighted difficulty, so a mostly-unmeasured set
            reads as a small one.
          */}
          {tree.metrics.unmeasured > 0 ? (
            <p className="mt-3 text-sm text-[#50575e]">
              {tree.metrics.unmeasured.toLocaleString()} of these have no volume
              figure yet, so they count toward neither total.
            </p>
          ) : null}

          {tree.truncated ? (
            <p className="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Showing the first {SEO_KEYWORD_LIMIT.toLocaleString()} keywords by
              volume. The totals above cover only those.
            </p>
          ) : null}

          <div className="mt-6">
            <SeoTreeView tree={tree} variant="research" />
          </div>
        </>
      )}
    </>
  );
}
