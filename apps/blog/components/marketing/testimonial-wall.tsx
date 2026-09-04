'use client';

import Script from 'next/script';

import { REVIEWS } from './brand';

/**
 * The SocialJuice review wall.
 *
 * WHY THIS ONE IS A CLIENT COMPONENT, when the other two embeds are not.
 *
 * GTM and the HighLevel survey both self-initialise — form_embed.js finds its
 * iframes with querySelectorAll and attaches itself — so they need nothing but a
 * <Script> tag and stay server components. iframeResizer does not: it exposes
 * `iFrameResize()` and waits to be called.
 *
 * That call has to happen AFTER the library loads, and Next only guarantees
 * script execution order for `beforeInteractive` ("executed in the order they
 * are placed"); two `afterInteractive` scripts have no ordering guarantee, so an
 * inline call beside the <Script src> could run before `iFrameResize` exists.
 * The documented mechanism is `onLoad`, and its docs carry an explicit warning
 * that it "does not yet work with Server Components and can only be used in
 * Client Components".
 *
 * The cost is small and worth being clear about: this is a leaf with no props,
 * and client components still server-render, so the iframe is in the static HTML
 * exactly as before. Only a small hydration payload is added.
 *
 * Without the resizer this was pinned at a hardcoded height, which clipped the
 * wall or left dead space under it depending on how many reviews existed.
 */

/**
 * Load-bearing, not decorative. iframeResizer resolves its target from this
 * selector, so if the id and the selector drift the wall still renders — it just
 * never resizes, staying stuck at initialHeight, with nothing logged anywhere.
 * The same trap as the HighLevel iframe's id; there is a test for both.
 */
const FRAME_ID = 'socialjuice-wall-nntm-capital';

declare global {
  interface Window {
    iFrameResize?: (options: Record<string, unknown>, target: string) => void;
  }
}

export function TestimonialWall() {
  return (
    <>
      <iframe
        id={FRAME_ID}
        src={REVIEWS.wallUrl}
        title="Customer reviews"
        /* The resizer sizes the frame to its content, so an inner scrollbar
           would only ever appear mid-resize. */
        scrolling="no"
        /* Below the fold on both pages that use it. The resizer attaches on
           load, so deferring costs nothing beyond holding initialHeight until
           the frame scrolls into view. */
        loading="lazy"
        allowFullScreen
        style={{ border: 'none', width: '100%', height: REVIEWS.initialHeight }}
      />

      <Script
        src={REVIEWS.resizerSrc}
        strategy="afterInteractive"
        onLoad={() => {
          /*
           * `checkOrigin: false` is SocialJuice's own snippet, kept verbatim. It
           * disables the postMessage origin check, so worth being explicit about
           * the exposure: the only thing these messages control is the height of
           * this iframe, so the worst a forged one does is resize a review wall.
           * Turning it on would mean pinning their embed origin here and breaking
           * the wall silently if they ever move it.
           */
          window.iFrameResize?.({ log: false, checkOrigin: false }, `#${FRAME_ID}`);
        }}
      />
    </>
  );
}
