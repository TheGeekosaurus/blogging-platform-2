import Image from 'next/image';

import { CTA_HREF } from '../brand';
import { CashFlowIcon } from '../ft/icons';
import { DIFFERENCE } from './content';
import { GaugeIcon, LockIcon, PersonIcon } from './icons';
import { CONTAINER, Chip, CtaButton } from './primitives';

/**
 * The "difference" band — four claims beside a photograph.
 *
 * IT REPLACED THE QUALIFIER SURVEY, and that is the thing to know about this
 * section rather than anything about how it looks. The homepage used to embed
 * the ten-question GoHighLevel survey here, so a visitor could start an
 * application without leaving the page; now the same visitor gets four reasons
 * and a button to /get-funded, where that survey still lives in full.
 *
 * Denis asked for the swap. It is worth keeping in view because it moves the
 * page's lead capture one click further away, which is the kind of change that
 * shows up in conversion rather than in a screenshot. The flow is unbroken —
 * the CTA lands on the survey — but it is no longer a homepage form.
 *
 * It also means this page no longer loads the HighLevel embed script at all,
 * which is the one clear win in the trade.
 *
 * The layout is the reference's: claims stacked on the left with an icon each,
 * photograph on the right, one button underneath. See ./content.ts for what
 * happened to the copy and why.
 */

const ROW_ICONS = {
  speed: CashFlowIcon,
  score: GaugeIcon,
  data: LockIcon,
  people: PersonIcon,
} as const;

export function DaylightDifference() {
  return (
    <section aria-labelledby="dl-difference" className="border-t border-[var(--ft-line)]">
      <div
        className={`${CONTAINER} grid items-center gap-12 py-14 lg:grid-cols-2 lg:gap-16 lg:py-20`}
      >
        <div>
          {/*
            The label, tinted by `.dl-surface .ft-chip` like every other section
            label on the page. Written out rather than reached for through
            SectionIntro: that primitive puts the heading in its own column with
            an optional CTA beside it, and this section's heading has to sit
            directly above the list it introduces.
          */}
          <Chip>{DIFFERENCE.label}</Chip>

          <h2
            id="dl-difference"
            className="mt-5 max-w-[19ch] font-[family-name:var(--font-headline)] text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.08] text-[var(--ft-ink)]"
          >
            {DIFFERENCE.heading}
          </h2>

          {/*
            A <dl>, not a <ul>: each row is a short claim and its explanation,
            which is what a description list is for. The icon is decorative and
            sits inside the <dt> so a screen reader reads the claim and its
            body as one pair rather than announcing four unlabelled images.
          */}
          <dl className="mt-10 flex flex-col gap-7">
            {DIFFERENCE.rows.map((row) => {
              const Icon = ROW_ICONS[row.icon];
              return (
                <div key={row.title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4">
                  <Icon className="mt-0.5 h-6 w-6 shrink-0 text-[var(--ft-accent)]" />
                  <dt className="text-[1.0625rem] font-semibold text-[var(--ft-ink)]">
                    {row.title}
                  </dt>
                  {/*
                    `col-start-2` keeps the body aligned under the heading
                    rather than under the icon, without a second wrapper — the
                    icon occupies the first column of the first row only.
                  */}
                  <dd className="col-start-2 mt-1.5 max-w-[46ch] text-[1.0625rem] leading-[1.55] text-[var(--ft-muted)]">
                    {row.body}
                  </dd>
                </div>
              );
            })}
          </dl>

          <CtaButton href={CTA_HREF} className="mt-10">
            {DIFFERENCE.cta.label}
          </CtaButton>
        </div>

        {/*
          The photograph, at the same radius the destination cards use so the
          page has one corner language.

          `width`/`height` are the FILE's real pixels, not a guess: next/image
          reserves the box from that ratio before the image arrives, so a stale
          pair is a layout shift on load and a crop under `object-cover`. They
          moved with the photo when it was replaced.

          `sizes` matters here: without it next/image assumes the image is the
          full viewport width and serves a file roughly twice the size it needs.
          Half the viewport above the breakpoint, all of it below.
        */}
        <Image
          src={DIFFERENCE.image.src}
          alt={DIFFERENCE.image.alt}
          width={1800}
          height={1018}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="w-full rounded-[20px] object-cover shadow-[0_18px_40px_-20px_rgba(11,45,114,0.35)]"
        />
      </div>
    </section>
  );
}
