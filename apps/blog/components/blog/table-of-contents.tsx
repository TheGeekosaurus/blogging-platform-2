'use client';

import { useEffect, useRef, useState } from 'react';

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
      className={`block text-sm leading-[1.5] no-underline transition-colors ${
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
        Mirrors the summary's flex row below, spacer and all, so a section with
        no sub-headings lines up with the ones that have chevrons. Rendering the
        link bare instead left these sitting a chevron's width to the left of
        their neighbours.
      */
      <li className="flex items-start gap-2">
        <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
        <Entry
          heading={heading}
          active={activeId === heading.id}
          className="min-w-0 flex-1"
        />
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
          <span
            className={`mt-[0.2rem] transition-colors ${
              withinSection ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-muted)]'
            }`}
          >
            <Chevron open={open} />
          </span>

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
        </summary>

        <ol className="mt-2 flex list-none flex-col gap-2 border-l border-[var(--color-line)] pl-3 ml-[0.42rem]">
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
  id,
  className = '',
}: {
  groups: HeadingGroup[];
  /**
   * `rail` is the standing left column; `disclosure` is the collapsed block that
   * takes its place when there is no room for a third column.
   *
   * Both are rendered on every post and hidden at the other's breakpoints.
   * `display: none` takes a subtree out of the accessibility tree, so only one
   * is ever exposed — but each needs its own `id`, since two elements sharing
   * one would make `aria-labelledby` ambiguous.
   */
  variant: 'rail' | 'disclosure';
  id: string;
  className?: string;
}) {
  const activeId = useActiveHeading(HEADING_SELECTOR);
  const [open, setOpen] = useState<OpenState>({});

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

  const flat = groups.flatMap((group) => [group.heading, ...group.children]);
  const reached = activeId ? flat.findIndex((heading) => heading.id === activeId) + 1 : 0;
  const progress = (reached / flat.length) * 100;

  const list = (
    <div className="relative">
      {/*
        Progress rail. The track is the full height of the list and the fill
        stops at the current entry, so the gold band answers "how much of this
        post is behind me" at a glance rather than only "where am I".
      */}
      <span
        aria-hidden="true"
        data-toc-track=""
        className="absolute left-0 top-0 w-px bg-[var(--color-line)]"
        style={{ height: '100%' }}
      />
      <span
        aria-hidden="true"
        data-toc-progress=""
        className="absolute left-0 top-0 w-px bg-[var(--color-accent)] transition-[height] duration-200"
        style={{ height: `${progress}%` }}
      />

      <ol className="flex list-none flex-col gap-3 pl-4">
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
    </div>
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
    <nav
      aria-labelledby={id}
      /*
       * Its own scroll container, and the reason for this whole layout: as one
       * block with the metadata in a single sticky column, a contents list
       * longer than the viewport was simply cut off at the bottom with no way
       * to reach the rest. Sticky positioning clips, it does not scroll.
       */
      className={`toc-scroll xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto ${className}`}
    >
      <h2
        id={id}
        className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]"
      >
        Table of Contents
      </h2>

      {list}
    </nav>
  );
}
