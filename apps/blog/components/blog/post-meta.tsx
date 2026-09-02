import Link from 'next/link';

import { categoryPath, formatPostDate, type PostDetail } from '@blog/core';

/**
 * The 2x2 metadata grid at the top of the post sidebar.
 *
 * The design's fifth and sixth cells are engagement counts — likes, views,
 * comments. Those are omitted deliberately: there is no analytics pipeline, no
 * likes feature, and no comment system (the WordPress import skips comments), so
 * any number here would be invented. Dropping them was Denis's call.
 */
function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <dt className="text-sm text-[var(--color-blog-muted)]">{label}</dt>
      <dd className="text-base font-semibold text-[var(--color-blog-ink)]">{children}</dd>
    </div>
  );
}

export function PostMeta({ post, locale }: { post: PostDetail; locale: string }) {
  const category = post.categories[0];

  return (
    <dl className="grid grid-cols-2 gap-x-5 gap-y-7">
      <Cell label="Publication Date">
        <time dateTime={post.published_at}>{formatPostDate(post.published_at, locale)}</time>
      </Cell>

      {category ? (
        <Cell label="Category">
          <Link
            href={categoryPath(category.slug)}
            className="!text-[var(--color-blog-ink)] no-underline hover:!text-[var(--color-gold)]"
          >
            {category.name}
          </Link>
        </Cell>
      ) : null}

      {post.reading_minutes ? (
        <Cell label="Reading Time">{post.reading_minutes} min</Cell>
      ) : null}

      {post.author_name ? <Cell label="Author">{post.author_name}</Cell> : null}
    </dl>
  );
}
