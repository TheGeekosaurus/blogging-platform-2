import Link from 'next/link';

import { requireCurrentSite } from '@/lib/current-site';
import { countLeadsPerMagnet, listLeadMagnets } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function LeadMagnetsPage() {
  const site = await requireCurrentSite();
  const [magnets, leadCounts] = await Promise.all([
    listLeadMagnets(site.id),
    countLeadsPerMagnet(site.id),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Lead magnets</h1>
        <Link
          href="/lead-magnets/new"
          className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          New offer
        </Link>
      </div>

      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        A card in the sidebar of a post, offering something in exchange for an email
        address. Aim each one at the posts it belongs on — where several match, the
        most specific wins and only one is ever shown.
      </p>

      {magnets.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">
          None yet. <Link href="/lead-magnets/new">Add one</Link>, then choose where it
          appears.
        </p>
      ) : (
        /*
          `wp-table`, like Posts, Pages and Redirects, and `overflow-x-auto` on
          the wrapper rather than the table, so a narrow window scrolls the
          table inside its own box instead of pushing the page sideways.

          This screen started as a <ul> matching Authors, which was the wrong
          neighbour to copy: an author row is a face and a name, while an offer
          carries five independent facts — whether it is live, where it
          appears, how it is performing, and what automations know it as. Those
          are columns, and reading them off a run-on line means comparing two
          offers by counting commas.
        */
        <div className="mt-6 overflow-x-auto rounded border border-slate-300">
          <table className="wp-table">
            <thead>
              <tr>
                <th scope="col">Offer</th>
                <th scope="col">Status</th>
                <th scope="col">Appears on</th>
                <th scope="col">Leads</th>
                <th scope="col">Key</th>
              </tr>
            </thead>
            <tbody>
              {magnets.map((magnet) => {
                const leads = leadCounts.get(magnet.id) ?? 0;

                return (
                  <tr key={magnet.id}>
                    <td>
                      <div className="flex items-start gap-2">
                        {magnet.image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={magnet.image_url}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="h-9 w-9 shrink-0 rounded border border-dashed border-slate-300"
                          />
                        )}
                        <Link
                          href={`/lead-magnets/${magnet.id}`}
                          className="font-semibold"
                        >
                          {magnet.name}
                        </Link>
                      </div>
                    </td>

                    <td className="whitespace-nowrap">
                      {magnet.active ? (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-900">
                          live
                        </span>
                      ) : (
                        <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-700">
                          off
                        </span>
                      )}
                    </td>

                    {/*
                      Called out rather than left to be inferred from a zero. A
                      saved, live offer aimed at nothing renders nowhere and
                      looks, from every other column, like it is working.
                    */}
                    <td className="whitespace-nowrap">
                      {magnet.targetCount === 0 ? (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900">
                          nowhere
                        </span>
                      ) : (
                        `${magnet.targetCount} ${magnet.targetCount === 1 ? 'rule' : 'rules'}`
                      )}
                    </td>

                    <td className="whitespace-nowrap">{leads}</td>

                    <td>
                      <code className="text-xs">{magnet.slug}</code>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 max-w-2xl text-sm text-slate-500">
        Retiring an offer? Untick <strong>Live on the site</strong> rather than
        deleting it — that keeps the copy and the targeting so you can bring it back.
        Deleting keeps the leads either way.
      </p>
    </>
  );
}
