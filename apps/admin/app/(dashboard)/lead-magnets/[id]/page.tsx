import { notFound } from 'next/navigation';

import { EmptyState } from '@/components/ui/empty-state';
import { DataTable } from '@/components/ui/data-table';
import { deleteLeadMagnet } from '@/app/actions/lead-magnets';
import { CtaBuilder } from '@/components/cta-builder/cta-builder';
import { requireCurrentSite } from '@/lib/current-site';
import {
  getLeadMagnetForEdit,
  listAllTerms,
  listMediaOptions,
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

  const [magnet, terms, posts, media] = await Promise.all([
    getLeadMagnetForEdit(site.id, id),
    listAllTerms(site.id),
    listPostOptions(site.id),
    listMediaOptions(site.id),
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

  /* No PageHeader: the builder takes the window and carries its own bar, with
     the block's name where a page title would be. See components/admin-shell. */
  return (
    <CtaBuilder
      terms={terms}
      posts={posts}
      media={media}
      records={<LeadMagnetRecords magnet={magnet} leads={leads} locale={site.locale} />}
      values={{
        id: magnet.id,
        name: magnet.name,
        slug: magnet.slug,
        heading: magnet.heading,
        body: magnet.body ?? '',
        buttonLabel: magnet.button_label,
        successMessage: magnet.success_message,
        collectName: magnet.collect_name,
        imageId: magnet.image_id,
        consentText: magnet.consent_text ?? '',
        assetUrl: magnet.asset_url ?? '',
        kind: magnet.kind,
        href: magnet.href ?? '',
        layout: magnet.layout,
        theme: magnet.theme,
        accentBorder: magnet.accent_border,
        eyebrow: magnet.eyebrow ?? '',
        active: magnet.active,
        categoryIds: idsFor('category'),
        tagIds: idsFor('tag'),
        postIds: idsFor('post'),
      siteWide: targets.some((target) => target.scope === 'site'),
      }}
    />
  );
}

/**
 * What this block has done, and the way to remove it — under the preview in
 * the builder's stage rather than in its sidebar, because they are a record
 * rather than a setting, and a three-column table does not fit in 24rem.
 */
function LeadMagnetRecords({
  magnet,
  leads,
  locale,
}: {
  magnet: NonNullable<Awaited<ReturnType<typeof getLeadMagnetForEdit>>>;
  leads: Awaited<ReturnType<typeof listRecentLeads>>;
  locale: string;
}) {
  return (
    <>
      <section className="mt-12 border-t border-line pt-5">
        <h2 className="text-sm font-semibold">Recent leads</h2>

        {leads.length === 0 ? (
          <EmptyState tight>
            Nothing yet. Note that only owners and admins can read this list — an
            editor sees the offer and an empty table here.
          </EmptyState>
        ) : (
          <>
            {/* `data-table`, the same class Posts and Pages use. It exists so
                the list screens cannot drift apart again; a fourth table with
                its own borders would be the drift. */}
            <DataTable card={false}>
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
                        <span className="text-ink-muted"> · {lead.name}</span>
                      ) : null}
                      {/* A repeat request usually means the first email did not
                          land, which is worth seeing next to the address. */}
                      {lead.submissions > 1 ? (
                        <span className="text-ink-muted"> · ×{lead.submissions}</span>
                      ) : null}
                    </td>
                    <td className="text-ink-muted">{lead.source_path ?? '—'}</td>
                    <td className="whitespace-nowrap text-ink-muted">
                      {new Date(lead.created_at).toLocaleDateString(locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>

            <p className="mt-2 text-sm text-ink-muted">
              The {RECENT_LEADS} most recent. This is a check that capture is
              working, not the mailing list — that lives wherever the webhook sends
              it.
            </p>
          </>
        )}
      </section>

      <section className="mt-10 border-t border-line pt-5">
        <form action={deleteLeadMagnet}>
          <input type="hidden" name="id" value={magnet.id} />
          <button type="submit" className="text-sm text-danger-ink underline">
            Delete this offer
          </button>
        </form>
        <p className="mt-2 text-sm text-ink-muted">
          The leads it collected are kept, tagged with <code>{magnet.slug}</code>. The
          copy and the targeting are not — untick <strong>Live on the site</strong>
          instead if you might bring it back.
        </p>
      </section>
    </>
  );
}
