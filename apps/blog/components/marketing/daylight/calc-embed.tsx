'use client';

import { useEffect, useRef } from 'react';

import { DSCR_EMBED } from './dscr-content';

/**
 * The RebelIQ calculator, mounted as an iframe.
 *
 * WHY NOT THE OFFICIAL LOADER. Denis's snippet is a <div data-calc> plus
 * app.rebeliq.ai/calc-embed-loader.js, and that loader does exactly what this
 * component does: build `/calc/<slug>?embed=true`, create an iframe at 100%
 * width with an 800px floor, then load iframe-resizer-parent.js and hand the
 * iframe to it. Using it would have been fewer lines.
 *
 * It is not used because of one attribute. The snippet carries
 * `data-calc-hide-bg="true"`, and the loader never reads it — `init()` looks at
 * `data-calc` and nothing else, and `hide_bg` sits in the loader's own
 * RESERVED_QUERY_KEYS, so even its parent-URL forwarding strips it. Checked
 * against the app rather than assumed: requesting the embed URL with
 * `&hide_bg=true` changes what the server serialises into the page, so the
 * flag is real and only the loader is behind. Until the loader forwards the
 * attribute, the only way to get the calculator transparent against our own
 * background is to put the parameter in the URL ourselves.
 *
 * Two smaller things come free with mounting it here: the frame gets an
 * accessible name describing THIS calculator — the loader hardcodes "Mortgage
 * Calculator" for every calculator it mounts — and we are not loading a
 * third-party script whose only job is to write an element we can write.
 *
 * WHEN THE LOADER CATCHES UP, delete this file and drop the snippet in. The
 * contract it expects is one <div data-calc> and one <script>.
 *
 * ── Height ──────────────────────────────────────────────────────────────────
 * iframe-resizer, same as the loader. The child half is already in the
 * calculator's own bundle (its `app/calc/[slug]/page` chunk references
 * iFrameSizer), so the handshake works and the frame follows its content.
 *
 * The 900px floor is what shows while the script loads and what remains if it
 * never arrives — a third-party script that fails should leave a usable
 * calculator behind, not a collapsed box. The loader falls back to 800px; this
 * is a little taller because this calculator is a long form.
 */

type ResizeFn = (options: Record<string, unknown>, target: HTMLElement) => void;

declare global {
  interface Window {
    iframeResize?: ResizeFn;
    __riqIframeResizerReady?: boolean;
  }
}

const PARENT_SCRIPT = `${DSCR_EMBED.origin}/iframe-resizer-parent.js`;

/** Load the parent script once per page, however many embeds ask for it. */
function ensureResizer(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.__riqIframeResizerReady && typeof window.iframeResize === 'function') {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${PARENT_SCRIPT}"]`,
  );
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => resolve(), { once: true });
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = PARENT_SCRIPT;
    script.async = true;
    // Resolve on error too: the floor below is a working fallback, and a
    // rejected promise here would only turn a cosmetic problem into a crash.
    script.addEventListener('load', () => {
      window.__riqIframeResizerReady = true;
      resolve();
    });
    script.addEventListener('error', () => resolve());
    document.head.appendChild(script);
  });
}

export function DscrCalculatorEmbed() {
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let cancelled = false;

    void ensureResizer().then(() => {
      if (cancelled || !frame.current) return;
      try {
        window.iframeResize?.(
          { license: 'GPLv3', waitForLoad: false, checkOrigin: [DSCR_EMBED.origin] },
          frame.current,
        );
      } catch {
        // The floor holds. Nothing here is worth breaking the page over.
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * `hide_bg=true` is the parameter the loader drops; see the note at the top.
   * `embed=true` is what the platform's own snippet sends.
   */
  const src = `${DSCR_EMBED.origin}/calc/${encodeURIComponent(DSCR_EMBED.slug)}?embed=true&hide_bg=true`;

  return (
    <iframe
      ref={frame}
      src={src}
      title={DSCR_EMBED.title}
      loading="lazy"
      className="block w-full border-0"
      style={{ minHeight: 900 }}
    />
  );
}
