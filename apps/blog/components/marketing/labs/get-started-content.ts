/**
 * Copy for the Nanotom Labs Get Started page.
 *
 * Built from the Figma template's Contact frame, which is why the shape —
 * headline beside a stat grid, then a tabbed contact card beside a form — is
 * the template's rather than invented. The words are not: the template's
 * generic agency copy is replaced with what this business actually offers.
 *
 * ONE THING ON THIS PAGE IS NOT REAL YET, and it is marked below rather than
 * guessed at: CONTACT_CHANNELS carries no addresses, numbers or locations.
 * Inventing an email for a contact page is worse than leaving it blank — a
 * plausible address that nobody reads swallows enquiries silently, which is the
 * exact failure this page exists to prevent. Fill these in and they render as
 * real links.
 *
 * THE FORM IS REAL NOW. It used to be ENQUIRY_FIELDS here: a presentational
 * field set with every control disabled, because the live form was a HighLevel
 * FUNNEL page rather than an embeddable widget and there was nothing to lift.
 * Denis supplied the survey's embed code, so the page renders that survey
 * instead — see SURVEY in ./brand.ts — and the template's fields are gone
 * rather than left beside it. The questions it asks (business name, whether
 * there is a site already) are the qualification the template's First Name /
 * Last Name / Message never captured.
 */

export const GET_STARTED_HERO = {
  headingLines: ['Get in Touch', 'With Us Today!'],
  cta: 'Start a Project',
  body:
    'Tell us about your business and what you want more of — calls, bookings, quote ' +
    'requests. We will look at where you stand in local search today and come back with ' +
    'what we would do about it.',
} as const;

/** The stat grid's trailing tile, which scrolls to the form rather than away. */
export const REACH_US = 'Reach Us';

export type ContactEntry = {
  label: string;
  /** Null until the real detail exists — see the note at the top of this file. */
  value: string | null;
  /** `mailto:`/`tel:` for a filled entry; absent while `value` is null. */
  href?: string;
};

export type ContactChannel = {
  /** The tab's label. */
  name: string;
  entries: readonly ContactEntry[];
};

/**
 * The tabbed contact card.
 *
 * Three tabs, switched in CSS with no client JavaScript — see `.nl-tabset` in
 * globals.css. The first is shown by default, including in a browser without
 * `:has()`.
 *
 * EVERY VALUE IS NULL. See the note at the top of this file: a guessed address
 * on a contact page loses enquiries quietly, which is the worst failure mode
 * available here. Each entry renders its label with a muted "coming soon" in
 * place of the detail, and carries no link, so nothing looks operable that is
 * not.
 */
export const CONTACT_CHANNELS: readonly ContactChannel[] = [
  {
    name: 'Phone Number',
    entries: [
      { label: 'New Enquiries', value: null },
      { label: 'Existing Clients', value: null },
    ],
  },
  {
    name: 'Emails',
    entries: [
      { label: 'General Enquiries', value: null },
      { label: 'New Projects', value: null },
      { label: 'Support', value: null },
    ],
  },
  {
    name: 'Office Locations',
    entries: [{ label: 'Head Office', value: null }],
  },
];

/** Shown in place of a detail that does not exist yet. */
export const CONTACT_PENDING = 'Coming soon';

/** The embedded survey's accessible name — see HighLevelForm. */
export const ENQUIRY_SURVEY_TITLE = 'Nanotom Labs get started survey';
