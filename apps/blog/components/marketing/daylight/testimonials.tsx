import { REVIEWS } from '../brand';
import { TESTIMONIALS } from '../ft/content';
import { StarIcon } from '../ft/icons';
import { Avatar } from '../ft/post-list';
import { CONTAINER, SectionIntro } from './primitives';

/**
 * The Daylight review wall.
 *
 * ITS OWN FILE BECAUSE TWO PAGES WEAR IT. The homepage had it first; Denis
 * asked for it on /funding-solutions too on 2026-10-04, above the FAQ. Moved
 * here rather than copied, for the same reason ./hero.tsx exists — a copy is
 * the same section only on the day it is written.
 *
 * The reviews are quoted exactly as written; see the note over TESTIMONIALS in
 * ft/content.ts. Two of them contain the reviewers' own typos and those are not
 * ours to tidy.
 */

/**
 * A review's score, drawn.
 *
 * The number is the accessible name and the stars are hidden from it: five
 * repetitions of "star" is not what a screen reader should read out, and a
 * rounded-up four would be a different claim than the one the customer made.
 *
 * An empty star is the SAME path at low opacity rather than a different mark,
 * so the five always sit on one baseline at identical width.
 *
 * DAYLIGHT — the filled star is the gold fill rather than --ft-accent. It is a
 * mark, not text, so it keeps the brand colour; and a row of bronze stars reads
 * as a row of dead stars.
 */
function Stars({ score }: { score: number }) {
  return (
    <p className="inline-flex items-center gap-1 rounded-full bg-[var(--ft-card-raised)] px-4 py-2">
      <span className="sr-only">{score} out of 5</span>
      {[1, 2, 3, 4, 5].map((position) => (
        <StarIcon
          key={position}
          className={
            position <= score
              ? 'h-4 w-4 text-[var(--dl-gold)]'
              : 'h-4 w-4 text-[var(--ft-subtle)] opacity-35'
          }
        />
      ))}
    </p>
  );
}

/*
 * How wide a cell is, by how many share its row.
 *
 * The grid is SIX columns so a short last row can fill it instead of ending
 * ragged: three cells take two columns each, two take three, one takes all six.
 * That matters because the hairlines here are `gap-px` over a container painted
 * --ft-line, so a column with no cell in it is not blank — it is a solid bar of
 * rule colour. Filling the row avoids that without centring hacks, and it means
 * any number of reviews lays out properly.
 *
 * Written as whole literal class names. Tailwind generates classes by scanning
 * source text, so `lg:col-span-${n}` would compile to nothing at all.
 */
const REVIEW_SPAN: Record<number, string> = {
  1: 'lg:col-span-6',
  2: 'lg:col-span-3',
  3: 'lg:col-span-2',
};

/**
 * The review wall — our own markup over our own copy.
 *
 * The reviews are quoted exactly as written; see the note over TESTIMONIALS in
 * ft/content.ts. Two of them contain the reviewers' own typos and those are not
 * ours to tidy.
 */
export function DaylightTestimonials() {
  const { reviews } = TESTIMONIALS;
  /* Cells in the final row — 3 when the count divides evenly, not 0. */
  const lastRow = reviews.length % 3 || 3;
  const lastRowFrom = reviews.length - lastRow;

  return (
    <section aria-labelledby="dl-testimonials" className="border-t border-[var(--ft-line)]">
      <div className={`${CONTAINER} py-14 lg:py-20`}>
        <SectionIntro
          id="dl-testimonials"
          label={TESTIMONIALS.label}
          heading={TESTIMONIALS.heading}
          cta={TESTIMONIALS.cta}
          ctaHref={REVIEWS.collectUrl}
          ctaExternal
          className="mb-12 lg:mb-14"
        />

        <ul className="grid gap-px overflow-hidden rounded-2xl border border-[var(--ft-line)] bg-[var(--ft-line)] lg:grid-cols-6">
          {reviews.map((review, index) => (
            <li
              key={review.name}
              className={`flex flex-col items-center gap-5 bg-[var(--ft-bg)] px-6 py-10 text-center lg:px-8 ${
                REVIEW_SPAN[index < lastRowFrom ? 3 : lastRow]
              }`}
            >
              <div className="flex items-center gap-3">
                {/*
                  No reviewer on the wall has a photo, so this is always the
                  initial disc — the same one the blog list uses, which derives
                  a stable hue from the name rather than randomising it. Its
                  background is an inline style and so cannot be re-themed; the
                  `.dl-surface .ft-avatar` rule in globals.css puts the initials
                  back to white on top of it.
                */}
                <Avatar name={review.name} className="h-10 w-10 text-sm" />
                <div className="text-left leading-tight">
                  <p className="font-medium text-[var(--ft-ink)]">{review.name}</p>
                  <p className="text-sm text-[var(--ft-muted)]">
                    {review.title ? `${review.title} - ${review.company}` : review.company}
                  </p>
                </div>
              </div>

              <Stars score={review.score} />

              <blockquote className="w-full rounded-xl border border-[var(--ft-line)] bg-[var(--ft-card)] px-5 py-5 text-[0.9375rem] leading-[1.55] text-[var(--ft-muted)]">
                <p>{review.quote}</p>
              </blockquote>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * The blog band, fed by the site's real published posts.
 *
 * The rows and the pills are /blog's own components — the band on this page is
 * the first few of the same list, so it has to BE the same list rather than
 * look like it.
 */
