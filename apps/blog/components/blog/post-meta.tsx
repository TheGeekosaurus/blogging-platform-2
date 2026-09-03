import Image from 'next/image';

import {
  formatPostDate,
  mediaPublicUrl,
  postAuthorName,
  type PostDetail,
} from '@blog/core';

/**
 * The metadata grid at the top of the post sidebar.
 *
 * A fixed 2x2 rather than four conditional cells:
 *
 *   Publication Date  |  Reading Time
 *   Author            |  theme control
 *
 * Fixed on purpose. With auto-flow and conditional cells, a post missing its
 * category or author silently reflowed the whole grid and the control slid into
 * a different column — which reads as a bug rather than as a blank field. An
 * empty cell holds the column instead.
 *
 * Category is deliberately absent: it lives under the hero title now, so the
 * link to its archive is more prominent than it was buried here.
 */
function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-sm text-[var(--color-ink-muted)]">{label}</dt>
      <dd className="text-base font-semibold text-[var(--color-ink)]">{children}</dd>
    </div>
  );
}

export function PostMeta({
  post,
  locale,
  themeControl,
}: {
  post: PostDetail;
  locale: string;
  /**
   * Rendered in the second row's right cell. Passed in rather than imported so
   * this stays a presentational server component and the client component's
   * boundary is owned by the page.
   */
  themeControl?: React.ReactNode;
}) {
  /*
   * Through the resolver, never off `author_name` directly: an attached author
   * record wins, and the free-text field is what imported posts still use.
   */
  const author = postAuthorName(post);
  const avatar = post.byline?.avatar ?? null;

  return (
    <dl className="grid grid-cols-2 gap-x-5 gap-y-7">
      <Cell label="Publication Date">
        <time dateTime={post.published_at}>{formatPostDate(post.published_at, locale)}</time>
      </Cell>

      {post.reading_minutes ? (
        <Cell label="Reading Time">{post.reading_minutes} min</Cell>
      ) : (
        <div />
      )}

      {author ? (
        <Cell label="Author">
          {/*
            Sized down from the base cell type. This column is half of a 300px
            rail — roughly 138px — and at the default 16px a two-word name plus
            a 32px portrait wraps mid-name and reads like a mistake. A longer
            name still wraps, which is fine; `leading-tight` keeps it compact
            when it does.
          */}
          <span className="flex items-center gap-2 text-sm leading-tight">
            {avatar ? (
              <Image
                src={mediaPublicUrl(avatar.storage_path)}
                /*
                  Empty alt on purpose: the name is right there in the same
                  cell, so describing the portrait would have a screen reader
                  announce the author twice.
                */
                alt=""
                width={56}
                height={56}
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
            ) : null}
            {author}
          </span>
        </Cell>
      ) : (
        <div />
      )}

      {themeControl ? (
        <div className="flex flex-col gap-1.5">
          {/*
            Hidden from assistive tech, not from sight: the control carries its
            own sr-only <legend> with this same wording, so leaving both in the
            accessibility tree announces "Reading theme" twice.
          */}
          <span aria-hidden="true" className="text-sm text-[var(--color-ink-muted)]">
            Reading theme
          </span>
          {themeControl}
        </div>
      ) : (
        <div />
      )}
    </dl>
  );
}
