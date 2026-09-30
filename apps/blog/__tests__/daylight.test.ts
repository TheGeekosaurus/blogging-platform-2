import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CODED_SITES, NNTM_CAPITAL_SLUG } from "@blog/core";

/**
 * Daylight — the light-theme homepage preview at /daylight.
 *
 * A parallel build of the Nanotom Capital homepage, living beside the dark one
 * so the two can be compared without the live page moving. Everything here
 * guards a property that is easy to break silently and expensive to break: the
 * compliance text, the noindex, and the dark site staying exactly as it was.
 */

const marketing = join(__dirname, "..", "components", "marketing");
const read = (...parts: string[]) =>
  readFileSync(join(marketing, ...parts), "utf8");

/**
 * The footer's legal text is the SAME legal text, word for word.
 *
 * Daylight's footer is a copy of the shared one in a light palette, which means
 * the funding disclaimer, the operator paragraph and the two third-party
 * notices now exist twice. That copy is compliance text Denis supplied, not
 * marketing — it says, among other things, that Nanotom Capital is not the
 * party extending the credit — and a light-theme edit that quietly tightens a
 * sentence in one footer and not the other is the worst kind of drift, because
 * both pages keep rendering and nothing complains.
 *
 * Paragraphs are compared with markup and whitespace normalised away, so
 * reformatting either file is free and changing the words is not.
 */
describe("the two footers state the same legal text", () => {
  function legalParagraphs(source: string): string[] {
    const withoutComments = source.replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");

    return (
      [...withoutComments.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
        .map(([, inner]) =>
          (inner ?? "")
            .replace(/<[^>]+>/g, "")
            // JSX expressions: {CONTACT.legalEntity}, {' '}, {'.'} and the like.
            .replace(/\{[^}]*\}/g, "")
            .replace(/\s+/g, " ")
            .trim(),
        )
        // The long ones are the disclaimers; the short ones are addresses and
        // copyright lines, which carry a year and are allowed to differ.
        .filter((text) => text.length > 120)
    );
  }

  const dark = legalParagraphs(read("site-footer.tsx"));
  const daylight = legalParagraphs(read("daylight", "site-footer.tsx"));

  it("finds the disclaimers in the live footer", () => {
    expect(dark.length).toBeGreaterThanOrEqual(4);
  });

  it("carries every one of them, verbatim, into the light one", () => {
    expect(daylight).toEqual(dark);
  });

  it("still names the unaffiliated funding providers", () => {
    // The single most important sentence in the footer: it is the one that says
    // we are not the lender. Asserted by content, not only by parity, so a
    // change that drops it from BOTH footers fails here too.
    expect(daylight.join(" ")).toContain("network of unaffiliated");
  });
});

/**
 * The "difference" band's copy is ours.
 *
 * It is modelled on National Funding's section — Denis sent it as the
 * reference — and the layout and the four claims come from there. The
 * sentences do not, for the reason settled when the how-it-works steps were
 * written against Fora Financial's: a competitor's structure is fair game, and
 * retyping their marketing copy onto a page aimed at the same market is not.
 *
 * The easy way to undo that is a tidy-up pass that "restores the reference
 * copy". These assertions are what that pass would have to argue with.
 */
describe('the difference band says what is true of us', () => {
  const copy = read('daylight', 'content.ts');
  const source = readFileSync(
    join(marketing, 'daylight', 'content.ts'),
    'utf8',
  ).replace(/\/\*[\s\S]*?\*\//g, ' ');

  it.each(['national funding', 'fora financial'])('never names %s in rendered copy', (rival) => {
    // The comment block explains the provenance and may name them; the strings
    // a visitor reads may not. Case-insensitive so a heading-cased or shouted
    // spelling cannot slip through.
    expect(source.toLowerCase()).not.toContain(rival);
  });

  it('records the provenance rather than hiding it', () => {
    // Case-insensitive: the note shouts the name for emphasis.
    expect(copy.toLowerCase()).toContain('national funding');
  });

  /*
   * The original marks two claims with "**" and a lozenge, pointing at
   * disclosures printed further down THEIR page. Carried across without those
   * disclosures they would be references to nothing, which on a page taking
   * credit applications is worse than no mark at all.
   */
  it('carries no footnote markers, because it carries no footnotes', () => {
    expect(source).not.toMatch(/\*\*["\u2019\s]|\u25CA/);
  });

  /*
   * The claim most likely to be "corrected" back to the reference's. Ours is
   * same-day, which HOW_IT_WORKS already states; theirs is 24 hours, which is
   * their service level and not a promise this business has made.
   */
  it('promises same-day funding, not the reference\'s 24 hours', () => {
    expect(source).toContain('same day');
    expect(source).not.toContain('24 hours');
  });

  /*
   * The soft-pull claim has to keep agreeing with the footer's funding
   * disclaimer, which states it on the same page.
   */
  it('describes the credit check the footer already discloses', () => {
    /*
     * Whitespace-normalised on both sides. JSX wraps prose at the print
     * margin, so the footer's disclaimer carries a newline in the middle of
     * "a soft / credit check" — a raw substring search finds nothing and the
     * test fails for a reason that has nothing to do with the claim.
     */
    const flat = (text: string) => text.replace(/\s+/g, ' ');
    expect(flat(source)).toContain('soft credit check');
    expect(flat(read('site-footer.tsx'))).toContain('soft credit check');
  });
});

/**
 * The preview must not compete with the page it previews.
 *
 * /daylight renders the homepage's copy at a second URL. Indexed, that is
 * textbook duplicate content on a domain whose entire migration was for SEO.
 * Two things have to agree for it to stay out of the index — the route's own
 * robots directive and the registry's `index` flag — and the failure mode is
 * flipping one and not the other, which leaves either an unlisted page or a
 * sitemap entry pointing at a page that asks not to be indexed.
 */
describe("the preview route is kept out of the index", () => {
  const route = readFileSync(
    join(__dirname, "..", "app", "daylight", "page.tsx"),
    "utf8",
  );

  it("sets robots noindex on the route", () => {
    expect(route).toMatch(/robots:\s*\{\s*index:\s*false/);
  });

  it("follows links out of it, so nothing downstream loses its referral", () => {
    expect(route).toMatch(/follow:\s*true/);
  });

  it("is registered, so it is visible in the admin rather than appearing absent", () => {
    const paths = CODED_SITES[NNTM_CAPITAL_SLUG]?.map((r) => r.path) ?? [];
    expect(paths).toContain("daylight");
  });

  it("is registered as NOT indexable, agreeing with the route", () => {
    const entry = CODED_SITES[NNTM_CAPITAL_SLUG]?.find(
      (r) => r.path === "daylight",
    );
    expect(entry?.index).toBe(false);
  });

  it("is gated on the Capital slug like every other coded route", () => {
    expect(route).toContain("isNntmCapital()");
    expect(route).toContain("notFound()");
  });
});

/**
 * The dark site is not supposed to move.
 *
 * The whole argument for building this as a parallel route rather than as a
 * theme flag is that the live homepage cannot be affected by it. A handful of
 * shared components were touched to make Daylight possible, and every one of
 * those edits is a MARKER CLASS carrying no styles of its own — the styling
 * lives under `.dl-surface`, which the dark pages never match.
 *
 * These tests state that invariant. If a marker ever grows a rule outside that
 * scope, the light build has started leaking into the live one.
 */
describe("the shared components only gained markers", () => {
  const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");

  it.each([
    "ft-avatar",
    "nc-cta",
    "ft-chip",
    "ft-ghost",
    "ft-faq-item",
    "ft-faq-aside",
  ])(
    "%s is styled only under .dl-surface",
    (marker) => {
      const rules = [
        ...css.matchAll(new RegExp(`([^{}]*\\.${marker}[^{}]*)\\{`, "g")),
      ].map(([, selector]) => (selector ?? "").trim());

      expect(
        rules.length,
        `no rule anywhere styles .${marker}`,
      ).toBeGreaterThan(0);
      for (const selector of rules) {
        expect(selector, `.${marker} is styled outside .dl-surface`).toContain(
          ".dl-surface",
        );
      }
    },
  );

  /*
   * The FAQ's exclusive-accordion behaviour is the other half of the same
   * invariant, and it is markup rather than CSS so the marker test cannot see
   * it. `name` groups <details> elements, so leaving it on unconditionally
   * would change how the live dark FAQ opens.
   */
  it("the FAQ only groups its rows when asked to", () => {
    const shared = read("ft/shared-sections.tsx");
    expect(shared).toContain("name={exclusive ? 'ft-faq' : undefined}");
    expect(shared).toContain("exclusive = false");
  });

  it("Daylight is the only caller that asks for it", () => {
    expect(read("daylight/home.tsx")).toContain("<Faq exclusive blurb={false} />");
    // The dark homepage renders the same section with no props at all.
    expect(read("ft/home-v2.tsx")).toContain("<Faq />");
  });

  /*
   * `blurb` defaults ON for the same reason `exclusive` defaults off: the
   * paragraph and the Ask a Question button are on the live site today, and a
   * default of false would delete them from it.
   */
  it("keeps the FAQ blurb unless a caller drops it", () => {
    expect(read("ft/shared-sections.tsx")).toContain("blurb = true");
  });

  it("the CTA marker adds no colour of its own in the component", () => {
    // It must be in the shared `base` string, which carries layout only — the
    // gold and the white live in `styles`, and this marker must not join them.
    const cta = read("cta-button.tsx");
    expect(cta).toContain("'nc-cta inline-block");
  });
});

/**
 * The header dropdowns.
 *
 * NAV is shared with the dark header, so the `icon` keys landed in brand.ts —
 * data both designs can see, which only this one draws. These tests hold the
 * two halves together: every entry has a key, and every key has a mark.
 */
describe("the Daylight dropdowns", () => {
  const header = read("daylight/site-header.tsx");
  const brand = readFileSync(join(marketing, "brand.ts"), "utf8");

  it("gives every dropdown entry an icon key", () => {
    /*
     * Parsed from the source rather than by importing NAV, because brand.ts
     * pulls in next/image transitively through the module graph this file
     * already reads as text elsewhere. A child is any object literal with an
     * href under /funding-solutions/ or /industries/ — the two dropdowns.
     */
    const children = [
      ...brand.matchAll(/\{[^{}]*href: '\/(?:funding-solutions|industries)\/[^']*'[^{}]*\}/g),
    ].map(([entry]) => entry);

    expect(children.length).toBe(7);
    for (const entry of children) {
      expect(entry, `${entry} has no icon key`).toMatch(/icon: '[a-z-]+'/);
    }
  });

  it("maps every icon key the nav uses", () => {
    const keys = [...brand.matchAll(/icon: '([a-z-]+)'/g)].map(([, k]) => k ?? "");
    const mapped = header.slice(
      header.indexOf("const NAV_ICONS = {"),
      header.indexOf("} as const;", header.indexOf("const NAV_ICONS = {")),
    );
    for (const key of new Set(keys)) {
      expect(mapped, `NAV_ICONS has no entry for '${key}'`).toContain(key);
    }
  });

  /*
   * Denis asked for the reference's layout without its section headings. They
   * are easy to reintroduce by reflex, since every other panel-like thing on
   * the page has a label above it.
   */
  it("prints no section heading over a dropdown list", () => {
    const panel = header.slice(header.indexOf("{item.children.map"));
    expect(panel).not.toMatch(/uppercase/);
  });

  /*
   * The CTA band must not carry the reference's ceiling, which is a different
   * company's limit. Ours is stated site-wide as $15,000 to $5,000,000.
   */
  it("quotes our funding range and not the reference's", () => {
    const copy = readFileSync(join(marketing, "daylight", "content.ts"), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, " ");
    expect(copy).toContain("$15,000 to $5,000,000");
    expect(copy).not.toContain("$600,000");
  });
});

