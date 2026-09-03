import { AuthorForm } from '@/components/author-form';
import { requireCurrentSite } from '@/lib/current-site';
import { listMediaOptions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function NewAuthorPage() {
  const site = await requireCurrentSite();
  const media = await listMediaOptions(site.id);

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">New author</h1>
      <AuthorForm
        media={media}
        values={{ name: '', title: '', slug: '', bio: '', avatarId: null, social: {} }}
      />
    </>
  );
}
