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
 *
 * It is also the only one of the two that is ORDERED. Pages sort by priority
 * within their topic, unranked last, which is the difference between a list of
 * what has been agreed to and a queue of what to write next. Priority is set by
 * hand on each row; 0014 explains why nothing computes it yet.
 */
export default async function RoadmapPage() {
  const site = await requireCurrentSite();
  const tree = await loadSeoTree(site.id, 'roadmap');

  const counts = tree.topics.reduce(
    (acc, t) => {
      for (const node of [...(t.pillar ? [t.pillar] : []), ...t.subs]) {
        acc.total += 1;
        acc[node.page.status] += 1;
        /*
         * Both of these count only pages that are NOT published yet.
         *
         * A "high priority" figure taken over everything would be mostly
         * finished work — 22 of Nanotom Capital's 29 roadmap rows are already
         * live — so it would never go down, and a queue length that never goes
         * down is not a queue length. Same for the unranked caveat: a published
         * page nobody ever ranked is not a gap in the triage.
         */
        if (node.page.status === 'published') continue;
        if (node.page.priority === 'high') acc.high += 1;
        if (node.page.priority === null) acc.unranked += 1;
      }
      return acc;
    },
    { total: 0, researched: 0, briefed: 0, drafted: 0, published: 0, high: 0, unranked: 0 },
  );

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Roadmap</h1>

      <p className="mt-2 max-w-2xl text-sm text-[#50575e]">
        Pages that have been briefed, and where each one has got to, highest
        priority first within each topic. Everything still in research is on{' '}
        <strong>Keywords</strong>.
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
            <div>
              <dt className="text-xs uppercase tracking-wide text-[#787c82]">
                High priority
              </dt>
              <dd className="mt-0.5 text-lg font-semibold tabular-nums">
                {counts.high}
              </dd>
            </div>
          </dl>

          {/*
            Said out loud, like the unmeasured-volume caveat on Keywords: the
            ordering below is only as good as how much of it has been ranked,
            and an unranked page sits at the bottom of its topic whatever it is
            worth. Nothing ranks these automatically yet — see 0014.
          */}
          {counts.unranked > 0 ? (
            <p className="mt-3 text-sm text-[#50575e]">
              {counts.unranked} unpublished{' '}
              {counts.unranked === 1 ? 'page has' : 'pages have'} no priority
              set, so {counts.unranked === 1 ? 'it sorts' : 'they sort'} last
              within {counts.unranked === 1 ? 'its' : 'their'} topic. Open a row
              to rank it.
            </p>
          ) : null}

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
