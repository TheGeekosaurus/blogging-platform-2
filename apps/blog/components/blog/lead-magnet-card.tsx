'use client';

import Image from 'next/image';
import { useEffect, useId, useRef, useState } from 'react';

import type { LeadMagnetOffer } from '@blog/core';

import { CAPTURE_ENDPOINT, readUtm } from '@/lib/lead-magnet';

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
 * IT OWNS NO CHROME. No heading, no border, no way to close it: the panel it
 * sits in supplies all three (see sidebar-panels.tsx), and the offer's headline
 * is the panel's title, so it stays readable while the body is collapsed.
 * Drawing its own box inside that one produced two nested borders, and a second
 * copy of the headline under the first.
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

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [assetUrl, setAssetUrl] = useState<string | null>(null);

  /*
   * Checked before every setState after an await. The panel this lives in
   * unmounts its body when it collapses, so a reader who collapses the offer
   * mid-submission would otherwise have the response try to set state on a
   * component that is gone.
   */
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);

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
    } catch {
      if (!live.current) return;
      // Network-level failure: no response at all. Distinguished from a 4xx
      // because the reader can do something about one and not the other.
      setError('Could not reach the server. Check your connection and try again.');
      setStatus('idle');
    }
  }

  return (
    <div className={className}>
      {/*
        Full-bleed to the panel's edges, which is why the padding is on the
        block below rather than on this wrapper.
      */}
      {offer.image ? <OfferImage image={offer.image} /> : null}

      {/*
        A gap rather than margins on the children. The margins here used to
        space each block off the headline above it; with the headline gone to
        the panel, the first of them was spacing itself off the padding.
      */}
      <div className="flex flex-col gap-3 px-4 pb-4 pt-3">
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
          <div>
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
              <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
                {offer.body}
              </p>
            ) : null}

            <form onSubmit={onSubmit} className="flex flex-col gap-2">
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
