import { formatVolume } from '@blog/core';

import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { SeoTreeView } from '@/components/seo-tree';
import { requireCurrentSite } from '@/lib/current-site';
import { isSeoTreeEmpty, loadSeoTree, SEO_KEYWORD_LIMIT } from '@/lib/seo';

export const dynamic = 'force-dynamic';

/**
 * Keywords — the research, in full.
 *
 * Every keyword this site knows about, in the shape the research produces it:
 * topic → cluster → keywords, where a cluster is named by its head term. No
 * page titles — clustering happens well before anything has a title, and the
 * working ones that do exist are placeholders. Titles appear on the Roadmap,
 * which is where a cluster lands once it has been briefed as a page.
 *
 * Read-only for now, deliberately. The clustering decisions that populate these
 * tables are made against live SERPs — which page should own a term is settled
 * by who already ranks for it, not by dragging rows around — so an editing UI
 * here would invite exactly the guesswork the research exists to replace.
 */
export default async function KeywordsPage() {
  const site = await requireCurrentSite();
  const tree = await loadSeoTree(site.id, 'research');

  const clusterCount = tree.topics.reduce(
    (sum, t) => sum + (t.pillar ? 1 : 0) + t.subs.length,
    0,
  );

  return (
    <>
      <PageHeader
        title="Keywords"
        description={
          <>
            Every keyword researched for this site, grouped into the clusters meant
            to own them. A cluster reaches the <strong>Roadmap</strong> once it has
            been briefed as a page.
          </>
        }
      />

      {isSeoTreeEmpty(tree) ? (
        <EmptyState>
          No keyword research yet for {site.name}.
        </EmptyState>
      ) : (
        <>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-muted">
                Keywords
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {tree.metrics.keywordCount.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-muted">
                Total volume
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {formatVolume(tree.metrics.volume)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-muted">
                Topics
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {tree.topics.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-ink-muted">
                Clusters
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {clusterCount}
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
            <p className="mt-3 text-sm text-ink-muted">
              {tree.metrics.unmeasured.toLocaleString()} of these have no volume
              figure yet, so they count toward neither total.
            </p>
          ) : null}

          {tree.truncated ? (
            <div className="mt-3"><Alert tone="warning">
              Showing the first {SEO_KEYWORD_LIMIT.toLocaleString()} keywords by
              volume. The totals above cover only those.
            </Alert></div>
          ) : null}

          <div className="mt-6">
            <SeoTreeView tree={tree} variant="research" />
          </div>
        </>
      )}
    </>
  );
}
