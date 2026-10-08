import { notFound } from 'next/navigation';

import { isProofPresetIcon } from '@blog/core';

import { deleteProofCampaign } from '@/app/actions/proof-notifications';
import { ProofCampaignForm } from '@/components/proof-campaign-form';
import { PageHeader } from '@/components/ui/page-header';
import { requireCurrentSite } from '@/lib/current-site';
import {
  getProofCampaignForEdit,
  listAllTerms,
  listMediaOptions,
  listPostOptions,
} from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EditProofCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = await requireCurrentSite();

  const [campaign, terms, posts, media] = await Promise.all([
    getProofCampaignForEdit(site.id, id),
    listAllTerms(site.id),
    listPostOptions(site.id),
    listMediaOptions(site.id),
  ]);

  if (!campaign) notFound();

  const { targets } = campaign;
  const idsFor = (scope: string) =>
    targets
      .filter((t) => t.scope === scope && !t.exclude)
      .map((t) => t.term_id ?? t.post_id)
      .filter((value): value is string => Boolean(value));
  const patterns = (exclude: boolean) =>
    targets
      .filter((t) => t.scope === 'path' && t.exclude === exclude && t.pattern)
      .map((t) => t.pattern)
      .join('\n');

  return (
    <div className="space-y-6">
      <PageHeader title={campaign.name} />

      <ProofCampaignForm
        terms={terms}
        posts={posts}
        media={media}
        values={{
          id: campaign.id,
          name: campaign.name,
          active: campaign.active,
          template: campaign.template,
          imageMode: campaign.image_mode,
          presetIcon: isProofPresetIcon(campaign.preset_icon) ? campaign.preset_icon : 'fire',
          imageId: campaign.image_id,
          position: campaign.position,
          showOnMobile: campaign.show_on_mobile,
          initialDelayS: campaign.initial_delay_s,
          displayS: campaign.display_s,
          gapS: campaign.gap_s,
          maxPerView: campaign.max_per_view,
          repeat: campaign.repeat_events,
          frequency: campaign.frequency,
          showTimeAgo: campaign.show_time_ago,
          accent: campaign.accent,
          siteWide: targets.some((t) => t.scope === 'site' && !t.exclude),
          categoryIds: idsFor('category'),
          tagIds: idsFor('tag'),
          postIds: idsFor('post'),
          includePaths: patterns(false),
          excludePaths: patterns(true),
          events: campaign.events.map((event) => ({
            key: event.id,
            id: event.id,
            name: event.name ?? '',
            city: event.city ?? '',
            region: event.region ?? '',
            country: event.country ?? '',
            action: event.action,
            minutesMin: event.minutes_ago_min,
            minutesMax: event.minutes_ago_max,
            link: event.link_url ?? '',
            imageId: event.image_id,
            mapUrl: event.map_url,
            mapPlace: event.map_place,
          })),
        }}
      />

      <section className="mt-10 max-w-2xl border-t border-line pt-5">
        <form action={deleteProofCampaign}>
          <input type="hidden" name="id" value={campaign.id} />
          <button type="submit" className="text-sm text-danger-ink underline">
            Delete this campaign
          </button>
        </form>
        <p className="mt-2 text-sm text-ink-muted">
          Removes its events and targeting. Untick <strong>Live on the site</strong>{' '}
          instead if you might bring it back.
        </p>
      </section>
    </div>
  );
}
