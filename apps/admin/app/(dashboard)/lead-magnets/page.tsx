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
        <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {magnets.map((magnet) => {
            const leads = leadCounts.get(magnet.id) ?? 0;

            return (
              <li key={magnet.id} className="flex flex-wrap items-center gap-3 py-3">
                <Link href={`/lead-magnets/${magnet.id}`} className="font-medium">
                  {magnet.name}
                </Link>

                {magnet.active ? null : (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    Off
                  </span>
                )}

                {/*
                  Called out rather than left to be inferred from a zero. A saved,
                  live offer that is aimed at nothing renders nowhere and looks
                  from every other column like it is working.
                */}
                {magnet.targetCount === 0 ? (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                    Appears nowhere
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">
                    {magnet.targetCount} {magnet.targetCount === 1 ? 'rule' : 'rules'}
                  </span>
                )}

                <span className="text-sm text-slate-500">
                  {leads} {leads === 1 ? 'lead' : 'leads'}
                </span>

                <code className="text-xs text-slate-400">{magnet.slug}</code>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 max-w-2xl text-sm text-slate-500">
        Retiring an offer? Untick <strong>Live on the site</strong> rather than
        deleting it — that keeps the copy and the targeting so you can bring it back.
        Deleting keeps the leads either way.
      </p>
    </>
  );
}
