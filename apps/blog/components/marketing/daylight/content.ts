/*
 * Copy that belongs to Daylight alone.
 *
 * Everything else on this page reads ft/content.ts, which is the single source
 * both designs share. This file exists for the one section the dark homepage
 * does not have, and it should stay that small: anything both pages say belongs
 * in the shared file, or the two start quietly disagreeing.
 */

/**
 * The "difference" band, which replaced the qualifier survey on this page.
 *
 * MODELLED ON NATIONAL FUNDING'S SECTION, at Denis's request — he sent it as
 * the reference and asked for the copy to match. The LAYOUT and the four claims
 * are theirs; the sentences are not, for the reason already settled when the
 * how-it-works steps were written against Fora Financial's: taking a
 * competitor's structure is fair, retyping their marketing copy onto a page
 * aimed at the same market is not. The row headings are kept as-is because they
 * are generic claim labels; the bodies are ours.
 *
 * AND BECAUSE EVERY BODY HERE HAD TO BECOME TRUE OF US. Three of the four
 * originals are claims about a different company:
 *
 *   - "Funds in your account as fast as 24 hours" is their service level. Ours
 *     is same-day, which HOW_IT_WORKS already states, so that is what this
 *     says.
 *   - "Bank-level encryption keeps your information safe" describes an
 *     infrastructure posture nothing on this site establishes. What can be
 *     stated is that the form is served over an encrypted connection and the
 *     data is handled under a privacy policy that exists and is linked.
 *   - "Speak with a U.S.-based funding expert" is a staffing fact about their
 *     team. "In-house loan advisor" is the term this site already uses, and it
 *     is the one that is ours to make.
 *
 * The credit-score row is the one that carries across almost unchanged, because
 * it is already true here: the footer's funding disclaimer states that every
 * application is subject to a soft credit check that does not affect scores.
 *
 * The footnote markers are gone with them. The original's "**" and "◊" point at
 * disclosures printed further down THEIR page; reproducing the marks without
 * the disclosures would be a reference to nothing.
 */
export const DIFFERENCE = {
  /*
   * The label carries the old headline. "The Nanotom Capital difference" was
   * doing the job of a section label — naming the section rather than saying
   * anything — so it moved to the chip, where naming the section is the job,
   * and the headline got to make a point instead. Nothing is lost.
   */
  label: 'The Nanotom Difference',
  /*
   * THE HEADLINE IS THE FIRST TWO ROWS, ARGUING WITH EACH OTHER. "We move
   * fast" and "we protect your credit score" are the two claims below it, and
   * the tension between them is the actual pitch: everything about this is
   * quick except the one thing a borrower does not want touched.
   *
   * It is a joke that has to stay true, so both halves are claims the page
   * already makes and the footer's disclaimer already covers — same-day
   * decisions in HOW_IT_WORKS, and the soft credit check in the funding
   * disclaimer and the FAQ. If either ever stops being true this line is the
   * first thing to change.
   */
  heading: 'Everything Moves Fast. Except Your Credit Score.',
  rows: [
    {
      icon: 'speed',
      title: 'We move fast.',
      body: 'Same-day decisions, and the money can land as soon as the same day.',
    },
    {
      icon: 'score',
      title: 'We protect your credit score.',
      body: "Checking what you qualify for is a soft credit check, so the score you have worked hard for is untouched.",
    },
    {
      icon: 'data',
      title: 'We protect your data.',
      body: 'Your details are sent over an encrypted connection and handled under our Privacy Policy.',
    },
    {
      icon: 'people',
      title: 'We have real people and real support.',
      body: 'Speak with an in-house loan advisor who works your file from application to funding.',
    },
  ],
  cta: { label: 'Apply now' },
  /** The photo beside it. Alt text describes the building, not the brand. */
  image: {
    src: '/marketing/office.webp',
    alt: 'The Nanotom Capital office building',
  },
} as const;

/**
 * The band at the foot of every header dropdown.
 *
 * Modelled on the one Denis sent from Credibly's menu, where a two-line pitch
 * and an Apply Now sit under the links. The SHAPE is theirs; the sentences are
 * not, and neither is the number in them — "financing up to $600,000" is their
 * ceiling, and printing it here would advertise a limit this business does not
 * have.
 *
 * Both lines are compressions of copy already on the site rather than new
 * claims:
 *
 *   - the heading is LOANS.hero.heading, "Every Way To Fund Your Business. One
 *     Application.", said in one breath;
 *   - the range is LOANS.hero.body's "approvals from $15,000 to $5,000,000",
 *     and the soft pull is the footer's funding disclaimer and the FAQ's
 *     `will-applying-affect-my-credit`, both of which state it on this page.
 *
 * If either fact changes it changes in ft/content.ts first, and this follows.
 */
export const NAV_CTA = {
  heading: 'One application, every option.',
  body: 'Approvals from $15,000 to $5,000,000, with a soft credit check.',
} as const;

/**
 * The CTA card at the head of the footer, which replaced the flat navy band.
 *
 * Modelled on the Haven Home Equity card Denis sent — a dark card on a white
 * section, copy left, button right, one reassuring line under the button. The
 * shape is theirs and the green is theirs; the words and the navy are ours.
 *
 * ALL THREE LINES ARE ALREADY ON THE PAGE, deliberately, because a CTA that
 * appears under every page must not be the one place a new promise is made:
 *
 *   - the heading is the band's own, carried over unchanged;
 *   - the body is the difference band's support row, verbatim from
 *     DIFFERENCE.rows — "in-house loan advisor" is the term this site uses and
 *     the one that is ours to make, per the note there;
 *   - the reassurance is the pair the hero's amount card already prints under
 *     its button, joined into one line.
 */
export const FOOTER_CTA = {
  heading: 'We Can Secure The Capital You Need For Your Business',
  body: 'Speak with an in-house loan advisor who works your file from application to funding.',
  reassurance: 'Soft credit check only. No obligation.',
} as const;
