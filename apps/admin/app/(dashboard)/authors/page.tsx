import Link from 'next/link';

import { requireCurrentSite } from '@/lib/current-site';
import { countPostsPerAuthor, listAuthors } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AuthorsPage() {
  const site = await requireCurrentSite();
  const [authors, counts] = await Promise.all([
    listAuthors(site.id),
    countPostsPerAuthor(site.id),
  ]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Authors</h1>
        <Link
          href="/authors/new"
          className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          New author
        </Link>
      </div>

      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        A byline with a photo, a bio and links. Attach one to a post from the post
        editor. Posts with no author attached keep showing whatever is typed in their
        Byline field, which is how imported posts keep theirs.
      </p>

      {authors.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">
          None yet. <Link href="/authors/new">Add one</Link>, then attach it to a post.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
          {authors.map((author) => {
            const used = counts.get(author.id) ?? 0;
            const links = Object.keys(author.social ?? {}).length;

            return (
              <li key={author.id} className="flex flex-wrap items-center gap-3 py-3">
                {author.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={author.avatar_url}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="h-9 w-9 shrink-0 rounded-full border border-dashed border-slate-300"
                  />
                )}

                <Link href={`/authors/${author.id}`} className="font-medium">
                  {author.name}
                </Link>

                <span className="text-sm text-slate-500">
                  {used} {used === 1 ? 'post' : 'posts'}
                </span>

                {links > 0 ? (
                  <span className="text-sm text-slate-500">
                    {links} {links === 1 ? 'link' : 'links'}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 max-w-2xl text-sm text-slate-500">
        Deleting an author leaves their posts intact — each falls back to its Byline
        field, so a delete costs the photo and the links, never the writing.
      </p>
    </>
  );
}
