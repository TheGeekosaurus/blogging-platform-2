import Image from 'next/image';

import { formatPostDate, mediaPublicUrl, postAuthorName, type PostDetail } from '@blog/core';

/**
 * The author and timing row under a post title.
 *
 * Author on the left — photo, name, role — and the timing on the right, which
 * wraps beneath on a narrow column rather than squeezing.
 *
 * The date is `updated_at`, NOT `published_at`, and it is labelled. An
 * unlabelled date is read as the publish date, which is precisely what this
 * one is not: on an archive post revised today it would claim the post is new.
 * `__tests__/post-header.test.ts` pins both the field and the label, because
 * `published_at` is the obvious thing for the next person to reach for.
 */
export function PostByline({ post, locale }: { post: PostDetail; locale: string }) {
  const author = postAuthorName(post);
  const byline = post.byline;
  const avatar = byline?.avatar ?? null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      {author ? (
        <div className="flex items-center gap-3">
          {avatar ? (
            <Image
              src={mediaPublicUrl(avatar.storage_path)}
              /*
                Empty alt: the name sits beside it, so describing the portrait
                makes a screen reader announce the author twice.
              */
              alt=""
              width={72}
              height={72}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : null}

          <div className="leading-tight">
            <p className="font-semibold text-[var(--color-ink)]">{author}</p>
            {/* Only a record carries a role; a plain-text byline has none. */}
            {byline?.title ? (
              <p className="mt-0.5 text-sm text-[var(--color-ink-muted)]">{byline.title}</p>
            ) : null}
          </div>
        </div>
      ) : (
        <span />
      )}

      <p className="flex flex-wrap items-center gap-x-2 text-sm text-[var(--color-ink-muted)]">
        <span>
          Updated{' '}
          <time dateTime={post.updated_at}>{formatPostDate(post.updated_at, locale)}</time>
        </span>
        {post.reading_minutes ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{post.reading_minutes} min read</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
