import { ImageResponse } from 'next/og';

/**
 * The social preview card, for every route that has one.
 *
 * ONE renderer, because these are generated per route file and there is no
 * shared layout to hang them off — the post card, the page card and the author
 * card would otherwise be three near-copies drifting apart, which is how the
 * post card ended up on the generic slate palette (#101216 with a blue rule)
 * while the site it represents is near-black and gold. A link shared to
 * LinkedIn looked like a different company's blog.
 *
 * Colours are the brand's, written out rather than read from CSS: this runs in
 * the edge renderer with no stylesheet, so --color-ground and --color-gold are
 * not available here. They are pinned by a test against globals.css instead.
 *
 * System fonts only. Loading a webface would add a network fetch to every page
 * build, and at 1200x630 with one line of text the gain is invisible.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

/** --color-ground */
const GROUND = '#141414';
/** --color-gold */
const GOLD = '#e0a840';
/** --color-blog-ink */
const INK = '#f2f2f3';
/** --color-blog-muted */
const MUTED = '#9a9a9e';

export function ogCard({
  title,
  eyebrow,
  footer,
}: {
  title: string;
  /** Small label above the title — "Article", "Author", a category. */
  eyebrow?: string | null;
  /** The byline and site name, or just the site name. */
  footer: string;
}) {
  /*
   * Two steps rather than a formula: a long headline needs to shrink, but a
   * continuous scale produces a different size on every card and the set stops
   * looking like a set.
   */
  const fontSize = title.length > 70 ? 56 : 72;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: GROUND,
          color: INK,
          padding: '72px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {eyebrow ? (
            <div
              style={{
                display: 'flex',
                fontSize: 24,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: GOLD,
              }}
            >
              {eyebrow}
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              fontSize,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              /*
                Cards are generated from author-supplied titles of any length.
                Without a clamp a very long one overflows the card and the
                footer is pushed off the bottom edge.
              */
              maxHeight: '380px',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 28 }}>
          <div style={{ width: 44, height: 6, background: GOLD, display: 'flex' }} />
          <div style={{ color: MUTED, display: 'flex' }}>{footer}</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
