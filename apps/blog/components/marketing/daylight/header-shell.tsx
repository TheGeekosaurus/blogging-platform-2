'use client';

import { useEffect, useState } from 'react';

/**
 * Daylight's header chrome, which changes with scroll position.
 *
 * The same one-boolean shell as ../header-shell.tsx, in white. It is a separate
 * file rather than a prop on that one because the two are the chrome of two
 * different sites: this branch exists so the light build can be changed without
 * anything reaching back into the live dark header, and a shared component with
 * a `theme` prop is exactly the thread back.
 *
 * At rest the header is opaque white, so it and the hero below it read as one
 * surface. Once scrolled it becomes white at 82% with a 14px backdrop blur —
 * the light counterpart of the dark site's ink-glass. The alpha is higher than
 * the dark version's 72% on purpose: dark text needs more opacity behind it to
 * stay readable over whatever is passing underneath, where white text over a
 * dark plate does not.
 *
 * The hairline only appears once scrolled. Against a white hero it is a line
 * across the page with nothing on either side of it; against content sliding
 * under the glass it is what separates the two.
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

  return (
    <header
      data-scrolled={scrolled ? 'true' : 'false'}
      className="sticky top-0 z-50 border-b border-transparent bg-[var(--ft-bg)] transition-[background-color,border-color] duration-200 data-[scrolled=true]:border-[var(--ft-line)] data-[scrolled=true]:bg-[rgba(255,255,255,0.82)] data-[scrolled=true]:backdrop-blur-[14px]"
    >
      {children}
    </header>
  );
}
