import { LeadMagnetForm } from '@/components/lead-magnet-form';
import { requireCurrentSite } from '@/lib/current-site';
import { listAllTerms, listPostOptions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function NewLeadMagnetPage() {
  const site = await requireCurrentSite();
  const [terms, posts] = await Promise.all([
    listAllTerms(site.id),
    listPostOptions(site.id),
  ]);

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">New offer</h1>
      <LeadMagnetForm
        terms={terms}
        posts={posts}
        values={{
          name: '',
          slug: '',
          heading: '',
          body: '',
          buttonLabel: '',
          successMessage: '',
          collectName: false,
          consentText: '',
          assetUrl: '',
          /*
            On by default, unlike a post, which starts as a draft. An offer with
            no targeting rules appears nowhere regardless, so the safe state is
            already the default one — and making a new offer live is otherwise a
            step everybody forgets and then debugs.
          */
          active: true,
          categoryIds: [],
          tagIds: [],
          postIds: [],
          siteWide: false,
        }}
      />
    </>
  );
}
