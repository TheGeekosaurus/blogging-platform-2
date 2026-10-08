import type { CtaTheme } from '@blog/core';

/**
 * The four background treatments, as class strings.
 *
 * NAMED BY ROLE, PAINTED FROM TOKENS. This platform runs several sites with
 * different brands, and the blog flips its whole palette under
 * `html[data-theme]` through `.blog-surface`. A block that stored `#7FD4B4`
 * would be mint on a site whose brand is navy, and still mint in dark mode.
 * Everything resolves through `--cta-*`, which cta.css defines and the blog
 * re-maps per theme — see the token contract at the top of that file.
 */
export interface ThemeSkin {
  /** The block's own surface. */
  shell: string;
  /** Heading colour. */
  heading: string;
  /** Supporting copy. */
  body: string;
  /** The small print under the button, quieter again. */
  fine: string;
  /** True when this ground is dark, so the button flips to a light fill. */
  dark: boolean;
}

export const THEME_SKINS: Record<CtaTheme, ThemeSkin> = {
  /** A card, the way most in-content CTAs should look. */
  surface: {
    shell: 'bg-[var(--cta-surface)] border border-[var(--cta-line)]',
    heading: 'text-[var(--cta-ink)]',
    body: 'text-[var(--cta-ink-muted)]',
    fine: 'text-[var(--cta-ink-muted)]',
    dark: false,
  },
  /** The same card, lifted off the page. Used when a block follows a figure. */
  tint: {
    shell: 'bg-[var(--cta-surface-muted)] border border-[var(--cta-line)]',
    heading: 'text-[var(--cta-ink)]',
    body: 'text-[var(--cta-ink-muted)]',
    fine: 'text-[var(--cta-ink-muted)]',
    dark: false,
  },
  /** Brand ground. The loudest a block gets without an image behind it. */
  dark: {
    shell: 'bg-[var(--cta-dark)] border border-transparent',
    heading: 'text-white',
    body: 'text-white/75',
    fine: 'text-white/60',
    dark: true,
  },
  /*
   * Brand ground with the house pattern behind it.
   *
   * The pattern is drawn in CSS rather than loaded as an image: it is a tiled
   * geometric wash, so a bitmap would be a request and a cache entry for
   * something two gradients produce, and it would not follow the brand colour
   * the way `currentColor`-derived gradients do.
   */
  pattern: {
    shell: 'cta-pattern bg-[var(--cta-dark)] border border-transparent',
    heading: 'text-white',
    body: 'text-white/75',
    fine: 'text-white/60',
    dark: true,
  },
};

/**
 * The button.
 *
 * One accent fill on light grounds, and the inverse on dark ones — on
 * `--cta-dark` an accent button is brand-on-brand, which is how a CTA ends
 * up invisible on the loudest layout.
 */
export function buttonClass(dark: boolean): string {
  const base =
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-full ' +
    'px-7 py-3.5 text-sm font-semibold no-underline transition-colors';

  return dark
    ? `${base} bg-white text-[var(--cta-dark)] hover:bg-white/90`
    : `${base} bg-[var(--cta-accent)] text-white hover:opacity-90`;
}
