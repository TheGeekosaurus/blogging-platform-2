import Link from 'next/link';

/**
 * The pager under every long table in the admin.
 *
 * Extracted when the fourth screen needed one. The Posts nav was copied by
 * hand up to that point, and each copy rebuilt the query string inline — which
 * is where the bug lives: drop one filter key from the href and paging silently
 * resets the reader's filters instead of moving them a page. Taking `query` as
 * a record and serialising it in one place means a caller cannot forget a key
 * it already has.
 *
 * Total count rather than just "next/previous": knowing there are 40 pages of
 * broken links is the difference between a problem and a catastrophe, and it
 * costs nothing — every caller is already computing the count to paginate at
 * all.
 */
export interface PaginationProps {
  /** Path this pager links to, no query string — '/posts', '/links'. */
  basePath: string;
  /** 1-based, already clamped by the caller. */
  page: number;
  pageCount: number;
  /**
   * Every other search param to carry across, WITHOUT `page` — this owns that
   * key. Falsy values are dropped, so callers can pass `undefined` for "no
   * filter" rather than branching at each call site.
   */
  query?: Record<string, string | undefined>;
  /**
   * Row noun for the summary, singular. 'post' gives "1,203 posts".
   * Omit to show only the page position.
   */
  label?: string;
  /** Total rows across all pages, for the summary. */
  total?: number;
  /**
   * Direction words. Posts reads newest-first, so 'Newer'/'Older' is clearer
   * there than 'Previous'/'Next'; a path-ordered table wants the default.
   */
  prevLabel?: string;
  nextLabel?: string;
}

function href(
  basePath: string,
  query: Record<string, string | undefined>,
  page: number,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    /*
     * `page` is this component's, and is dropped even if a caller passes one —
     * a screen that spreads its own searchParams into `query` otherwise leaks
     * the CURRENT page in, and `set()` would not clear it on the page-1 link
     * below. The reader would then be unable to get back to page one.
     */
    if (key === 'page') continue;
    if (value) search.set(key, value);
  }
  // Page 1 is the bare path: a shareable URL with no ?page=1 noise, and it
  // matches what every "first page" link elsewhere in the admin produces.
  if (page > 1) search.set('page', String(page));

  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  basePath,
  page,
  pageCount,
  query = {},
  label,
  total,
  prevLabel = '← Previous',
  nextLabel = 'Next →',
}: PaginationProps) {
  // One page is not a pager. The count still belongs on screen, though — a
  // reader looking at 12 rows should not have to wonder whether that is all of
  // them, which is exactly the doubt an absent total creates.
  const summary =
    label && total !== undefined
      ? `${total.toLocaleString()} ${total === 1 ? label : `${label}s`}`
      : null;

  if (pageCount <= 1) {
    return summary ? <p className="mt-4 text-sm text-slate-500">{summary}</p> : null;
  }

  return (
    <nav
      className="mt-6 flex items-center justify-between gap-3 text-sm"
      aria-label="Pagination"
    >
      {/* Empty spans, not a conditional flex change: they hold the three slots
          so the position text stays centred on the first and last page. */}
      {page > 1 ? (
        <Link href={href(basePath, query, page - 1)} rel="prev">
          {prevLabel}
        </Link>
      ) : (
        <span />
      )}

      <span className="text-slate-500">
        {summary ? `${summary} — ` : ''}page {page} of {pageCount}
      </span>

      {page < pageCount ? (
        <Link href={href(basePath, query, page + 1)} rel="next">
          {nextLabel}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

/**
 * Read a `?page=` value, before the row count is known.
 *
 * This is the one a DATABASE-paginated screen needs: the page number decides
 * the range to select, so it has to be settled before the query that would
 * reveal how many pages there are. Junk resolves to 1; a number past the end
 * selects an empty range, and the screen's own "nothing matches" copy covers
 * that better than a redirect would.
 */
export function parsePage(raw: string | undefined): number {
  const parsed = Number(raw ?? '1');
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
}

/**
 * Clamp a `?page=` value to a page that exists.
 *
 * For a screen paginating a list it ALREADY holds in memory — the link graph —
 * where the count is known up front. `?page=99` on a two-page list shows page
 * two rather than an empty table, which would otherwise be indistinguishable
 * from "you have no links".
 */
export function clampPage(raw: string | undefined, pageCount: number): number {
  return Math.min(parsePage(raw), Math.max(1, pageCount));
}
