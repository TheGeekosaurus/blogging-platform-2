/**
 * Copy for the Nanotom Labs Get Started page.
 *
 * Built from the Figma template's Contact frame, which is why the shape —
 * headline beside a stat grid, then a tabbed contact card beside a form — is
 * the template's rather than invented. The words are not: the template's
 * generic agency copy is replaced with what this business actually offers.
 *
 * TWO THINGS ON THIS PAGE ARE NOT REAL YET, and both are marked below rather
 * than guessed at:
 *
 *   - CONTACT_CHANNELS carries no addresses, numbers or locations. Inventing
 *     an email for a contact page is worse than leaving it blank: a plausible
 *     address that nobody reads swallows enquiries silently, which is the
 *     exact failure this page exists to prevent. Fill these in and they render
 *     as real links.
 *   - ENQUIRY_FIELDS is presentational. The live form at
 *     nanotomlabs.com/demo-survey-page is a HighLevel funnel page rather than
 *     an embeddable widget, so there was nothing to lift — and it asks
 *     qualification questions (business name, whether there is a site already,
 *     industry) that these template fields do not. Wiring the real one needs
 *     the form or survey ID from the HighLevel account; Capital's SURVEY
 *     constant and HighLevelForm component already do exactly this job.
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

export type EnquiryField = {
  /** Also the input's id, so the label's `htmlFor` cannot drift from it. */
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  /** Half-width on desktop, so first and last name share a row. */
  half?: boolean;
};

export const ENQUIRY_FIELDS: readonly EnquiryField[] = [
  { id: 'gs-first-name', label: 'First Name', placeholder: 'Enter First Name', type: 'text', half: true },
  { id: 'gs-last-name', label: 'Last Name', placeholder: 'Enter Last Name', type: 'text', half: true },
  { id: 'gs-email', label: 'Email', placeholder: 'Enter your Email', type: 'email' },
  { id: 'gs-phone', label: 'Phone Number', placeholder: 'Enter Phone Number', type: 'tel' },
  { id: 'gs-message', label: 'Message', placeholder: 'Enter your Message', type: 'textarea' },
];

export const ENQUIRY_FORM_COPY = {
  consent: 'I agree with the Terms of Use and Privacy Policy',
  submit: 'Send Your Message',
} as const;
