/**
 * Brand constants for the Nanotom Capital marketing site.
 *
 * Copy is still transcribed verbatim from the live HighLevel pages; the LAYOUT is
 * the 2026 ink+gold refresh, so this is a redesign of the presentation and a
 * straight port of the words. Copy lives next to the markup that uses it; only
 * values shared across several pages (nav, contact details, asset paths) are here.
 */

/**
 * Images stay on HighLevel's CDN by explicit decision. Measured 2026-09-01: all
 * are already WebP, already Cloudflare edge-cached (`cf-cache-status: HIT`,
 * `cache-control: max-age=15780000`), and 5-36 KB each. Re-hosting them would
 * add a build step and save nothing.
 *
 * They are rendered with plain <img>, not next/image: the files are already
 * optimised, so routing them through Next's optimiser would burn image-
 * optimisation quota to re-encode a WebP into a WebP.
 */
const CDN = 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/Hq8fXA7z9KgVOYhqLqCD/media';
const CDN_GCS = 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://storage.googleapis.com/msgsndr/Hq8fXA7z9KgVOYhqLqCD/media';

/** Preconnected in the root layout so the CDN handshake overlaps HTML parsing. */
export const IMAGE_ORIGIN = 'https://images.leadconnectorhq.com';

/**
 * The 2026 hero background: a muted looping video behind the headline.
 *
 * Self-hosted, and NOT hotlinked like the images above — the account's CDN
 * cannot serve it. Every other asset here goes through
 * `images.leadconnectorhq.com/image/f_webp/...`, which is an IMAGE pipeline:
 * handed an `.mp4` it answers `{"errorCode":400,"message":"Invalid file type"}`,
 * so the original URL silently never loaded and the `poster` showed instead.
 *
 * The origin does serve the file directly, but at 1920x1080 / 7832 kb/s it is
 * 42 MB — around 220 s on a slow 4G connection, against 12 KB of HTML and
 * 169 KB of JS for everything else on the page. Committed here re-encoded to
 * 1280x720 at 24 fps (h264, crf 34, faststart, no audio track): 3.0 MB, 92.9%
 * smaller, and visually indistinguishable under the hero's 90%-to-35% black
 * gradient. Compared frames before settling on it; 960px was visibly softer for
 * only 500 KB more saved.
 *
 * Re-encode with, from the repo root:
 *   ffmpeg -i original.mp4 -vf "scale=1280:-2,fps=24" -an \
 *     -c:v libx264 -preset slow -crf 34 -profile:v main -level 4.0 \
 *     -pix_fmt yuv420p -movflags +faststart \
 *     apps/blog/public/marketing/hero-loop.mp4
 */
export const HERO_VIDEO = '/marketing/hero-loop.mp4';

export const IMAGES = {
  heroBackground: `${CDN}/689eaeb0c6ba4e046393cc98.png`,
  featuredOn: [
    `${CDN_GCS}/68cf739b7629a15f8821fd6e.png`,
    `${CDN_GCS}/68cf741c4f886faffab37112.png`,
    `${CDN_GCS}/68cf74257629a1505b220569.png`,
    `${CDN_GCS}/68cf7430beb0270f40dce6fb.png`,
    `${CDN_GCS}/68cf74c1beb02706f1dceea3.png`,
    `${CDN_GCS}/68cf74ca074b8d30f6ac635c.png`,
  ],
} as const;

/**
 * Self-hosted in `public/marketing/`, unlike the hotlinked images above.
 *
 * The two photos reached this codebase as already-exported files with no known
 * source on the account's CDN. The logo is a different case and worth recording
 * accurately: it IS on the CDN, at
 * `.../media/6a0d11e0e29a8860a545eff5.png`, served as a 36 KB WebP, versus the
 * 193 KB PNG committed here. Self-hosting it is still the better call — it is in
 * the header of every page, so it should not depend on a third party staying up
 * — and `next/image` re-encodes it anyway, so nothing near 193 KB is ever sent.
 */
export const LOCAL_IMAGES = {
  logo: '/marketing/nanotom-capital-logo.png',
  /*
   * The same wordmark with the type in ink instead of white, for the Daylight
   * build's white header and footer.
   *
   * `logo` above is light artwork on transparency — on white it all but
   * disappears, and the obvious fix, a CSS `invert()`, takes the gold mark with
   * it and turns it blue. So this is a real second file: the neutral pixels
   * recoloured, the saturated gold ones untouched, and every antialiased edge
   * preserved because the coverage was already in the alpha channel rather than
   * in the colour.
   *
   * THE WORDMARK IS BLACK, NOT THE THEME'S BLUE. It was briefly #0B2D72 to
   * match Daylight's ink, which is exactly the mistake worth naming: a logo is
   * the company's and a palette is the page's, and tinting one to the other
   * means the mark changes every time the design does. #0B0B0C is
   * --color-brand, the near-black this codebase already declares, so this is
   * the brand's own black rather than a value invented for the occasion.
   *
   * Generated from `logo`, not drawn — if the brand ever supplies an official
   * dark-background wordmark, replace this file with it rather than
   * regenerating.
   */
  logoDark: '/marketing/nanotom-capital-logo-dark.png',
  appPhone: '/marketing/photo-app-phone.png',
  cityTower: '/marketing/photo-city-tower.png',
} as const;

export const CONTACT = {
  phone: '(855) 598-9916',
  phoneHref: 'tel:+18555989916',
  address: '1286 University Ave, San Diego, CA 92103',
  legalEntity: 'Nanotom LLC',
} as const;

/*
 * SOCIAL is gone rather than fixed.
 *
 * It listed instagram.com, facebook.com, linkedin.com and youtube.com — the
 * networks' own home pages, not this company's profiles, carried over from the
 * HighLevel template. A footer icon that takes a visitor to Instagram's logged-out
 * splash page is worse than no icon, so the row is removed until real profile
 * URLs exist. Add them back here and restore the block in site-footer.tsx.
 */

export type NavItem = {
  label: string;
  href?: string;
  external?: boolean;
  children?: readonly NavItem[];
  /*
   * A glyph for this entry, as a key rather than a component: this module is
   * data and importing JSX into it would make every consumer of the nav pull
   * an icon set it may not draw. Each design maps the key to its own mark — see
   * NAV_ICONS in daylight/site-header.tsx.
   *
   * Only dropdown children carry one today, and only the Daylight header reads
   * them; the dark header and the footer ignore the field entirely.
   */
  icon?: string;
  /*
   * A dropdown row that must not scroll away with the rest of the list.
   *
   * Only the Industries menu's "And More" uses it, and the reason is specific:
   * that row is the escape hatch for a list too long to show at once, so it is
   * the one row that must never itself be inside the overflow. The desktop
   * dropdown renders pinned children in a band of their own below the scrolling
   * list; the mobile sheet and the footer scroll as a whole and ignore the flag,
   * which is correct — nothing can hide past the end there.
   */
  pinned?: boolean;
};

/**
 * The main navigation.
 *
 * Every dropdown entry used to be href-less — HighLevel's placeholder for a menu
 * item whose page was never built — and rendered as greyed-out text. They now
 * point at real paths, all of which resolve: the ones without content yet are
 * served as noindex stubs by the pages catch-all (see STUB_PAGES below), so
 * there are no dead links in the header.
 *
 * The Loan Calculator is no longer an external link to the calc subdomain. It is
 * /calc on this domain — a coded route in this repo now (app/calc/page.tsx),
 * where it was a rewrite to the subdomain before — so the header, the hero, the
 * CTA card and the footer all point at one path. The subdomain still works and
 * is deliberately left up: retiring it belongs with the other redirects at
 * domain transfer, not here.
 */
/**
 * THE CORE FUNDING OPTIONS — the one list, read by every surface.
 *
 * Denis set these nine on 2026-10-01, after the site had drifted into four
 * different answers to "what do you fund?": the header and footer listed five
 * programs, the homepage carousel showed four, the hero tile claimed six, and
 * two of the carousel's four were not categories at all but named programs from
 * one particular lender. A visitor who read the menu and then the homepage saw
 * two different companies.
 *
 * So this array is the source and the others are derived. The header dropdown,
 * both footers' Funding Solutions column, the homepage cards and the
 * /funding-solutions list all read it or are keyed to its slugs, and
 * FUNDING_OPTIONS.cards in ft/content.ts is typed as a record over `slug` —
 * adding a tenth program here is a COMPILE ERROR until its copy exists. That is
 * the point: the drift above happened because four lists could disagree in
 * silence.
 *
 * ORDER IS DENIS'S, not alphabetical and not by popularity. The first entry is
 * also the one /funding-solutions marks "Featured", so reordering this array
 * moves that pill.
 *
 * "Business Loans" is the term-loan category. Denis's list called it "Term
 * Loans"; he chose to keep the existing name, which is also the name of the
 * page that already exists at that slug.
 *
 * BANKROLL AND THE INTEREST-ONLY PROGRAM ARE DELIBERATELY ABSENT. They were the
 * first two homepage cards. They are specifications of one lender's offer — in
 * Denis's words, "just specifications" — rather than kinds of money a business
 * can ask for, so they do not belong in a list of categories. Their terms are
 * not lost: BANKROLL's are the whole of /funding-solutions/line-of-credit, and
 * the interest-only program's are /funding-solutions/revenue-based-financing.
 * Folding them into the relevant product pages as named programs is the next
 * job and is Denis's call on where.
 */
const CORE_PROGRAMS = [
  { label: 'Working Capital', slug: 'working-capital', icon: 'wallet' },
  { label: 'Business Line of Credit', slug: 'line-of-credit', icon: 'cash-flow' },
  { label: 'SBA Loans', slug: 'sba-loans', icon: 'bank' },
  { label: 'Equipment Financing', slug: 'equipment-financing', icon: 'equipment' },
  { label: 'Merchant Cash Advance', slug: 'merchant-cash-advance', icon: 'growth' },
  { label: 'Business Loans', slug: 'business-loans', icon: 'coins' },
  { label: 'Inventory Financing', slug: 'inventory-financing', icon: 'inventory' },
  { label: 'Receivables Financing', slug: 'receivables-financing', icon: 'invoice' },
  { label: 'Bridge Loans', slug: 'bridge-loans', icon: 'bridge' },
] as const;

export type FundingSlug = (typeof CORE_PROGRAMS)[number]['slug'];

/**
 * The slugs that have a dedicated page at /funding-solutions/<slug>.
 *
 * ALL NINE, since 2026-10-05. It was four for four days, and the other five
 * linked to their own block on /funding-solutions instead — not as a
 * placeholder but because app/funding-solutions/[product]/page.tsx is a ROUTE
 * SEGMENT, which beats the pages catch-all, so a slug with no LOAN_PAGES entry
 * could not be given a STUB_PAGES fallback: it hit that route, found nothing
 * and called notFound(). Pointing the menu at it would have been five hard
 * 404s in the header and the footer.
 *
 * The anchors those five used are still rendered on /funding-solutions, and
 * deliberately so — nothing links to them now, but the machinery that builds
 * them from the slug is what a tenth product would need on the day it is added
 * before its page exists.
 *
 * KEEP THIS IN STEP WITH LOAN_PAGES. A slug listed here with no LOAN_PAGES
 * entry is a 404 in the navigation; a test asserts the two agree rather than
 * leaving it to be noticed in production.
 */
const SLUGS_WITH_PAGE: ReadonlySet<string> = new Set<FundingSlug>([
  'working-capital',
  'line-of-credit',
  'sba-loans',
  'equipment-financing',
  'merchant-cash-advance',
  'business-loans',
  'inventory-financing',
  'receivables-financing',
  'bridge-loans',
]);

export type FundingProgram = {
  readonly label: string;
  readonly slug: FundingSlug;
  /** Key into the glyph maps — see the note on NavItem.icon. */
  readonly icon: string;
  /** The product page where one exists, else that product's section anchor. */
  readonly href: string;
  /** False for the five still waiting on a product page. */
  readonly hasPage: boolean;
};

/**
 * The nine, with their destinations resolved.
 *
 * The anchor matches the id ft/funding-solutions.tsx puts on each product
 * block, which is derived from the same slug — see `headingId` there.
 */
export const FUNDING_PROGRAMS: readonly FundingProgram[] = CORE_PROGRAMS.map((program) => {
  const hasPage = SLUGS_WITH_PAGE.has(program.slug);
  return {
    ...program,
    hasPage,
    href: hasPage
      ? `/funding-solutions/${program.slug}`
      : `/funding-solutions#ft-loans-${program.slug}`,
  };
});

/*
 * Lifted out of NAV so the footer's Industries column and the header's
 * Industries menu are the same two entries. They were inline until the footer
 * grew a column for them, which is the moment a copied array starts drifting.
 */
export const INDUSTRIES: readonly { label: string; href: string; icon: string }[] = [
  { label: 'Food Business', href: '/industries/food-business', icon: 'storefront' },
  {
    label: 'Construction Business',
    href: '/industries/construction-business',
    icon: 'hard-hat',
  },
  { label: 'Agriculture', href: '/industries/agriculture', icon: 'wheat' },
  { label: 'Accounting', href: '/industries/accounting', icon: 'ledger' },
  { label: 'Auto Repair', href: '/industries/auto-repair', icon: 'car' },
  { label: 'Beauty & Wellness', href: '/industries/beauty-wellness', icon: 'shears' },
  { label: 'Chiropractor', href: '/industries/chiropractor', icon: 'spine' },
  { label: 'Dental', href: '/industries/dental', icon: 'tooth' },
  { label: 'Electrical', href: '/industries/electrical', icon: 'bolt' },
  { label: 'Healthcare', href: '/industries/healthcare', icon: 'pulse' },
  { label: 'HVAC', href: '/industries/hvac', icon: 'fan' },
  { label: 'Insurance', href: '/industries/insurance', icon: 'shield' },
  { label: 'Landscaping', href: '/industries/landscaping', icon: 'tree' },
  { label: 'Legal', href: '/industries/legal', icon: 'scales' },
  { label: 'Real Estate', href: '/industries/real-estate', icon: 'house' },
  { label: 'Restaurants', href: '/industries/restaurants', icon: 'cutlery' },
];

/**
 * The Industries menu: every industry, then the way out to the rest.
 *
 * SEPARATE FROM `INDUSTRIES` ON PURPOSE. That array is the list of trades that
 * have a page, and a test holds it against INDUSTRY_PAGES one-for-one — a label
 * there with no record is a link to a 404 and a record with no label is a page
 * nothing links to. "And More" is neither: it is a route to the index, so
 * folding it into that array would make the check meaningless for the one entry
 * most likely to be wrong.
 *
 * ALWAYS LAST, which Denis asked for in as many words, and which is also the
 * only place it reads correctly: an escape hatch above the thing it escapes
 * from is just a confusing first option.
 */
/*
 * `href` is REQUIRED here, not optional as NavItem leaves it. The footer renders
 * this same array as a link column and every row in it is a destination, so the
 * narrower type is the true one — and it keeps the footer from having to prove
 * it at the call site.
 */
export const INDUSTRIES_MENU: readonly (NavItem & { href: string })[] = [
  ...INDUSTRIES,
  /*
   * `pinned`, because this row is the way out of a list that no longer fits on
   * screen — see NavItem.pinned. Measured: sixteen industries in the desktop
   * panel overflow its scroll cap at every width below 1440, and without the
   * flag "And More" was the single row you had to scroll to reach.
   */
  { label: 'And More', href: '/industries', icon: 'more', pinned: true },
];

/*
 * The calculators, lifted out for the same reason INDUSTRIES was: the header
 * menu and anything else that lists them should be one array.
 *
 * ITS PARENT HAS NO `href`. /calc was the nav item until there were two
 * calculators, and the obvious move — leave the parent pointing at /calc and
 * list both underneath — makes the parent and its own first child the same
 * destination, which is the thing a dropdown should not do. There is no
 * calculators index to point at instead, so the trigger opens the menu and the
 * two children are where the pages are. Both headers already render an
 * href-less parent that way.
 */
export const CALCULATORS: readonly { label: string; href: string; icon: string }[] = [
  { label: 'Business Loan Calculator', href: '/calc', icon: 'calculator' },
  {
    label: 'DSCR Calculator',
    href: '/calculators/dscr-calculator',
    icon: 'gauge',
  },
];

export const NAV: readonly NavItem[] = [
  {
    label: 'Funding Solutions',
    href: '/funding-solutions',
    children: FUNDING_PROGRAMS,
  },
  /*
   * THE HREF IS BACK, as that note said it should be the day Capital had an
   * industries index of its own. It does now: app/industries/page.tsx serves
   * DaylightIndustriesIndex on this deployment instead of 404ing, so the
   * trigger, the footer column heading and the menu's "And More" row all have
   * somewhere real to go.
   *
   * Trigger and "And More" share a destination, which is deliberate rather than
   * an oversight: Denis asked for the row explicitly, and the trigger is also
   * the only way a keyboard user reaches the index without walking the whole
   * dropdown. Funding Solutions has had the same shape — trigger to the index,
   * children to the pages — since it was built.
   */
  {
    label: 'Industries',
    href: '/industries',
    children: INDUSTRIES_MENU,
  },
  {
    /*
     * Still "Loan Calculator", not "Calculators". Denis called it "the loan
     * calc menu" and both children ARE loan calculators — one sizes a business
     * loan, the other a property's debt service coverage — so the label is
     * accurate and renaming it is a change nobody asked for.
     */
    label: 'Loan Calculator',
    children: CALCULATORS,
  },
  { label: 'Programs', href: '/programs' },
] as const;

/**
 * Paths that must resolve but have no content yet.
 *
 * Served by the pages catch-all as a heading and nothing else, `noindex` so an
 * empty page never reaches the index. Deliberately NOT eight new route files:
 * every one of these is destined to become a real database page, and the moment
 * someone publishes a page at the same path it wins, because the catch-all only
 * falls back to this map when the lookup finds nothing. So the stub disappears
 * on its own — nobody has to remember to delete a route.
 *
 * The value is the <h1>, which matches the nav label that leads here.
 */
export const STUB_PAGES: Readonly<Record<string, string>> = {
  /*
   * Not a new nav item — /programs is linked from the header and from the
   * requirements callout on the homepage, and was returning 404 in production
   * when this was written. A heading-only stub is not a fix for that, it just
   * stops the bleeding; it still needs real content.
   *
   * `get-funded` used to sit here for the same reason and no longer does: it is
   * a coded route now (app/get-funded/page.tsx).
   */
  programs: 'Programs',

  /*
   * The five funding products are NOT here any more. They are a coded route
   * now — app/funding-solutions/[product]/page.tsx — and a static segment beats
   * the catch-all, so leaving them would have been a map nothing ever read.
   */
  /*
   * DEAD, and left here only so it is not re-added. app/industries/page.tsx is
   * a static route, a static segment beats the catch-all, and that route is
   * gated to Labs — so /industries answers 404 on Capital and never reaches
   * this map. Same trap as `about` below.
   */
  industries: 'Industries',
  /*
   * NO `industries/*` STUBS AT ALL ANY MORE, and nothing may put one back.
   * app/industries/[industry]/page.tsx is a dynamic segment, a route segment
   * beats the catch-all, and so every path under /industries now reaches that
   * route or 404s — this map is unreachable from there. A new industry is a
   * record in daylight/industry-content.ts, never an entry here. A test fails
   * if the two are ever both present.
   */

  /*
   * Added when the footer gained an About Us column. NOT `about`: that path is
   * a static route belonging to the Labs deployment, and a static segment beats
   * the catch-all, so /about on Capital would 404 rather than land here.
   *
   * It is a heading and nothing else, and it should not stay that way — this is
   * the one link in the new footer with no content behind it.
   */
  'about-us': 'About Us',
};

/** Footer policy row. Every one of these is a real, live page. */
export const POLICY_LINKS = [
  { label: 'Cancellation & Refund Policy', href: '/cancellation-and-refund-policy' },
  { label: 'Anti Spam Policy', href: '/anti-spam-policy' },
  { label: 'DMCA Policy', href: '/dmca-policy' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Earnings Disclaimer', href: '/earnings-disclaimer' },
  { label: 'Terms Of Use', href: '/terms-of-use' },
] as const;

export const CTA_HREF = '/get-funded';

/**
 * The HighLevel qualification survey embedded on the homepage.
 *
 * Note the host: this account is on a WHITE-LABELLED HighLevel domain, so the
 * embed lives at link.mailsengr.com, not api.leadconnectorhq.com. Both happen to
 * serve this survey, but the white-label host is the one HighLevel generated for
 * the account and the one its cookie-consent config is keyed to.
 *
 * Committed rather than read from an environment variable on purpose: the id is
 * public — it is in the HTML of the live site — so treating it as configuration
 * bought nothing and added a Vercel step that could be forgotten, plus a
 * placeholder state that reads as a bug rather than as missing config.
 */
/**
 * SocialJuice, which still collects the reviews but no longer displays them.
 *
 * The homepage used to embed this account's wall in an iframe. It renders our
 * own markup over our own copy now — see TESTIMONIALS in ft/content.ts, where
 * the reviews are quoted exactly — so all that survives here is the address of
 * the public wall, which "View All Testimonials" links to and which is where a
 * customer leaves a new one.
 *
 * The embed url, the resizer script, its origin and the reserved height went
 * with the component. They are in git history if the widget ever comes back.
 */
export const REVIEWS = {
  /** Where "View All Testimonials" goes — the public wall, not an embed. */
  collectUrl: 'https://collect.socialjuice.io/p/nntm-capital/wall',
} as const;

export const SURVEY = {
  host: 'https://link.mailsengr.com',
  kind: 'survey',
  id: 'iMvBFKUm0M5CxTrlVGOf',
  /**
   * Height reserved before the survey reports its real size, so the sections
   * below it do not jump. form_embed.js overwrites it via inline style.
   */
  initialHeight: 1100,
} as const;
