'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { CAPTURE_ENDPOINT, readUtm, type CtaBlockView } from '@blog/core';
import { buttonClass, THEME_SKINS } from '@blog/ui';


/**
 * The capture form an in-content CTA shows when its kind is 'email'.
 *
 * A SECOND form, beside the aside card's, and not a refactor of it. The aside
 * card is a collapsible beam with an image, a success panel and a download
 * link; this is one row that has to fit inside four different layouts. They
 * share what actually matters and is easy to get wrong — the endpoint contract,
 * the honeypot and the UTM capture, all from `@/lib/lead-magnet` — and differ
 * in the part that is just markup.
 *
 * The only client component in an in-content block. Link blocks render on the
 * server; this is why `CtaBlock` takes its action as a prop rather than
 * importing the form, which would make every block an island.
 */
export function CtaEmailForm({ block }: { block: CtaBlockView }) {
  const skin = THEME_SKINS[block.theme];
  const fieldId = useId();

  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  // A reader can navigate away mid-submission; without this the response sets
  // state on a component that is gone. Same guard as the aside card.
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
          magnet: block.slug,
          email: String(form.get('email') ?? ''),
          name: String(form.get('name') ?? '') || null,
          // The honeypot: empty for a human, filled by anything that submits
          // every field it finds.
          company: String(form.get('company') ?? ''),
          sourcePath: window.location.pathname,
          referrer: document.referrer || null,
          utm: readUtm(window.location.search),
        }),
      });

      if (!live.current) return;
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!live.current) return;

      if (!response.ok) {
        setError(body.error ?? 'That did not go through. Try again in a moment.');
        setStatus('idle');
        return;
      }

      setStatus('done');
    } catch {
      if (!live.current) return;
      setError('That did not go through. Try again in a moment.');
      setStatus('idle');
    }
  }

  if (status === 'done') {
    return (
      <p role="status" className={`text-base font-medium ${skin.heading}`}>
        {block.successMessage}
      </p>
    );
  }

  const field =
    'w-full rounded-full border px-5 py-3 text-sm outline-none sm:w-auto ' +
    (skin.dark
      ? 'border-white/25 bg-white/10 text-white placeholder:text-white/50 focus:border-white/60'
      : 'border-[var(--cta-line)] bg-[var(--cta-surface)] text-[var(--cta-ink)] focus:border-[var(--cta-accent)]');

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {block.collectName ? (
        <>
          <label htmlFor={`${fieldId}-name`} className="sr-only">
            First name
          </label>
          <input
            id={`${fieldId}-name`}
            name="name"
            autoComplete="given-name"
            placeholder="First name"
            className={field}
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
        placeholder="you@example.com"
        className={field}
      />

      {/*
        The honeypot. `aria-hidden` and tabIndex -1 so it is invisible to a
        screen reader and unreachable by keyboard; hidden by position rather
        than `display:none`, which some bots check for.
      */}
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <input name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" disabled={status === 'sending'} className={buttonClass(skin.dark)}>
        {status === 'sending' ? 'Sending…' : block.buttonLabel}
      </button>

      {error ? (
        <p role="alert" className="text-sm text-red-500 sm:ml-2">
          {error}
        </p>
      ) : null}
    </form>
  );
}
