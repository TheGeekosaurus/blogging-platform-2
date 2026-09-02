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
 * current one is announced as selected, and only one is in the tab order — none
 * of which comes free from buttons that merely look like a group.
 *
 * This is the only client component in apps/blog. A CSS-only checkbox toggle
 * would avoid the JavaScript entirely but cannot remember the choice across a
 * navigation, which makes it useless as a preference.
 */
function resolve(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
}

function apply(preference: ThemePreference): void {
  document.documentElement.setAttribute('data-theme', resolve(preference));
}

export function ThemeToggle() {
  const name = useId();

  /*
   * Starts at 'system' and is corrected in the effect below rather than read
   * during render. Reading localStorage while rendering would make the server
   * and client markup disagree — the server has no idea what is stored — which
   * React reports as a hydration mismatch. The visible theme is already correct
   * before this mounts, because the inline script in <head> set it.
   */
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      // Storage can throw outright when cookies are blocked; 'system' stands.
    }

    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setPreference(stored);
    }
    setReady(true);
  }, []);

  /*
   * Follow the OS live while the preference is 'system'. Without this, changing
   * the system theme leaves the page on whatever was resolved at load — which
   * looks like the toggle is stuck.
   */
  useEffect(() => {
    if (preference !== 'system') return;

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [preference]);

  function choose(next: ThemePreference) {
    setPreference(next);
    apply(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // The theme still applies for this page view; it just will not persist.
    }
  }

  return (
    <fieldset
      /*
       * Hidden until the stored preference is known, so the control never shows
       * "System" highlighted for a fraction of a second when the reader has
       * actually chosen Dark. `visibility` rather than conditional rendering
       * keeps the layout from shifting.
       */
      style={ready ? undefined : { visibility: 'hidden' }}
      className="border-0 p-0"
    >
      <legend className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
        Reading theme
      </legend>

      <div
        role="radiogroup"
        aria-label="Reading theme"
        className="mt-3 inline-flex rounded-full border border-[var(--color-line)] p-1"
      >
        {THEME_OPTIONS.map((option) => {
          const selected = preference === option.value;

          return (
            <label
              key={option.value}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                selected
                  ? 'bg-[var(--color-accent)] font-semibold text-[var(--color-surface)]'
                  : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                onChange={() => choose(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
