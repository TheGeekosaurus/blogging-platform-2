import Image from 'next/image';
import Link from 'next/link';

import { GET_STARTED_PATH } from './brand';
import { SERVICE_MARQUEE } from './content';
import { ArrowRight, PROJECT_FEATURE_ICONS } from './icons';
import type { Project } from './projects-content';
import { Marquee, Panel, SectionHeader } from './primitives';
import { ClosingCta, Faq, Testimonials, WorkPanel } from './sections';

/**
 * One project's page, from the template's Projects frame.
 *
 * The frame is a projects INDEX — a hero, four feature cards, then a showcase
 * of several projects behind Web Design / Web Development / Marketing filter
 * tabs. This is the singular version of it, so the filter tabs are gone: they
 * switch between projects, and a page about one project has nothing to switch
 * to. Everything else is the frame's, on the same grid as the other three
 * pages.
 *
 *   hero          copy card beside the project image
 *   key features  four cards in a panel
 *   showcase      the three-column panel /services also renders
 *   testimonials  (shared)
 *   FAQ           (shared)
 *   closing call  (shared)
 *
 * Every call on the page goes to /get-started rather than to an anchor. The
 * shared FAQ does bring the enquiry form down with it, so `#ask` would resolve
 * — but a visitor reading a case study is further from deciding than one who
 * clicked "Get Started", and the contact page offers the ways to reach the
 * business that a bare form does not.
 *
 * ⚠️ THE CONTENT IS PLACEHOLDER AND THE PROJECT NAMES A REAL COMPANY, and the
 * homepage galleries link here now. See the warning at the top of
 * ./projects-content.ts.
 */
export function LabsProject({ project }: { project: Project }) {
  return (
    <div className="px-4 pb-6 pt-4 lg:px-[50px] lg:pt-5">
      <Hero project={project} />
      <Features project={project} />

      <div className="mt-[var(--nl-section-gap)]">
        <SectionHeader title={project.showcaseTitle} />
        <div className="mt-5">
          {/*
           * `linkToCaseStudy={false}`: this panel's own entry points at this
           * page, and a gold button offering to show you the page you are
           * reading is a dead end wearing a call to action. It falls back to
           * "Book A Call" here.
           */}
          <WorkPanel
            work={project.showcase}
            enquiryAnchor={GET_STARTED_PATH}
            linkToCaseStudy={false}
          />
        </div>
      </div>

      <Testimonials />
      <Faq />
      <ClosingCta enquiryAnchor={GET_STARTED_PATH} />
    </div>
  );
}

function Hero({ project }: { project: Project }) {
  const { hero } = project;

  return (
    <section className="grid gap-5 lg:min-h-[var(--nl-hero-h)] lg:grid-cols-[minmax(0,1207fr)_minmax(0,593fr)]">
      <div className="flex min-w-0 flex-col justify-between gap-8 rounded-[var(--nl-radius-block)] bg-[var(--nl-card)] p-5 pb-4 lg:p-12 lg:pb-5">
        <div>
          {/*
           * The same clamps as the other three heroes — see the measured note
           * in ./home.tsx. The composition is the frame's: the call anchored to
           * the right of the first line, the rest stacked beneath.
           */}
          <h1 className="nl-heading text-[clamp(24px,6.5vw,30px)] leading-[1.15] lg:text-[clamp(36px,3.3vw,62px)] lg:leading-[1.1]">
            <span className="grid gap-y-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-8">
              <span>{hero.headingLines[0]}</span>

              <Link
                href={GET_STARTED_PATH}
                className="group hidden shrink-0 items-center gap-3 justify-self-end lg:inline-flex"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-full border border-[var(--nl-accent)] text-[var(--nl-accent)] transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="size-6" />
                </span>
                <span className="nl-label whitespace-nowrap text-base text-[var(--nl-accent)]">
                  {hero.cta}
                </span>
              </Link>
            </span>

            {hero.headingLines.slice(1).map((line) => (
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
            <span className="nl-label text-sm text-[var(--nl-accent)]">{hero.cta}</span>
          </Link>

          <p className="mt-5 max-w-[910px] text-sm leading-relaxed text-[var(--nl-muted)] lg:mt-6 lg:text-lg">
            {hero.body}
          </p>
        </div>

        <Marquee
          items={SERVICE_MARQUEE}
          durationSeconds={38}
          className="rounded-[var(--nl-radius-control)] bg-[var(--nl-bg)] py-4 lg:py-5"
        />
      </div>

      {/*
       * Untinted, like the other project imagery on the site: this is a
       * screenshot of work, and recolouring a portfolio thumbnail would
       * misrepresent what was delivered.
       *
       * The frame puts a category pill in one bottom corner and a "View Blog"
       * link in the other. The pill stays — it says what kind of project this
       * is at a glance. The link does not: it pointed at a blog on a page about
       * a client, which is a detour away from the one thing this page is for.
       */}
      <div className="relative min-h-[320px] min-w-0 overflow-hidden rounded-[var(--nl-radius-block)] bg-[var(--nl-card)]">
        <Image
          src={hero.image.src}
          alt={hero.image.alt}
          fill
          priority
          sizes="(min-width: 1024px) 593px, 100vw"
          className="object-cover"
        />

        <div className="absolute inset-x-0 bottom-0 p-4 lg:p-6">
          <span className="nl-label inline-flex rounded-[var(--nl-radius-input)] bg-white px-3 py-2 text-[10px] text-[#0f0f0f] lg:text-xs">
            {hero.tag}
          </span>
        </div>
      </div>
    </section>
  );
}

/**
 * The four key-feature cards.
 *
 * Four across only from `xl`, the same call the homepage's reasons block
 * makes: at 1024 a quarter-width card is 208px, narrower than some of these
 * titles set at the artwork's size, which pushes the page into horizontal
 * scroll rather than merely looking tight.
 */
function Features({ project }: { project: Project }) {
  return (
    <Panel className="mt-[var(--nl-section-gap)]">
      <SectionHeader title={project.featuresTitle} />

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {project.features.map((feature) => {
          const Icon = PROJECT_FEATURE_ICONS[feature.icon];

          return (
            <article
              key={feature.title}
              className="flex flex-col gap-5 rounded-[var(--nl-radius-card)] bg-[var(--nl-card)] p-5 lg:p-8"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-[var(--nl-radius-control)] border border-[var(--nl-line-strong)] bg-[var(--nl-raised)] text-[var(--nl-accent)] lg:size-14">
                <Icon className="size-5 lg:size-6" />
              </span>

              <div>
                <h3 className="nl-heading text-lg leading-snug break-words lg:text-xl">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--nl-body)]">
                  {feature.body}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}
