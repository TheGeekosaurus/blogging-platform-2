import { PageForm } from '@/components/page-form';
import { requireCurrentSite } from '@/lib/current-site';
import { listParentOptions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function NewPagePage() {
  const site = await requireCurrentSite();
  const parents = await listParentOptions(site.id);

  return (
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
  );
}
