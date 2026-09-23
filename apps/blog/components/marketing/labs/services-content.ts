/**
 * Copy unique to the Nanotom Labs Services page.
 *
 * Same provenance and the same warning as ./content.ts: THIS IS THE FIGMA
 * TEMPLATE'S PLACEHOLDER COPY, transcribed from the PDF export rather than
 * retyped, with every "NexGen" replaced by "Nanotom Labs". The truncated
 * "that leave a lasting." and the missing full stop after "brand's visibility"
 * are the artwork's own.
 *
 * A separate module from ./content.ts because that file is the homepage's, and
 * the two pages share only what ./sections.tsx renders. The strings both pages
 * use — SECTIONS, LINKS, STATS, TESTIMONIALS, FAQS, ENQUIRY_FORM, CLOSING_CTA
 * — stay in ./content.ts and are imported from there, so a wording change
 * reaches both pages in one edit.
 *
 * WHAT MUST CHANGE BEFORE THIS SERVES REAL TRAFFIC: the hero's screenshot and
 * caption name "Estatein Real Estate", which is the template's invented client
 * and not this agency's work. The stat band, the testimonials and the work
 * panels this page also renders carry the same problem and the same note in
 * ./content.ts.
 */

export const SERVICES_HERO = {
  headingLines: ['Digital Solutions', 'That Drive Success'],
  cta: 'Start a Project',
  body:
    'At Nanotom Labs, we believe in the transformative power of digital solutions. Our team ' +
    'of experts is dedicated to helping businesses like yours thrive in the fast-paced ' +
    'digital landscape.',
  /** The project screenshot beside the copy, and its caption bar. */
  image: {
    src: '/nntm-labs/project-estatein.webp',
    alt: 'The Estatein property site, shown as a grid of its screens',
  },
  imageTitle: 'Estatein Real Estate',
  imageTag: 'Web Development.',
} as const;

/*
 * The "reasons to choose" cards are NOT here either. They moved to the
 * HOMEPAGE — they answer "why you" rather than "what do you sell", which a
 * visitor asks before the service list rather than after it. See REASONS in
 * ./content.ts.
 */

/*
 * The four services are NOT here. They live in ./content.ts, because the
 * homepage renders the same four with a project gallery beside each — the two
 * pages differ in layout, not in what the services are. They were briefly
 * duplicated, which meant a copy tweak had to land in two files or the pages
 * quietly disagreed.
 */

/*
 * NEITHER IS "Our Work". It followed the same path the moment the homepage
 * started rendering it too — the list, the heading and the link label are all
 * in ./content.ts now, and both pages call the one `Works` section in
 * ./sections.tsx. This file is down to the hero.
 */

