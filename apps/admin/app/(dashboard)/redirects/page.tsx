import { deleteRedirect } from '@/app/actions/redirects';
import { Pagination, parsePage } from '@/components/pagination';
import { RedirectForm } from '@/components/redirect-form';
import { requireCurrentSite } from '@/lib/current-site';
import { ADMIN_PER_PAGE, listRedirectRows } from '@/lib/queries';

export const dynamic = 'force-dynamic';

/**
 * Redirects.
 *
 * The table and the wiring have existed since 0001 — apps/blog/next.config.ts
 * reads these rows and turns them into Next redirects — but nothing could add
 * one. On a WordPress migration that is the single most consequential gap in
 * the admin: every URL whose shape changed needs a 301, or its accumulated
 * ranking is thrown away rather than passed on.
 */
export default async function RedirectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const site = await requireCurrentSite();
  const page = parsePage(typeof params.page === 'string' ? params.page : undefined);

  const { redirects, total } = await listRedirectRows(site.id, page);
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PER_PAGE));

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Redirects</h1>

      {/*
        Stated plainly because it is the one thing about this screen that
        surprises people: redirects are read at BUILD time, not per request, so
        a new rule is not live until the blog is rebuilt. "Flush cache" does not
        do it — that revalidates pages, and this is routing configuration.
      */}
      <p className="mt-2 max-w-2xl text-sm text-[#50575e]">
        Sends one URL to another. Redirects are compiled into the site when it
        builds, so a new rule goes live on the next deploy — <strong>not</strong>{' '}
        when you flush the cache.
      </p>

      <div className="mt-6 max-w-2xl">
        <RedirectForm />
      </div>

      <div className="mt-10">
        {/* `total`, not the row count: this table is paginated, and a heading
            reading "20 rules" on the first of nine pages is simply wrong. */}
        <h2 className="text-lg font-semibold">
          {total.toLocaleString()} {total === 1 ? 'rule' : 'rules'}
        </h2>

        {total === 0 ? (
          <p className="mt-3 text-sm text-[#50575e]">
            None yet. Add one above for any URL that has moved.
          </p>
        ) : (
          <table className="wp-table mt-3">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Code</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {redirects.map((redirect) => (
                <tr key={redirect.id}>
                  <td className="font-mono text-xs">{redirect.from_path}</td>
                  <td className="font-mono text-xs">{redirect.to_path}</td>
                  <td>{redirect.status_code}</td>
                  <td className="text-right">
                    {/*
                      Its own micro-form per row, matching the Terms screen. A
                      nested <form> is illegal, which is why the add form above
                      is a sibling rather than wrapping this table.
                    */}
                    <form action={deleteRedirect}>
                      <input type="hidden" name="id" value={redirect.id} />
                      <button type="submit" className="text-sm text-red-700 underline">
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <Pagination basePath="/redirects" page={page} pageCount={pageCount} />
      </div>
    </>
  );
}
