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

import { StatusChip } from '@/components/ui/status-chip';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { clampPage, Pagination } from '@/components/pagination';
import { ViewLiveLink } from '@/components/view-live-link';
import { requireCurrentSite } from '@/lib/current-site';
import { editHref, LINK_GRAPH_LIMIT, loadLinkGraph } from '@/lib/link-graph';
import { ADMIN_PER_PAGE } from '@/lib/queries';

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

/*
 * Both views page at the shared admin size. This view used to show 100 rows,
 * on the reasoning that a link table is scanned rather than read — but it sits
 * next to Posts and Pages in the rail, and a screen that scrolls five times
 * further than its neighbours for no stated reason just reads as broken.
 */
const LINKS_PER_PAGE = ADMIN_PER_PAGE;

type View = 'content' | 'links';

/* Its own statuses, but on the same chips as everything else — see
   components/ui/status-chip.tsx for why these are not raw palette classes. */
const LINK_STATUS_CHIP: Record<LinkStatus, string> = {
  ok: 'chip-success',
  redirect: 'chip-info',
  unpublished: 'chip-warning',
  missing: 'chip-danger',
  unchecked: 'chip-neutral',
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
  /*
   * One `page` key for both views rather than one each. Only one view renders
   * at a time, and the tab links drop the key entirely, so switching tabs
   * always lands on page one — which is what you want, since a page number
   * from a list of links means nothing in a list of content.
   */
  const rawPage = one(params, 'page');

  const { totals } = graph;

  return (
    <>
      <PageHeader
        title="Links"
        actions={
          <p className="text-sm text-ink-muted">
            {totals.contentItems} {totals.contentItems === 1 ? 'item' : 'items'} scanned
          </p>
        }
        description={
          <>
            Read from the body of every post and page each time this screen loads, so it
            never goes stale — including right after a WordPress import. Internal links are
            checked against what the site actually serves; external ones are listed but not
            fetched.
          </>
        }
      />

      {graph.truncated ? (
        <div className="mt-3 max-w-3xl"><Alert tone="warning">
          Showing the {LINK_GRAPH_LIMIT} most recently edited posts and pages. Incoming
          counts below only see links from those, so an older post linking here is not
          counted and something may read as an orphan when it is not.
        </Alert></div>
      ) : null}

      <Summary totals={totals} />

      <nav className="mt-8 flex gap-4 border-b border-line text-sm">
        {(['content', 'links'] as const).map((value) => (
          <Link
            key={value}
            href={`/links${buildQuery({ view: value === 'content' ? undefined : value })}`}
            className={
              view === value
                ? '-mb-px border-b-2 border-ink pb-2 font-semibold'
                : 'pb-2 text-ink-muted'
            }
          >
            {value === 'content' ? 'By content' : 'Every link'}
          </Link>
        ))}
      </nav>

      {view === 'content' ? (
        <ContentView
          graph={graph}
          site={site}
          show={show}
          search={search}
          rawPage={rawPage}
        />
      ) : (
        <LinksView
          graph={graph}
          kind={kind}
          status={status}
          search={search}
          rawPage={rawPage}
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
            className="block rounded border border-line px-3 py-2 hover:border-line"
          >
            <span
              className={`block text-2xl font-semibold tabular-nums ${
                tile.alarm ? 'text-danger-ink' : 'text-ink'
              }`}
            >
              {tile.value}
            </span>
            <span className="block text-xs text-ink-muted">{tile.label}</span>
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
  rawPage,
}: {
  graph: Awaited<ReturnType<typeof loadLinkGraph>>;
  site: Awaited<ReturnType<typeof requireCurrentSite>>;
  show: string;
  search: string;
  rawPage: string | undefined;
}) {
  const needle = search.toLowerCase();
  const filtered = graph.nodes.filter(
    (stats) =>
      matchesShow(stats, show) &&
      (!needle ||
        stats.node.title.toLowerCase().includes(needle) ||
        stats.node.path.toLowerCase().includes(needle)),
  );

  /*
   * Sliced, not queried. The whole graph has to be built to know any incoming
   * count at all — that is what makes an orphan an orphan — so paginating the
   * DATABASE read here would break the numbers rather than save any work. The
   * page size is only about how much lands on screen.
   */
  const pageCount = Math.max(1, Math.ceil(filtered.length / LINKS_PER_PAGE));
  const page = clampPage(rawPage, pageCount);
  const rows = filtered.slice((page - 1) * LINKS_PER_PAGE, page * LINKS_PER_PAGE);

  const keep = {
    show: show === 'all' ? undefined : show,
    q: search || undefined,
  };

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <nav className="flex flex-wrap gap-3 text-sm">
          {CONTENT_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/links${buildQuery({ show: tab.value === 'all' ? undefined : tab.value, q: search || undefined })}`}
              className={show === tab.value ? 'font-semibold underline' : 'text-ink-muted'}
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
            className="field field-sm field-inline"
          />
          <button type="submit" className="field field-sm field-inline">
            Filter
          </button>
        </form>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>
          Nothing matches. {show === 'orphans' ? 'No orphans is the good outcome here.' : null}
        </EmptyState>
      ) : (
        /* Same wrapper as Posts and Pages: the table scrolls inside its own box
         * on a narrow window rather than pushing the page sideways. */
        <DataTable>
          <thead>
            <tr>
              <th scope="col">Title</th>
              {/* Right-aligned against .data-table th's default left, because
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
                  <span className="mr-1 chip chip-neutral">
                    {node.kind}
                  </span>
                  <StatusChip status={node.status} />
                  <code className="mt-1 block text-xs text-ink-muted">{node.path}</code>
                </td>

                <td className="text-right tabular-nums">
                  <Link
                    href={`/links${buildQuery({ view: 'links', kind: 'internal', q: node.title })}`}
                    className={stats.internalOut === 0 ? 'text-ink-muted' : undefined}
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
                  <span className={stats.incoming === 0 ? 'text-danger-ink' : 'text-ink'}>
                    {stats.incoming}
                  </span>
                  {stats.incoming > stats.incomingLive ? (
                    <span
                      className="block text-xs text-ink-muted"
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
                        className="chip chip-danger"
                        title="Nothing on the site links here, so it is reachable only from the sitemap."
                      >
                        orphan
                      </span>
                    ) : null}
                    {stats.brokenOut > 0 ? (
                      <Link
                        href={`/links${buildQuery({ view: 'links', status: 'missing', q: node.title })}`}
                        className="chip chip-danger"
                      >
                        {stats.brokenOut} broken
                      </Link>
                    ) : null}
                    {stats.unpublishedOut > 0 ? (
                      <Link
                        href={`/links${buildQuery({ view: 'links', status: 'unpublished', q: node.title })}`}
                        className="chip chip-warning"
                      >
                        {stats.unpublishedOut} unpublished
                      </Link>
                    ) : null}
                    {stats.redirectOut > 0 ? (
                      <Link
                        href={`/links${buildQuery({ view: 'links', status: 'redirect', q: node.title })}`}
                        className="chip chip-brand"
                      >
                        {stats.redirectOut} redirected
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <Pagination
        basePath="/links"
        page={page}
        pageCount={pageCount}
        total={filtered.length}
        label="item"
        query={keep}
      />

      <p className="mt-6 max-w-3xl text-sm text-ink-muted">
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
  rawPage,
}: {
  graph: Awaited<ReturnType<typeof loadLinkGraph>>;
  kind: string;
  status: string;
  search: string;
  rawPage: string | undefined;
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
  const page = clampPage(rawPage, pageCount);
  const rows = filtered.slice((page - 1) * LINKS_PER_PAGE, page * LINKS_PER_PAGE);

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
              className={kind === tab.value ? 'font-semibold underline' : 'text-ink-muted'}
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
                  : 'text-ink-muted'
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
            className="field field-sm field-inline"
          />
          <button type="submit" className="field field-sm field-inline">
            Filter
          </button>
        </form>
      </div>

      {/* The row count moved into the pager below, which now carries it for
          every table in the admin. This line keeps only what the pager cannot
          say: why a whole column of statuses reads "unchecked". */}
      {status === 'unchecked' || kind === 'external' ? (
        <p className="mt-4 text-sm text-ink-muted">
          External URLs are listed, not fetched, so none of them carry a verdict.
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState>
          No links match. {status === 'missing' ? 'Nothing broken is the good outcome.' : null}
        </EmptyState>
      ) : (
        <DataTable>
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
                  <code className="mt-1 block text-xs text-ink-muted">
                    {link.source.path}
                  </code>
                </td>

                <td className="max-w-md">
                  <Destination link={link} />
                  {link.text ? (
                    <span className="mt-1 block text-xs text-ink-muted">
                      “{link.text}”
                    </span>
                  ) : (
                    <span className="mt-1 block text-xs text-ink-muted">
                      no anchor text — an image or icon link
                    </span>
                  )}
                </td>

                <td className="whitespace-nowrap">
                  <span className="chip chip-neutral">
                    {KIND_LABELS[link.kind]}
                  </span>
                  {link.nofollow ? (
                    <span
                      className="ml-1 chip chip-neutral"
                      title="rel=nofollow — this link passes no authority."
                    >
                      nofollow
                    </span>
                  ) : null}
                  {link.occurrences > 1 ? (
                    <span
                      className="ml-1 text-xs text-ink-muted"
                      title="Times this URL is linked from this one body."
                    >
                      ×{link.occurrences}
                    </span>
                  ) : null}
                </td>

                <td className="whitespace-nowrap">
                  <span className={`chip ${LINK_STATUS_CHIP[link.status]}`}>
                    {LINK_STATUS_LABELS[link.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <Pagination
        basePath="/links"
        page={page}
        pageCount={pageCount}
        total={filtered.length}
        label="link"
        query={keep}
      />
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
        <code className="ml-2 text-xs text-ink-muted">{link.href}</code>
      </>
    );
  }

  if (link.kind === 'external') {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="break-all text-ink underline decoration-line"
      >
        {link.url}
      </a>
    );
  }

  return (
    <>
      <code className="break-all text-ink">{link.href}</code>
      {target && target.kind !== 'missing' ? (
        <span className="ml-2 text-xs text-ink-muted">{target.label}</span>
      ) : null}
      {/*
        A broken link with a plausible fix beside it is a work queue; one
        without is a hunt. This is mostly the imported-WordPress case — every
        old permalink lands one directory above /blog.
      */}
      {target?.kind === 'missing' && target.suggestion ? (
        <span className="mt-1 block text-xs text-ink-muted">
          did you mean <code className="text-ink">{target.suggestion}</code>?
        </span>
      ) : null}
    </>
  );
}
