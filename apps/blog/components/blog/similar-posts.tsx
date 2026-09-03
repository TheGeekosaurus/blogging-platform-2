import Image from 'next/image';
import Link from 'next/link';

import {
  blogIndexPath,
  categoryPath,
  excerptFor,
  formatPostDate,
  mediaPublicUrl,
  postAuthorName,
  postPath,
  type PostSummary,
} from '@blog/core';

/**
 * The "Similar News" row beneath a post.
 *
 * Card order, from the reference: thumbnail, category and reading time,
 * title, excerpt, rule, then the author opposite the updated date.
 *
 * A separate component from <PostCard>, which is the horizontal
 * thumbnail-beside-text card the index and archives use. Same data, different
 * shape — merging them behind a `variant` prop would mean one component with
 * two disjoint layouts and no shared markup worth speaking of.
 *
 * Each card reads its OWN category. It used to be handed a map built from the
 * current post's category for every entry, so all three showed the same one
 * whatever they were filed under — invisible while the label was small print,
 * and wrong now it leads the card.
 */
export function SimilarPosts({ posts, locale }: { posts: PostSummary[]; locale: string }) {
  if (posts.length === 0) return null;

  return (
    /*
      No top border. The post section above closes itself now — it has to, so
      the frame still shuts on a post with no related posts, where this
      component renders nothing at all. Drawing one here as well stacked two
      1px strokes into a 2px line, which is the same doubled-rule bug as
      before, just tight enough that only a measurement caught it.
    */
    <section aria-labelledby="similar-heading">
      <div className="mx-auto w-full max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <h2
            id="similar-heading"
            className="font-[family-name:var(--font-headline)] text-2xl text-[var(--color-ink)] sm:text-3xl"
          >
            Similar News
          </h2>
          <Link
            href={blogIndexPath()}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-6 py-3 text-sm font-semibold !text-[var(--color-ink)] no-underline transition-colors hover:border-[var(--color-accent)] hover:!text-[var(--color-accent)]"
          >
            View All News
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <ul className="mt-10 grid list-none grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const image = post.featured_image;
            const category = post.categories[0];
            const author = postAuthorName(post);
            const avatar = post.byline?.avatar ?? null;
            const summary = excerptFor({ excerpt: post.excerpt, content_html: '' }, 130);

            return (
              <li
                key={post.id}
                className="flex flex-col overflow-hidden rounded-xl border border-[var(--color-line)]"
              >
                <Link
                  href={postPath(post.slug)}
                  /*
                    Hidden from assistive tech: the title below links to the same
                    post, and two links to one destination read as two results.
                  */
                  aria-hidden="true"
                  tabIndex={-1}
                  className="block"
                >
                  {image ? (
                    <Image
                      src={mediaPublicUrl(image.storage_path)}
                      alt=""
                      width={image.width ?? 800}
                      height={image.height ?? 500}
                      placeholder={image.blur_data_url ? 'blur' : 'empty'}
                      blurDataURL={image.blur_data_url ?? undefined}
                      className="aspect-[16/10] w-full object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    // Holds the row's cards level when one post has no image,
                    // rather than letting it ride up beside the others.
                    <div className="aspect-[16/10] w-full bg-[var(--color-surface-muted)]" />
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    {category ? (
                      <Link
                        href={categoryPath(category.slug)}
                        className="font-semibold uppercase tracking-[0.12em] !text-[var(--color-accent)] no-underline"
                      >
                        {category.name}
                      </Link>
                    ) : (
                      <span />
                    )}

                    {post.reading_minutes ? (
                      <span className="flex shrink-0 items-center gap-1.5 text-[var(--color-ink-muted)]">
                        <ClockIcon />
                        {post.reading_minutes} min
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 font-[family-name:var(--font-headline)] text-lg leading-snug">
                    <Link
                      href={postPath(post.slug)}
                      className="!text-[var(--color-ink)] no-underline hover:!text-[var(--color-accent)]"
                    >
                      {post.title}
                    </Link>
                  </h3>

                  {summary ? (
                    <p className="mt-2 text-sm leading-[1.6] text-[var(--color-ink-muted)]">
                      {summary}
                    </p>
                  ) : null}

                  {/* `mt-auto` pins the byline to the card foot, so a short
                      excerpt does not leave it floating mid-card. The cards sit
                      in a grid, so they are all as tall as the tallest. */}
                  <div className="mt-auto flex items-end justify-between gap-3 border-t border-[var(--color-line)] pt-4">
                    {author ? (
                      <div className="flex min-w-0 items-center gap-2.5">
                        {avatar ? (
                          <Image
                            src={mediaPublicUrl(avatar.storage_path)}
                            alt=""
                            width={64}
                            height={64}
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : null}
                        <div className="min-w-0 leading-tight">
                          <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                            {author}
                          </p>
                          {post.byline?.title ? (
                            <p className="truncate text-xs text-[var(--color-ink-muted)]">
                              {post.byline.title}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <span />
                    )}

                    <p className="shrink-0 text-xs text-[var(--color-ink-muted)]">
                      <time dateTime={post.updated_at}>
                        {formatPostDate(post.updated_at, locale)}
                      </time>
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <circle cx="8" cy="8" r="6.2" />
      <path d="M8 4.6V8l2.4 1.6" strokeLinecap="round" />
    </svg>
  );
}
