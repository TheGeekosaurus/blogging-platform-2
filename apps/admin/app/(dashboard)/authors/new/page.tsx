import { AuthorForm } from '@/components/author-form';
import { PageHeader } from '@/components/ui/page-header';
import { requireCurrentSite } from '@/lib/current-site';
import { listMediaOptions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function NewAuthorPage() {
  const site = await requireCurrentSite();
  const media = await listMediaOptions(site.id);

  return (
    <div className="space-y-6">
      <PageHeader title="New author" />
      <AuthorForm
        media={media}
        values={{ name: '', title: '', slug: '', bio: '', avatarId: null, social: {} }}
      />
    </div>
  );
}
