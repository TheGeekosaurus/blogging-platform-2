import type { CtaKind, CtaLayout, CtaTheme } from '@blog/core';

/**
 * Human labels for the enum values, in one place.
 *
 * The builder, the insert picker and the CTA list all name these, and three
 * copies of "billboard" → "Billboard" is three chances for one screen to call
 * it something the others do not.
 */
export const CTA_LABELS: {
  layout: Record<CtaLayout, string>;
  theme: Record<CtaTheme, string>;
  kind: Record<CtaKind, string>;
} = {
  layout: {
    banner: 'Banner',
    split: 'Split',
    billboard: 'Billboard',
    strip: 'Strip',
  },
  theme: {
    surface: 'Card',
    tint: 'Tinted',
    dark: 'Dark',
    pattern: 'Patterned',
  },
  kind: {
    email: 'Email capture',
    link: 'Link',
  },
};

/** What each layout is FOR, shown beside it in the builder. */
export const LAYOUT_HINTS: Record<CtaLayout, string> = {
  banner: 'Copy left, button right. The default, and the safest mid-article.',
  split: 'Two columns with an image panel. Falls back to Banner without one.',
  billboard: 'Centred and tall. For when the CTA is the point, not an aside.',
  strip: 'A compact bar. Heading and button only — body copy is not shown.',
};
