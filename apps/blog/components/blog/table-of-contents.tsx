'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Heading, HeadingGroup } from '@blog/core';

import { useActiveHeading } from '@/lib/use-active-heading';

/**
 * Contents list for a post: collapsible h2 sections, with the section being read
 * highlighted and expanded as the reader moves down the page.
 *
 * This is the blog's second client component, after the theme control, and the
 * first thing in the codebase to watch scroll position. The interactivity is
 * what earns it: a long contents list that neither collapses nor tracks
 * position is just a wall of links.
 *
 * Built on `<details>`, so collapse is native. That matters for more than
 * elegance — the server-rendered HTML is a working, collapsible list before any
 * JavaScript arrives, and the client layer only adds the highlight and the
 * automatic expansion.
 *
 * Selector is shared with nothing: it must match the headings `injectHeadingIds`
 * stamped into the body that is actually rendered, or the highlight tracks
 * elements that are not there.
 */
const HEADING_SELECTOR = '.post-body :is(h2, h3)[id]';

/**
 * Why the open state is a record of *how* a section came to be open, rather
 * than a plain set:
 *
 * Sections open on their own as you scroll into them, and close again when you
 * leave — otherwise everything ends up open and collapsing bought nothing. But
 * a section the reader opened by hand must not be yanked shut underneath them.
 * Distinguishing the two is the whole reason for the 'user' | 'auto' tag.
 */
type OpenState = Record<string, 'user' | 'auto' | undefined>;

/**
 * The disclosure marker, at the TRAILING edge of a row rather than the leading
 * one.
 *
 * It led for one revision, and the cost was paid by every row WITHOUT
 * sub-headings: those had to carry an invisible spacer of exactly this width to
 * keep their titles lined up with the rows that had a marker. Trailing, the
 * titles all start at the column edge on their own and the spacer is gone.
 */
function Chevron({ open, className = '' }: { open: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-90' : ''} ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.5 4.5 13 10l-5.5 5.5" />
    </svg>
  );
}

function Entry({
  heading,
  active,
  className = '',
  onNavigate,
}: {
  heading: Heading;
  active: boolean;
  className?: string;
  onNavigate?: (event: React.MouseEvent) => void;
}) {
  return (
    <a
      href={`#${heading.id}`}
      onClick={onNavigate}
      aria-current={active ? 'location' : undefined}
      className={`block text-[13px] leading-[1.5] no-underline transition-colors ${
        active
          ? 'font-semibold !text-[var(--color-accent)]'
          : '!text-[var(--color-ink)] hover:!text-[var(--color-accent)]'
      } ${className}`}
    >
      {heading.text}
    </a>
  );
}

function Group({
  group,
  activeId,
  open,
  onToggle,
}: {
  group: HeadingGroup;
  activeId: string | null;
  open: boolean;
  onToggle: (open: boolean) => void;
}) {
  const { heading, children } = group;

  // An h2 with nothing under it is a link, not an empty disclosure to open onto
  // nothing. `groupHeadings` guarantees `children` exists, so this is a length
  // check rather than a null check.
  if (children.length === 0) {
    return (
      /*
        No spacer. With the marker on the trailing edge there is nothing to line
        up against — this row simply has no marker, and its title starts where
        every other title starts.
      */
      <li>
        <Entry heading={heading} active={activeId === heading.id} />
      </li>
    );
  }

  // Highlight the parent while any of its children is current, so a collapsed
  // section still shows the reader where they are.
  const withinSection =
    activeId === heading.id || children.some((child) => child.id === activeId);

  return (
    <li>
      <details
        open={open}
        /*
         * `onToggle` rather than an onClick on the summary: it fires for keyboard
         * activation and for the `open` prop being driven from state, so React
         * and the DOM cannot drift apart.
         */
        onToggle={(event) => onToggle(event.currentTarget.open)}
      >
        <summary className="flex cursor-pointer list-none items-start gap-2 [&::-webkit-details-marker]:hidden">
          {/*
            The title is a link inside the summary, because a reader needs both
            to jump to a section and to expand it. `stopPropagation` keeps the
            jump from also toggling the disclosure.

            Worth knowing how this fails if a browser ignores that: the section
            opens as well as being jumped to. Since scrolling into a section
            expands it anyway, the wrong outcome here is the right one.
          */}
          <Entry
            heading={heading}
            active={activeId === heading.id}
            onNavigate={(event) => event.stopPropagation()}
            className="min-w-0 flex-1"
          />

          <span
            className={`mt-[0.2rem] transition-colors ${
              withinSection ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-muted)]'
            }`}
          >
            <Chevron open={open} />
          </span>
        </summary>

        <ol className="mt-2 ml-0 flex list-none flex-col gap-2 border-l border-[var(--color-line)] pl-3">
          {children.map((child) => (
            <li key={child.id}>
              <Entry heading={child} active={activeId === child.id} />
            </li>
          ))}
        </ol>
      </details>
    </li>
  );
}

export function TableOfContents({
  groups,
  variant,
  labelledBy,
  className = '',
}: {
  groups: HeadingGroup[];
  className?: string;
} & (
  | {
      /**
       * The row inside the post's sidebar panel: a bare scrolling list.
       *
       * It does NOT render its own heading — the panel's header row already
       * says "Contents", and a second heading immediately under it would
       * announce the list twice. So the caller owns the label, and the union
       * here is what makes passing its id mandatory rather than merely
       * advisable: a `panel` with no `labelledBy` is a nav with no accessible
       * name, which nothing else in the build would catch.
       */
      variant: 'panel';
      labelledBy: string;
    }
  | {
      /**
       * The collapsed block that takes the panel's place below `lg`, where
       * there is no second column. It names itself from its own summary.
       */
      variant: 'disclosure';
      labelledBy?: never;
    }
)) {
  const activeId = useActiveHeading(HEADING_SELECTOR);
  const [open, setOpen] = useState<OpenState>({});

  /*
   * Which edges of the list have more content beyond them.
   *
   * CSS cannot ask "is this element scrollable", and the answer changes as
   * sections expand, as the window resizes and as the reader scrolls — so it is
   * measured. Starts at 'none' so the server-rendered markup carries no mask.
   */
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [fade, setFade] = useState<'none' | 'top' | 'bottom' | 'both'>('none');

  const updateFade = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    // A pixel of slack: sub-pixel layout makes exact comparisons flicker.
    const atTop = el.scrollTop <= 1;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

    setFade(atTop && atBottom ? 'none' : atTop ? 'bottom' : atBottom ? 'top' : 'both');
  }, []);

  /*
   * Re-measured whenever the box or its content changes size, which a plain
   * mount-time check would miss: expanding a section changes the content
   * height, and resizing the window changes the box.
   */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateFade();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateFade);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);

    return () => observer.disconnect();
  }, [updateFade, open, groups]);

  /* Which section this component opened by itself, so it knows what to undo. */
  const autoOpened = useRef<string | null>(null);

  useEffect(() => {
    if (!activeId) return;

    const owner = groups.find(
      (group) =>
        group.heading.id === activeId || group.children.some((child) => child.id === activeId),
    );

    /*
     * A section with no sub-headings has nothing to expand — but the one the
     * reader just left still needs closing, or it sits open behind them and the
     * list keeps a section's worth of height it no longer needs.
     */
    const ownerId = owner && owner.children.length > 0 ? owner.heading.id : null;
    if (autoOpened.current === ownerId) return;

    const previous = autoOpened.current;
    autoOpened.current = ownerId;

    setOpen((current) => {
      const next = { ...current };
      // Close what this component opened last, and only that — a section the
      // reader opened by hand stays open.
      if (previous && next[previous] === 'auto') delete next[previous];
      if (ownerId && !next[ownerId]) next[ownerId] = 'auto';
      return next;
    });
  }, [activeId, groups]);

  if (groups.length === 0) return null;

  /*
   * No progress rail. There was a hairline track down the left of the list with
   * a gold fill marking how far through the post the reader was — removed on
   * Denis's call, and worth saying why rather than leaving it to be rediscovered
   * as a gap: inside the panel it became a second vertical line a few pixels
   * from the panel's own border, and a full-height stroke beside a short list
   * reads as an unfinished element rather than as a gauge. The highlighted
   * entry already answers "where am I", which is the question that matters in a
   * list you can see all of.
   */
  const list = (
    <ol className="flex list-none flex-col gap-3">
      {groups.map((group) => (
        <Group
          key={group.heading.id}
          group={group}
          activeId={activeId}
          open={Boolean(open[group.heading.id])}
          onToggle={(isOpen) =>
            setOpen((current) => {
              /*
               * `onToggle` fires for BOTH a reader clicking and React driving
               * the `open` prop, and the two are indistinguishable from the
               * event alone. Recording every one of them tagged the automatic
               * opens as deliberate, which exempted them from being closed
               * again — so sections accumulated until the entire list was
               * open and collapsing had bought nothing.
               *
               * State leads a programmatic change and trails a click, so a
               * toggle that merely agrees with state is our own echo.
               */
              if (Boolean(current[group.heading.id]) === isOpen) return current;

              // A deliberate open outranks the automatic one and survives
              // scrolling away; a deliberate close clears the entry outright.
              return { ...current, [group.heading.id]: isOpen ? 'user' : undefined };
            })
          }
        />
      ))}
    </ol>
  );

  if (variant === 'disclosure') {
    return (
      <details className={`group rounded-xl border border-[var(--color-line)] ${className}`}>
        <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)] [&::-webkit-details-marker]:hidden">
          <Chevron open={false} className="group-open:rotate-90" />
          Contents
        </summary>
        <div className="px-5 pb-5">{list}</div>
      </details>
    );
  }

  return (
    /*
      `overflow-hidden` so that a zero-height list is actually invisible. The
      panel squeezes this row to nothing when an offer is open on a short
      window, and without this its scrolling child — which has padding, and so a
      floor of 32px — went on showing an empty strip under the header.
    */
    <nav
      aria-labelledby={labelledBy}
      className={`flex min-h-0 flex-col overflow-hidden ${className}`}
    >
      {/*
        Only the list scrolls. `min-h-0` is what makes it shrink below its
        content height — a flex child refuses to without it, which is how a
        bounded scroll area silently fails to bound.

        `data-fade` drives a mask on whichever edge has content beyond it. The
        scrollbar is deliberately near-invisible (see .toc-scroll in
        globals.css), and a list clipped flat against the viewport edge with no
        scrollbar looks broken rather than scrollable — which is exactly how
        this was reported.
      */}
      <div
        ref={scrollRef}
        data-fade={fade}
        onScroll={updateFade}
        /*
          The padding lives HERE rather than on the nav, so that it disappears
          along with the list when the row is squeezed to zero — padding on the
          container survives a zero content height and leaves a visible band.
        */
        className="toc-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4"
      >
        {list}
      </div>
    </nav>
  );
}
