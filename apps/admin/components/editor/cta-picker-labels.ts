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
    /* Kept because rows still store it, and the insert picker and the CTA list
       both name whatever a row holds. It is no longer offered as a choice —
       see OFFERED_LAYOUTS below. */
    split: 'Banner with image',
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
  banner:
    'Copy left, button right. Add an image and it becomes two columns with an image panel.',
  split: 'Two columns with an image panel.',
  billboard: 'Centred and tall. For when the CTA is the point, not an aside.',
  strip: 'A compact bar. Heading and button only — body copy is not shown.',
};

/**
 * The layouts the builder OFFERS, which is no longer all of them.
 *
 * `split` is gone from the list because it was never a separate decision: it
 * is what a banner looks like once it has a picture, and CtaBlock now renders
 * it that way from `banner` + an image. Rows that already store `split` still
 * work and still render identically; they simply have one fewer pill to get
 * lost among.
 */
export const OFFERED_LAYOUTS = ['banner', 'billboard', 'strip'] as const;
