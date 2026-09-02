import { notFound } from 'next/navigation';

import { deletePost } from '@/app/actions/posts';
import { PostForm } from '@/components/editor/post-form';
import { requireCurrentSite } from '@/lib/current-site';
import { getPostForEdit, listAllTerms, listMediaOptions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = await requireCurrentSite();

  const [post, terms, media] = await Promise.all([
    getPostForEdit(site.id, id),
    listAllTerms(site.id),
    listMediaOptions(site.id),
  ]);

  if (!post) notFound();

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Edit post</h1>

      <PostForm
        site={site}
        terms={terms}
        media={media}
        values={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? '',
          content_html: post.content_html,
          status: post.status,
          author_name: post.author_name ?? '',
          seo_title: post.seo_title ?? '',
          seo_description: post.seo_description ?? '',
          noindex: post.noindex,
          termIds: post.termIds,
          featuredImageId: post.featured_image_id,
        }}
      />

      <form
        action={deletePost}
        className="mt-10 border-t border-slate-200 pt-5"
      >
        <input type="hidden" name="id" value={post.id} />
        <input type="hidden" name="slug" value={post.slug} />
        <button type="submit" className="text-sm text-red-700 underline">
          Delete this post
        </button>
      </form>
    </>
  );
}
