import Link from 'next/link';

import type { HeadingGroup, LeadMagnetOffer } from '@blog/core';

import { LeadMagnetBlock } from '@/components/blog/lead-magnet-block';
import { TableOfContents } from '@/components/blog/table-of-contents';
import { ThemeToggle } from '@/components/blog/theme-toggle';
import type { SidebarCta } from '@/lib/marketing';

/**
 * Everything beside a post, as ONE panel rather than three loose elements.
 *
 * What this replaces: a bare reading-theme control, a contents list under it,
 * and an offer floating over both. Three things that shared a column without
 * belonging to each other, each solving its own placement — which is how the
 * offer ended up as an overlay with a bottom-right tile, and why the column
 * read as a stack of leftovers rather than as part of the page.
 *
 * FOUR ROWS, and only one of them flexes:
 *
 *   header    the label and the reading-theme control   fixed
 *   contents  the list                                  FLEXIBLE, scrolls
 *   offer     the lead capture block                    fixed
 *   action    the site's standing call to action        fixed
 *
 * That is the whole layout idea. The contents list is the only row that can
 * give up height, so the call to action is reachable without scrolling no
 * matter how many headings a post has, and opening the offer costs the list
 * some visible entries rather than pushing the button off the screen. Every
 * other arrangement of these four ends with something important below the fold
 * — which is exactly what the previous three versions each discovered.
 *
 * It is a SERVER component. All four rows are decided at build time; three of
 * the children are client components because they are interactive, but nothing
 * here needs to be.
 */

/**
 * The header's heading, which also names the list.
 *
 * A constant rather than a prop: the id has to be unique on the page, and the
 * only other contents list — the `disclosure` one below `lg` — names itself
 * from its own summary. Two panels on one post is not a thing that can happen.
 */
const LABEL_ID = 'post-aside-contents';

export function PostAside({
  groups,
  offer,
  cta,
}: {
  groups: HeadingGroup[];
  /** Null when no offer targets this post. */
  offer: LeadMagnetOffer | null;
  /** Null on a database-driven blog, which has no coded page to send anyone to. */
  cta: SidebarCta | null;
}) {
  return (
    /*
      Sticky and viewport-tall at `lg`, an ordinary block below it.

      `h-` rather than `max-h-`: "spans top to bottom" is the point of the
      panel, and a definite height is also what lets the offer's cap and the
      list's `flex-1` resolve against something. `max-h-full` is the guard for a
      short post — the column it sits in stretches to the row, so this cannot
      run past the bottom of the frame.

      The height is sized for the panel's NATURAL top, not the 96px it settles
      at once stuck. Before it sticks it sits below that — ~137px at 1280 and
      ~153px at 1024, where the site header wraps taller — so a height computed
      for the stuck position ran past the bottom of the viewport until you
      scrolled. 11rem clears the tallest of those; the ~32px it gives up once
      stuck is not worth chasing with a fixed offset that cannot be right at
      every width.

      `overflow-hidden` is what makes the rounded corners cut the rows inside
      it, and it is safe here only because nothing inside is `position: sticky`
      — an `overflow` ancestor breaks sticky for its descendants, which is the
      trap the old two-box rail existed to avoid.
    */
    <aside className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] lg:sticky lg:top-24 lg:flex lg:h-[calc(100vh-11rem)] lg:max-h-full lg:flex-col">
      {/*
        The header. Below `lg` the contents list is hidden — the article carries
        its own disclosure list above the body there — so the label goes with
        it and this row is just the reading control, which is what used to sit
        at the top of this column anyway.
      */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-line)] px-4 py-3">
        <h2
          id={LABEL_ID}
          className="hidden text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)] lg:block"
        >
          Contents
        </h2>
        <ThemeToggle />
      </div>

      {/*
        The only row that flexes. `min-h-0` is what lets it shrink below its
        content height — a flex child refuses to without it, which is how a
        bounded scroll area silently fails to bound, and here it is also what
        makes room for the offer when a reader opens it.
      */}
      <TableOfContents
        groups={groups}
        variant="panel"
        labelledBy={LABEL_ID}
        className="hidden min-h-0 flex-1 px-4 py-4 lg:flex"
      />

      {/*
        The foot: the offer, then the standing call to action, in that order and
        never the other way round. The site's own button is the one that must be
        in the same place on every post, so it is the one pinned to the bottom
        edge; the offer sits above it and changes size.

        `mt-auto` below `lg`, where there is no flexible row above to push this
        down — without it the two buttons would sit directly under the reading
        control with the panel's whole height empty beneath them.
      */}
      {offer || cta ? (
        <div className="mt-auto flex shrink-0 flex-col gap-3 border-t border-[var(--color-line)] p-4">
          {offer ? <LeadMagnetBlock offer={offer} /> : null}

          {cta ? (
            <Link
              href={cta.href}
              className="block w-full rounded-lg bg-[var(--color-accent)] px-4 py-3 text-center text-sm font-semibold !text-[var(--color-surface)] no-underline transition-opacity hover:opacity-90"
            >
              {cta.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
