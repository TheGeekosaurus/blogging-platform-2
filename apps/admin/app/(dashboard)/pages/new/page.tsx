import { PageForm } from '@/components/page-form';
import { PageHeader } from '@/components/ui/page-header';
import { requireCurrentSite } from '@/lib/current-site';
import { listParentOptions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function NewPagePage() {
  const site = await requireCurrentSite();
  const parents = await listParentOptions(site.id);

  return (
    <div className="space-y-6">
      <PageHeader title="New page" />
      <PageForm
        site={site}
        parents={parents}
        values={{
          title: '',
          slug: '',
          parent_id: '',
          template: 'prose',
          status: 'draft',
          content_html: '',
          seo_title: '',
          seo_description: '',
          noindex: false,
          structuredData: [],
        }}
      />
    </div>
  );
}
