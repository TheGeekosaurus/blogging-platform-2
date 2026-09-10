'use client';

import { useEffect, useId, useRef, useState } from 'react';

import type { LeadMagnetOffer } from '@blog/core';

import {
  CAPTURE_ENDPOINT,
  hide,
  isHidden,
  LEAD_MAGNET_EVENT,
  readUtm,
} from '@/lib/lead-magnet';

/**
 * The lead capture card: an offer, an email field, and a way to make it go away.
 *
 * This is the blog's third client component, after the theme control and the
 * contents list. It has to be one — a form that posts and then swaps itself for
 * a download link is interaction, not content.
 *
 * WHAT IT IS NOT: an interstitial. It renders in the layout, in the sidebar
 * rail or the article flow, and it never covers the article. That is a
 * deliberate limit rather than a missing feature. Google treats a popup that
 * obscures content on mobile as an intrusive interstitial and ranks the page
 * down for it, and a blog whose whole traffic model is search should not be
 * spending rankings on a form. The card still gets the sticky rail — the most
 * valuable real estate on the page — for free.
 *
 * The three states are idle, sending and done, and `done` is terminal: there is
 * no path back to the form once an address has been accepted. An error returns
 * to idle with the message shown and the field still filled in, because the
 * common cause is a typo the reader can see.
 */

type Status = 'idle' | 'sending' | 'done';

/*
 * There is no `variant` prop, and that is a decision rather than an omission.
 *
 * A second placement — an inline block mid-article, say — differs from the rail
 * in width and margin and in nothing else, and `className` already carries
 * both. A variant enum would be a lookup table of one useful entry plus
 * whatever a future placement turns out to need, guessed in advance. Add it
 * when a second caller exists and its needs are known.
 */
export function LeadMagnetCard({
  offer,
  className = '',
}: {
  offer: LeadMagnetOffer;
  className?: string;
}) {
  const fieldId = useId();

  /*
   * Starts visible and is corrected on mount, for the same reason the theme
   * control starts at 'system': the server cannot know what this reader has
   * dismissed, and reading localStorage during render is a hydration mismatch.
   *
   * Starting visible rather than hidden is the right way round. The card is
   * part of the prerendered HTML, so it is on the page before React runs
   * either way; starting hidden would make it appear and then vanish, which
   * reads as a bug. This way it is briefly present for a reader who dismissed
   * it, then gone.
   */
  const [hidden, setHidden] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [assetUrl, setAssetUrl] = useState<string | null>(null);

  /*
   * Set once the response lands, and checked before every setState after an
   * await. Without it, a reader who dismisses the card while the request is in
   * flight gets it re-rendered into the success state on top of them.
   */
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

  /*
   * Set by the instance that took the submission, and read by the broadcast
   * listener below so it does not hide the card it just succeeded in.
   *
   * A ref rather than reading `status`: the listener is registered once and
   * would close over the status from that first render.
   */
  const converted = useRef(false);

  useEffect(() => {
    if (isHidden(offer.slug)) setHidden(true);

    // The other placement on this page dismissing counts as this one being
    // dismissed. See LEAD_MAGNET_EVENT.
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ slug: string }>).detail;
      if (detail?.slug === offer.slug && !converted.current) setHidden(true);
    };

    window.addEventListener(LEAD_MAGNET_EVENT, onChange);
    return () => window.removeEventListener(LEAD_MAGNET_EVENT, onChange);
  }, [offer.slug]);

  if (hidden) return null;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'sending') return;

    const form = new FormData(event.currentTarget);

    setStatus('sending');
    setError(null);

    try {
      const response = await fetch(CAPTURE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          magnet: offer.slug,
          email: String(form.get('email') ?? ''),
          name: String(form.get('name') ?? '') || null,
          // The honeypot. Empty for a human, filled by anything that submits
          // every field it finds.
          company: String(form.get('company') ?? ''),
          sourcePath: window.location.pathname,
          referrer: document.referrer || null,
          utm: readUtm(window.location.search),
        }),
      });

      if (!live.current) return;

      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        assetUrl?: string | null;
      };

      if (!live.current) return;

      if (!response.ok) {
        setError(body.error ?? 'That did not go through. Try again in a moment.');
        setStatus('idle');
        return;
      }

      converted.current = true;
      setAssetUrl(body.assetUrl ?? null);
      setStatus('done');

      /*
       * Recorded as a conversion, but THIS card is not removed — the success
       * state renders in its place. Whipping the panel away at the moment it
       * finally has something to give the reader would take the download link
       * with it. The `converted` ref above is what exempts this instance from
       * the broadcast; the other placement on the page does hide, and so does
       * every article after this one.
       */
      hide(offer.slug, 'converted');
    } catch {
      if (!live.current) return;
      // Network-level failure: no response at all. Distinguished from a 4xx
      // because the reader can do something about one and not the other.
      setError('Could not reach the server. Check your connection and try again.');
      setStatus('idle');
    }
  }

  return (
    <div
      className={`rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2
          className="font-[family-name:var(--font-headline)] text-base leading-snug text-[var(--color-ink)]"
        >
          {offer.heading}
        </h2>

        {/*
          A real button with a real accessible name, not a decorative ×. It is
          the only way out of the card for a keyboard reader, and it sits before
          the form in the tab order so reaching it does not mean tabbing through
          the fields being declined.
        */}
        <button
          type="button"
          onClick={() => {
            hide(offer.slug, 'dismissed');
            setHidden(true);
          }}
          aria-label="Dismiss this offer"
          title="Dismiss"
          className="-mr-1.5 -mt-1.5 shrink-0 rounded p-1.5 text-[var(--color-ink-muted)] transition-colors hover:text-[var(--color-ink)]"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
          </svg>
        </button>
      </div>

      {/*
        The live region, always in the tree and empty until there is something
        to say.

        Inserting a role="status" element and its text in the same render is
        the version of this that looks right and announces unreliably — several
        screen readers only watch regions that existed when the change
        happened. The form is what had focus, and it is gone by then, so
        without this a submission succeeds silently.

        Visually hidden and duplicated: the success message below is the same
        text with no role, so it is announced once, not twice.
      */}
      <p role="status" aria-live="polite" className="sr-only">
        {status === 'done' ? offer.successMessage : ''}
      </p>

      {status === 'done' ? (
        <div className="mt-3">
          <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
            {offer.successMessage}
          </p>

          {assetUrl ? (
            <a
              href={assetUrl}
              /*
               * A new tab, and the one place on the blog that gets one. The
               * file is hosted elsewhere, so following it in place navigates
               * the reader out of the article they were part-way through — to
               * a PDF viewer, from which Back is not always a return.
               */
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium !text-[var(--color-surface)] no-underline"
            >
              Download it now
            </a>
          ) : null}
        </div>
      ) : (
        <>
          {offer.body ? (
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
              {offer.body}
            </p>
          ) : null}

          <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2">
            {offer.collectName ? (
              <>
                <label htmlFor={`${fieldId}-name`} className="sr-only">
                  First name
                </label>
                <input
                  id={`${fieldId}-name`}
                  name="name"
                  type="text"
                  autoComplete="given-name"
                  placeholder="First name"
                  className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
                />
              </>
            ) : null}

            <label htmlFor={`${fieldId}-email`} className="sr-only">
              Email address
            </label>
            <input
              id={`${fieldId}-email`}
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              aria-describedby={error ? `${fieldId}-error` : undefined}
              aria-invalid={error ? true : undefined}
              className="w-full rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
            />

            {/*
              The honeypot.

              `tabIndex={-1}` and `autoComplete="off"` keep it away from humans
              and password managers; the wrapper is positioned off-screen rather
              than `display: none`, because the cheapest bots skip hidden fields
              and the point is that they should not notice.

              aria-hidden so it is never announced. A screen reader user filling
              this in would be rejected as a bot, which is the one failure mode
              this must not have.
            */}
            <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
              <input
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                defaultValue=""
              />
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="mt-1 w-full rounded-md bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-[var(--color-surface)] transition-opacity disabled:opacity-60"
            >
              {status === 'sending' ? 'Sending…' : offer.buttonLabel}
            </button>

            {error ? (
              <p
                id={`${fieldId}-error`}
                role="alert"
                className="text-sm font-medium text-[var(--color-ink)]"
              >
                {error}
              </p>
            ) : null}

            {offer.consentText ? (
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                {offer.consentText}
              </p>
            ) : null}
          </form>
        </>
      )}
    </div>
  );
}
