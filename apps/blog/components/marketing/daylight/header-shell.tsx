'use client';

import { useEffect, useRef, useState } from 'react';

import { useDismissMenusOnNavigate } from './use-dismiss-menus';

/**
 * Daylight's header chrome, which changes with scroll position.
 *
 * The same one-boolean shell as ../header-shell.tsx, in white. It is a separate
 * file rather than a prop on that one because the two are the chrome of two
 * different sites: this branch exists so the light build can be changed without
 * anything reaching back into the live dark header, and a shared component with
 * a `theme` prop is exactly the thread back.
 *
 * IT IS AN ISLAND, not a bar welded to the top of the page: a rounded card
 * inset from the edges, the shape Denis asked for after looking at the Labs
 * site. The sticky wrapper carries the inset and the card floats inside it,
 * which is also what lets the card shrink to a centred pill for the opening
 * sequence — a full-bleed bar has nothing to shrink to.
 *
 * It is aligned to the page container rather than to the viewport, so its
 * edges line up with the hero's text instead of hanging 60px outside it.
 *
 * At rest the card is opaque white over a hairline. Once scrolled it becomes
 * white at 86% with a 14px backdrop blur and lifts on a shadow — the light
 * counterpart of the dark site's ink-glass. The alpha is higher than the dark
 * version's 72% on purpose: dark text needs more opacity behind it to stay
 * readable over whatever is passing underneath, where white text over a dark
 * plate does not.
 *
 * THE HAIRLINE IS ALWAYS ON, which is the one thing the full-bleed version did
 * differently. A bar can borrow the page edge to define itself and only needs a
 * rule once content slides under it; an island on a white page has no edge of
 * its own without one. The shadow is what changes on scroll instead.
 *
 * WHY A CLIENT COMPONENT, when the rest of the header is not: scroll position
 * is not knowable on the server, and `animation-timeline: scroll()` is not yet
 * supported widely enough to carry a site header. The logo, the nav and its
 * CSS-only dropdown are passed in as children and stay server rendered.
 *
 * The initial state is `false` rather than read from `window` during render —
 * reading it would differ between server and client and trip hydration. The
 * effect corrects it on the first frame, which also covers a load that restores
 * a mid-page scroll position.
 */
export function DaylightHeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // 8px rather than 0, so a rubber-band scroll does not flip the treatment.
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Closes the dropdowns and the mobile sheet on a link click — see the hook. */
  const header = useRef<HTMLElement>(null);
  useDismissMenusOnNavigate(header);

  return (
    <div className="sticky top-0 z-50 mx-auto w-full max-w-7xl px-5 pt-4 lg:px-8 lg:pt-5">
      <header
        ref={header}
        data-scrolled={scrolled ? 'true' : 'false'}
        className="dl-headbar rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-bg)] transition-[background-color,box-shadow] duration-200 data-[scrolled=true]:bg-[rgba(255,255,255,0.86)] data-[scrolled=true]:shadow-[0_18px_40px_-28px_rgba(11,45,114,0.45)] data-[scrolled=true]:backdrop-blur-[14px]"
      >
        {children}
      </header>
    </div>
  );
}
