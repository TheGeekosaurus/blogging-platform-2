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
  type TermRow,
} from '@blog/core';

import { GrowthIcon } from './icons';
import { CONTAINER, GhostButton } from './primitives';

/*
 * The blog list, and the pieces that draw a post when it is missing artwork or
 * a headshot.
 *
 * One row of the design's post list, plus the category pills over it. Both were
 * the homepage's until /blog wanted exactly the same list under its own hero,
 * which is the same trigger primitives.tsx and shared-sections.tsx follow — the
 * alternative was two copies of a layout that has to stay identical, since the
 * whole point of the /blog list is that it continues the one on the homepage.
 *
 * RayBurst lives here rather than with the homepage's hero because ImageSlot is
 * the only thing that draws it, and ImageSlot belongs to a post card.
 */

/**
 * An initial disc standing in for a headshot, on blog posts whose author has no
 * avatar on record.
 *
 * The hue is derived from the name so a given person is always the same colour,
 * and the arithmetic is pure — no randomness, which would differ between the
 * server and client renders and trip hydration.
 */
export function Avatar({ name, className = 'h-10 w-10 text-sm' }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('');
  const hue = [...name].reduce((total, char) => total + char.charCodeAt(0), 0) % 360;

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium text-[var(--ft-ink)] ring-1 ring-white/15 ${className}`}
      style={{ backgroundColor: `hsl(${hue} 8% 30%)` }}
    >
      {initials}
    </span>
  );
}

/**
 * The ray burst behind the hero, and the fill for a post with no image.
 *
 * Generated at module scope from a deterministic hash so the server and client
 * draw identical markup. `Math.random()` here would hydrate-mismatch every load.
 */
const RAYS = Array.from({ length: 130 }, (_, i) => {
  const hash = (n: number) => {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  };
  const spread = -0.5 + (i / 129) * 1.9; // radians, fanning right and down
  const angle = spread + (hash(i) - 0.5) * 0.06;
  const length = 55 + hash(i + 500) * 75;
  return {
    x2: 2 + Math.cos(angle) * length,
    y2: 18 + Math.sin(angle) * length,
    opacity: 0.06 + hash(i + 900) * 0.5,
    width: 0.07 + hash(i + 1300) * 0.28,
  };
});

function RayBurst({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 60"
      preserveAspectRatio="xMinYMid slice"
      className={`ft-rays ${className ?? ''}`}
      aria-hidden="true"
    >
      {RAYS.map((ray, i) => (
        <line
          key={i}
          x1="2"
          y1="18"
          x2={ray.x2}
          y2={ray.y2}
          stroke="#ffffff"
          strokeWidth={ray.width}
          opacity={ray.opacity}
        />
      ))}
    </svg>
  );
}

/** Stands in for a post's featured image when it has none. */
export function ImageSlot({ className }: { className?: string }) {
  return (
    <div
      className={`relative isolate flex items-center justify-center overflow-hidden rounded-xl border border-[var(--ft-line)] bg-[linear-gradient(135deg,#1f1f22,#141414_60%)] ${className ?? ''}`}
    >
      <RayBurst className="absolute inset-0 h-full w-full opacity-[0.18]" />
      <GrowthIcon className="relative h-16 w-16 text-[var(--ft-accent)] opacity-30" />
    </div>
  );
}

/**
 * The category pills over the list.
 *
 * Links to the archives, not tabs — see the note inside. `all` is where "All"
 * points; the homepage sends it to /blog, and /blog sends it to itself so the
 * row still reads as a complete set of filters rather than losing its first
 * item on the one page where it is already true.
 */
export function CategoryPills({
  categories,
  all = blogIndexPath(),
}: {
  categories: readonly TermRow[];
  all?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <nav aria-label="Post categories" className="border-b border-[var(--ft-line)]">
      <ul className={`${CONTAINER} flex flex-wrap gap-4 py-10`}>
        <li>
          <Link
            href={all}
            className="inline-block rounded-[42px] bg-[var(--ft-bg)] px-7 py-3.5 text-[0.9375rem] font-medium text-[var(--ft-ink)] ring-1 ring-[var(--ft-line)] transition-colors hover:ring-[var(--ft-accent)]"
          >
            All
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={categoryPath(category.slug)}
              className="inline-block rounded-[42px] px-7 py-3.5 text-[0.9375rem] text-[var(--ft-muted)] ring-1 ring-[var(--ft-line)] transition-colors hover:text-[var(--ft-ink)] hover:ring-[var(--ft-accent)]"
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** One post in the list: author on the left, the post in the middle, CTA right. */
export function PostRow({ post, locale }: { post: PostSummary; locale: string }) {
  const image = post.featured_image;
  const author = postAuthorName(post);
  const avatar = post.byline?.avatar ?? null;

  return (
    <article className="border-b border-[var(--ft-line)]">
      <div
        className={`${CONTAINER} grid gap-8 py-12 lg:grid-cols-[minmax(0,0.6fr)_minmax(0,1.7fr)_auto] lg:items-start lg:gap-14 lg:py-16`}
      >
        <div>
          {/*
           * `aria-hidden` + `tabIndex={-1}`, as post-card.tsx does: the
           * title below already links to the same place, and a screen
           * reader should not meet the post twice.
           */}
          <Link href={postPath(post.slug)} aria-hidden="true" tabIndex={-1}>
            {image ? (
              <Image
                src={mediaPublicUrl(image.storage_path)}
                alt=""
                width={image.width ?? 480}
                height={image.height ?? 360}
                placeholder={image.blur_data_url ? 'blur' : 'empty'}
                blurDataURL={image.blur_data_url ?? undefined}
                sizes="(min-width: 1024px) 300px, 100vw"
                className="aspect-[4/3] w-full rounded-xl object-cover"
              />
            ) : (
              <ImageSlot className="aspect-[4/3] w-full" />
            )}
          </Link>

          {author ? (
            <div className="mt-5 flex items-center gap-3">
              {avatar ? (
                <Image
                  src={mediaPublicUrl(avatar.storage_path)}
                  alt=""
                  width={72}
                  height={72}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
              ) : (
                <Avatar name={author} className="h-9 w-9 text-xs" />
              )}
              <div className="leading-tight">
                <p className="font-medium text-[var(--ft-ink)]">{author}</p>
                {/* Only an author record carries a role; a plain-text byline has none. */}
                {post.byline?.title ? (
                  <p className="mt-0.5 text-sm text-[var(--ft-muted)]">{post.byline.title}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <p className="font-medium text-[var(--ft-muted)]">
            <time dateTime={post.published_at}>
              {formatPostDate(post.published_at, locale)}
            </time>
          </p>
          <h3 className="mt-3 text-[1.5rem] font-semibold leading-[1.25] text-[var(--ft-ink)]">
            <Link href={postPath(post.slug)} className="hover:text-[var(--ft-accent)]">
              {post.title}
            </Link>
          </h3>
          <p className="mt-3 max-w-[70ch] text-[1.0625rem] leading-[1.5] text-[var(--ft-muted)]">
            {/* Summaries carry no body, so there is nothing to fall back to. */}
            {excerptFor({ excerpt: post.excerpt, content_html: '' }, 200)}
          </p>
        </div>

        <div className="lg:pt-10">
          <GhostButton href={postPath(post.slug)}>Read More</GhostButton>
        </div>
      </div>
    </article>
  );
}
