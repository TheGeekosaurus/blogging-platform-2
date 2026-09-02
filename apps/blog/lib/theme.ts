/**
 * Blog theme preference.
 *
 * Two distinct values, which is the whole trick:
 *   - the PREFERENCE, one of 'system' | 'light' | 'dark', stored per reader;
 *   - the RESOLVED theme, always 'light' | 'dark', written to
 *     document.documentElement's `data-theme`.
 *
 * Resolving in the inline script means the CSS needs a single dark block keyed
 * on `data-theme="dark"`, instead of duplicating the palette for a
 * `prefers-color-scheme` media query as well.
 */

export const THEME_STORAGE_KEY = 'nntm-blog-theme';

export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_OPTIONS: ReadonlyArray<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/**
 * The script that runs before first paint.
 *
 * MUST stay inline and in <head>. Deferred, external or module-typed, it runs
 * after the first paint and the reader sees a flash of the wrong theme on every
 * single load — worse than having no toggle. Guarded by
 * apps/blog/__tests__/theme.test.ts.
 *
 * Wrapped in try/catch because `localStorage` throws outright in some
 * configurations (Safari private browsing, cookies blocked entirely) rather than
 * returning null. An exception here would abort the script before the attribute
 * was set, leaving the page on the light base — readable, but not what was asked
 * for, and silent.
 *
 * Written as a compact string rather than a real module because it is inlined
 * into the document: no bundling, no import, nothing to fetch.
 */
export const THEME_SCRIPT = `(function(){try{
var p=localStorage.getItem('${THEME_STORAGE_KEY}');
var d=p==='dark'||((!p||p==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);
document.documentElement.setAttribute('data-theme',d?'dark':'light');
}catch(e){}})();`;
