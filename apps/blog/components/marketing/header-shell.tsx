'use client';

import { useEffect, useState } from 'react';

/**
 * The header's chrome, which changes with scroll position.
 *
 * At the top of the page it is opaque --color-ground — the token the homepage,
 * the footer and the blog's dark theme all paint with, so header and hero read
 * as one surface. Named rather than written out as #141414: the hex used to be
 * copied into each of those places, which is how the header and footer ended up
 * on two different blacks. Once scrolled it becomes the ink-glass it was before:
 * near-black at 72% with a 14px backdrop blur, so content passing underneath is
 * visible through it.
 *
 * WHY A CLIENT COMPONENT, when the rest of the header is not. Scroll position
 * is not knowable on the server, and the CSS that could express it —
 * `animation-timeline: scroll()` — is not supported widely enough to carry a
 * site header. So this shell owns one boolean and nothing else: the logo, the
 * nav and its CSS-only dropdown are passed in as children and stay server
 * rendered. A client component still renders on the server, so the whole header
 * is in the static HTML exactly as before; only the scroll listener is new.
 *
 * The initial state is deliberately `false` rather than read from `window`
 * during render. Reading it would differ between the server (no window) and the
 * client and trip hydration; the effect below corrects it on the first frame,
 * which also covers a load that restores a mid-page scroll position.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // 8px rather than 0: a rubber-band scroll or a 1px wheel nudge should not
    // flip the header's whole treatment.
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      data-scrolled={scrolled ? 'true' : 'false'}
      className="sticky top-0 z-50 border-b border-white/10 bg-[var(--color-ground)] transition-colors duration-200 data-[scrolled=true]:bg-[rgba(11,11,12,0.72)] data-[scrolled=true]:backdrop-blur-[14px]"
    >
      {children}
    </header>
  );
}
