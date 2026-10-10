'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { CAPTURE_ENDPOINT, readUtm, type LeadMagnetOffer } from '@blog/core';

import { THEME_SKINS } from './cta-theme';

/**
 * How the offer's picture gets drawn.
 *
 * INJECTED, because the two callers need different renderers and neither
 * should win. The blog passes a `next/image` one — the sidebar is about 350px
 * wide and the source is usually a full-size upload, so it saves most of the
 * bytes, and the admin's uploader records the dimensions it needs. The admin's
 * builder has only a URL and an alt (MediaOption carries no width or height),
 * and `next/image` on a remote URL would need remotePatterns configured in the
 * admin for a picture nobody but the author ever sees.
 *
 * The default is a plain <img>, which is also the blog's own fallback for a
 * row imported before the uploader recorded dimensions.
 */
/* One field treatment, used by both inputs, flipped for a dark ground. */
const FIELD_CLASS = (dark: boolean) =>
  `w-full rounded-md border px-3 py-2 text-sm ${
    dark
      ? 'border-white/25 bg-white/10 text-white placeholder:text-white/50'
      : 'border-[var(--cta-line)] bg-[var(--cta-surface)] text-[var(--cta-ink)] placeholder:text-[var(--cta-ink-muted)]'
  }`;

export type ImageRenderer = (
  image: NonNullable<LeadMagnetOffer['image']>,
  className: string,
) => React.ReactNode;

/**
 * The lead capture card: an offer, an email field, and a way out of it.
 *
 * PRESENTATIONAL. It owns the submission and nothing else — whether it is on
 * screen, and what closing it means, belong to the block that wraps it (see
 * lead-magnet-block.tsx). Splitting them is what has let the same card be the
 * body of a rail block, then of an overlay, and now of a row in the sidebar
 * panel, without any of those placements leaving assumptions in here.
 *
 * It has to be a client component: a form that posts and then swaps itself for
 * a download link is interaction, not content.
 *
 * The three states are idle, sending and done, and `done` is terminal: there is
 * no path back to the form once an address has been accepted. An error returns
 * to idle with the message shown and the field still filled in, because the
 * common cause is a typo the reader can see.
 */

type Status = 'idle' | 'sending' | 'done';

/*
 * Still no `variant` prop. The second caller arrived — the admin's builder
 * renders this for its preview — and it wants the card to look exactly as it
 * looks on the blog, which is the whole point of sharing the component. What
 * it needs instead is `renderImage`, above, and a `theme` on the offer.
 */
export function LeadMagnetCard({
  offer,
  onClose,
  onConverted,
  renderImage,
  className = '',
}: {
  offer: LeadMagnetOffer;
  /** Pressing the cross. What that does is the wrapper's decision, not this one's. */
  onClose: () => void;
  /** Fired once an address has been accepted, so the wrapper can remember it. */
  onConverted: () => void;
  /** See ImageRenderer. Defaults to a plain <img>. */
  renderImage?: ImageRenderer;
  className?: string;
}) {
  const fieldId = useId();
  const skin = THEME_SKINS[offer.theme];

  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [assetUrl, setAssetUrl] = useState<string | null>(null);

  /*
   * Checked before every setState after an await. The wrapper unmounts this
   * when the block is collapsed, so a reader who closes it mid-submission
   * would otherwise have the response set state on a component that is gone.
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

      /*
       * Reported, not acted on. The card stays exactly where it is and shows
       * the success state — whipping it away at the moment it finally has
       * something to give the reader would take the download link with it.
       * What the wrapper does with this only affects the next article.
       */
      onConverted();
    } catch {
      if (!live.current) return;
      // Network-level failure: no response at all. Distinguished from a 4xx
      // because the reader can do something about one and not the other.
      setError('Could not reach the server. Check your connection and try again.');
      setStatus('idle');
    }
  }

  return (
    /*
     * THE THEME REACHES THIS CARD NOW. It used to be one hard-coded treatment
     * — a muted surface and a hairline — which meant the builder's Background
     * control did nothing at all to a block that appears in the sidebar, while
     * appearing to. Denis, 2026-10-09, on a block that looked nothing like its
     * preview: "maybe add a new theme or style (sidebar) to render these 2
     * existing properly".
     *
     * The skins are the same four the in-body block uses, drawn from --cta-*,
     * so a block set to Dark is the same dark in both placements. The one
     * visible change to blocks that already exist: `surface` is the column's
     * own surface rather than the muted one it used to be pinned to, because
     * that is what `surface` means everywhere else.
     */
    <div
      className={`relative overflow-hidden rounded-xl ${skin.shell} ${
        offer.accentBorder ? 'cta-accent-edge' : ''
      } ${className}`}
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
        onClick={onClose}
        aria-label="Close this offer"
        title="Close"
        className={`absolute right-2 top-2 z-10 rounded-full p-1.5 backdrop-blur-sm transition-colors ${
          skin.dark
            ? 'bg-black/30 text-white/70 hover:text-white'
            : 'bg-[var(--cta-surface)]/80 text-[var(--cta-ink-muted)] hover:text-[var(--cta-ink)]'
        }`}
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

      {offer.image ? (
        /*
          Inset rather than full-bleed. It ran edge to edge across the top for
          two revisions, which was right while the card was an overlay with the
          whole rail to itself; in the sidebar panel the offer shares a fixed
          height with the contents list and the call to action, and a 4:3 mockup
          at the column's full width was single-handedly deciding whether the
          rest fitted. See OfferImage for the cap.
        */
        <div className="px-5 pt-5">
          <OfferImage image={offer.image} render={renderImage} />
        </div>
      ) : null}

      <div className={offer.image ? 'px-5 pb-5 pt-4' : 'p-5'}>
        <h2
          className={`pr-8 font-[family-name:var(--font-headline)] text-base leading-snug ${skin.heading}`}
        >
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

        {offer.kind === 'link' ? (
          /*
             A LINK BLOCK. It used to render the capture form anyway — the card
             had no `kind` to branch on — so a block whose whole job was to send
             someone to a calculator asked them for an email instead, and its
             destination went nowhere. Now the two kinds mean the same thing in
             both placements.

             No live region and no status: nothing is submitted, so there is
             nothing to announce.
          */
          <>
            {offer.body ? (
              <p className={`mt-2 whitespace-pre-line text-sm leading-relaxed ${skin.body}`}>{offer.body}</p>
            ) : null}

            <a
              href={offer.href ?? '#'}
              className={`mt-4 inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium no-underline ${
                skin.dark
                  ? 'bg-white !text-[var(--cta-dark)]'
                  : 'bg-[var(--cta-accent)] !text-[var(--cta-accent-ink)]'
              }`}
            >
              {offer.buttonLabel}
            </a>

            {offer.consentText ? (
              <p className={`mt-2 text-xs leading-relaxed ${skin.fine}`}>
                {offer.consentText}
              </p>
            ) : null}
          </>
        ) : status === 'done' ? (
          <div className="mt-3">
            <p className={`text-sm leading-relaxed ${skin.body}`}>
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
                className={`mt-4 inline-flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium no-underline ${
                  skin.dark
                    ? 'bg-white !text-[var(--cta-dark)]'
                    : 'bg-[var(--cta-accent)] !text-[var(--cta-accent-ink)]'
                }`}
              >
                Download it now
              </a>
            ) : null}
          </div>
        ) : (
          <>
            {offer.body ? (
              <p className={`mt-2 whitespace-pre-line text-sm leading-relaxed ${skin.body}`}>
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
                    className={FIELD_CLASS(skin.dark)}
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
                className={FIELD_CLASS(skin.dark)}
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
                className={`mt-1 w-full rounded-md px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-60 ${
                  skin.dark
                    ? 'bg-white text-[var(--cta-dark)]'
                    : 'bg-[var(--cta-accent)] text-[var(--cta-accent-ink)]'
                }`}
              >
                {status === 'sending' ? 'Sending…' : offer.buttonLabel}
              </button>

              {error ? (
                <p
                  id={`${fieldId}-error`}
                  role="alert"
                  className={`text-sm font-medium ${skin.heading}`}
                >
                  {error}
                </p>
              ) : null}

              {offer.consentText ? (
                <p className={`mt-1 text-xs leading-relaxed ${skin.fine}`}>
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
 * The offer's picture, across the top of the card.
 *
 * NEVER CROPPED, and bounded by HEIGHT rather than width. These are designed
 * graphics — a mockup with the product's name set into it — so an
 * `object-cover` box at a fixed ratio would cut the words off the artwork, and
 * which words depends on the image.
 *
 * So the cap is `max-h-40` with `w-auto`: the picture keeps its aspect ratio
 * and simply renders smaller, up to 160px tall, whatever shape the author
 * uploaded. A `max-w` would not do the same job — a portrait mockup constrained
 * by width is still tall — and `object-contain` inside a fixed box would leave
 * the element claiming height the picture is not using.
 *
 * 160px is the number that makes the rest of the panel fit on a laptop. The
 * card has no scroll region any more, deliberately (see lead-magnet-block.tsx),
 * so its natural height is the whole budget: heading, copy, field, button and
 * this. At the column's full width a 4:3 mockup alone was 240px of it.
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
function OfferImage({
  image,
  render,
}: {
  image: NonNullable<LeadMagnetOffer['image']>;
  render?: ImageRenderer;
}) {
  /*
   * `mx-auto` because a picture narrower than the card would otherwise sit
   * against its left edge. Most are wider than 160px tall and fill the width
   * anyway; a portrait one does not, and centred is the only placement that
   * looks deliberate.
   */
  const className = 'mx-auto h-auto max-h-40 w-auto max-w-full';

  if (render) return <>{render(image, className)}</>;

  /*
   * Empty alt unless the author wrote one. The heading directly above says what
   * the offer is, so describing the mockup as well announces the same thing
   * twice to anyone listening rather than looking.
   */
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={image.url} alt={image.alt ?? ''} className={className} />;
}
