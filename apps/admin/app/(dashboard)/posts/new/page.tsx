import { PostForm } from '@/components/editor/post-form';
import { requireCurrentSite } from '@/lib/current-site';
import { listAllTerms, listAuthorOptions, listMediaOptions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function NewPostPage() {
  const site = await requireCurrentSite();
  const [terms, media, authors] = await Promise.all([
    listAllTerms(site.id),
    listMediaOptions(site.id),
    listAuthorOptions(site.id),
  ]);

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">New post</h1>
      <PostForm
        site={site}
        terms={terms}
        media={media}
        authors={authors}
        values={{
          title: '',
          slug: '',
          excerpt: '',
          content_html: '',
          status: 'draft',
          author_name: '',
          bylineId: null,
          seo_title: '',
          seo_description: '',
          noindex: false,
          structuredData: [],
          termIds: [],
          featuredImageId: null,
        }}
      />
    </>
  );
}
