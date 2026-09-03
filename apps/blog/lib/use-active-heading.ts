import { useEffect, useState } from 'react';

/**
 * The offset the sticky site header occupies, in pixels.
 *
 * Deliberately the same 6rem as the `scroll-margin-top` on blog headings in
 * globals.css. If these two disagree, following a contents link lands a heading
 * on one side of the line while the highlight is computed from the other, so the
 * entry you just clicked is not the one that lights up.
 */
const HEADER_OFFSET = 96;

/** A little past the line, so a heading resting exactly at it counts as reached. */
const SLACK = 8;

/**
 * The id of the heading the reader is currently under.
 *
 * `null` until the first heading passes the header line — while someone is still
 * in the intro, no section has been reached and highlighting the first one would
 * be a lie.
 *
 * Uses an IntersectionObserver purely as a trigger and then measures rects,
 * rather than trusting the entries themselves. Two things go wrong with the
 * entries-only approach: scrolling fast enough that several headings cross
 * between frames leaves the wrong one active, and a viewport with no heading
 * intersecting at all (a long section) reports nothing, freezing the highlight.
 * Measuring answers "which heading did I last pass" directly, and the observer
 * only says when to ask — which is exactly at a crossing, so there is no polling.
 */
export function useActiveHeading(selector: string): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (nodes.length === 0) return;

    const measure = () => {
      let current: string | null = null;

      // Document order, so the last one past the line wins.
      for (const node of nodes) {
        if (node.getBoundingClientRect().top > HEADER_OFFSET + SLACK) break;
        current = node.id;
      }

      setActiveId(current);
    };

    measure();

    const observer = new IntersectionObserver(measure, {
      // Shifts the top of the observed area down to the header line, so every
      // callback coincides with a heading crossing it.
      rootMargin: `-${HEADER_OFFSET}px 0px 0px 0px`,
      threshold: 0,
    });
    for (const node of nodes) observer.observe(node);

    // Reflow moves every heading without any of them crossing the line.
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [selector]);

  return activeId;
}
