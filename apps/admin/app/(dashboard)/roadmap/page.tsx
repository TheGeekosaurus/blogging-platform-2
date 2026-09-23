import { SeoTreeView } from '@/components/seo-tree';
import { requireCurrentSite } from '@/lib/current-site';
import { isSeoTreeEmpty, loadSeoTree } from '@/lib/seo';

export const dynamic = 'force-dynamic';

/**
 * Roadmap — the same tree, filtered to work.
 *
 * A page appears here once it has been briefed, and carries its status through
 * to published. Keeping it as one tree with the Keywords screen rather than a
 * separate list means the two cannot disagree about what exists: the roadmap is
 * a filter over the research, not a copy of it.
 */
export default async function RoadmapPage() {
  const site = await requireCurrentSite();
  const tree = await loadSeoTree(site.id, 'roadmap');

  const counts = tree.topics.reduce(
    (acc, t) => {
      for (const node of [...(t.pillar ? [t.pillar] : []), ...t.subs]) {
        acc.total += 1;
        acc[node.page.status] += 1;
      }
      return acc;
    },
    { total: 0, researched: 0, briefed: 0, drafted: 0, published: 0 },
  );

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Roadmap</h1>

      <p className="mt-2 max-w-2xl text-sm text-[#50575e]">
        Pages that have been briefed, and where each one has got to. Everything
        still in research is on <strong>Keywords</strong>.
      </p>

      {isSeoTreeEmpty(tree) ? (
        <p className="mt-6 text-sm text-[#50575e]">
          No keyword research yet for {site.name}.
        </p>
      ) : counts.total === 0 ? (
        /*
          A different message from the empty one above, and the distinction
          matters: research exists, none of it has been briefed. Saying "no
          roadmap yet" here would read as "the research is missing".
        */
        <p className="mt-6 text-sm text-[#50575e]">
          Nothing briefed yet.{' '}
          {tree.outOfScopePages > 0
            ? `${tree.outOfScopePages} ${tree.outOfScopePages === 1 ? 'page is' : 'pages are'} researched and waiting for a brief.`
            : null}
        </p>
      ) : (
        <>
          <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#787c82]">
                On the roadmap
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {counts.total}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#787c82]">
                Briefed
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {counts.briefed}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#787c82]">
                Drafted
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {counts.drafted}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#787c82]">
                Published
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {counts.published}
              </dd>
            </div>
          </dl>

          {tree.outOfScopePages > 0 ? (
            <p className="mt-3 text-sm text-[#50575e]">
              {tree.outOfScopePages} more{' '}
              {tree.outOfScopePages === 1 ? 'page is' : 'pages are'} researched
              but not briefed — see Keywords.
            </p>
          ) : null}

          <div className="mt-6">
            <SeoTreeView tree={tree} variant="roadmap" />
          </div>
        </>
      )}
    </>
  );
}
