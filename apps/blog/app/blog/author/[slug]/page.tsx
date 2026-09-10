import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';

import {
  authorPath,
  buildAuthorSchemas,
  getAuthorBySlug,
  listAuthorsWithPosts,
  listPostsByAuthor,
  mediaPublicUrl,
  socialLinks,
  truncateWords,
} from '@blog/core';

import { JsonLd } from '@/components/json-ld';
import { PostCard } from '@/components/post-card';
import { ReadingColumn } from '@/components/reading-column';
import { getClient, getSite } from '@/lib/site';

export const dynamic = 'force-static';
export const revalidate = false;
// `dynamicParams` stays at its default of true, for the same reason every other
// archive here does: pinning it to the build-time params makes any author added
// after the last deploy 404 permanently. See app/blog/[slug]/page.tsx.

/**
 * An author's archive.
 *
 * Only authors with at least one published post get a page. An author record
 * created but never assigned would otherwise be an empty indexable URL — thin
 * content that dilutes the site rather than adding to it — and it would sit in
 * the sitemap advertising itself.
 */
export async function generateStaticParams() {
  const site = await getSite();
  const authors = await listAuthorsWithPosts(getClient(), site.id);
  return authors.map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSite();
  const author = await getAuthorBySlug(getClient(), site.id, decodeURIComponent(slug));
  if (!author) return {};

  /*
   * The bio makes the better description than a template — it is the one string
   * that actually distinguishes one author page from another. Truncated because
   * a bio has no length limit and a meta description does.
   */
  const description = author.bio
    ? truncateWords(author.bio, 160)
    : `Articles by ${author.name}${author.title ? `, ${author.title}` : ''}.`;

  return {
    title: author.name,
    description,
    alternates: { canonical: authorPath(author.slug) },
    openGraph: {
      type: 'profile',
      title: author.name,
      description,
      url: authorPath(author.slug),
    },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getSite();
  const client = getClient();

  const author = await getAuthorBySlug(client, site.id, decodeURIComponent(slug));
  if (!author) {
    notFound();
  }

  const posts = await listPostsByAuthor(client, site.id, author.id, { limit: 50 });

  /*
   * An author with a record but no published posts 404s rather than rendering
   * an empty page. generateStaticParams already excludes them, but this route
   * answers unknown slugs on demand, so the check has to exist here too.
   */
  if (posts.length === 0) {
    notFound();
  }

  const links = socialLinks(author.social);
  const avatarUrl = author.avatar ? mediaPublicUrl(author.avatar.storage_path) : null;

  return (
    <ReadingColumn>
      {/*
        ProfilePage, not a bare Person — see buildAuthorSchemas. `sameAs` comes
        from socialLinks(), which has already dropped anything that is not an
        http(s) URL, so a hand-edited row cannot put a javascript: URL in the
        structured data.
      */}
      <JsonLd
        nodes={buildAuthorSchemas({
          site,
          author,
          sameAs: links.map((link) => link.url),
          imageUrl: avatarUrl,
          postCount: posts.length,
        })}
      />

      <header className="mb-10">
        <p className="text-sm uppercase tracking-wide text-[var(--color-ink-muted)]">Author</p>

        <div className="mt-3 flex flex-wrap items-start gap-5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              /*
                Empty alt: the name is right beside it as an <h1>, so describing
                the photo again would have a screen reader announce the person
                twice.
              */
              alt=""
              width={96}
              height={96}
              className="h-20 w-20 shrink-0 rounded-full object-cover"
            />
          ) : null}

          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">{author.name}</h1>
            {author.title ? (
              <p className="mt-1 text-[var(--color-ink-muted)]">{author.title}</p>
            ) : null}
          </div>
        </div>

        {author.bio ? (
          <p className="mt-5 max-w-2xl leading-[1.7] text-[var(--color-ink-muted)]">
            {author.bio}
          </p>
        ) : null}

        {links.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {links.map((link) => (
              <li key={link.platform}>
                <a href={link.url} rel="me noopener noreferrer" target="_blank">
                  {link.platform}
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="mt-5 text-sm text-[var(--color-ink-muted)]">
          {posts.length} {posts.length === 1 ? 'article' : 'articles'}
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} locale={site.locale} />
        ))}
      </div>
    </ReadingColumn>
  );
}
