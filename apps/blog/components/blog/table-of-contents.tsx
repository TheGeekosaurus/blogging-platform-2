import type { Heading } from '@blog/core';

/**
 * Contents list for a post, in a bordered card in the sidebar.
 *
 * The ids come from `injectHeadingIds` running over the same body that is
 * rendered, so the anchors land. Scroll offset is handled by `scroll-margin-top`
 * on the headings themselves (globals.css) rather than here, so it also applies
 * when someone arrives on a #fragment URL directly.
 *
 * `<nav>` with a label rather than a bare list: a screen reader user tabbing
 * through gets "Table of contents, navigation" instead of an unexplained set of
 * in-page links.
 */
export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length === 0) return null;

  return (
    <nav aria-labelledby="toc-heading">
      <h2
        id="toc-heading"
        className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-blog-muted)]"
      >
        Table of Contents
      </h2>

      <ol className="mt-4 flex list-none flex-col gap-3 rounded-xl border border-[var(--color-blog-line)] p-5">
        {headings.map((heading) => (
          <li
            key={heading.id}
            // h3s indent under their h2, matching the design's flat-ish list.
            className={heading.level === 3 ? 'pl-4' : undefined}
          >
            <a
              href={`#${heading.id}`}
              className="flex gap-2.5 text-sm leading-[1.5] !text-[var(--color-blog-ink)] no-underline hover:!text-[var(--color-gold)]"
            >
              <span aria-hidden="true" className="text-[var(--color-gold)]">
                •
              </span>
              <span>{heading.text}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
