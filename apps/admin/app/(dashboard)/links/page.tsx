import Link from 'next/link';

import {
  isLive,
  pageUrl,
  type ContentLink,
  type LinkKind,
  type LinkStatus,
  type NodeLinkStats,
  type PostStatus,
} from '@blog/core';

import { ViewLiveLink } from '@/components/view-live-link';
import { requireCurrentSite } from '@/lib/current-site';
import { editHref, LINK_GRAPH_LIMIT, loadLinkGraph } from '@/lib/link-graph';

export const dynamic = 'force-dynamic';

/*
 * Two views over one graph, in the shape the question is usually asked in:
 *
 *   Content — one row per post or page: what it links out to, and what links
 *             back to it. This is the view that finds orphans.
 *   Links   — one row per link: source, destination, verdict. This is the view
 *             that finds the broken ones.
 *
 * Both are filters over the same in-memory graph, so switching views and
 * narrowing costs nothing beyond the single read in loadLinkGraph().
 */

const LINKS_PER_PAGE = 100;

type View = 'content' | 'links';

const STATUS_STYLES: Record<PostStatus, string> = {
  published: 'bg-emerald-100 text-emerald-900',
  draft: 'bg-slate-200 text-slate-700',
  scheduled: 'bg-sky-100 text-sky-900',
  archived: 'bg-amber-100 text-amber-900',
};

const LINK_STATUS_STYLES: Record<LinkStatus, string> = {
  ok: 'bg-emerald-100 text-emerald-900',
  redirect: 'bg-sky-100 text-sky-900',
  unpublished: 'bg-amber-100 text-amber-900',
  missing: 'bg-red-100 text-red-900',
  unchecked: 'bg-slate-200 text-slate-700',
};

const LINK_STATUS_LABELS: Record<LinkStatus, string> = {
  ok: 'ok',
  redirect: 'redirect hop',
  unpublished: 'not published',
  missing: 'broken',
  unchecked: 'unchecked',
};

const KIND_LABELS: Record<LinkKind, string> = {
  internal: 'Internal',
  external: 'External',
  anchor: 'On-page',
  email: 'Email',
  phone: 'Phone',
  other: 'Other',
};

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

const one = (params: Record<string, string | string[] | undefined>, key: string) =>
  typeof params[key] === 'string' ? (params[key] as string) : undefined;

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const site = await requireCurrentSite();
  const graph = await loadLinkGraph(site);

  const view: View = one(params, 'view') === 'links' ? 'links' : 'content';
  const show = one(params, 'show') ?? 'all';
  const kind = one(params, 'kind') ?? 'all';
  const status = one(params, 'status') ?? 'all';
  const search = one(params, 'q')?.trim() ?? '';
  const page = Math.max(1, Number(one(params, 'page') ?? '1') || 1);

  const { totals } = graph;

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Links</h1>
        <p className="text-sm text-slate-500">
          {totals.contentItems} {totals.contentItems === 1 ? 'item' : 'items'} scanned
        </p>
      </div>

      <p className="mt-1 max-w-3xl text-sm text-slate-600">
        Read from the body of every post and page each time this screen loads, so it
        never goes stale — including right after a WordPress import. Internal links are
        checked against what the site actually serves; external ones are listed but not
        fetched.
      </p>

      {graph.truncated ? (
        <p className="mt-3 max-w-3xl rounded border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Showing the {LINK_GRAPH_LIMIT} most recently edited posts and pages. Incoming
          counts below only see links from those, so an older post linking here is not
          counted and something may read as an orphan when it is not.
        </p>
      ) : null}

      <Summary totals={totals} />

      <nav className="mt-8 flex gap-4 border-b border-slate-200 text-sm">
        {(['content', 'links'] as const).map((value) => (
          <Link
            key={value}
            href={`/links${buildQuery({ view: value === 'content' ? undefined : value })}`}
            className={
              view === value
                ? '-mb-px border-b-2 border-slate-900 pb-2 font-semibold'
                : 'pb-2 text-slate-600'
            }
          >
            {value === 'content' ? 'By content' : 'Every link'}
          </Link>
        ))}
      </nav>

      {view === 'content' ? (
        <ContentView graph={graph} site={site} show={show} search={search} />
      ) : (
        <LinksView
          graph={graph}
          kind={kind}
          status={status}
          search={search}
          page={page}
        />
      )}
    </>
  );
}

/**
 * The stat row, every tile a filter.
 *
 * A count you cannot act on is decoration — clicking "3 broken" has to land on
 * those three links, or the number just prompts a hunt through the table.
 */
function Summary({ totals }: { totals: Awaited<ReturnType<typeof loadLinkGraph>>['totals'] }) {
  const tiles: Array<{ label: string; value: number; href: string; alarm?: boolean }> = [
    {
      label: 'Internal links',
      value: totals.internal,
      href: `/links${buildQuery({ view: 'links', kind: 'internal' })}`,
    },
    {
      label: 'External links',
      value: totals.external,
      href: `/links${buildQuery({ view: 'links', kind: 'external' })}`,
    },
    {
      label: 'Broken',
      value: totals.broken,
      href: `/links${buildQuery({ view: 'links', status: 'missing' })}`,
      alarm: totals.broken > 0,
    },
    {
      label: 'Not published',
      value: totals.unpublished,
      href: `/links${buildQuery({ view: 'links', status: 'unpublished' })}`,
      alarm: totals.unpublished > 0,
    },
    {
      label: 'Redirect hops',
      value: totals.redirects,
      href: `/links${buildQuery({ view: 'links', status: 'redirect' })}`,
    },
    {
      label: 'Orphans',
      value: totals.orphans,
      href: `/links${buildQuery({ show: 'orphans' })}`,
      alarm: totals.orphans > 0,
    },
  ];

  return (
    <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map((tile) => (
        <li key={tile.label}>
          <Link
            href={tile.href}
            className="block rounded border border-slate-200 px-3 py-2 hover:border-slate-400"
          >
            <span
              className={`block text-2xl font-semibold tabular-nums ${
                tile.alarm ? 'text-red-700' : 'text-slate-900'
              }`}
            >
              {tile.value}
            </span>
            <span className="block text-xs text-slate-600">{tile.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const CONTENT_TABS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'orphans', label: 'Orphans' },
  { value: 'broken', label: 'With broken links' },
  { value: 'no-internal', label: 'No internal links out' },
  { value: 'posts', label: 'Posts' },
  { value: 'pages', label: 'Pages' },
];

function matchesShow(stats: NodeLinkStats, show: string): boolean {
  switch (show) {
    case 'orphans':
      return stats.orphan;
    case 'broken':
      return stats.brokenOut > 0 || stats.unpublishedOut > 0;
    case 'no-internal':
      return stats.internalOut === 0;
    case 'posts':
      return stats.node.kind === 'post';
    case 'pages':
      return stats.node.kind === 'page';
    default:
      return true;
  }
}

function ContentView({
  graph,
  site,
  show,
  search,
}: {
  graph: Awaited<ReturnType<typeof loadLinkGraph>>;
  site: Awaited<ReturnType<typeof requireCurrentSite>>;
  show: string;
  search: string;
}) {
  const needle = search.toLowerCase();
  const rows = graph.nodes.filter(
    (stats) =>
      matchesShow(stats, show) &&
      (!needle ||
        stats.node.title.toLowerCase().includes(needle) ||
        stats.node.path.toLowerCase().includes(needle)),
  );

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <nav className="flex flex-wrap gap-3 text-sm">
          {CONTENT_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/links${buildQuery({ show: tab.value === 'all' ? undefined : tab.value, q: search || undefined })}`}
              className={show === tab.value ? 'font-semibold underline' : 'text-slate-600'}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <form action="/links" className="ml-auto flex items-center gap-2">
          {show !== 'all' ? <input type="hidden" name="show" value={show} /> : null}
          <label htmlFor="q" className="sr-only">
            Search titles and paths
          </label>
          <input
            id="q"
            name="q"
            defaultValue={search}
            placeholder="Search titles"
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button type="submit" className="rounded border border-slate-300 px-2 py-1 text-sm">
            Filter
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 text-slate-600">
          Nothing matches. {show === 'orphans' ? 'No orphans is the good outcome here.' : null}
        </p>
      ) : (
        /* Same wrapper as Posts and Pages: the table scrolls inside its own box
         * on a narrow window rather than pushing the page sideways. */
        <div className="mt-6 overflow-x-auto rounded border border-slate-300">
          <table className="wp-table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                {/* Right-aligned against .wp-table th's default left, because
                    these are counts and are read by scanning a column. */}
                <th scope="col" className="text-right">
                  Internal out
                </th>
                <th scope="col" className="text-right">
                  External out
                </th>
                <th scope="col" className="text-right">
                  Incoming
                </th>
                <th scope="col">Needs attention</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ node, ...stats }) => (
                <tr key={node.id}>
                  <td>
                    <div className="flex items-start gap-2">
                      <Link href={editHref(node)} className="font-semibold">
                        {node.title}
                      </Link>
                      {/* Same rule as Posts and Pages: no icon for a row that is
                          not served, so it can never lead to a 404. */}
                      {isLive(node) ? (
                        <ViewLiveLink href={pageUrl(site, node.path)} label={node.title} />
                      ) : null}
                    </div>
                    <span className="mr-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      {node.kind}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[node.status]}`}
                    >
                      {node.status}
                    </span>
                    <code className="mt-1 block text-xs text-slate-500">{node.path}</code>
                  </td>

                  <td className="text-right tabular-nums">
                    <Link
                      href={`/links${buildQuery({ view: 'links', kind: 'internal', q: node.title })}`}
                      className={stats.internalOut === 0 ? 'text-slate-400' : undefined}
                    >
                      {stats.internalOut}
                    </Link>
                  </td>
                  <td className="text-right tabular-nums">{stats.externalOut}</td>

                  {/*
                    Incoming counts DISTINCT other items, not anchors — five
                    links from one post is one page vouching for this one, and
                    counting it as five is how an orphan hides. Self-links are
                    excluded for the same reason.
                  */}
                  <td className="text-right tabular-nums">
                    <span className={stats.incoming === 0 ? 'text-red-700' : 'text-slate-900'}>
                      {stats.incoming}
                    </span>
                    {stats.incoming > stats.incomingLive ? (
                      <span
                        className="block text-xs text-slate-500"
                        title="Links from drafts do not help — a crawler cannot see them."
                      >
                        {stats.incomingLive} live
                      </span>
                    ) : null}
                  </td>

                  <td>
                    <div className="flex flex-wrap gap-1">
                      {stats.orphan ? (
                        <span
                          className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-900"
                          title="Nothing on the site links here, so it is reachable only from the sitemap."
                        >
                          orphan
                        </span>
                      ) : null}
                      {stats.brokenOut > 0 ? (
                        <Link
                          href={`/links${buildQuery({ view: 'links', status: 'missing', q: node.title })}`}
                          className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-900"
                        >
                          {stats.brokenOut} broken
                        </Link>
                      ) : null}
                      {stats.unpublishedOut > 0 ? (
                        <Link
                          href={`/links${buildQuery({ view: 'links', status: 'unpublished', q: node.title })}`}
                          className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900"
                        >
                          {stats.unpublishedOut} unpublished
                        </Link>
                      ) : null}
                      {stats.redirectOut > 0 ? (
                        <Link
                          href={`/links${buildQuery({ view: 'links', status: 'redirect', q: node.title })}`}
                          className="rounded bg-sky-100 px-1.5 py-0.5 text-xs font-medium text-sky-900"
                        >
                          {stats.redirectOut} redirected
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 max-w-3xl text-sm text-slate-500">
        An <strong>orphan</strong> has nothing linking to it. It is still in the sitemap, so
        it can be found — but nothing on the site passes it any authority, and a reader who
        lands nearby has no route to it.
      </p>
    </>
  );
}

const KIND_TABS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'internal', label: 'Internal' },
  { value: 'external', label: 'External' },
  { value: 'anchor', label: 'On-page' },
  { value: 'contact', label: 'Email & phone' },
];

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'Any status' },
  { value: 'missing', label: 'Broken' },
  { value: 'unpublished', label: 'Not published' },
  { value: 'redirect', label: 'Redirect hops' },
  { value: 'ok', label: 'Fine' },
];

function matchesKind(link: ContentLink, kind: string): boolean {
  if (kind === 'all') return true;
  if (kind === 'contact') return link.kind === 'email' || link.kind === 'phone';
  return link.kind === kind;
}

function LinksView({
  graph,
  kind,
  status,
  search,
  page,
}: {
  graph: Awaited<ReturnType<typeof loadLinkGraph>>;
  kind: string;
  status: string;
  search: string;
  page: number;
}) {
  const needle = search.toLowerCase();

  const filtered = graph.links.filter(
    (link) =>
      matchesKind(link, kind) &&
      (status === 'all' || link.status === status) &&
      (!needle ||
        link.source.title.toLowerCase().includes(needle) ||
        link.href.toLowerCase().includes(needle) ||
        link.text.toLowerCase().includes(needle)),
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / LINKS_PER_PAGE));
  const clamped = Math.min(page, pageCount);
  const rows = filtered.slice((clamped - 1) * LINKS_PER_PAGE, clamped * LINKS_PER_PAGE);

  const keep = {
    view: 'links',
    kind: kind === 'all' ? undefined : kind,
    status: status === 'all' ? undefined : status,
    q: search || undefined,
  };

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <nav className="flex flex-wrap gap-3 text-sm">
          {KIND_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/links${buildQuery({ ...keep, kind: tab.value === 'all' ? undefined : tab.value, page: undefined })}`}
              className={kind === tab.value ? 'font-semibold underline' : 'text-slate-600'}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <nav className="flex flex-wrap gap-3 text-sm">
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/links${buildQuery({ ...keep, status: tab.value === 'all' ? undefined : tab.value, page: undefined })}`}
              className={
                status === tab.value
                  ? 'font-semibold underline'
                  : 'text-slate-600'
              }
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <form action="/links" className="ml-auto flex items-center gap-2">
          <input type="hidden" name="view" value="links" />
          {kind !== 'all' ? <input type="hidden" name="kind" value={kind} /> : null}
          {status !== 'all' ? <input type="hidden" name="status" value={status} /> : null}
          <label htmlFor="q" className="sr-only">
            Search source, URL or anchor text
          </label>
          <input
            id="q"
            name="q"
            defaultValue={search}
            placeholder="Search source or URL"
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button type="submit" className="rounded border border-slate-300 px-2 py-1 text-sm">
            Filter
          </button>
        </form>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {filtered.length} {filtered.length === 1 ? 'link' : 'links'}
        {status === 'unchecked' || kind === 'external'
          ? ' — external URLs are listed, not fetched, so none of them carry a verdict.'
          : null}
      </p>

      {rows.length === 0 ? (
        <p className="mt-10 text-slate-600">
          No links match. {status === 'missing' ? 'Nothing broken is the good outcome.' : null}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded border border-slate-300">
          <table className="wp-table">
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">Destination</th>
                <th scope="col">Type</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((link) => (
                <tr key={`${link.source.id}\n${link.href}`}>
                  <td>
                    <Link href={editHref(link.source)} className="font-semibold">
                      {link.source.title}
                    </Link>
                    <code className="mt-1 block text-xs text-slate-500">
                      {link.source.path}
                    </code>
                  </td>

                  <td className="max-w-md">
                    <Destination link={link} />
                    {link.text ? (
                      <span className="mt-1 block text-xs text-slate-500">
                        “{link.text}”
                      </span>
                    ) : (
                      <span className="mt-1 block text-xs text-slate-400">
                        no anchor text — an image or icon link
                      </span>
                    )}
                  </td>

                  <td className="whitespace-nowrap">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
                      {KIND_LABELS[link.kind]}
                    </span>
                    {link.nofollow ? (
                      <span
                        className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700"
                        title="rel=nofollow — this link passes no authority."
                      >
                        nofollow
                      </span>
                    ) : null}
                    {link.occurrences > 1 ? (
                      <span
                        className="ml-1 text-xs text-slate-500"
                        title="Times this URL is linked from this one body."
                      >
                        ×{link.occurrences}
                      </span>
                    ) : null}
                  </td>

                  <td className="whitespace-nowrap">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-medium ${LINK_STATUS_STYLES[link.status]}`}
                    >
                      {LINK_STATUS_LABELS[link.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <nav className="mt-6 flex justify-between text-sm">
          {clamped > 1 ? (
            <Link href={`/links${buildQuery({ ...keep, page: String(clamped - 1) })}`}>
              ← Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-slate-500">
            Page {clamped} of {pageCount}
          </span>
          {clamped < pageCount ? (
            <Link href={`/links${buildQuery({ ...keep, page: String(clamped + 1) })}`}>
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}

/**
 * The destination cell.
 *
 * An internal link that resolves to content is a link to the EDITOR, not to the
 * live URL: from this screen the next action is almost always to fix the target
 * or check what is on it. An external one opens the real URL in a new tab.
 */
function Destination({ link }: { link: ContentLink }) {
  const target = link.target;

  if (target?.kind === 'content') {
    return (
      <>
        <Link href={editHref(target.node)} className="font-medium">
          {target.node.title}
        </Link>
        <code className="ml-2 text-xs text-slate-500">{link.href}</code>
      </>
    );
  }

  if (link.kind === 'external') {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="break-all text-slate-800 underline decoration-slate-300"
      >
        {link.url}
      </a>
    );
  }

  return (
    <>
      <code className="break-all text-slate-800">{link.href}</code>
      {target && target.kind !== 'missing' ? (
        <span className="ml-2 text-xs text-slate-500">{target.label}</span>
      ) : null}
      {/*
        A broken link with a plausible fix beside it is a work queue; one
        without is a hunt. This is mostly the imported-WordPress case — every
        old permalink lands one directory above /blog.
      */}
      {target?.kind === 'missing' && target.suggestion ? (
        <span className="mt-1 block text-xs text-slate-600">
          did you mean <code className="text-slate-900">{target.suggestion}</code>?
        </span>
      ) : null}
    </>
  );
}
