import { formatPostDate, type PostDetail } from '@blog/core';

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

      {post.author_name ? <Cell label="Author">{post.author_name}</Cell> : <div />}

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
