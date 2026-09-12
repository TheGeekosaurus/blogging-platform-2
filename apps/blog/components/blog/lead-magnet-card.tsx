'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';

import type { LeadMagnetOffer } from '@blog/core';

import { CAPTURE_ENDPOINT, hide, isHidden, readUtm } from '@/lib/lead-magnet';

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

  // Corrected on mount, never during render: the server cannot know what this
  // reader has dismissed, and reading localStorage while rendering is a
  // hydration mismatch.
  useEffect(() => {
    if (isHidden(offer.slug)) setHidden(true);
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

      setAssetUrl(body.assetUrl ?? null);
      setStatus('done');

      /*
       * Recorded as a conversion, but the card is NOT removed — `hidden` stays
       * false and the success state renders in place. Whipping the card away
       * at the moment it finally has something to give the reader would take
       * the download link with it. The record only affects the next article.
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
      className={`relative overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] ${className}`}
    >
      {/*
        Pinned to the card's top-right corner rather than sitting in the heading
        row, which is where it used to be and where it looked wrong: the image
        is full-bleed across the top, so a control in the row BELOW it reads as
        floating in the middle of the card rather than closing it.

        Absolute, so it overlays whatever is at the top — the image, or the
        heading on an offer with no image — and `pr-8` on the heading keeps a
        long headline from running under it. The translucent ground is what
        keeps the glyph legible against an arbitrary image; without it the cross
        disappears into a light one.

        First in the DOM, so it is also first in the tab order: reaching the way
        out should not mean tabbing through the fields being declined.
      */}
      <button
        type="button"
        onClick={() => {
          hide(offer.slug, 'dismissed');
          setHidden(true);
        }}
        aria-label="Dismiss this offer"
        title="Dismiss"
        className="absolute right-2 top-2 z-10 rounded-full bg-[var(--color-surface)]/80 p-1.5 text-[var(--color-ink-muted)] backdrop-blur-sm transition-colors hover:text-[var(--color-ink)]"
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

      {offer.image ? <OfferImage image={offer.image} /> : null}

      <div className="p-5">
        <h2 className="pr-8 font-[family-name:var(--font-headline)] text-base leading-snug text-[var(--color-ink)]">
          {offer.heading}
        </h2>

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
    </div>
  );
}

/**
 * The offer's picture, full-bleed across the top of the card.
 *
 * Full width and natural height, never cropped. These are designed graphics —
 * a mockup with the product's name set into it — so an `object-cover` box at a
 * fixed ratio would cut the words off the artwork, and which words depends on
 * the image. The card grows to fit instead; the author controls the height by
 * choosing the image.
 *
 * TWO PATHS, and the branch is real rather than defensive. next/image needs
 * intrinsic dimensions to reserve space, and it is worth having: the rail is
 * about 350px wide and the source is usually a full-size upload, so it saves
 * most of the bytes. The admin's uploader records width and height, so this is
 * the path anything picked in the admin takes. A row imported before that, or
 * one whose dimensions could not be read, has no numbers to give it — passing
 * invented ones would reserve the wrong space and shift the page when the real
 * image landed, which is worse than not optimising.
 */
function OfferImage({ image }: { image: NonNullable<LeadMagnetOffer['image']> }) {
  /*
   * Empty alt unless the author wrote one. The heading directly above says what
   * the offer is, so describing the mockup as well announces the same thing
   * twice to anyone listening rather than looking.
   */
  const alt = image.alt ?? '';

  if (image.width && image.height) {
    return (
      <Image
        src={image.url}
        alt={alt}
        width={image.width}
        height={image.height}
        className="h-auto w-full"
        /* Its rendered width is the rail, which is fixed at lg and full-bleed
           in the stacked layout below it. */
        sizes="(min-width: 1024px) 352px, 100vw"
      />
    );
  }

  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={image.url} alt={alt} className="h-auto w-full" />;
}
