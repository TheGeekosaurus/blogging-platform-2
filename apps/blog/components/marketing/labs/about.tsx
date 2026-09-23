import Image from 'next/image';
import Link from 'next/link';

import {
  ABOUT_HERO,
  ABOUT_LINKS,
  ABOUT_SECTIONS,
  ABOUT_STATS_CTA,
  AWARDS,
  MILESTONES,
  TEAM,
  TEAM_ANCHOR,
} from './about-content';
import { GET_STARTED_PATH } from './brand';
import { SERVICE_MARQUEE } from './content';
import { ArrowRight, AwardMedal, SOCIAL_ICONS } from './icons';
import { Marquee, Panel, SectionHeader, SectionLink } from './primitives';
import { ClosingCta, Faq, StatGrid, Testimonials } from './sections';

/**
 * The Nanotom Labs About page, from the template's About frame.
 *
 * Its shape is the frame's, on the same grid as the other four pages:
 *
 *   hero          copy card beside the stat grid (shared, ./sections.tsx)
 *   team          four people
 *   achievements  four dated milestones
 *   awards        four awards
 *   testimonials  (shared)
 *   FAQ           (shared)
 *   closing call  (shared)
 *
 * ⚠️ THREE OF THOSE SECTIONS ARE PLACEHOLDER, and on an About page that is a
 * different kind of problem than it is elsewhere — this is the page where a
 * business states facts about itself, so the invented staff, dates and awards
 * read as claims rather than as filler. Read the warning at the top of
 * ./about-content.ts before this page is published.
 *
 * EACH OF THE THREE DROPS ITSELF WHEN ITS ARRAY IS EMPTY, which is the point:
 * making this page honest today is deleting four lines of data, not editing
 * markup. The FAQ, the testimonials and the closing call are the shared ones
 * and stay either way.
 *
 * NO MOBILE ARTBOARD was supplied for this frame, so everything below `lg` is
 * an inference from the homepage's mobile frame: one column, the stat grid
 * under the copy, and the section links moving beneath their content.
 */
export function LabsAbout() {
  return (
    <div className="px-4 pb-6 pt-4 lg:px-[50px] lg:pt-5">
      <Hero />
      <Team />
      <Milestones />
      <Awards />
      <Testimonials />
      <Faq />

      {/*
       * The closing call goes to the contact page rather than to the FAQ's
       * form below it, which is the same call the project pages make: someone
       * who has just read who you are is further from deciding than someone
       * who clicked "Get Started", and that page offers the ways to reach the
       * business that a bare form does not.
       */}
      <ClosingCta enquiryAnchor={GET_STARTED_PATH} />
    </div>
  );
}

function Hero() {
  return (
    <section className="grid gap-5 lg:min-h-[var(--nl-hero-h)] lg:grid-cols-[minmax(0,1207fr)_minmax(0,593fr)]">
      <div className="flex min-w-0 flex-col justify-between gap-8 rounded-[var(--nl-radius-block)] bg-[var(--nl-card)] p-5 pb-4 lg:p-12 lg:pb-5">
        <div>
          {/*
           * The same clamps as /services, /get-started and the project pages —
           * see the measured note in ./home.tsx. The homepage's are different
           * now, and deliberately: its first line carries the rolling slot and
           * has to fit the longest word in it, which no other hero does.
           */}
          <h1 className="nl-heading text-[clamp(24px,6.5vw,30px)] leading-[1.15] lg:text-[clamp(36px,3.3vw,62px)] lg:leading-[1.1]">
            <span className="grid gap-y-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-8">
              <span>{ABOUT_HERO.headingLines[0]}</span>

              <Link
                href={GET_STARTED_PATH}
                className="group hidden shrink-0 items-center gap-3 justify-self-end lg:inline-flex"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[var(--nl-accent)] text-[var(--nl-accent)] transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="size-6" />
                </span>
                <span className="nl-label whitespace-nowrap text-base text-[var(--nl-accent)]">
                  {ABOUT_HERO.cta}
                </span>
              </Link>
            </span>

            {ABOUT_HERO.headingLines.slice(1).map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <Link
            href={GET_STARTED_PATH}
            className="group mt-6 inline-flex items-center gap-3 lg:hidden"
          >
            <span className="grid size-10 place-items-center rounded-full border border-[var(--nl-accent)] text-[var(--nl-accent)]">
              <ArrowRight className="size-4" />
            </span>
            <span className="nl-label text-sm text-[var(--nl-accent)]">{ABOUT_HERO.cta}</span>
          </Link>

          <p className="mt-5 max-w-[910px] text-sm leading-relaxed text-[var(--nl-muted)] lg:mt-6 lg:text-lg">
            {ABOUT_HERO.body}
          </p>
        </div>

        <Marquee
          items={SERVICE_MARQUEE}
          durationSeconds={38}
          className="rounded-[var(--nl-radius-control)] bg-[var(--nl-bg)] py-4 lg:py-5"
        />
      </div>

      {/*
       * The template's hero puts four invented figures here. These are the
       * five the business actually stands behind — the same STATS the homepage
       * bands across its width — and the trailing tile scrolls to the team
       * rather than off the page, which is what the frame's down arrow means.
       */}
      <StatGrid trailing={{ label: ABOUT_STATS_CTA, href: `#${TEAM_ANCHOR}` }} />
    </section>
  );
}

/**
 * The team.
 *
 * ⚠️ NOBODY HERE WORKS HERE — see ./about-content.ts. Renders nothing at all
 * when TEAM is empty, which is how the section is removed.
 *
 * THE PORTRAITS ARE CUT-OUTS over an accent panel, the same treatment the
 * /services work panels give their avatars: the source files carry an alpha
 * channel, so the colour behind the figure is the page's, not the image's.
 * That is why they followed the rebrand from the template's terracotta to gold
 * without anybody re-exporting anything.
 *
 * `object-contain` and `items-end`, not `object-cover`: these are people
 * standing on a ground, and covering would crop heads at the top of the panel.
 */
function Team() {
  if (TEAM.length === 0) return null;

  return (
    <Panel className="mt-[var(--nl-section-gap)]">
      <SectionHeader
        id={TEAM_ANCHOR}
        title={ABOUT_SECTIONS.team}
        link={{ label: ABOUT_LINKS.allMembers }}
      />

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {TEAM.map((member) => (
          <article
            key={member.name}
            className="flex flex-col gap-5 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 text-center lg:p-6"
          >
            <div>
              <h3 className="nl-heading text-lg break-words lg:text-xl">{member.name}</h3>
              <p className="mt-2 text-sm text-[var(--nl-muted)]">{member.role}</p>
            </div>

            <div className="flex aspect-[4/3] items-end justify-center overflow-hidden rounded-[var(--nl-radius-control)] bg-[var(--nl-accent)]">
              <Image
                src={member.portrait}
                alt=""
                width={220}
                height={220}
                className="h-full w-auto object-contain"
              />
            </div>

            {/*
             * Only for a member who has somewhere to send you. The design puts
             * three discs under every face; three discs that go nowhere are
             * three controls that look operable and are not.
             */}
            {member.links?.length ? (
              <ul className="flex items-center justify-center gap-3">
                {member.links.map((link) => {
                  const Icon = SOCIAL_ICONS[link.name];

                  return (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid size-10 place-items-center rounded-full bg-[var(--nl-raised)] text-[var(--nl-ink)] transition-colors hover:text-[var(--nl-accent)]"
                      >
                        <Icon className="size-4" />
                        <span className="sr-only">{`${member.name} on ${link.name}`}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </article>
        ))}
      </div>

      {/*
       * The header's link is desktop-only — see SectionHeader — so callers
       * that pass one place its mobile half themselves, under the content.
       * Testimonials does the same with "ALL Testimonials".
       */}
      <SectionLink label={ABOUT_LINKS.allMembers} />
    </Panel>
  );
}

/**
 * The dated milestones.
 *
 * ⚠️ THE DATES ARE INVENTED — see ./about-content.ts. Renders nothing when
 * MILESTONES is empty.
 *
 * Four across only from `xl`, the same call the homepage's reasons block and
 * the project pages' feature cards make: a quarter-width card is 208px at
 * 1024, narrower than some of these titles set at the artwork's size, which
 * pushes the page into horizontal scroll rather than merely looking tight.
 */
function Milestones() {
  if (MILESTONES.length === 0) return null;

  return (
    <Panel className="mt-[var(--nl-section-gap)]">
      <SectionHeader title={ABOUT_SECTIONS.milestones} />

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {MILESTONES.map((milestone) => (
          <article
            key={milestone.title}
            className="flex flex-col gap-5 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 lg:p-6"
          >
            {/*
             * The date in the mono face, which is what the artwork does and
             * what the rest of this site reserves for labels — it reads as
             * metadata rather than as the first line of the copy.
             */}
            <p className="nl-label text-xs text-[var(--nl-muted)]">{milestone.date}</p>

            <h3 className="nl-heading text-lg leading-snug break-words lg:text-xl">
              {milestone.title}
            </h3>

            <p className="mt-auto text-sm leading-relaxed text-[var(--nl-body)]">
              {milestone.body}
            </p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

/**
 * The awards.
 *
 * ⚠️ THE AWARDS WERE NOT GIVEN. This is the one section on the site that
 * names a third party who could say so — read the warning on AWARDS in
 * ./about-content.ts. Renders nothing when the array is empty, which is the
 * intended state until real ones exist.
 */
function Awards() {
  if (AWARDS.length === 0) return null;

  return (
    <Panel className="mt-[var(--nl-section-gap)]">
      <SectionHeader title={ABOUT_SECTIONS.awards} />

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {AWARDS.map((award) => (
          <article
            key={award.title}
            className="flex flex-col gap-5 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 lg:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-2 rounded-full bg-[var(--nl-raised)] px-3 py-2">
                <span className="text-xs text-[var(--nl-muted)]">{ABOUT_LINKS.date}</span>
                <span className="size-1 rounded-full bg-[var(--nl-accent)]" aria-hidden />
                <span className="text-xs text-[var(--nl-ink)]">{award.date}</span>
              </p>

              <span className="grid size-11 shrink-0 place-items-center rounded-[var(--nl-radius-control)] bg-[var(--nl-raised)] text-[var(--nl-accent)]">
                <AwardMedal className="size-5" />
              </span>
            </div>

            <h3 className="nl-heading text-lg leading-snug break-words lg:text-xl">
              {award.title}
            </h3>

            <p className="mt-auto text-sm leading-relaxed text-[var(--nl-body)]">{award.body}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}
