import Image from 'next/image';
import Link from 'next/link';

import {
  blogIndexPath,
  mediaPublicUrl,
  postPath,
  type PostSummary,
  type TermRow,
} from '@blog/core';

/**
 * The "Similar News" row beneath a post: three image-on-top cards.
 *
 * A separate component from <PostCard>, which is the horizontal
 * thumbnail-beside-text card used in the index and archive lists. Same data,
 * different shape — merging them behind a `variant` prop would mean one
 * component with two disjoint layouts and no shared markup worth speaking of.
 *
 * The design puts engagement counts on each card; omitted for the same reason as
 * in the sidebar — there is nothing real to put in them.
 */
export function SimilarPosts({
  posts,
  categoryFor,
}: {
  posts: PostSummary[];
  /** First category per post id, for the label under each title. */
  categoryFor?: Map<string, TermRow>;
}) {
  if (posts.length === 0) return null;

  return (
    <section
      aria-labelledby="similar-heading"
      className="border-t border-[var(--color-blog-line)]"
    >
      <div className="mx-auto w-full max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <h2
            id="similar-heading"
            className="font-[family-name:var(--font-headline)] text-2xl text-[var(--color-blog-ink)] sm:text-3xl"
          >
            Similar News
          </h2>
          <Link
            href={blogIndexPath()}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blog-line)] px-6 py-3 text-sm font-semibold !text-[var(--color-blog-ink)] no-underline transition-colors hover:border-[var(--color-gold)] hover:!text-[var(--color-gold)]"
          >
            View All News
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <ul className="mt-10 grid list-none grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const image = post.featured_image;
            const category = categoryFor?.get(post.id);

            return (
              <li key={post.id} className="flex flex-col gap-5">
                <Link
                  href={postPath(post.slug)}
                  aria-hidden="true"
                  tabIndex={-1}
                  className="block overflow-hidden rounded-xl"
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
                    // Keeps the row's cards the same height when a post has no
                    // image, rather than letting one card ride up.
                    <div className="aspect-[16/10] w-full bg-[var(--color-blog-raised)]" />
                  )}
                </Link>

                <div className="flex flex-col gap-2">
                  <h3 className="font-[family-name:var(--font-headline)] text-lg leading-snug">
                    <Link
                      href={postPath(post.slug)}
                      className="!text-[var(--color-blog-ink)] no-underline hover:!text-[var(--color-gold)]"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  {category ? (
                    <p className="text-sm text-[var(--color-blog-muted)]">{category.name}</p>
                  ) : null}
                </div>

                <Link
                  href={postPath(post.slug)}
                  className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-blog-line)] px-5 py-2.5 text-sm font-semibold !text-[var(--color-blog-ink)] no-underline transition-colors hover:border-[var(--color-gold)] hover:!text-[var(--color-gold)]"
                >
                  Read More
                  <span aria-hidden="true">↗</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
