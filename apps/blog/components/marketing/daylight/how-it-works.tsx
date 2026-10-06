import Image from 'next/image';

import { HOW_IT_WORKS } from '../ft/content';
import { ApplyRow } from '../ft/shared-sections';
import { CONTAINER, SectionIntro } from './primitives';

/**
 * How It Works — the shared timeline, with Denis's step icons above it.
 *
 * A FORK, AND ONLY FOR THE ICONS. Everything else here is ft/shared-sections'
 * HowItWorks reproduced as it stands: the same header band, the same centred
 * sub-heading, the same numbered row with its connecting hairline, the same
 * sweep classes, the same "Get Funded" underneath. This page had a forked
 * version once before that turned the timeline into cards on a navy ground,
 * and Denis reverted it — so the fork came back deliberately narrow.
 *
 * It exists because there was no third option. The icons are three files that
 * have to sit above three specific steps, which means markup; the shared
 * component is rendered by the LIVE dark homepage, so adding them there would
 * change a page nobody asked to change. A marker class could not have done it
 * either — CSS can restyle an element, not introduce three different images.
 *
 * THE COPY IS STILL HOW_IT_WORKS, so the two pages say the same thing and a
 * change to a step body lands on both. What is local to this file is the
 * pairing of an icon to a step, which is a design decision rather than content.
 *
 * If the icons are ever wanted on the dark site too, this whole file should go
 * and the icons should move into content.ts beside the steps they belong to.
 */

/**
 * One icon per step, in step order.
 *
 * Self-hosted rather than hotlinked from the CDN Denis supplied them on. The
 * marketing photos elsewhere are hotlinked by an earlier decision, but that is
 * one origin the site already depends on and pays a handshake for; these came
 * from a second, and three small marks in the middle of the page are not worth
 * a new third-party dependency on the critical path.
 *
 * The line art is navy and cyan on transparency — the palette already in use —
 * so they need no treatment here and would need a different one on the dark
 * site, which is another reason they are not in content.ts.
 */
const STEP_ICONS = [
  { src: '/marketing/step-1.png', alt: '' },
  { src: '/marketing/step-2.png', alt: '' },
  { src: '/marketing/step-3.png', alt: '' },
] as const;

export function DaylightHowItWorks() {
  return (
    /*
      `border-t` — Denis asked for a divider ahead of this section on
      2026-10-04. It is on the section rather than on whatever precedes it so
      every page that drops this in gets the rule without having to remember,
      which is how the homepage and /funding-solutions stay in step.

      It shows against a white neighbour and is simply covered by a dark one —
      on /funding-solutions the products now sit on navy artwork, so there the
      edge is the artwork's and this rule does nothing. That is the right
      failure: a hairline that disappears where it is not needed.
    */
    <section aria-labelledby="dl-how" className="border-t border-[var(--ft-line)]">
      <div className={`${CONTAINER} py-14 lg:py-20`}>
        <SectionIntro
          id="dl-how"
          label={HOW_IT_WORKS.label}
          heading={HOW_IT_WORKS.heading}
          className="mb-14 lg:mb-16"
        />

        <h3 className="mb-12 font-[family-name:var(--font-headline)] text-[clamp(1.5rem,2.8vw,2.125rem)] font-semibold leading-[1.2] text-[var(--ft-ink)] lg:mb-16">
          {HOW_IT_WORKS.stepsHeading}
        </h3>

        {/*
         * The sweep is staggered purely by `animation-delay`, computed here so
         * the order lives with the markup rather than in five CSS rules:
         * numeral, its rule, the next numeral, and so on, 1.2s apart.
         */}
        <ol className="ft-steps grid gap-12 md:grid-cols-3 md:gap-8">
          {HOW_IT_WORKS.steps.map((step, i) => {
            const icon = STEP_ICONS[i];

            return (
              <li key={step.title} className="flex flex-col gap-5">
                {/*
                  Decorative: `alt=""` and nothing announced. The step's own
                  title says what it is, and "a calculator" is not extra
                  information — it is the same information as a picture.

                  Rendered at 2x its display size, so it stays crisp on a
                  retina screen; `unoptimized` is not set, so next/image serves
                  a resized WebP from our own origin.
                */}
                {icon ? (
                  <Image
                    src={icon.src}
                    alt={icon.alt}
                    width={144}
                    height={144}
                    className="h-[72px] w-[72px]"
                  />
                ) : null}

                <div className="flex items-center gap-5">
                  <span
                    aria-hidden="true"
                    style={{ animationDelay: `${i * 2.4}s` }}
                    className="ft-step-number font-[family-name:var(--font-headline)] text-[2.75rem] font-semibold leading-none text-[var(--dl-gold)]"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {i < HOW_IT_WORKS.steps.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className="relative hidden h-px flex-1 bg-[var(--dl-gold)]/35 md:block"
                    >
                      {/* Drawn over the resting rule, so the rule never disappears. */}
                      <span
                        style={{ animationDelay: `${i * 2.4 + 1.2}s` }}
                        className="ft-step-fill absolute inset-0 block bg-[var(--dl-gold)]"
                      />
                    </span>
                  ) : null}
                </div>

                <div>
                  <h4 className="text-lg font-medium text-[var(--ft-ink)]">{step.title}</h4>
                  <p className="mt-2 max-w-[34ch] text-[1.0625rem] leading-[1.55] text-[var(--ft-muted)]">
                    {step.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <ApplyRow className="mt-14" />
      </div>
    </section>
  );
}
