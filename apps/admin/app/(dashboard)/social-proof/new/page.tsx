import { ProofCampaignForm } from '@/components/proof-campaign-form';
import { PageHeader } from '@/components/ui/page-header';
import { requireCurrentSite } from '@/lib/current-site';
import { listAllTerms, listMediaOptions, listPostOptions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function NewProofCampaignPage() {
  const site = await requireCurrentSite();
  const [terms, posts, media] = await Promise.all([
    listAllTerms(site.id),
    listPostOptions(site.id),
    listMediaOptions(site.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="New social-proof campaign" />
      <ProofCampaignForm
        terms={terms}
        posts={posts}
        media={media}
        values={{
          name: '',
          // On by default, as a new lead magnet is: with no targeting it shows nowhere anyway.
          active: true,
          template: 'pill',
          imageMode: 'preset',
          presetIcon: 'fire',
          imageId: null,
          position: 'bottom-left',
          showOnMobile: true,
          initialDelayS: 5,
          displayS: 6,
          gapS: 8,
          maxPerView: 5,
          repeat: true,
          frequency: 'every_page',
          showTimeAgo: true,
          accent: null,
          siteWide: false,
          categoryIds: [],
          tagIds: [],
          postIds: [],
          includePaths: '',
          excludePaths: '',
          events: [],
        }}
      />
    </div>
  );
}
