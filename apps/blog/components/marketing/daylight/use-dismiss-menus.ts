import { useEffect, type RefObject } from 'react';

/**
 * Closes the header's menus when a link inside one is clicked.
 *
 * WHY THIS NEEDS JAVASCRIPT AT ALL, given both menus were built deliberately
 * without it. Denis, 2026-10-06: "it's so fast, and the header doesn't move,
 * that it almost looks like you didn't click the menu — there is no effect.
 * Can we just have the drop-down menu close upon clicking on something?"
 *
 * He is describing a real thing, and there are two separate causes:
 *
 *   DESKTOP. The dropdown is pure CSS — `group-hover` and `group-focus-within`
 *   on the <li>. Clicking a row navigates, but the pointer is still inside the
 *   panel and the link still holds focus, so BOTH of the conditions that open
 *   it are still true afterwards. The new page renders underneath a menu that
 *   never closed. No amount of CSS fixes this: "the pointer is here but the
 *   user has already chosen" is not a state the selector language can express.
 *
 *   MOBILE. The sheet is a <details>, and `open` is DOM state on an element
 *   that never unmounts — the header lives in the root layout, so a client-side
 *   navigation swaps the page underneath and leaves the sheet exactly as it
 *   was, covering it.
 *
 * In both cases the page really did change; it changed behind something that
 * stayed put. Closing the menu is the missing feedback.
 *
 * A HOOK ON THE SHELL RATHER THAN AN ISLAND OF ITS OWN. DaylightHeaderShell is
 * already a client component — it carries the scrolled/not-scrolled boolean —
 * and it already owns the <header> element this listens on. A second client
 * component would add a boundary and a tree to render nothing. The original
 * note on the mobile nav argued against pulling hydration in "for one button",
 * and that still holds: this adds no hydration that was not already there.
 */
export function useDismissMenusOnNavigate(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const header = ref.current;
    if (!header) return;

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!header || !(target instanceof Element)) return;

      /*
       * Only a real link. A click on the trigger itself, on the panel's padding
       * or on the logo is not a choice and must not close anything — and on
       * desktop the trigger IS sometimes a link, since Funding Solutions has an
       * index page of its own, so "anywhere in the header" would dismiss the
       * panel at the very moment it opened.
       */
      const link = target.closest('a[href]');
      if (!link || !header.contains(link)) return;

      /* The mobile sheet: plain DOM state, so it is simply turned off. */
      for (const sheet of header.querySelectorAll('details[open]')) {
        if (sheet instanceof HTMLDetailsElement) sheet.open = false;
      }

      /*
       * The desktop panel. `data-dismissed` suppresses it in CSS while the
       * pointer is still inside — see the rule in globals.css — and comes off
       * the moment the pointer or the focus leaves, so the menu behaves
       * normally on the next visit.
       *
       * The blur is NOT redundant with the attribute: without it the clicked
       * link keeps focus, and `group-focus-within` reopens the panel the
       * instant the attribute is removed, with the pointer long gone.
       */
      const item = link.closest<HTMLElement>('.dl-headitem');
      if (!item) return;

      if (link instanceof HTMLElement) link.blur();
      item.dataset.dismissed = '';

      const release = (releaseEvent: Event) => {
        /*
         * `pointerout` and `focusout`, not their non-bubbling twins: the events
         * start on a row deep inside the panel, and what matters is whether the
         * pointer or the focus has left the whole <li> rather than moved
         * between its children — which `relatedTarget` answers.
         */
        const to = (releaseEvent as PointerEvent | FocusEvent).relatedTarget;
        if (to instanceof Node && item.contains(to)) return;

        delete item.dataset.dismissed;
        item.removeEventListener('pointerout', release);
        item.removeEventListener('focusout', release);
      };

      item.addEventListener('pointerout', release);
      item.addEventListener('focusout', release);
    }

    /*
     * Capture phase, so the menu closes even if something downstream stops the
     * click propagating. Nothing in the header does today; this costs nothing
     * and removes the possibility.
     */
    header.addEventListener('click', onClick, true);
    return () => header.removeEventListener('click', onClick, true);
  }, [ref]);
}
