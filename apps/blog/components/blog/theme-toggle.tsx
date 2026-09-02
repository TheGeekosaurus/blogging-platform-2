'use client';

import { useEffect, useId, useState } from 'react';

import {
  THEME_OPTIONS,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/lib/theme';

/**
 * Reading-theme control for the blog.
 *
 * A radio group rather than three buttons: arrow keys move between options, the
 * current one is announced as selected, and only one lands in the tab order —
 * none of which comes free from buttons that merely look like a group.
 *
 * Icon-only, so the accessible names carry the whole meaning. Each input keeps
 * its `aria-label` and gains a matching `title` for hover; the legend is
 * visually hidden rather than removed. Without those this is three unlabelled
 * squares to anyone not looking at it.
 *
 * Icons are inline SVG. This is the blog's only client component and it should
 * not pull an icon dependency for three glyphs.
 *
 * This is also the one component here that may not use the palette-specific
 * tokens — see apps/blog/__tests__/contrast.test.ts.
 */
const ICONS: Record<ThemePreference, React.ReactNode> = {
  system: (
    <>
      <rect x="2.5" y="3.5" width="15" height="10" rx="1.5" />
      <path d="M7 17h6M10 13.5V17" strokeLinecap="round" />
    </>
  ),
  light: (
    <>
      <circle cx="10" cy="10" r="3.6" />
      <path
        d="M10 2.2v1.6M10 16.2v1.6M2.2 10h1.6M16.2 10h1.6M4.5 4.5l1.1 1.1M14.4 14.4l1.1 1.1M15.5 4.5l-1.1 1.1M5.6 14.4l-1.1 1.1"
        strokeLinecap="round"
      />
    </>
  ),
  dark: <path d="M16 11.6A6.6 6.6 0 1 1 8.4 4a5.4 5.4 0 0 0 7.6 7.6Z" strokeLinejoin="round" />,
};

export function ThemeToggle({ className = '' }: { className?: string }) {
  const name = useId();

  /*
   * Starts at 'system' and is corrected in the effect below rather than read
   * during render. Reading localStorage while rendering would make the server
   * and client markup disagree — the server cannot know what is stored — which
   * React reports as a hydration mismatch. The visible theme is already right
   * before this mounts, because the inline script in <head> set it.
   */
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      // Storage throws outright when cookies are blocked; 'system' stands.
    }

    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setPreference(stored);
    }
    setReady(true);
  }, []);

  /*
   * Follow the OS live while the preference is 'system'. Without this, changing
   * the system theme leaves the page on whatever was resolved at load, which
   * looks like the control is stuck.
   */
  useEffect(() => {
    if (preference !== 'system') return;

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      document.documentElement.setAttribute('data-theme', query.matches ? 'dark' : 'light');
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [preference]);

  function choose(next: ThemePreference) {
    setPreference(next);

    const resolved =
      next === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : next;
    document.documentElement.setAttribute('data-theme', resolved);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Applies for this page view; it just will not persist.
    }
  }

  return (
    <fieldset
      /*
       * Hidden until the stored preference is known, so the control never shows
       * System highlighted for a moment when the reader has chosen Dark.
       * `visibility` rather than conditional rendering, so the layout does not
       * shift once it appears.
       */
      style={ready ? undefined : { visibility: 'hidden' }}
      className={`border-0 p-0 ${className}`}
    >
      <legend className="sr-only">Reading theme</legend>

      {/*
        No role="radiogroup" here: the fieldset and its legend already group
        these natively, and nesting an explicit group with the same name has a
        screen reader announce "Reading theme" twice. This div is layout only.

        rounded-md to match the CTA buttons in the header and footer.
      */}
      <div className="inline-flex gap-0.5 rounded-md border border-[var(--color-line)] p-0.5">
        {THEME_OPTIONS.map((option) => {
          const selected = preference === option.value;

          return (
            <label
              key={option.value}
              title={option.label}
              className={`flex h-8 w-9 cursor-pointer items-center justify-center rounded-md transition-colors ${
                selected
                  ? 'bg-[var(--color-accent)] text-[var(--color-surface)]'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => choose(option.value)}
                aria-label={option.label}
                className="sr-only"
              />
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                {ICONS[option.value]}
              </svg>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
