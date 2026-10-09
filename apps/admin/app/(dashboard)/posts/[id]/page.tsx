import { notFound } from 'next/navigation';

import { deletePost } from '@/app/actions/posts';
import { PostForm } from '@/components/editor/post-form';
import { requireCurrentSite } from '@/lib/current-site';
import { snippetsToText } from '@/lib/structured-data';
import {
  getPostForEdit,
  listCtaBlockViews,
  listAllTerms,
  listAuthorOptions,
  listMediaOptions,
} from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = await requireCurrentSite();

  const [post, terms, media, authors, ctaBlocks] = await Promise.all([
    getPostForEdit(site.id, id),
    listAllTerms(site.id),
    listMediaOptions(site.id),
    listAuthorOptions(site.id),
    listCtaBlockViews(site.id),
  ]);

  if (!post) notFound();

  /* No PageHeader: the editor takes the window and carries its own bar, with
     the post's title where a page title would be. See components/workspace. */
  return (
    <PostForm
      danger={
        /*
          Rendered here and passed in, so it is a SIBLING of the editor's form
          rather than a child — HTML does not nest forms, and the parser would
          turn this button into a second Save.
        */
        <form action={deletePost} className="builder-danger">
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="slug" value={post.slug} />
          <button type="submit" className="text-sm text-danger-ink underline">
            Delete this post
          </button>
          <p className="hint mt-1">
            Gone for good, along with its body. Set the status to{' '}
            <strong>Archived</strong> instead to take it off the site and keep it.
          </p>
        </form>
      }
        site={site}
        terms={terms}
        media={media}
        authors={authors}
        ctaBlocks={ctaBlocks}
        values={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? '',
          content_html: post.content_html,
          status: post.status,
          author_name: post.author_name ?? '',
          bylineId: post.byline_id,
          seo_title: post.seo_title ?? '',
          seo_description: post.seo_description ?? '',
          noindex: post.noindex,
          structuredData: snippetsToText(post.structured_data),
          termIds: post.termIds,
          featuredImageId: post.featured_image_id,
        }}
    />
  );
}
