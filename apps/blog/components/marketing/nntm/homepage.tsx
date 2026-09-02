import Image from 'next/image';

import { CtaButton } from '../cta-button';
import { HERO_VIDEO, IMAGES, LOCAL_IMAGES } from '../brand';
import { TestimonialWall } from '../testimonial-wall';

/*
 * The Nanotom Capital homepage — 2026 visual refresh.
 *
 * Replaces the original section-for-section HighLevel port with the redesign
 * from the Claude Design kit: a full-bleed video hero, press logos as a
 * scrolling marquee, proof figures in cards, a two-column "how it works" with
 * the phone mockup, and a two-column advantage block with the use-of-funds
 * checklist. Copy is unchanged from the live site — this is a visual
 * redesign, not a rewrite.
 *
 * Two sections from the original port are dropped rather than carried over,
 * because the kit's final screen omits them: the two BANKROLL program cards
 * (now their own /programs page — see the "See Our Programs" CTA below) and
 * the embedded qualification quiz mid-page (the funnel now runs through the
 * dedicated /get-funded page only).
 *
 * Every section here is still a server component; the only scripts are the
 * two third-party embeds (GTM, the testimonial wall) and the video autoplays
 * natively with no JS.
 */

const STEPS = [
  {
    title: 'Complete the application.',
    body: 'Our streamlined process is designed to be completed in just minutes.',
  },
  {
    title: 'Get a decision.',
    body: 'Work with an expert loan advisor to choose the best option for you.',
  },
  {
    title: 'Receive your funds.',
    body: 'Sign your contract and get funds as soon as the same day.',
  },
] as const;

const USE_CASES = [
  'Purchase inventory',
  'Cover payroll',
  'Expand or renovate',
  'Launch marketing campaigns',
  'Stabilize cash flow',
  'Upgrade equipment',
  'Hire more employees',
  'Consolidate business debt',
] as const;

const REQUIREMENTS = [
  ['As little as', '30 Days', 'in business'],
  ['Be on the approved', 'Industries', 'list'],
  ['Minimum', '551', 'personal FICO® score'],
] as const;

function CircleCheckIcon() {
  return (
    <svg
      className="h-[17px] w-[17px] shrink-0 text-[var(--color-gold-hover)]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8.2 12.3l2.4 2.4 5.2-5.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-gold-hover)]">
      {children}
    </p>
  );
}

function Hero() {
  return (
    <section className="relative isolate flex min-h-[min(760px,92vh)] items-center overflow-hidden bg-[var(--color-brand)]">
      <video
        autoPlay
        muted
        loop
        playsInline
        poster={IMAGES.heroBackground}
        src={HERO_VIDEO}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,.90)_0%,rgba(10,10,10,.78)_46%,rgba(10,10,10,.35)_100%)]"
      />
      <div className="relative mx-auto w-full max-w-7xl px-5 py-20 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)]">
          Entrepreneurs &amp; Business Owners
        </p>
        <h1 className="mt-6 max-w-3xl font-[family-name:var(--font-headline)] text-4xl leading-[1.1] text-white sm:text-5xl lg:text-6xl">
          Get The Capital Your Business Needs To Grow
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-[1.7] text-white/80">
          Whether you&apos;re a startup, established business, or real estate investor,
          access flexible financing solutions to fuel your next big move.
        </p>
        <CtaButton className="mt-10 shadow-[0_8px_24px_rgba(224,168,64,.28)]" />
      </div>
    </section>
  );
}

function TrackRecord() {
  const stats = [
    ['2,300+', 'businesses funded since 2012'],
    ['$36+ M', 'provided in financing'],
    ['4.7 Stars', 'from happy customers'],
  ] as const;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-5 text-center lg:px-8">
        <h2 className="mx-auto max-w-2xl font-[family-name:var(--font-headline)] text-2xl leading-[1.3] text-[var(--color-brand)] sm:text-3xl">
          We&apos;re a Funding Partner with a Proven Track Record
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {stats.map(([value, label]) => (
            <div
              key={label}
              className="flex flex-col items-center gap-3 rounded-xl border border-black/5 bg-white px-6 py-9 shadow-[0_1px_2px_rgba(11,11,12,.05),0_8px_20px_rgba(11,11,12,.06)]"
            >
              <span className="whitespace-nowrap font-mono text-4xl font-medium tracking-tight text-[var(--color-gold-hover)]">
                {value}
              </span>
              <span className="text-sm text-black/60">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedOn() {
  const track = Array.from({ length: 8 }, (_, dup) => dup);

  return (
    <section className="border-y border-black/5 bg-[#f7f7f7] py-12">
      <div className="mx-auto max-w-7xl px-5 text-center lg:px-8">
        <Eyebrow>Featured On</Eyebrow>
      </div>
      <div
        className="relative mt-8 overflow-hidden
          [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]
          [-webkit-mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]"
      >
        <div className="flex w-max animate-[nt-marquee_100s_linear_infinite]">
          {track.map((dup) => (
            <div key={dup} aria-hidden={dup !== 0} className="flex items-center gap-12 pr-12">
              {IMAGES.featuredOn.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={dup === 0 ? 'Press logo' : ''}
                  className="h-9 w-auto shrink-0 object-contain opacity-70 grayscale"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Steps() {
  return (
    <section className="bg-[var(--color-brand)] py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8">
        <div>
          <h2 className="max-w-md font-[family-name:var(--font-headline)] text-3xl leading-[1.3] text-white sm:text-4xl">
            Funding that moves at your speed.
          </h2>
          <div className="mt-10 flex flex-col gap-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="grid grid-cols-[auto_1fr] items-start gap-5">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-gold)] font-[family-name:var(--font-headline)] text-xl font-extrabold text-[var(--color-brand)]">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-2 pt-1.5">
                  <h3 className="font-[family-name:var(--font-headline)] text-xl text-white">
                    {step.title}
                  </h3>
                  <p className="max-w-md text-base leading-[1.7] text-white/70">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
          <CtaButton className="mt-10" />
        </div>

        <div className="relative flex justify-center">
          <div
            aria-hidden="true"
            className="absolute left-[2%] top-[4%] h-[190px] w-[190px] rounded-full bg-[var(--color-gold)] opacity-90"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-[2%] right-[-4%] h-[230px] w-[230px] rounded-full bg-[var(--color-gold)] opacity-90"
          />
          <Image
            src={LOCAL_IMAGES.appPhone}
            alt="Nanotom Capital funding application on mobile"
            width={540}
            height={960}
            className="relative w-full max-w-[340px]"
          />
        </div>
      </div>
    </section>
  );
}

function Advantage() {
  return (
    <section className="border-y border-black/5 bg-[#f7f7f7] py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[.95fr_1.05fr] lg:items-center lg:px-8">
        <div>
          <Eyebrow>The Nanotom Capital Advantage</Eyebrow>
          <h2 className="mt-4 font-[family-name:var(--font-headline)] text-3xl leading-[1.3] text-[var(--color-brand)] sm:text-4xl">
            Funding Options Built to Work for You.
          </h2>
          <p className="mt-5 max-w-md text-base leading-[1.7] text-black/65">
            No matter your goal, our in-house loan advisors can help you choose a financing
            solution — no middleman or delays.
          </p>
          <CtaButton href="/programs" className="mt-9">
            See Our Programs
          </CtaButton>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {USE_CASES.map((use) => (
            <span
              key={use}
              className="inline-flex items-center gap-3 text-sm font-semibold text-[var(--color-brand)]"
            >
              <CircleCheckIcon />
              {use}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Requirements() {
  return (
    <section className="py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:px-8">
        <div>
          <h2 className="font-[family-name:var(--font-headline)] text-3xl leading-[1.3] text-[var(--color-brand)] sm:text-4xl">
            Are we a match? Check our minimum requirements.
          </h2>
          <div className="mt-10 flex flex-col gap-6">
            {REQUIREMENTS.map(([pre, big, post]) => (
              <div
                key={big}
                className="flex flex-wrap items-baseline gap-3 border-b border-black/10 pb-5"
              >
                <span className="text-base text-black/55">{pre}</span>
                <span className="font-mono text-3xl font-medium tracking-tight text-[var(--color-gold-hover)]">
                  {big}
                </span>
                <span className="text-base text-black/55">{post}</span>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-md font-[family-name:var(--font-headline)] text-xl font-bold leading-[1.3] tracking-tight text-[var(--color-brand)]">
            We look beyond your credit score to say &lsquo;Yes&rsquo; when others won&apos;t.
          </p>
          <CtaButton className="mt-8" />
        </div>

        <Image
          src={LOCAL_IMAGES.cityTower}
          alt="Business owner reviewing plans"
          width={540}
          height={960}
          className="w-full max-w-[420px] justify-self-center"
        />
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="border-t border-black/5 bg-[#f7f7f7] py-20">
      <div className="mx-auto max-w-4xl px-5 text-center lg:px-8">
        <Eyebrow>Testimonials</Eyebrow>
        <h2 className="mt-3 font-[family-name:var(--font-headline)] text-2xl leading-[1.3] text-[var(--color-brand)] sm:text-3xl">
          What others are saying
        </h2>
        <div className="mt-10">
          <TestimonialWall />
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="py-20 text-center">
      <div className="mx-auto max-w-2xl px-5 lg:px-8">
        <h2 className="font-[family-name:var(--font-headline)] text-3xl leading-[1.3] text-[var(--color-brand)] sm:text-4xl">
          Get Funded Today
        </h2>
        <p className="mt-5 text-base leading-[1.7] text-black/65">
          Get started with your application and join Nanotom Capital&apos;s family of
          forward-thinking businesses.
        </p>
        <CtaButton className="mt-8" />
      </div>
    </section>
  );
}

export function NntmHomepage() {
  return (
    <>
      <Hero />
      <TrackRecord />
      <FeaturedOn />
      <Steps />
      <Advantage />
      <Requirements />
      <Testimonials />
      <FinalCta />
    </>
  );
}
