import { PostForm } from '@/components/editor/post-form';
import { requireCurrentSite } from '@/lib/current-site';
import { listAllTerms } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const site = await requireCurrentSite();
  const terms = await listAllTerms(site.id);

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">New post</h1>
      <PostForm
        site={site}
        terms={terms}
        values={{
          title: '',
          slug: '',
          excerpt: '',
          content_html: '',
          status: 'draft',
          author_name: '',
          seo_title: '',
          seo_description: '',
          noindex: false,
          termIds: [],
        }}
      />
    </>
  );
}
