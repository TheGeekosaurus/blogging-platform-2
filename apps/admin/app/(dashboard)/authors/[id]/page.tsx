import { notFound } from 'next/navigation';

import { deleteAuthor } from '@/app/actions/authors';
import { AuthorForm } from '@/components/author-form';
import { PageHeader } from '@/components/ui/page-header';
import { requireCurrentSite } from '@/lib/current-site';
import { countPostsPerAuthor, getAuthorForEdit, listMediaOptions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EditAuthorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = await requireCurrentSite();

  const [author, media, counts] = await Promise.all([
    getAuthorForEdit(site.id, id),
    listMediaOptions(site.id),
    countPostsPerAuthor(site.id),
  ]);

  if (!author) notFound();

  const used = counts.get(author.id) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title={author.name} />

      <AuthorForm
        media={media}
        values={{
          id: author.id,
          name: author.name,
          title: author.title ?? '',
          slug: author.slug,
          bio: author.bio ?? '',
          avatarId: author.avatar_id,
          social: author.social ?? {},
        }}
      />

      <section className="mt-10 max-w-2xl border-t border-line pt-5">
        <form action={deleteAuthor}>
          <input type="hidden" name="id" value={author.id} />
          <button type="submit" className="text-sm text-danger-ink underline">
            Delete this author
          </button>
        </form>
        <p className="mt-2 text-sm text-ink-muted">
          {used === 0
            ? 'No posts are attached, so nothing else changes.'
            : `${used} ${used === 1 ? 'post falls' : 'posts fall'} back to the Byline field typed on ${used === 1 ? 'it' : 'them'}. The posts themselves are untouched.`}
        </p>
      </section>
    </div>
  );
}
