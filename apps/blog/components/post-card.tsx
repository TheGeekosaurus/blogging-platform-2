import Image from 'next/image';
import Link from 'next/link';

import {
  excerptFor,
  formatPostDate,
  mediaPublicUrl,
  postPath,
  type PostSummary,
} from '@blog/core';

/**
 * A post in a list. Deliberately a Server Component with no interactivity —
 * nothing here ships JavaScript to the browser.
 */
export function PostCard({ post, locale }: { post: PostSummary; locale: string }) {
  const summary = excerptFor({ excerpt: post.excerpt, content_html: '' }, 200);
  const image = post.featured_image;

  return (
    <article className="flex gap-5 border-b border-[var(--color-line)] pb-8 last:border-b-0">
      {image ? (
        <Link
          href={postPath(post.slug)}
          // Hidden from assistive tech: the heading link below points at the
          // same post, and two links with the same destination read as two
          // separate results.
          aria-hidden="true"
          tabIndex={-1}
          className="hidden shrink-0 sm:block"
        >
          <Image
            src={mediaPublicUrl(image.storage_path)}
            alt=""
            /*
             * Fixed render box with a 3:2 crop. The source's own dimensions are
             * passed so Next can pick a sensible srcset, but the box is fixed so
             * a portrait and a landscape thumbnail do not give neighbouring
             * cards different heights.
             */
            width={image.width ?? 240}
            height={image.height ?? 160}
            placeholder={image.blur_data_url ? 'blur' : 'empty'}
            blurDataURL={image.blur_data_url ?? undefined}
            className="h-[7.5rem] w-[11.25rem] rounded-lg object-cover"
            sizes="180px"
          />
        </Link>
      ) : null}

      <div className="min-w-0">
        <h2 className="text-2xl font-semibold leading-snug tracking-tight">
          <Link
            href={postPath(post.slug)}
            className="!text-[var(--color-ink)] no-underline hover:!text-[var(--color-accent)]"
          >
            {post.title}
          </Link>
        </h2>

        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          <time dateTime={post.published_at}>
            {formatPostDate(post.published_at, locale)}
          </time>
          {post.author_name ? <> · {post.author_name}</> : null}
          {post.reading_minutes ? <> · {post.reading_minutes} min read</> : null}
        </p>

        {summary ? <p className="mt-3 text-[var(--color-ink-muted)]">{summary}</p> : null}
      </div>
    </article>
  );
}
