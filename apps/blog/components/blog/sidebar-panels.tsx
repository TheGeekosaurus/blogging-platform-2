'use client';

import { useId, useState, type ReactNode } from 'react';

/**
 * The post sidebar's two collapsible panels: the contents list and the offer.
 *
 * WHY THIS EXISTS. Both used to stand open at once. Between the reading-theme
 * control, a card with an image and a form, and a contents list, the rail ran
 * past the bottom of the viewport on ordinary laptop heights — and the contents
 * list, being last, was the part pushed out of sight. A sticky rail whose
 * useful half is below the fold is not a sticky rail.
 *
 * ONE AT A TIME, which is what makes it a fix rather than a rearrangement. Two
 * panels that can both be open can both be too tall together, and the reader is
 * back where they started. With one open, the rail's height is the tallest
 * single panel plus two collapsed strips, whatever the reader does.
 *
 * The offer starts open and the contents list closed. The contents list is
 * reference material a reader goes looking for; the offer has to be seen to
 * work at all. Closing the offer to open the contents is a deliberate act and
 * takes one click.
 */

type PanelId = 'toc' | 'offer';

/**
 * Open eye for a panel you can see into, struck through for one you cannot.
 *
 * A chevron is the usual glyph for a disclosure, and this deliberately is not
 * one: the choice being offered is not "is there more below" but "do I want
 * this on screen at all", which is what an eye says. The slash is drawn as part
 * of the same icon rather than swapped for a different shape, so the two states
 * read as one control changing rather than two controls alternating.
 */
function Eye({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-[18px] w-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.8 10S4.9 4.8 10 4.8 18.2 10 18.2 10 15.1 15.2 10 15.2 1.8 10 1.8 10Z" />
      <circle cx="10" cy="10" r="2.3" />
      {open ? null : <path d="M4 16 16 4" />}
    </svg>
  );
}

function Panel({
  title,
  open,
  onToggle,
  bodyClassName = '',
  className = '',
  children,
}: {
  title: ReactNode;
  open: boolean;
  onToggle: () => void;
  bodyClassName?: string;
  className?: string;
  children: ReactNode;
}) {
  const bodyId = useId();

  return (
    <section
      className={`overflow-hidden rounded-xl border border-[var(--color-line)] ${
        /*
         * Only the open panel is allowed to grow, and it is the only one with
         * anything to grow into. A closed panel that kept `flex-1` would take
         * an equal share of the rail to show one line of text.
         *
         * Note what is NOT here: a `flex` display utility. The caller supplies
         * that, because the contents panel also needs `hidden lg:flex` — and
         * an unprefixed `flex` alongside an unprefixed `hidden` is decided by
         * Tailwind's own sort order rather than by anything in this file.
         * Leaving display to one source keeps that unarguable.
         */
        open ? 'min-h-0 flex-1 flex-col' : 'shrink-0'
      } ${className}`}
    >
      {/*
        A heading wrapping a button, which is the accordion pattern: the heading
        keeps the panel in the document outline for anyone navigating by
        headings, and the button is what announces itself as expandable and
        responds to Enter and Space.

        The title and the icon are INSIDE one button rather than being two
        controls, so clicking either toggles — and a screen reader is told about
        one thing, not a label with a mystery button next to it. The icon is
        aria-hidden for the same reason: the button already says "Table of
        Contents, expanded".
      */}
      <h2 className="shrink-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={open ? bodyId : undefined}
          className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold leading-snug text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-muted)]"
        >
          <span className="min-w-0">{title}</span>
          <span className="text-[var(--color-ink-muted)]">
            <Eye open={open} />
          </span>
        </button>
      </h2>

      {/*
        Rendered only when open, rather than hidden with a class.
        `[hidden]` and Tailwind's `flex` are both display declarations at equal
        specificity, so which wins comes down to stylesheet order — a panel that
        stays visible because of source order is not a bug anyone finds by
        reading this component.
      */}
      {open ? (
        <div id={bodyId} className={`min-h-0 flex-1 ${bodyClassName}`}>
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function SidebarPanels({
  toc,
  offer,
  offerTitle,
  className = '',
}: {
  /** The contents list, or null on a post with no headings to list. */
  toc: ReactNode;
  /** The capture card, or null where no offer targets this post. */
  offer: ReactNode;
  /** The offer's headline, which is all that shows while it is collapsed. */
  offerTitle: string | null;
  className?: string;
}) {
  /*
   * The offer opens first when there is one, and the contents list otherwise.
   *
   * "Contents closed by default" is the rule, but a rail holding nothing but a
   * single closed strip is not a sensible reading of it — on a post with no
   * offer there is nothing for the contents list to be yielding to.
   */
  const [openPanel, setOpenPanel] = useState<PanelId | null>(offer ? 'offer' : 'toc');

  const toggle = (panel: PanelId) =>
    setOpenPanel((current) => (current === panel ? null : panel));

  return (
    <div className={`flex min-h-0 flex-col gap-3 ${className}`}>
      {toc ? (
        <Panel
          title="Table of Contents"
          open={openPanel === 'toc'}
          onToggle={() => toggle('toc')}
          /*
           * No overflow here: the list scrolls itself, with its own edge fades
           * measured against its own box (see TableOfContents). A scroll
           * container around a scroll container gives the outer one nothing to
           * do and the inner one the wrong height to measure.
           */
          bodyClassName="flex flex-col px-4 pb-4"
          /*
           * Desktop only, and the panel's display utility besides. Below `lg`
           * the contents list is already in the article as the disclosure
           * variant, where it is useful before the text rather than after it —
           * this column stacks under the post.
           */
          className="hidden lg:flex"
        >
          {toc}
        </Panel>
      ) : null}

      {offer && offerTitle ? (
        <Panel
          title={offerTitle}
          open={openPanel === 'offer'}
          onToggle={() => toggle('offer')}
          /*
           * This one does scroll. A card with an image, a paragraph, two fields
           * and small print can be taller than the rail on a short window, and
           * the alternative to scrolling it is the button falling off the
           * bottom — which is the one element that has to be reachable.
           */
          bodyClassName="overflow-y-auto"
          // Shown at every width: this column is the offer's mobile placement.
          className="flex"
        >
          {offer}
        </Panel>
      ) : null}
    </div>
  );
}
