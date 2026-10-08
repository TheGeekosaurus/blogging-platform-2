import Link from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
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
      <PageHeader
        title="CTAs"
        actions={
          <Link
            href="/lead-magnets/new"
            className="btn btn-primary"
          >
            New block
          </Link>
        }
        description={
          <>
            Blocks you drop into a post from the editor, or aim at posts with the rules
            below. A block either links somewhere or captures an email address.
          </>
        }
      />

      {magnets.length === 0 ? (
        <EmptyState>
          None yet. <Link href="/lead-magnets/new">Add one</Link>, then choose where it
          appears.
        </EmptyState>
      ) : (
        /*
          `data-table`, like Posts, Pages and Redirects, and `overflow-x-auto` on
          the wrapper rather than the table, so a narrow window scrolls the
          table inside its own box instead of pushing the page sideways.

          This screen started as a <ul> matching Authors, which was the wrong
          neighbour to copy: an author row is a face and a name, while an offer
          carries five independent facts — whether it is live, where it
          appears, how it is performing, and what automations know it as. Those
          are columns, and reading them off a run-on line means comparing two
          offers by counting commas.
        */
        <DataTable>
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
                          className="h-9 w-9 shrink-0 rounded border border-dashed border-line"
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
                      <span className="chip chip-success">
                        live
                      </span>
                    ) : (
                      <span className="chip chip-neutral">
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
                      <span className="chip chip-warning">
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
        </DataTable>
      )}

      <p className="mt-8 max-w-2xl text-sm text-ink-muted">
        Retiring an offer? Untick <strong>Live on the site</strong> rather than
        deleting it — that keeps the copy and the targeting so you can bring it back.
        Deleting keeps the leads either way.
      </p>
    </>
  );
}
