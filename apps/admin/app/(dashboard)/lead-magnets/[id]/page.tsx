import { notFound } from 'next/navigation';

import { deleteLeadMagnet } from '@/app/actions/lead-magnets';
import { LeadMagnetForm } from '@/components/lead-magnet-form';
import { requireCurrentSite } from '@/lib/current-site';
import {
  getLeadMagnetForEdit,
  listAllTerms,
  listPostOptions,
  listRecentLeads,
  RECENT_LEADS,
} from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EditLeadMagnetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = await requireCurrentSite();

  const [magnet, terms, posts] = await Promise.all([
    getLeadMagnetForEdit(site.id, id),
    listAllTerms(site.id),
    listPostOptions(site.id),
  ]);

  if (!magnet) notFound();

  // After the notFound() above, so a missing offer does not run a lead query
  // for an id that is not this site's.
  const leads = await listRecentLeads(site.id, magnet.id);

  const targets = magnet.targets ?? [];
  const idsFor = (scope: string) =>
    targets
      .filter((target) => target.scope === scope)
      .map((target) => target.term_id ?? target.post_id)
      .filter((value): value is string => Boolean(value));

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">{magnet.name}</h1>

      <LeadMagnetForm
        terms={terms}
        posts={posts}
        values={{
          id: magnet.id,
          name: magnet.name,
          slug: magnet.slug,
          heading: magnet.heading,
          body: magnet.body ?? '',
          buttonLabel: magnet.button_label,
          successMessage: magnet.success_message,
          collectName: magnet.collect_name,
          consentText: magnet.consent_text ?? '',
          assetUrl: magnet.asset_url ?? '',
          active: magnet.active,
          categoryIds: idsFor('category'),
          tagIds: idsFor('tag'),
          postIds: idsFor('post'),
          siteWide: targets.some((target) => target.scope === 'site'),
        }}
      />

      <section className="mt-10 max-w-2xl border-t border-slate-200 pt-5">
        <h2 className="text-sm font-semibold">Recent leads</h2>

        {leads.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Nothing yet. Note that only owners and admins can read this list — an
            editor sees the offer and an empty table here.
          </p>
        ) : (
          <>
            {/* `wp-table`, the same class Posts and Pages use. It exists so
                the list screens cannot drift apart again; a fourth table with
                its own borders would be the drift. */}
            <table className="wp-table mt-3">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>From</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      {lead.email}
                      {lead.name ? (
                        <span className="text-slate-500"> · {lead.name}</span>
                      ) : null}
                      {/* A repeat request usually means the first email did not
                          land, which is worth seeing next to the address. */}
                      {lead.submissions > 1 ? (
                        <span className="text-slate-500"> · ×{lead.submissions}</span>
                      ) : null}
                    </td>
                    <td className="text-slate-500">{lead.source_path ?? '—'}</td>
                    <td className="whitespace-nowrap text-slate-500">
                      {new Date(lead.created_at).toLocaleDateString(site.locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-2 text-sm text-slate-500">
              The {RECENT_LEADS} most recent. This is a check that capture is
              working, not the mailing list — that lives wherever the webhook sends
              it.
            </p>
          </>
        )}
      </section>

      <section className="mt-10 max-w-2xl border-t border-slate-200 pt-5">
        <form action={deleteLeadMagnet}>
          <input type="hidden" name="id" value={magnet.id} />
          <button type="submit" className="text-sm text-red-700 underline">
            Delete this offer
          </button>
        </form>
        <p className="mt-2 text-sm text-slate-500">
          The leads it collected are kept, tagged with <code>{magnet.slug}</code>. The
          copy and the targeting are not — untick <strong>Live on the site</strong>
          instead if you might bring it back.
        </p>
      </section>
    </>
  );
}
