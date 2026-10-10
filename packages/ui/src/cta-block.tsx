import type { CtaBlockView } from '@blog/core';

import { buttonClass, THEME_SKINS } from './cta-theme';

/**
 * An in-content call to action.
 *
 * ONE component, rendered by both apps: readers see it in a post body, and the
 * admin renders this exact component in the builder's live preview and inside
 * the editor. A preview that is a second implementation is a preview that lies
 * the first time a layout changes, and the whole point of a builder is that
 * what you see is what ships.
 *
 * FOUR LAYOUTS, a closed set. They are shapes, not styles: each answers a
 * different question about how much room the CTA deserves. The styling on top
 * of them is the theme, which is four more. Sixteen combinations is enough
 * range for a blog and few enough that every one can be looked at.
 *
 * The action slot — button or email form — is passed IN rather than rendered
 * here. The email variant needs client-side state, and a layout component that
 * imported it would drag `'use client'` across all four, turning every link
 * block into a hydrated island for no reason.
 */
export function CtaBlock({
  block,
  action,
}: {
  block: CtaBlockView;
  /** The button or the capture form. See `CtaAction` in the consuming app. */
  action: React.ReactNode;
}) {
  const skin = THEME_SKINS[block.theme];

  /*
   * The accent edge from the references, as a gradient rule across the top.
   *
   * A pseudo-element rather than a border, because `border-image` cannot be
   * combined with a radius — the corners square off, which is exactly the
   * detail the treatment exists for.
   */
  const frame = [
    'cta-block relative isolate my-10 overflow-hidden rounded-2xl',
    skin.shell,
    block.accentBorder ? 'cta-accent-edge' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const eyebrow = block.eyebrow ? (
    <p
      className={`mb-2 text-xs font-semibold uppercase tracking-[0.12em] ${skin.fine}`}
    >
      {block.eyebrow}
    </p>
  ) : null;

  const heading = (
    <h3 className={`text-2xl font-bold leading-tight ${skin.heading}`}>
      {block.heading}
    </h3>
  );

  /*
   * `whitespace-pre-line`, so the line breaks the author typed survive.
   *
   * The field is a textarea and the hint under it says "plain text", which
   * everyone reasonably reads as "what I type is what I get". HTML does not
   * agree: a newline in a text node is whitespace, so four ticked lines came
   * out as one run-on paragraph. Denis, 2026-10-09: "The CTA doesn't respect
   * when I go to the line."
   *
   * `pre-line` rather than `pre-wrap`: it honours newlines and still collapses
   * runs of spaces and wraps normally, which is what plain text pasted out of
   * a document needs. `pre-wrap` would also preserve the accidental double
   * spaces and the indentation that comes with a paste.
   */
  const body = block.body ? (
    <p className={`mt-2 whitespace-pre-line text-base leading-relaxed ${skin.body}`}>
      {block.body}
    </p>
  ) : null;

  const fine = block.consentText ? (
    <p className={`mt-3 text-sm ${skin.fine}`}>{block.consentText}</p>
  ) : null;

  /*
   * BANNER AND SPLIT ARE ONE LAYOUT, and `split` is what a banner is called
   * once it has a picture.
   *
   * They were two, and the difference between them was exactly the image —
   * Denis, 2026-10-09: "what's the difference between banner and split? Isn't
   * split just banner with an image?" Reading the two branches, yes: the only
   * thing the split arrangement adds is the image panel, and the only reason
   * its button sits under the copy rather than beside it is that the panel has
   * taken the right half. That is one layout answering to whether there is a
   * picture, not two layouts.
   *
   * So a banner WITH an image now draws the panel. Before this, choosing an
   * image on a banner did nothing visible anywhere, which is the bug underneath
   * the question. `split` stays a valid stored value and renders as it always
   * did; it is simply no longer offered as a separate choice in the admin.
   */
  const layout =
    block.layout === 'banner' && block.image ? 'split' : block.layout;

  switch (layout) {
    /*
     * BILLBOARD — centred, the button as the whole point.
     *
     * The only layout that centres, and the only one where the copy is allowed
     * to be the hero. For the moment in an article where the CTA is the point
     * rather than an aside.
     */
    case 'billboard':
      return (
        <aside className={frame}>
          <div className="mx-auto max-w-2xl px-6 py-12 text-center sm:px-10">
            {eyebrow}
            {heading}
            {body}
            <div className="mt-7 flex justify-center">{action}</div>
            {fine}
          </div>
        </aside>
      );

    /*
     * STRIP — a compact bar. Heading left, button right, no body copy slot.
     *
     * `body` is deliberately dropped rather than wrapped: this layout exists to
     * be short, and letting a paragraph in turns it into a worse banner. The
     * builder says so where the layout is chosen.
     */
    case 'strip':
      return (
        <aside className={frame}>
          <div className="flex flex-col gap-5 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-9">
            <div className="min-w-0">
              {eyebrow}
              {heading}
            </div>
            <div className="shrink-0">{action}</div>
          </div>
        </aside>
      );

    /*
     * SPLIT — the banner with its picture: two columns, the right one a panel
     * for the image.
     *
     * Falls back to the plain banner when there is no image: an empty panel is
     * a wide stripe of nothing, and a block should not look broken because
     * somebody has not uploaded the picture yet.
     */
    case 'split':
      if (!block.image) break;
      return (
        <aside className={frame}>
          <div className="grid items-stretch gap-0 sm:grid-cols-[1.3fr_1fr]">
            <div className="px-6 py-9 sm:px-9">
              {eyebrow}
              {heading}
              {body}
              <div className="mt-6">{action}</div>
              {fine}
            </div>
            {/* Dark on every theme, including the light ones — in the
                references this panel is what the eye lands on. */}
            <div className="relative min-h-[11rem] bg-[var(--cta-dark)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={block.image.url}
                alt={block.image.alt ?? ''}
                width={block.image.width ?? undefined}
                height={block.image.height ?? undefined}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </aside>
      );

    default:
      break;
  }

  /*
   * BANNER — the default, and where `split` lands without an image.
   * With one it is the split arrangement above.
   *
   * Copy left, action right, small print under the action rather than under the
   * copy: it qualifies the button, and in the references it sits with it.
   */
  return (
    <aside className={frame}>
      <div className="flex flex-col gap-6 px-6 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-9">
        <div className="min-w-0 sm:max-w-md">
          {eyebrow}
          {heading}
          {body}
        </div>
        <div className="shrink-0 sm:text-center">
          {action}
          {fine}
        </div>
      </div>
    </aside>
  );
}

/** The link variant's action: one button, no client JavaScript. */
export function CtaLinkButton({ block }: { block: CtaBlockView }) {
  const skin = THEME_SKINS[block.theme];
  if (!block.href) return null;

  const external = /^https?:\/\//i.test(block.href);

  return (
    <a
      href={block.href}
      className={buttonClass(skin.dark)}
      // Only on genuinely external destinations — noopener on an internal link
      // costs a client-side navigation for nothing.
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {block.buttonLabel}
    </a>
  );
}

export { buttonClass, THEME_SKINS };
