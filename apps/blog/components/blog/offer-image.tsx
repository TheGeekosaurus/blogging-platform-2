import Image from 'next/image';

import type { ImageRenderer } from '@blog/ui';

/**
 * The offer picture, optimised — the blog's half of `LeadMagnetCard`'s
 * `renderImage`.
 *
 * NEVER CROPPED, and bounded by HEIGHT rather than width. These are designed
 * graphics — a mockup with the product's name set into it — so an
 * `object-cover` box at a fixed ratio would cut the words off the artwork, and
 * which words depends on the image. The cap lives with the card (`max-h-40`),
 * which hands it down as `className`; this decides only HOW the file is
 * fetched.
 *
 * WHY IT IS A PROP RATHER THAN PART OF THE CARD. The card moved into
 * `@blog/ui` so the admin's builder can preview the real thing, and a package
 * shared by two apps should not import `next/image`: the admin would need
 * `images.remotePatterns` configured for a picture only its author ever sees.
 * The blog does want it — the sidebar is about 350px wide and the source is
 * usually a full-size upload, so it saves most of the bytes.
 *
 * TWO PATHS, and the branch is real rather than defensive. next/image needs
 * intrinsic dimensions to reserve space. The admin's uploader records width
 * and height, so that is the path anything picked in the admin takes. A row
 * imported before that, or one whose dimensions could not be read, has no
 * numbers to give it — passing invented ones would reserve the wrong space and
 * shift the page when the real image landed, which is worse than not
 * optimising. The card's own fallback covers that case.
 */
export const OfferImage: ImageRenderer = (image, className) => {
  /*
   * Empty alt unless the author wrote one. The heading directly above says what
   * the offer is, so describing the mockup as well announces the same thing
   * twice to anyone listening rather than looking.
   */
  const alt = image.alt ?? '';

  if (!image.width || !image.height) {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img src={image.url} alt={alt} className={className} />;
  }

  return (
    <Image
      src={image.url}
      alt={alt}
      width={image.width}
      height={image.height}
      className={className}
      /* Its rendered width is the panel's, less the card's padding — fixed at
         lg, and the full column in the stacked layout below it. */
      sizes="(min-width: 1024px) 312px, 100vw"
    />
  );
};
