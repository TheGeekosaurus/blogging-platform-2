import { CtaButton } from '../cta-button';
import { HighLevelForm } from '../highlevel-form';
import { IMAGES } from '../brand';
import { TestimonialWall } from '../testimonial-wall';

/*
 * The Nanotom Capital homepage.
 *
 * A port of the live HighLevel page, section for section, in the same order. All
 * copy is transcribed verbatim from the rendered page — this is a hosting
 * migration, not a rewrite, so wording is not "improved" in passing.
 *
 * Every section is a server component. The page ships no JavaScript of its own;
 * the only scripts are the two third-party embeds and GTM.
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

const PRODUCTS = [
  {
    title: 'The Ultimate Revolving Line of Credit',
    blurb:
      "Get the financial flexibility your business demands with BANKROLL's industry-leading revolving credit line. Access up to $1,500,000 in capital with the freedom to draw funds when you need them and pay down principal when cash flow allows.",
    note: 'Great for keeping funds on hand',
    bullets: [
      ['Massive Credit Limits', 'Approvals up to $1,500,000'],
      [
        'True Flexibility',
        'Unlimited draws and paydowns of $5,000+ during your 1-year revolving period',
      ],
      ['Predictable Payments', 'Fixed weekly payments over terms up to 36 months'],
      ['Complete Control', 'You decide when to borrow, how much to pay, and when to pay off'],
      ['No Penalties', 'Early payoff available anytime without fees'],
      [
        'Smart Financing',
        'Pay interest only on what you use, with no minimum finance charges',
      ],
    ],
  },
  {
    title: 'Pay Only The Interest For Up To A Year',
    blurb:
      'Access up to $750,000 with the ultimate cash flow solution. Pay only interest for up to one full year while enjoying unlimited access to additional funds through your built-in line of credit.',
    note: null,
    bullets: [
      ['Lower Entry Point', 'Start with just $50,000 (reduced from $150,000)'],
      ['Interest-Only Freedom', 'Pay only interest for up to 52 weeks'],
      [
        'Built-In Line of Credit',
        'Unlimited draws of $25,000+ during your interest-only period',
      ],
      [
        'Maximum Flexibility',
        'Take your initial loan in multiple draws across consecutive business days',
      ],
      ['Safety Net Included', 'Built-in rollover amortization option up to 2 years'],
      [
        'Smart Structure',
        'Your credit line equals the difference between your approval and initial draw',
      ],
    ],
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

function SectionHeading({
  eyebrow,
  children,
  tone = 'dark',
}: {
  eyebrow?: string;
  children: React.ReactNode;
  tone?: 'dark' | 'light';
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <p
          className={`text-sm font-semibold uppercase tracking-[0.2em] ${
            tone === 'light' ? 'text-[var(--color-gold)]' : 'text-[var(--color-gold)]'
          }`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={`mt-3 font-[family-name:var(--font-headline)] text-3xl leading-[1.3] sm:text-4xl ${
          tone === 'light' ? 'text-white' : 'text-[var(--color-brand)]'
        }`}
      >
        {children}
      </h2>
    </div>
  );
}

export function NntmHomepage() {
  return (
    <>
      {/* 1 — Hero */}
      <section className="relative isolate overflow-hidden bg-[var(--color-brand)]">
        <img
          src={IMAGES.heroBackground}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-25"
          fetchPriority="high"
        />
        <div className="mx-auto max-w-7xl px-5 py-24 text-center lg:px-8 lg:py-32">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-gold)]">
            Entrepreneurs &amp; Business Owners
          </p>
          <h1 className="mx-auto mt-5 max-w-4xl font-[family-name:var(--font-headline)] text-4xl leading-[1.15] text-white sm:text-5xl lg:text-6xl">
            Get The Capital Your Business Needs To Grow
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-[1.8] text-white/80">
            Whether you&apos;re a startup, established business, or real estate investor,
            access flexible financing solutions to fuel your next big move.
          </p>
          <CtaButton className="mt-10" />
        </div>
      </section>

      {/* 2 — Track record. The live page renders both the real figures and '0+'
          placeholders for a count-up animation; only the real values ship here. */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h2 className="text-center font-[family-name:var(--font-headline)] text-2xl leading-[1.3] text-[var(--color-brand)] sm:text-3xl">
            We&apos;re a Funding Partner with a Proven Track Record
          </h2>
          <dl className="mt-12 grid gap-10 text-center sm:grid-cols-3">
            {[
              ['2,300+', 'businesses funded since 2012'],
              ['$36+ M', 'provided in financing'],
              ['4.7 Stars', 'from happy customers'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="font-[family-name:var(--font-headline)] text-4xl text-[var(--color-gold)] sm:text-5xl">
                  {value}
                </dt>
                <dd className="mt-2 text-sm text-black/60">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 3 — Featured on */}
      <section className="border-y border-black/5 bg-[#f7f7f7] py-12">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-black/45">
            Featured On
          </p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
            {IMAGES.featuredOn.map((src) => (
              <li key={src}>
                {/* Decorative press logos: the section heading already names them. */}
                <img
                  src={src}
                  alt=""
                  aria-hidden="true"
                  className="h-9 w-auto opacity-70 grayscale"
                  loading="lazy"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4 — Three steps */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading>Funding that moves at your speed.</SectionHeading>
          <ol className="mt-14 grid gap-10 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand)] font-[family-name:var(--font-headline)] text-xl text-white">
                  {i + 1}
                </span>
                <h3 className="mt-5 font-[family-name:var(--font-headline)] text-xl text-[var(--color-brand)]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-[1.8] text-black/65">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-14 text-center">
            <CtaButton />
          </div>
        </div>
      </section>

      {/* 5 — Products */}
      <section className="bg-[var(--color-brand)] py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading eyebrow="The Nanotom Capital Advantage" tone="light">
            Funding Options Built to Work for You.
          </SectionHeading>

          <div className="mt-14 grid gap-8 lg:grid-cols-2">
            {PRODUCTS.map((product) => (
              <article
                key={product.title}
                className="flex flex-col rounded-xl bg-white p-8 sm:p-10"
              >
                <h3 className="font-[family-name:var(--font-headline)] text-2xl leading-[1.3] text-[var(--color-brand)]">
                  {product.title}
                </h3>
                <p className="mt-4 text-sm leading-[1.8] text-black/65">{product.blurb}</p>

                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {product.bullets.map(([label, detail]) => (
                    <li key={label} className="flex gap-3 text-sm leading-[1.7]">
                      <svg
                        className="mt-1 h-4 w-4 shrink-0 text-[var(--color-gold)]"
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                      >
                        <path
                          d="M2 8.5l4 4 8-9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <span>
                        <strong className="text-[var(--color-brand)]">{label}</strong> —{' '}
                        <span className="text-black/65">{detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                {product.note ? (
                  <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-[var(--color-gold)]">
                    {product.note}
                  </p>
                ) : null}

                <CtaButton href="/programs" className="mt-6 self-start !px-8 !py-3 !text-sm">
                  Learn More
                </CtaButton>
              </article>
            ))}
          </div>

          <div className="mt-14 text-center">
            <CtaButton />
          </div>
        </div>
      </section>

      {/* 6 — Qualification form */}
      <section id="get-started" className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-5 lg:px-8">
          <SectionHeading eyebrow="Get Started">Not Sure What is Best for You?</SectionHeading>
          <ol className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 text-center text-sm text-black/65 sm:flex-row sm:justify-center sm:gap-8">
            <li>Answer a few simple questions</li>
            <li>We will look at your particular situation</li>
            <li>We&apos;ll send you some recommendations</li>
          </ol>
          <div className="mt-10">
            <HighLevelForm />
          </div>
        </div>
      </section>

      {/* 7 — Use cases */}
      <section className="bg-[#f7f7f7] py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading>
            What can you do with funding from Nanotom Capital?
          </SectionHeading>
          <p className="mx-auto mt-5 max-w-3xl text-center text-base leading-[1.8] text-black/65">
            No matter your goal, our in-house loan advisors can help you choose a financing
            solution — no middleman or delays.
          </p>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((use) => (
              <li
                key={use}
                className="rounded-lg border border-black/5 bg-white px-6 py-5 text-center text-sm font-semibold text-[var(--color-brand)]"
              >
                {use}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 8 — Minimum requirements */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading>Are we a match? Check our minimum requirements.</SectionHeading>
          <dl className="mt-14 grid gap-10 text-center sm:grid-cols-3">
            {[
              ['As little as', '30 Days', 'in business'],
              ['Be on the approved', 'Industries', 'list'],
              ['Minimum', '551', 'personal FICO® score'],
            ].map(([pre, value, post]) => (
              <div key={value}>
                <dt className="text-sm text-black/55">{pre}</dt>
                <dd>
                  <span className="block font-[family-name:var(--font-headline)] text-4xl text-[var(--color-brand)] sm:text-5xl">
                    {value}
                  </span>
                  <span className="mt-1 block text-sm text-black/55">{post}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="mx-auto mt-10 max-w-2xl text-center text-base leading-[1.8] text-black/65">
            We look beyond your credit score to say &lsquo;Yes&rsquo; when others won&apos;t.
          </p>
          <div className="mt-10 text-center">
            <CtaButton />
          </div>
        </div>
      </section>

      {/* 9 — Testimonials */}
      <section className="border-t border-black/5 bg-[#f7f7f7] py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <SectionHeading eyebrow="Testimonials">What others are saying</SectionHeading>
          <div className="mt-12">
            <TestimonialWall />
          </div>
        </div>
      </section>

      {/* 10 — Final CTA */}
      <section className="bg-[var(--color-brand-dark)] py-20">
        <div className="mx-auto max-w-3xl px-5 text-center lg:px-8">
          <h2 className="font-[family-name:var(--font-headline)] text-3xl leading-[1.3] text-white sm:text-4xl">
            Get Funded Today
          </h2>
          <p className="mt-5 text-base leading-[1.8] text-white/75">
            Get started with your application and join Nanotom Capital&apos;s family of
            forward-thinking businesses.
          </p>
          <CtaButton className="mt-10" />
        </div>
      </section>
    </>
  );
}
