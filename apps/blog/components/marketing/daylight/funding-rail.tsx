import { FUNDING_OPTIONS } from '../ft/content';
import { CONTAINER, Chip, CtaButton, SolidButton } from './primitives';

/**
 * The funding options, as a sticky rail beside a scrolling column of products.
 *
 * ITS OWN FILE BECAUSE TWO PAGES WEAR IT, the same argument ./hero.tsx makes.
 * Denis asked the industry pages' shortlist to "mimic the main page with
 * products, title on the left, product cards scrolling on the right" — and the
 * honest reading of "mimic the main page" is the same component, not a second
 * copy that looks the same on the day it is written. It was the homepage's
 * `FundingOptions` until then and moved here unchanged; the homepage now calls
 * it with the copy it always passed.
 *
 * WHAT VARIES IS FOUR THINGS, which is exactly what the pages disagree about:
 *
 *   label    the chip
 *   heading  the rail's headline
 *   body     the rail's paragraph
 *   cards    which products, and in what order. The homepage passes all nine;
 *            an industry page passes the handful that trade usually wants.
 *
 * Nothing else is a prop. The CTA under the rail is on every page that shows
 * products, and a `showCta` flag would be the first step back towards two
 * sections.
 *
 * DAYLIGHT — modelled on the National Funding section Denis sent: the heading
 * holds still on the left while the products scroll past it on the right. The
 * dark design's horizontal carousel is gone from this build, and with it the
 * client component that drove it — this section is now entirely server
 * rendered, because a vertical stack needs no scroll logic at all.
 *
 * WHY THE CARDS LOST FIVE BULLETS EACH. They carried all six `points`, which is
 * a specification, not a teaser, and made each card taller than the viewport in
 * a column of four. The reference's cards are a title, a blurb, one headline
 * figure and a link — so these keep `points[0]`, the lead spec, and send the
 * rest to the product page.
 *
 * Nothing is lost by that: every card links to a /funding-solutions page whose
 * LOAN_PAGES entry carries the amount, the term, the repayment shape, the
 * funding time, the entry requirements and a pros/cons pair — considerably more
 * than the six bullets it replaces.
 *
 * THE CARDS ARE WHITE ON A SHADOW, matching the press tiles rather than the
 * tinted panels they were. Which means they are white on a white page and the
 * shadow is the only thing separating them — so it is the press tiles' exact
 * shadow, a tinted navy rather than a neutral black, and the border went with
 * the fill: a hairline plus a shadow gives a card two edges and reads as a
 * mistake.
 *
 * AND THE FIGURE IS THE CARD'S OWN, deliberately. The obvious move was to pull
 * `facts.amount` off the linked LOAN_PAGES entry, which would have given every
 * card a clean "$15,000 to $5,000,000" line exactly like the reference. It is
 * wrong here: the interest-only card links to /revenue-based-financing as the
 * closest fit among the pages that exist, not because it IS that product — see
 * the note on its `cta` in content.ts — so it would have printed another
 * product's limits under its own name. On a page taking live credit
 * applications that is not a cosmetic error.
 */
export function DaylightFundingRail({
  label,
  heading,
  body,
  cards,
  id = 'dl-options',
}: {
  label: string;
  heading: string;
  body: string;
  cards: readonly (typeof FUNDING_OPTIONS.cards)[number][];
  id?: string;
}) {
  return (
    <section aria-labelledby={id} className="border-t border-[var(--ft-line)]">
      <div
        className={`${CONTAINER} grid gap-10 py-14 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:py-20`}
      >
        {/*
          The rail. `self-start` is what makes `sticky` work inside a grid — a
          grid item stretches to the row height by default, so it has no room to
          move within its own track and sticks to nothing.

          `top-28` clears the sticky site header, which is itself `top-0`;
          without the offset the heading slides under it.
        */}
        <div className="flex flex-col items-start gap-6 lg:sticky lg:top-28 lg:self-start">
          <Chip>{label}</Chip>
          <h2
            id={id}
            className="max-w-[16ch] font-[family-name:var(--font-headline)] text-[clamp(1.875rem,3.6vw,2.75rem)] font-bold leading-[1.1] text-[var(--ft-ink)]"
          >
            {heading}
          </h2>

          {/*
            The rail's paragraph is LOANS.hero.body, not a new sentence written
            for this layout. FUNDING_OPTIONS has no body of its own, and the
            reference's left column is a headline over a paragraph — so rather
            than invent marketing copy for a page that takes credit
            applications, this borrows the line /funding-solutions already
            opens with. It describes exactly this: the options, side by side,
            one application. Give it a sentence of its own and it goes here.
          */}
          <p className="max-w-[46ch] text-[1.0625rem] leading-[1.65] text-[var(--ft-muted)]">
            {body}
          </p>

          <CtaButton className="mt-2" />
        </div>

        <ul className="flex flex-col gap-5 lg:gap-6">
          {cards.map((card) => {
            /*
             * Indexed access, so this is `| undefined` under the build's
             * stricter typecheck even though every card is written with six
             * points. Rendered conditionally rather than asserted — a card
             * added later without points should lose a line, not crash the
             * homepage.
             */
            const lead = card.points[0];

            return (
              <li
                key={card.slug}
                className="rounded-2xl bg-[var(--ft-bg)] p-6 shadow-[0_10px_26px_-12px_rgba(11,45,114,0.38)] lg:p-8"
              >
                {/*
                  The product's name, read off the program as `label` — the
                  same string as the menu item and the footer link, so the
                  three cannot drift apart.
                */}
                <h3 className="font-[family-name:var(--font-headline)] text-[clamp(1.375rem,2.2vw,1.75rem)] font-semibold leading-[1.2] text-[var(--ft-ink)]">
                  {card.label}
                </h3>

                {/*
                  THE 19px AND THE BOLD ARE NOT A STYLE CHOICE. --ft-subhead is
                  Denis's #5792A8, which is 3.45:1 on this white card — under
                  the 4.5:1 AA wants for body text and over the 3:1 it wants for
                  large text. WCAG counts 18.66px bold as large, so at
                  19px/700 this line is compliant and at 17px/500 it is not.
                  The long note in globals.css has the measurements and the
                  darker alternative if this ever needs to be smaller.
                */}
                <p className="mt-2 text-[1.1875rem] font-bold leading-[1.3] text-[var(--ft-subhead)]">
                  {card.subtitle}
                </p>

                <p className="mt-3 text-[1.0625rem] leading-[1.55] text-[var(--ft-muted)]">
                  {card.body}
                </p>

                {lead ? (
                  <p className="mt-5 border-t border-[var(--ft-line)] pt-5 text-[1.0625rem] leading-[1.5]">
                    <strong className="font-semibold text-[var(--ft-ink)]">{lead.label}</strong>
                    <span className="text-[var(--ft-muted)]">{' — '}{lead.body}</span>
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <SolidButton href={card.cta.href}>{card.cta.label}</SolidButton>
                  {card.tag ? (
                    <p className="text-[0.9375rem] italic text-[var(--ft-subtle)]">{card.tag}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
