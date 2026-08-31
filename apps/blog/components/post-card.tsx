import Link from 'next/link';

import { excerptFor, formatPostDate, postPath, type PostSummary } from '@blog/core';

/**
 * A post in a list. Deliberately a Server Component with no interactivity —
 * nothing here ships JavaScript to the browser.
 */
export function PostCard({ post, locale }: { post: PostSummary; locale: string }) {
  const summary = excerptFor({ excerpt: post.excerpt, content_html: '' }, 200);

  return (
    <article className="border-b border-[var(--color-line)] pb-8 last:border-b-0">
      <h2 className="text-2xl font-semibold leading-snug tracking-tight">
        <Link
          href={postPath(post.slug)}
          className="!text-[var(--color-ink)] no-underline hover:!text-[var(--color-accent)]"
        >
          {post.title}
        </Link>
      </h2>

      <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
        <time dateTime={post.published_at}>{formatPostDate(post.published_at, locale)}</time>
        {post.author_name ? <> · {post.author_name}</> : null}
        {post.reading_minutes ? <> · {post.reading_minutes} min read</> : null}
      </p>

      {summary ? <p className="mt-3 text-[var(--color-ink-muted)]">{summary}</p> : null}
    </article>
  );
}
