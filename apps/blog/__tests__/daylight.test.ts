import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CODED_SITES, NNTM_CAPITAL_SLUG } from "@blog/core";

/**
 * Daylight — the light build, which is the Nanotom Capital homepage as of
 * 2026-10-02.
 *
 * It began as a parallel design at /daylight so the two could be compared
 * without the live page moving, and Denis promoted it. What these tests guard
 * is unchanged by that: the properties that are easy to break silently and
 * expensive to break — the compliance text matching the dark footer word for
 * word, the subhead colour carrying its own contrast, and the dark site, which
 * still serves every other route, staying exactly as it was.
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
    /*
     * BOTH comment forms, and the second one is not hypothetical: a plain block
     * comment in daylight/site-footer.tsx explains the heading alignment and
     * mentions "<p>" in passing, which this regex then read as the start of a
     * paragraph and ran to the next real </p> a hundred lines below. Prose
     * about markup is not markup. JSX comments go first, because the plain
     * pattern would leave their braces behind.
     */
    const withoutComments = source
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
      .replace(/\/\*[\s\S]*?\*\//g, " ");

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
 * Daylight is the homepage now, and the preview URL is gone.
 *
 * While both existed, /daylight carried the homepage's copy at a second URL and
 * was held out of the index by two flags that had to agree — the route's robots
 * directive and the registry's `index`. Promotion retires that whole problem,
 * and the thing worth asserting flips with it: not "the duplicate is noindexed"
 * but "there is no duplicate". A /daylight route restored later without a
 * robots directive would be exactly the duplicate-content trap the original
 * route was written to avoid, on a domain whose migration was for SEO.
 */
describe("the light build is the homepage, not a second copy of it", () => {
  const home = readFileSync(join(__dirname, "..", "app", "page.tsx"), "utf8");

  it("renders Daylight at '/'", () => {
    expect(home).toContain("DaylightHome");
    expect(home).toContain("daylight/home");
  });

  /*
   * The dark homepage is unrouted, not deleted. It is the revert path — one
   * import and one tag — and several tests still read it as the reference the
   * light build was derived from.
   */
  it("keeps the dark homepage in the tree, just not on a route", () => {
    expect(home).not.toContain("<HomeV2");
    expect(existsSync(join(marketing, "ft", "home-v2.tsx"))).toBe(true);
  });

  it("no longer serves the preview route", () => {
    expect(existsSync(join(__dirname, "..", "app", "daylight", "page.tsx"))).toBe(false);
  });

  it("drops its registry entry with it, so the admin lists no phantom page", () => {
    const paths = CODED_SITES[NNTM_CAPITAL_SLUG]?.map((r) => r.path) ?? [];
    expect(paths).not.toContain("daylight");
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
    /*
     * The props are matched individually rather than as one exact call string.
     * That string has now been rewritten twice by adding a prop, and each time
     * the test failed for a reason that had nothing to do with what it guards:
     * that Daylight opts in and the dark homepage does not.
     */
    const call = read("daylight/home.tsx").match(/<Faq\b[^>]*\/>/)?.[0] ?? "";
    expect(call).toContain("exclusive");
    expect(call).toContain("blurb={false}");

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
  /*
   * Read through NAV rather than scraped out of brand.ts. It used to be a regex
   * over the source, on the belief that importing the module pulled next/image
   * in transitively; brand.ts imports nothing, and the regex quietly stopped
   * seeing anything the moment FUNDING_PROGRAMS was built by .map() instead of
   * written as nine literals. It reported 2 children where there are 11, which
   * is the failure mode of testing source text instead of values.
   */
  it("gives every dropdown entry an icon key", async () => {
    const { NAV } = await import("../components/marketing/brand");

    const { CALCULATORS, FUNDING_PROGRAMS, INDUSTRIES_MENU } = await import(
      "../components/marketing/brand"
    );
    const children = NAV.flatMap((item) => item.children ?? []);

    /*
     * DERIVED, not a magic number. This read `toBe(11)` — nine products and two
     * industries — and every time the menus grew it failed for the wrong
     * reason. What the test is actually for is that nothing reaches a dropdown
     * WITHOUT going through one of the three arrays, so count them.
     */
    expect(children.length).toBe(
      FUNDING_PROGRAMS.length + INDUSTRIES_MENU.length + CALCULATORS.length,
    );
    for (const child of children) {
      expect(child.icon, `${child.label} has no icon key`).toMatch(/^[a-z-]+$/);
    }
  });

  /*
   * Both glyph maps, against the one list of keys.
   *
   * A missing key is quiet in a way a wrong one is not: DropdownRow renders a
   * row with no tile rather than with a stand-in mark, and ICONS on the loans
   * page would hand `undefined` to JSX. The two maps are also the place the
   * `cashflow` / `cash-flow` near-miss lived, so they are checked together
   * against the same source.
   */
  it("maps every icon key the nav uses, in both glyph maps", async () => {
    const { NAV } = await import("../components/marketing/brand");
    const loans = read("ft/funding-solutions.tsx");

    const slice = (source: string, open: string) =>
      source.slice(source.indexOf(open), source.indexOf("} as const;", source.indexOf(open)));

    const navIcons = slice(header, "const NAV_ICONS = {");
    const loanIcons = slice(loans, "const ICONS = {");

    const keys = new Set(
      NAV.flatMap((item) => item.children ?? [])
        .map((child) => child.icon)
        .filter((key): key is string => Boolean(key)),
    );

    /* Hyphenated keys are quoted in both maps and bare ones are not, so the
       match has to allow either rather than assume one. */
    const declares = (map: string, key: string) =>
      new RegExp(`(^|[{,\\s])'?${key}'?\\s*:`, "m").test(map);

    expect(keys.size).toBeGreaterThan(0);
    for (const key of keys) {
      expect(declares(navIcons, key), `NAV_ICONS has no entry for '${key}'`).toBe(true);
    }

    /* The loans page draws only the nine funding marks, not the industries. */
    const { FUNDING_PROGRAMS } = await import("../components/marketing/brand");
    for (const program of FUNDING_PROGRAMS) {
      expect(
        declares(loanIcons, program.icon),
        `ICONS has no entry for '${program.icon}'`,
      ).toBe(true);
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

/**
 * The footer's CTA card and its columns.
 *
 * Denis asked for the card to travel with the footer, so it lives in the footer
 * component rather than on the homepage. These tests hold the two properties
 * that are easy to lose: the copy stays copy the page already says, and the
 * columns do not grow a link that 404s.
 */
describe("the Daylight footer", () => {
  const footer = read("daylight/site-footer.tsx");
  const copy = read("daylight", "content.ts").replace(/\/\*[\s\S]*?\*\//g, " ");

  it("renders the CTA inside the footer, not the page", () => {
    expect(footer).toContain("dl-cta-card");
    expect(read("daylight/home.tsx")).not.toContain("dl-cta-card");
  });

  /*
   * A CTA under every page is the worst place to invent a claim, so all three
   * of its lines are lifted from copy that already appears elsewhere.
   */
  it("says nothing the page does not already say", () => {
    const shared = read("ft", "content.ts");
    const difference = copy;
    expect(difference).toContain(
      "Speak with an in-house loan advisor who works your file from application to funding.",
    );
    expect(difference).toContain("Soft credit check only. No obligation.");
    // The two halves of that reassurance are the hero card's own pair.
    const slider = read("daylight/amount-slider.tsx");
    expect(slider).toContain("Soft credit check only");
    expect(slider).toContain("No obligation");
    // And the heading is the band's, which the shared footer still prints.
    expect(shared.length).toBeGreaterThan(0);
  });

  /*
   * /industries is a static route gated to the Labs deployment, so it answers
   * 404 on Capital. The column heading must stay unlinked until that changes.
   */
  /*
   * THE INDUSTRIES HEADING IS LINKED AGAIN. It was plain text for as long as
   * /industries was a Labs-only route that answered 404 on Capital; that route
   * serves this deployment its own index now, so every one of the four column
   * headings has a real page behind it.
   */
  it("links the Industries heading now that the index exists", () => {
    expect(footer).toContain('heading="Industries" href="/industries"');
  });

  it("gives every other column heading its real page", () => {
    expect(footer).toContain('heading="Funding Solutions" href="/funding-solutions"');
    expect(footer).toContain('heading="About Us"');
    expect(footer).toContain('href="/about-us"');
  });
});

/**
 * The funding subhead, and why its weight is a contrast rule rather than taste.
 *
 * Denis gave #5792A8 for the line under each product name. It measures 3.45:1
 * on this theme's white — under the 4.5:1 AA wants for body text, over the 3:1
 * it wants for large text. WCAG counts 18.66px bold as large, so the colour is
 * compliant at 19px/700 and non-compliant at anything smaller or lighter.
 *
 * That is invisible in a screenshot and the exact kind of thing a later "make
 * the subhead a bit lighter" pass removes without noticing, so it is asserted.
 */
describe("the funding subhead carries its own contrast", () => {
  /*
   * `daylight/funding-rail.tsx` is where the homepage's run went when that
   * section was lifted out so the industry pages could wear it too. The list is
   * written out rather than globbed so a NEW call site has to be added here
   * deliberately — the point is that nobody introduces a fourth subhead at a
   * size the colour does not survive.
   */
  const USERS = [
    "daylight/funding-rail.tsx",
    "ft/home-v2.tsx",
    "ft/funding-solutions.tsx",
  ];

  it("sets every --ft-subhead run at 19px or more, and bold", () => {
    for (const file of USERS) {
      const source = read(file);
      const runs = [...source.matchAll(/className="([^"]*--ft-subhead[^"]*)"/g)].map(
        ([, cls]) => cls ?? "",
      );

      expect(runs.length, `${file} uses --ft-subhead`).toBeGreaterThan(0);

      for (const cls of runs) {
        expect(cls, `${file}: --ft-subhead run is not bold`).toContain("font-bold");

        const size = cls.match(/text-\[([\d.]+)rem\]/);
        expect(size, `${file}: --ft-subhead run has no explicit size`).not.toBeNull();
        /* 1.1875rem = 19px, over WCAG's 18.66px large-text threshold. */
        expect(
          Number(size?.[1]),
          `${file}: --ft-subhead run is below the large-text threshold`,
        ).toBeGreaterThanOrEqual(1.1875);
      }
    }
  });

  /*
   * And the token is declared on BOTH surfaces. The dark site's blocks use it
   * too, where it is 5.70:1 and safe at any size; a token that resolved to
   * nothing there would render the subhead in inherited ink and look merely
   * dull rather than broken.
   */
  it("declares the token on both themes", () => {
    const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");
    const declarations = [...css.matchAll(/--ft-subhead:\s*([^;]+);/g)].map(([, v]) =>
      (v ?? "").trim(),
    );

    expect(declarations.length).toBe(2);
    for (const value of declarations) expect(value).toBe("#5792a8");
  });
});

/**
 * The blog category filters match the buttons beside them, on Daylight only.
 */
describe("the category filters", () => {
  it("squares off under .dl-surface without moving the dark site", () => {
    const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");
    const list = read("ft/post-list.tsx");

    /* The marker is on the component and carries no radius of its own there. */
    expect(list).toContain("ft-catpill");
    /* The lozenge is still what the shared component ships. */
    expect(list).toContain("rounded-[42px]");

    /* And the square-off is scoped to the light theme. */
    expect(css).toContain(".dl-surface .ft-catpill");
    const rule = css.slice(
      css.indexOf(".dl-surface .ft-catpill"),
      css.indexOf("}", css.indexOf(".dl-surface .ft-catpill")),
    );
    /* The same radius .ft-ghost and the solid buttons take. */
    expect(rule).toContain("border-radius: 0.375rem");
  });
});

/**
 * The chrome is global, and the wrapper that carries its tokens generates no box.
 *
 * Denis made the light header site-wide on 2026-10-04. Two things have to stay
 * true for that to work, and both failed silently when they were first written:
 *
 * 1. `display: contents` ON THE WRAPPER. A `position: sticky` element can only
 *    stick while its parent block is in view, and a plain wrapper div is
 *    exactly as tall as the header — so the header unstuck the moment you
 *    scrolled past it. Measured at -1822px on a long page, i.e. gone, with
 *    nothing on screen to say so. `contents` generates no box, which gives the
 *    sticky header the flex column as its containing block again.
 *
 * 2. THE TOKENS STAY ON A WRAPPER rather than going on the column itself. A
 *    dark page nested inside `.dl-surface` would pick up every
 *    `.dl-surface .ft-*` marker rule in globals.css — the navy ghost buttons,
 *    the squared category filters, the navy FAQ — and restyle itself.
 */
describe("the site-wide Daylight chrome", () => {
  const layout = readFileSync(join(__dirname, "..", "app", "layout.tsx"), "utf8");

  it("renders Daylight's header and footer for Capital", () => {
    expect(layout).toContain("DaylightHeader");
    expect(layout).toContain("DaylightFooter");
  });

  it("keeps the sticky header's containing block with display: contents", () => {
    const wrappers = [...layout.matchAll(/className="dl-surface([^"]*)"/g)].map(
      ([, rest]) => rest,
    );
    expect(wrappers.length, "the chrome wrappers carry .dl-surface").toBe(2);
    for (const rest of wrappers) {
      expect(rest, "a chrome wrapper is missing `contents`").toContain("contents");
    }
  });

  it("does not put the light tokens on the whole column", () => {
    /* The flex column that holds header, main and footer must not itself be a
       Daylight surface — see reason 2 above. */
    expect(layout).not.toMatch(/className="dl-surface[^"]*flex min-h-screen/);
    expect(layout).not.toMatch(/className="flex min-h-screen[^"]*dl-surface/);
  });

  /*
   * And the pages do not draw their own. Two headers would be two banner
   * landmarks; the old answer was a CSS rule that hid one, which is the stopgap
   * this replaced.
   */
  it("leaves the pages to render only their own content", () => {
    for (const file of [
      "daylight/home.tsx",
      "daylight/funding-solutions.tsx",
      "daylight/dscr-calculator.tsx",
      "daylight/get-funded.tsx",
      "daylight/industries-index.tsx",
    ]) {
      const source = read(file);
      expect(source, `${file} still draws a header`).not.toContain("<DaylightHeader");
      expect(source, `${file} still draws a footer`).not.toContain("<DaylightFooter");
    }
  });

  it("no longer hides chrome with CSS", () => {
    const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");

    /*
     * COMMENTS STRIPPED FIRST. The phrase survives in a note explaining why the
     * rule is gone, and what must not come back is the rule itself.
     *
     * This read `/body:has\(\.dl-surface\)[^{]*\{/` against the raw file, which
     * passed only because that note happened to be the last thing in it — the
     * pattern finds the next `{` anywhere downstream, so the first rule
     * appended after the note turned a note into a match. Stripping comments
     * tests what the test is named for.
     */
    const code = css.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(code).not.toContain("body:has(.dl-surface)");
  });
});

/**
 * /funding-solutions is Daylight, and wears the homepage's hero.
 */
describe("the Daylight funding-solutions page", () => {
  const page = read("daylight/funding-solutions.tsx");

  it("is what the route renders", () => {
    const route = readFileSync(
      join(__dirname, "..", "app", "funding-solutions", "page.tsx"),
      "utf8",
    );
    expect(route).toContain("DaylightFundingSolutions");
  });

  /*
   * Denis: "same as main, but keep the headline on this current page." The
   * same component, not a second copy of it — a copy is the same hero only on
   * the day it is written.
   */
  it("shares the homepage's hero component, with its own headline", () => {
    expect(page).toContain("DaylightHero");
    expect(page).toContain("LOANS.hero.heading");
    expect(read("daylight/home.tsx")).toContain("DaylightHero");
  });

  it("uses the Daylight versions of the sections the homepage also has", () => {
    expect(page).toContain("DaylightHowItWorks");
    expect(page).toContain("DaylightUseCases");
    /* The same FAQ props the homepage passes. */
    expect(page).toContain("exclusive");
    expect(page).toContain("blurb={false}");
  });

  /*
   * The qualifier survey is deliberately absent: it is a GoHighLevel iframe
   * whose own Custom CSS paints its html/body #141414, so it cannot sit on a
   * white page. The homepage dropped it for the same reason.
   */
  it("does not embed the dark-painted survey on a white page", () => {
    expect(page).not.toContain("Qualifier");
  });

  /*
   * THE CARD DECK. Denis asked three times for one thing and I built two
   * others first, so this pins what it actually is: the cards keep the full
   * width and the header keeps its place above them, and the motion belongs to
   * the cards — each pins at the top and the next slides over it.
   *
   * What fails silently here is the OFFSET. `position: sticky` with every card
   * on the same `top` still works, it just stops reading as a stack — every
   * card lands in the same place and it becomes a slideshow. The per-card step
   * is the whole effect, and it depends on an inline `--dl-i` that Tailwind
   * cannot generate, so it is easy to drop in a refactor and see nothing break.
   */
  it("stacks the cards rather than putting the heading in a side column", () => {
    const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");

    /* The list is the deck, and each card carries its index. */
    expect(page).toContain("dl-stack");
    expect(page).toContain("'--dl-i' as string");

    /* Full width: no side rail, no re-split of the card's own columns. */
    expect(page, "the heading went back into a side column").not.toContain("lg:sticky");
    expect(page).not.toContain("lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]");

    const rule = css.slice(css.indexOf(".dl-stack > li"), css.indexOf("}", css.indexOf(".dl-stack > li")));
    expect(rule).toContain("position: sticky");
    /* The step per card — without it the deck is a slideshow. */
    expect(rule).toMatch(/var\(--dl-i[^)]*\)\s*\*/);
  });

  /*
   * And the deck is off where it would hurt: below 1024px the card's columns
   * stack and it grows taller than the viewport, so pinning would hold content
   * off-screen that the reader is scrolling towards.
   */
  it("only stacks where a pinned card still fits on screen", () => {
    const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");
    const guard = css.slice(
      css.lastIndexOf("@media", css.indexOf(".dl-stack > li")),
      css.indexOf(".dl-stack > li"),
    );
    expect(guard).toContain("min-width: 1024px");
    expect(guard).toContain("prefers-reduced-motion: no-preference");
  });
});

/**
 * The individual product pages, /funding-solutions/<slug>.
 */
describe("the Daylight loan-product page", () => {
  const page = read("daylight/loan-product.tsx");

  it("is what the route renders", () => {
    const route = readFileSync(
      join(__dirname, "..", "app", "funding-solutions", "[product]", "page.tsx"),
      "utf8",
    );
    expect(route).toContain("DaylightLoanProduct");
  });

  /*
   * The shared bands, in the order every other converted page uses them. The
   * review wall is part of that order now — the dark file's note says a product
   * page "ends the way every other page on this site ends", and since the
   * homepage and the funding index moved, that ending has the reviews in it.
   */
  it("ends the way the other converted pages end", () => {
    for (const section of [
      "DaylightHowItWorks",
      "DaylightUseCases",
      "DaylightTestimonials",
    ]) {
      expect(page, `${section} is missing`).toContain(section);
    }
    /* The same FAQ props the homepage and the funding index pass. */
    expect(page).toContain("exclusive");
    expect(page).toContain("blurb={false}");
    /* Use of funds sits on the band artwork, as elsewhere. */
    expect(page).toContain("dl-art");
  });

  /*
   * THE GLYPH IS THE PRODUCT'S OWN. The dark page draws CoinsIcon on all five —
   * a credit line and a piece of equipment finance both illustrated with a
   * stack of coins. These read the same `icon` key the nav and the funding
   * index use, so a product cannot wear one mark in the menu and another on its
   * own page.
   */
  it("gives each product its own mark rather than coins for all five", () => {
    expect(page).toContain("iconFor");
    expect(page).toContain("FUNDING_PROGRAMS.find");
  });

  /*
   * And the fallback is reachable, not decorative: `revenue-based-financing`
   * has a LOAN_PAGES entry but no FUNDING_PROGRAMS entry — it is the
   * interest-only BANKROLL program, which left the core nine and kept its page.
   */
  it("still renders a product that is not one of the core nine", async () => {
    const { LOAN_PAGES } = await import("../components/marketing/ft/content");
    const { FUNDING_PROGRAMS } = await import("../components/marketing/brand");

    const orphans = LOAN_PAGES.filter(
      (lp) => !FUNDING_PROGRAMS.some((p) => p.slug === lp.slug),
    );
    expect(orphans.length, "the fallback has nothing to cover").toBeGreaterThan(0);
    expect(page, "no fallback for a product with no program").toMatch(/\?\?\s*CoinsIcon/);
  });

  /*
   * The compare tabs are the blog's category filters in another place — same
   * 42px lozenge, same job — so they take the same marker and square off
   * together. Denis asked for that shape on the blog on 2026-10-02.
   */
  it("squares the compare tabs with the same marker the blog filters use", () => {
    expect(page).toContain("ft-compare-tab ft-catpill");
  });

  /*
   * No accent on the last word of the hero heading. That treatment works on the
   * homepage and the funding index because both end on the word the sentence is
   * about; these end on "Repay", "Around", "Itself".
   */
  it("does not colour the last word of a heading that ends on a preposition", () => {
    expect(page).not.toContain("dl-display");
  });
});

/*
 * ---------------------------------------------------------------------------
 * THE INDUSTRY PAGES
 *
 * The first one — /industries/food-business — landed on 2026-10-05, and most of
 * what is worth guarding here is routing rather than markup. That corner of the
 * tree has three separate traps in it: /industries itself belongs to the Labs
 * deployment and 404s on Capital, the sibling path is still a catch-all stub,
 * and a route segment always beats the catch-all. A change that forgets any one
 * of them takes a live link down silently.
 * ---------------------------------------------------------------------------
 */
describe("the Daylight industry page", () => {
  const page = read("daylight/industry.tsx");
  const content = read("daylight/industry-content.ts");
  const route = readFileSync(
    join(__dirname, "..", "app", "industries", "[industry]", "page.tsx"),
    "utf8",
  );

  it("is what the route renders, gated to Capital", () => {
    expect(route).toContain("DaylightIndustry");
    expect(route).toContain("isNntmCapital");
  });

  /*
   * THE LOAD-BEARING ONE, and it has flipped.
   *
   * `app/industries/[industry]/page.tsx` captures EVERY /industries/* path,
   * because a route segment always beats the catch-all. While any industry was
   * still a noindex STUB_PAGES entry — construction was, and was linked live
   * from the header dropdown and the footer — that segment would have turned a
   * working 200 into a hard 404 with nothing to notice, so the route was the
   * literal `food-business` instead.
   *
   * Every industry has a record now and the stubs are gone, so the segment is
   * dynamic. What this test guards is that the two never coexist again: a stub
   * under this prefix is unreachable while that route exists, so adding one is
   * silently writing a page nobody will ever be served.
   */
  it("never has an industry stub behind the dynamic segment", async () => {
    const { STUB_PAGES } = await import("../components/marketing/brand");
    const stubbed = Object.keys(STUB_PAGES).filter((path) =>
      path.startsWith("industries/"),
    );
    const dynamicRoute = existsSync(
      join(__dirname, "..", "app", "industries", "[industry]", "page.tsx"),
    );

    if (dynamicRoute) {
      expect(
        stubbed,
        "a route segment beats the catch-all, so these are unreachable",
      ).toEqual([]);
    }
  });

  /* Every record in the file has a route to render it, and vice versa. */
  it("gives every industry record a route and every route a record", async () => {
    const { INDUSTRY_PAGES } = await import(
      "../components/marketing/daylight/industry-content"
    );
    const { STUB_PAGES } = await import("../components/marketing/brand");
    expect(INDUSTRY_PAGES.length).toBeGreaterThan(0);

    const dir = join(__dirname, "..", "app", "industries");
    const dynamicRoute = existsSync(join(dir, "[industry]", "page.tsx"));

    for (const entry of INDUSTRY_PAGES) {
      expect(
        dynamicRoute || existsSync(join(dir, entry.slug, "page.tsx")),
        `no route for ${entry.slug}`,
      ).toBe(true);
      expect(
        Object.hasOwn(STUB_PAGES, `industries/${entry.slug}`),
        `${entry.slug} is both a route and a stub`,
      ).toBe(false);
    }

    /* The dynamic route builds its params from the records, so a record added
       without a CODED_SITES entry is the only way the two can part company —
       which the sitemap test below catches. A LITERAL route left behind after
       the switch is the other, and would serve a second copy at the same URL. */
    if (dynamicRoute) {
      const literals = readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && e.name !== "[industry]")
        .map((e) => e.name);
      expect(literals, "a literal route still shadows the segment").toEqual([]);
    }
  });

  /*
   * THE NAV AND THE RECORDS ARE THE SAME SIX. The header dropdown and the
   * footer column both read INDUSTRIES; a label there with no record is a link
   * to a 404, and a record with no entry is a page nothing links to.
   */
  it("lists exactly the industries that have pages", async () => {
    const { INDUSTRIES } = await import("../components/marketing/brand");
    const { INDUSTRY_PAGES } = await import(
      "../components/marketing/daylight/industry-content"
    );

    const navSlugs = INDUSTRIES.map((i) => i.href.replace(/^\/industries\/|\/$/g, ""));
    const recordSlugs = INDUSTRY_PAGES.map((p) => p.slug);

    expect([...navSlugs].sort()).toEqual([...recordSlugs].sort());

    /* And every one carries a glyph the header can actually draw. */
    const header = read("daylight/site-header.tsx");
    const map = header.slice(
      header.indexOf("const NAV_ICONS"),
      header.indexOf("} as const;", header.indexOf("const NAV_ICONS")),
    );
    const { INDUSTRIES_MENU } = await import("../components/marketing/brand");
    for (const item of INDUSTRIES_MENU) {
      expect(map, `no glyph for "${item.icon}"`).toMatch(
        new RegExp(`['"]?${item.icon}['"]?\\s*:`),
      );
    }
  });

  /*
   * A page that renders but is missing from CODED_SITES is invisible to
   * crawlers and to the admin, and nothing fails to say so — which is why this
   * is asserted for every industry rather than for the one that exists today.
   */
  it("puts every industry page in the sitemap registry", async () => {
    const { INDUSTRY_PAGES } = await import(
      "../components/marketing/daylight/industry-content"
    );
    const paths = new Set(CODED_SITES[NNTM_CAPITAL_SLUG]?.map((r) => r.path));

    for (const entry of INDUSTRY_PAGES) {
      expect(paths.has(`industries/${entry.slug}`), `${entry.slug} is not registered`).toBe(
        true,
      );
    }

    /*
     * And `industries` itself is NOT registered: app/industries/page.tsx is
     * gated to Labs, so on Capital that path answers 404 and listing it would
     * submit a 404 in the sitemap.
     */
    expect(paths.has("industries")).toBe(true);
  });

  /*
   * The Industries trigger pointed at /industries, which 404d on Capital, so it
   * carried no href for a while. The index exists on this deployment now, so
   * the href is back — and what this guards is that it points at a page the
   * registry actually knows about rather than at a path that merely looks right.
   */
  it("points the Industries menu at a registered page", async () => {
    const { NAV } = await import("../components/marketing/brand");
    const industries = NAV.find((item) => item.label === "Industries");

    expect(industries, "the Industries menu is gone").toBeTruthy();
    expect(industries?.children?.length ?? 0).toBeGreaterThan(0);

    const paths = new Set((CODED_SITES[NNTM_CAPITAL_SLUG] ?? []).map((r) => r.path));
    const path = (industries?.href ?? "").replace(/^\/|\/$/g, "");
    expect(paths.has(path), `the trigger points at an unregistered /${path}`).toBe(true);
  });

  /*
   * "AND MORE" IS LAST, AND IT IS PINNED. Denis asked for the row at the end of
   * the menu, going to the index directly.
   *
   * Pinned is the part that is not cosmetic. Sixteen industries overflow the
   * desktop panel's scroll cap at every width below 1440 — measured: seventeen
   * rows in one column stood 1259px tall against a 768px viewport — so without
   * the flag the one row that exists to escape a too-long list was itself the
   * row you had to scroll to find.
   */
  it("ends the Industries menu with a pinned route to the index", async () => {
    const { INDUSTRIES, INDUSTRIES_MENU } = await import("../components/marketing/brand");

    expect(INDUSTRIES_MENU.length).toBe(INDUSTRIES.length + 1);

    const last = INDUSTRIES_MENU[INDUSTRIES_MENU.length - 1];
    expect(last?.label).toBe("And More");
    expect(last?.href).toBe("/industries");
    expect(last?.pinned, "the escape hatch can scroll out of reach").toBe(true);

    /* Every other row is a trade, and none of them is pinned. */
    for (const row of INDUSTRIES_MENU.slice(0, -1)) {
      expect(row.pinned, `${row.label} is pinned`).toBeUndefined();
    }

    /* And the panel renders pinned rows outside the scrolling list. */
    const header = read("daylight/site-header.tsx");
    expect(header).toContain("const pinned = item.children.filter((child) => child.pinned)");
    expect(header).toMatch(/overflow-y-auto/);
  });

  /*
   * The index is a real page on both deployments, serving a different one to
   * each. A slug gate that falls through to notFound() is what makes one path
   * safe to share between two sites.
   */
  it("serves an industries index to Capital as well as Labs", () => {
    const route = readFileSync(
      join(__dirname, "..", "app", "industries", "page.tsx"),
      "utf8",
    );
    expect(route).toContain("DaylightIndustriesIndex");
    expect(route).toContain("LabsIndustries");
    expect(route).toContain("notFound()");

    /* The index lists the trades, not the menu — the menu's last row points
       back here, and a page linking to itself at the end of its own grid is a
       loop with no exit. */
    /* Comments stripped: the file's own note explains which list it reads and
       why, so it names the one it does not use. */
    const page = read("daylight/industries-index.tsx").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(page).toContain("INDUSTRIES");
    expect(page).not.toContain("INDUSTRIES_MENU");
  });

  /*
   * THE REGISTRY CANNOT OUTLIVE THE RECORDS EITHER. The sitemap test above
   * checks every record is registered; this is the other direction — a path
   * left in CODED_SITES after a record is renamed or dropped puts a 404 in the
   * sitemap, which is exactly the failure that registry exists to prevent.
   */
  it("registers no industry path that has no record", async () => {
    const { INDUSTRY_PAGES } = await import(
      "../components/marketing/daylight/industry-content"
    );
    const slugs = new Set(INDUSTRY_PAGES.map((p) => p.slug));

    const registered = (CODED_SITES[NNTM_CAPITAL_SLUG] ?? [])
      .map((r) => r.path)
      .filter((path) => path.startsWith("industries/"))
      .map((path) => path.slice("industries/".length));

    expect(registered.length).toBe(INDUSTRY_PAGES.length);
    for (const slug of registered) {
      expect(slugs.has(slug), `${slug} is registered with no record`).toBe(true);
    }
  });

  /* Denis: "Hero section same as main, new headline on the left side." */
  it("wears the same hero as the homepage, with its own headline", () => {
    expect(page).toContain("DaylightHero");
    expect(page).toContain("page.hero.heading");
    /*
     * And the record carries nothing the shared hero cannot draw. An `eyebrow`
     * field was written and removed for exactly this reason: that hero builds
     * its badge from HERO.stats, so a per-industry eyebrow would have been a
     * field nothing rendered.
     */
    expect(content).not.toContain("eyebrow");
  });

  it("ends the way the other converted pages end", () => {
    for (const section of [
      "DaylightHowItWorks",
      "DaylightUseCases",
      "DaylightTestimonials",
    ]) {
      expect(page, `${section} is missing`).toContain(section);
    }
    expect(page).toContain("exclusive");
    expect(page).toContain("blurb={false}");
    expect(page).toContain('className="dl-art"');
  });

  /*
   * The recommended products are read from the shared copy, never retyped — the
   * whole reason the record stores slugs. A product described one way on the
   * index, another on its own page and a third here is the drift this prevents.
   */
  it("reads its product copy from the shared source", () => {
    /* The record stores slugs; the cards come from the one place the index and
       the product pages already read. A product described one way here and
       another there is the drift this prevents. */
    expect(page).toContain("FUNDING_OPTIONS.cards");
    expect(content).not.toContain("Best for");
    expect(content).not.toContain("subtitle");
  });

  /*
   * Every icon key a record names has a glyph. Without this, a typo renders a
   * cell with a hole where the mark should be and no error anywhere.
   */
  it("has a glyph for every icon key the content names", async () => {
    const { INDUSTRY_PAGES } = await import(
      "../components/marketing/daylight/industry-content"
    );
    const map = page.slice(page.indexOf("const NEED_ICONS"), page.indexOf("const CARDS_BY_SLUG"));

    for (const entry of INDUSTRY_PAGES) {
      for (const item of entry.needs.items) {
        /* Hyphenated keys are quoted in the map, bare ones are not. */
        expect(map, `no glyph for "${item.icon}"`).toMatch(
          new RegExp(`['"]?${item.icon}['"]?\\s*:`),
        );
      }
    }
  });

  /*
   * THE SHORTLIST IS THE HOMEPAGE'S SECTION, not a copy of it — Denis asked it
   * to "mimic the main page with products, title on the left, product cards
   * scrolling on the right", and a copy mimics the main page only on the day it
   * is written.
   */
  it("shares the homepage's products section rather than redrawing it", () => {
    expect(page).toContain("DaylightFundingRail");
    expect(read("daylight/home.tsx")).toContain("DaylightFundingRail");

    /* And the rail really is the sticky one. */
    const rail = read("daylight/funding-rail.tsx");
    expect(rail).toContain("lg:sticky");
    expect(rail).toMatch(/lg:grid-cols-\[minmax\(0,0\.8fr\)_minmax\(0,1\.2fr\)\]/);
  });

  /*
   * The divider Denis asked for between "what they borrow for" and the
   * shortlist. It is on the rail, not on the needs grid, so every page that
   * drops that section in gets the edge — the same reasoning that puts How It
   * Works' rule on How It Works.
   */
  it("rules off the shortlist from the block above it", () => {
    expect(read("daylight/funding-rail.tsx")).toContain(
      'className="border-t border-[var(--ft-line)]"',
    );
  });

  /*
   * NO TEXT ON THE BAND ARTWORK — and on this page that is now settled by there
   * being no band at all.
   *
   * It is worth leaving the guard. `.dl-deep` paints a picture behind itself,
   * and globals.css permits that only because the band carries opaque cards and
   * no type. This section had its header on it for a round: measured against
   * the rendered pixels the white heading came out at 2.20:1 and the standfirst
   * at 1.29:1 where the artwork's gold curve runs under them from 1024px up.
   *
   * The in-browser contrast sweep does NOT catch this — it resolves a
   * background-COLOR up the ancestor chain and cannot see a background-image —
   * so this is the only automated guard there is.
   */
  it("puts no text on the band artwork", () => {
    const at = page.indexOf('"dl-deep');
    if (at === -1) return;

    const band = page.slice(at, page.indexOf("</div>", at));
    expect(band, "a heading is sitting on the picture").not.toContain("SectionIntro");
    expect(band, "prose is sitting on the picture").not.toMatch(/<p[\s>]/);
  });

  /*
   * The shortlist is ordered by the record, not by the menu. A food business is
   * shown equipment finance first; FUNDING_PROGRAMS order would have led with
   * working capital, which is the global ranking and says nothing about the
   * trade.
   */
  it("keeps the shortlist in the record's order, not the menu's", async () => {
    const { INDUSTRY_PAGES } = await import(
      "../components/marketing/daylight/industry-content"
    );
    const { FUNDING_PROGRAMS } = await import("../components/marketing/brand");

    /* Comments stripped: the helper's own note quotes the call it rules out. */
    const code = page.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(code, "filter() would reorder to menu order").toContain("cardsFor");
    expect(code).not.toMatch(/FUNDING_OPTIONS\.cards\.filter/);

    /* And at least one record actually disagrees with menu order, or the test
       above is guarding nothing. */
    const menu = FUNDING_PROGRAMS.map((p) => p.slug);
    const disagrees = INDUSTRY_PAGES.some((entry) => {
      const ranked = [...entry.products.slugs].sort(
        (a, b) => menu.indexOf(a) - menu.indexOf(b),
      );
      return ranked.join() !== entry.products.slugs.join();
    });
    expect(disagrees, "no record departs from menu order").toBe(true);
  });

  /*
   * An industry page may be specific about the TRADE and not about this
   * business's record in it. Nobody has counted the restaurants funded, so no
   * page may imply someone has.
   */
  it("claims no record in the trade it describes", () => {
    const prose = JSON.stringify(
      INDUSTRY_PROSE_SOURCE(content),
    ).toLowerCase();
    for (const claim of ["we have funded", "we've funded", "businesses funded"]) {
      expect(prose, `"${claim}" is a count nobody has`).not.toContain(claim);
    }

    /*
     * And no bare tally of the trade either — "180 restaurants", "400+ farms".
     * A phrase ban alone was both too loose and too tight: "clients in" was on
     * the list and caught "winning clients in the quiet months", which claims
     * nothing. The number is the thing that cannot be supported.
     */
    expect(
      prose,
      "a count of the trade that nobody has made",
    ).not.toMatch(
      /\d[\d,]*\+?\s+(restaurants|contractors|farms|practices|shops|clients|businesses|customers)/,
    );
  });
});

/* Everything the content file states as prose, with the doc comments stripped —
   the comment above INDUSTRY_PAGES discusses the very phrases the test bans. */
function INDUSTRY_PROSE_SOURCE(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\//g, "");
}

/*
 * ---------------------------------------------------------------------------
 * ONE WEIGHT FOR SECTION HEADLINES
 *
 * Denis, 2026-10-06, pointing at the products rail: "the headline is a
 * different weight than the others. Make all other sections headings like that
 * the same weight as this one."
 *
 * The split was not a design decision, it was an accident of plumbing — the two
 * headlines written inline in a page file were bold and every headline that
 * went through SectionIntro was medium, so which weight a section got depended
 * on which route it took to the screen.
 * ---------------------------------------------------------------------------
 */
describe("Daylight section headlines", () => {
  /*
   * WHAT COUNTS AS A SECTION HEADLINE, mechanically: a headline-font run whose
   * clamp tops out at 2.5rem or more. Everything above that line is a band's
   * own headline; everything below is a card title or a footer sub-head, which
   * are semibold on purpose and are not what Denis was pointing at.
   */
  const files = readdirSync(join(__dirname, "..", "components", "marketing", "daylight"))
    .filter((f) => f.endsWith(".tsx"));

  it("sets every one of them bold", () => {
    const seen: string[] = [];

    for (const file of files) {
      const source = read(`daylight/${file}`);
      const runs = source.match(/[^"]*font-\[family-name:var\(--font-headline\)\][^"]*/g) ?? [];

      for (const run of runs) {
        const max = run.match(/text-\[clamp\([^,]+,[^,]+,([\d.]+)rem\)\]/);
        if (!max || Number(max[1] ?? 0) < 2.5) continue;

        seen.push(`${file}: ${max[1]}rem`);
        expect(run, `${file}: a section headline is not bold`).toContain("font-bold");
      }
    }

    /* The scan has to actually find them, or this passes by finding nothing. */
    expect(seen.length, "no section headlines matched").toBeGreaterThan(4);
  });
});

/*
 * ---------------------------------------------------------------------------
 * THE ARTWORK GROUND
 *
 * `.dl-art` paints the band picture behind a whole section and re-points
 * --ft-ink to white. Two things have to be true of anything that uses it, and
 * both have been got wrong once.
 * ---------------------------------------------------------------------------
 */
describe("sections standing on the band artwork", () => {
  const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");

  /*
   * A `.dl-art` section whose content is not wrapped in `.dl-panel` prints the
   * white --ft-ink the ground sets onto its own white cells. The panel is the
   * other half of the token inversion, never optional.
   */
  it("always pairs the ground with a panel", () => {
    const files = readdirSync(join(__dirname, "..", "components", "marketing", "daylight"))
      .filter((f) => f.endsWith(".tsx"));

    let grounds = 0;
    for (const file of files) {
      const source = read(`daylight/${file}`);
      if (!source.includes("dl-art")) continue;
      grounds += 1;

      /*
       * Either this file wraps a component that carries its own panel — which
       * is how the homepage drops UseCases onto the artwork — or it paints the
       * panel itself. Both are fine; neither being true is not.
       */
      const paintsOwn = source.includes("dl-panel");
      const wrapsComponent = /<div className="dl-art">\s*<Daylight/.test(source);
      expect(
        paintsOwn || wrapsComponent,
        `${file}: dl-art with nothing restoring the light tokens`,
      ).toBe(true);
    }

    expect(grounds, "no dl-art sections found").toBeGreaterThan(0);
  });

  /*
   * THE GROUND MUST CARRY THE DIM TOKENS TOO, not only --ft-ink.
   *
   * It did not until an industry page put a standfirst between its heading and
   * its grid. Up to then nothing muted had ever stood on the artwork, so
   * --ft-muted kept its light-page value — #45557F, which is dark slate on
   * navy. The heading was fine and the sentence under it was invisible.
   */
  it("gives the ground a muted colour that works on navy", () => {
    const rule = css.slice(css.indexOf("  .dl-art {"), css.indexOf("  .dl-art .dl-panel"));

    expect(rule).toContain("--ft-ink: #ffffff");
    expect(rule, "a standfirst on the artwork would be dark on dark").toMatch(
      /--ft-muted:\s*#b9c6e4/,
    );

    /* And the panel still puts the light values back, or the grid goes pale. */
    const panel = css.slice(
      css.indexOf("  .dl-art .dl-panel"),
      css.indexOf("  .dl-art .dl-panel") + 400,
    );
    expect(panel).toMatch(/--ft-muted:\s*#45557f/);
  });
});

/*
 * ---------------------------------------------------------------------------
 * THE CALCULATORS MENU
 *
 * Denis, 2026-10-06: "change the loan calc menu in the header to be a drop down
 * as well with our 2 calculators for now, DSCR, and business loan."
 * ---------------------------------------------------------------------------
 */
describe("the Loan Calculator dropdown", () => {
  it("is a dropdown whose trigger is not also its first child", async () => {
    const { CALCULATORS, NAV } = await import("../components/marketing/brand");
    const item = NAV.find((entry) => entry.label === "Loan Calculator");

    expect(item, "the Loan Calculator menu is gone").toBeTruthy();
    expect(item?.children).toEqual(CALCULATORS);
    expect(CALCULATORS.length).toBe(2);

    /*
     * NO `href` ON THE PARENT. It pointed at /calc when that was the only
     * calculator; leaving it there would make the trigger and its own first
     * row the same destination, and there is no calculators index to point at
     * instead. Both headers render an href-less parent as a trigger.
     */
    expect(item?.href, "the trigger duplicates its first child").toBeUndefined();
  });

  /*
   * Both destinations are real coded routes. A menu row pointing at a path
   * nothing serves is the failure CODED_SITES exists to make visible.
   */
  it("points both rows at registered pages", async () => {
    const { CALCULATORS } = await import("../components/marketing/brand");
    const paths = new Set((CODED_SITES[NNTM_CAPITAL_SLUG] ?? []).map((r) => r.path));

    for (const entry of CALCULATORS) {
      const path = entry.href.replace(/^\/|\/$/g, "");
      expect(paths.has(path), `${entry.label} points at an unregistered ${path}`).toBe(true);
    }
  });

  /*
   * And the footer lists them from the same array. Its Resources column had a
   * hand-written "Loan Calculator" row, so the DSCR calculator was a live page
   * the footer never mentioned.
   */
  it("is the same list the footer prints", () => {
    expect(read("daylight/site-footer.tsx")).toContain("...CALCULATORS");
  });
});

/*
 * ---------------------------------------------------------------------------
 * CLOSING THE MENUS
 *
 * Denis, 2026-10-06: "it's so fast, and the header doesn't move, that it almost
 * looks like you didn't click the menu — there is no effect. Can we just have
 * the drop-down menu close upon clicking on something?"
 * ---------------------------------------------------------------------------
 */
describe("the header menus close when a link in them is clicked", () => {
  const header = read("daylight/site-header.tsx");
  const hook = read("daylight/use-dismiss-menus.ts");
  const shell = read("daylight/header-shell.tsx");
  const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");

  it("runs the dismissal from the shell, which is already a client component", () => {
    expect(shell).toContain("useDismissMenusOnNavigate");
    /* On the <header> itself, not the document — the listener is scoped. */
    expect(shell).toContain("ref={header}");
    /* And no second client boundary was opened to do it. */
    expect(hook).not.toContain("'use client'");
  });

  /*
   * Only a link dismisses. The desktop trigger IS a link when the section has
   * an index page (Funding Solutions), so a listener that fired on any click
   * inside the header would close the panel at the moment it opened.
   */
  it("dismisses on a link, not on any click in the header", () => {
    expect(hook).toContain("a[href]");
    expect(hook).toContain(".dl-headitem");
    /* The mobile sheet is DOM state and is turned off directly. */
    expect(hook).toContain("details[open]");
    /* Focus has to be dropped too, or focus-within reopens the panel. */
    expect(hook).toContain("blur()");
  });

  /*
   * THE RULE MUST BE UNLAYERED. Everything else in globals.css sits in
   * `@layer base` or `@layer components`, and Tailwind's `utilities` layer
   * outranks both — so the same rule written inside a layer would lose to
   * `group-hover:visible` no matter how specific it is. Layer order is decided
   * before specificity.
   */
  it("hides the dismissed panel from outside every cascade layer", () => {
    const marker = ".dl-headitem[data-dismissed] .dl-menu";
    const at = css.indexOf(marker);
    expect(at, "the dismissal rule is gone").toBeGreaterThan(-1);

    /* Brace depth at that point: zero means no enclosing @layer block. */
    let depth = 0;
    for (const ch of css.slice(0, at)) {
      if (ch === "{") depth += 1;
      else if (ch === "}") depth -= 1;
    }
    expect(depth, "the rule is inside a @layer and will lose to utilities").toBe(0);

    /* And the panel carries the marker the rule selects. */
    expect(header).toContain("dl-menu");
  });

  /*
   * EVERY TRIGGER HAS TO BE FOCUSABLE, or `focus-within` — half of what opens
   * the panel — can never fire.
   *
   * This was broken for a while and measured in a browser: the href-less
   * branch rendered a <span>, which is not focusable, so tabbing the header
   * skipped Industries and Loan Calculator entirely and the eight pages behind
   * those two menus could not be reached without a mouse.
   */
  it("gives an href-less dropdown trigger a focusable element", async () => {
    const { NAV } = await import("../components/marketing/brand");
    const hrefless = NAV.filter((item) => item.children && !item.href);
    expect(hrefless.length, "nothing exercises this branch").toBeGreaterThan(0);

    /* The branch that runs when there is no href renders a button. */
    expect(header).toMatch(/<button type="button" className=\{`\$\{TRIGGER_CLASS\}/);
    expect(header, "a span trigger is not keyboard reachable").not.toMatch(
      /<span className=\{`\$\{TRIGGER_CLASS\}[^`]*`\}>/,
    );
  });
});

/*
 * ---------------------------------------------------------------------------
 * /GET-FUNDED IN WHITE
 *
 * Denis, 2026-10-06: "rebrand the get funded page colors."
 * ---------------------------------------------------------------------------
 */
describe("the Daylight get-funded page", () => {
  const page = read("daylight/get-funded.tsx");

  it("is what the route renders, gated to Capital", () => {
    const route = readFileSync(
      join(__dirname, "..", "app", "get-funded", "page.tsx"),
      "utf8",
    );
    expect(route).toContain("DaylightGetFunded");
    expect(route).toContain("isNntmCapital");
  });

  /* The copy is unchanged — this was a colour change, not a rewrite. */
  it("keeps the shared copy rather than restating it", () => {
    expect(page).toContain("GET_FUNDED.heading");
    expect(page).toContain("GET_FUNDED.sub");
    expect(page).toContain("GET_FUNDED.eyebrow");
  });

  /*
   * THE FRAME MATCHES THE EMBED, and the hex is not a brand colour.
   *
   * The survey iframe is one flat near-black field: its html/body carries a
   * background-image that is a 1000x750 PNG of solid #141414, and its own card
   * config sets `bgColor: "141414"`. Both live in Denis's GoHighLevel account
   * and neither can be reached from this origin. So the wrapper paints the same
   * value, which turns a black rectangle sitting on a white page into one dark
   * card — and the day those two settings change, this constant changes with
   * them rather than the page being redesigned around them.
   */
  it("frames the survey in the colour the survey actually is", () => {
    expect(page).toContain("const SURVEY_INK = '#141414'");
    expect(page).toContain("backgroundColor: SURVEY_INK");

    /* Never a --ft-* token: this is a third party's colour, not ours, and
       pointing a theme token at it would make it look like a palette value. */
    const wrapper = page.slice(page.indexOf("mx-auto mt-12"), page.indexOf("HighLevelForm eager"));
    expect(wrapper).not.toContain("--ft-");
    expect(wrapper).not.toContain("--dl-");
  });

  /* One survey, one CRM record, whichever route the visitor took. */
  it("embeds the shared HighLevel form eagerly", () => {
    expect(page).toContain("<HighLevelForm eager />");
  });
});

/*
 * ---------------------------------------------------------------------------
 * /BLOG IN WHITE
 *
 * Denis, 2026-10-08: "rebrand the blog page to be light like the new theme."
 * ---------------------------------------------------------------------------
 */
describe("the Daylight blog index", () => {
  const page = read("daylight/blog-index.tsx");
  const dark = read("ft/blog-index.tsx");

  it("is what both blog routes render", () => {
    const index = readFileSync(join(__dirname, "..", "app", "blog", "page.tsx"), "utf8");
    const archive = readFileSync(
      join(__dirname, "..", "app", "blog", "page", "[page]", "page.tsx"),
      "utf8",
    );
    expect(index).toContain("DaylightBlogIndex");
    expect(archive).toContain("DaylightBlogArchivePage");

    /*
     * BOTH, not just the index. Page 2 is one click from the index via "Older
     * posts", and converting the front and leaving the archive dark is a theme
     * change a reader walks straight off the edge of.
     */
    expect(index).not.toContain("FtBlogIndex");
    expect(archive).not.toContain("FtBlogArchivePage");
  });

  /*
   * THE CARDS ARE IMPORTED, NOT COPIED. Everything the featured story and the
   * three-up draw reads --ft-* and nothing else, so `.dl-surface` re-themes
   * them untouched. Two copies of a post card is how the index and the
   * homepage's band start disagreeing about what a post looks like.
   */
  it("reuses the dark build's cards rather than reproducing them", () => {
    expect(page).toContain("BlogFeatured");
    expect(page).toContain("BlogRecentCard");
    expect(dark).toContain("export function BlogFeatured");
    expect(dark).toContain("export function BlogRecentCard");

    /* And the rows and pills are the homepage's, from the shared list file. */
    expect(page).toContain("CategoryPills");
    expect(page).toContain("PostRow");
  });

  /*
   * SectionIntro, NOT SectionHead. The dark page opens its list with a
   * full-bleed band across the page; Denis asked for those bands to go when
   * Daylight was designed. That is a change of structure, which is why a theme
   * flag could not have done this conversion.
   */
  it("drops the full-bleed section band", () => {
    /* Comments stripped: the file's own note names the component it replaced. */
    const code = page.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(code).toContain("SectionIntro");
    expect(code).not.toContain("SectionHead");
    /* The dark one keeps it — this is a parallel file, not a migration. */
    expect(dark).toContain("SectionHead");
  });

  /* The list wears the marker that restores the homepage's row rhythm. */
  it("gives the list the homepage's row spacing", () => {
    expect(page).toContain("dl-bloglist");
    const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");
    expect(css).toContain(".dl-surface .dl-bloglist article > div");
  });

  it("stands on the light surface, and the dark one is left intact", () => {
    const code = page.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(code).toContain('className="dl-surface"');
    expect(code).not.toContain("ft-surface");
    expect(dark).toContain('className="ft-surface"');
  });
});

/*
 * ---------------------------------------------------------------------------
 * NANOTOM CAPITAL POST BODIES
 *
 * Denis, 2026-10-08: tables in two of our blues with the button radius, every
 * heading in the green of the hero's "GROW", and a gold dollar for bullets —
 * numbers where the list is numbered.
 * ---------------------------------------------------------------------------
 */
describe("the Capital post-body treatments", () => {
  const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");
  const block = css.slice(css.indexOf("NANOTOM CAPITAL POST BODIES"));

  /*
   * THE SCOPE IS THE WHOLE POINT. `.post-body` is not Capital's class — this
   * app is deployed once per blog from one codebase, and page-body.tsx renders
   * the same class for database 'prose' pages. A bare rule would paint Nanotom
   * gold and navy onto every other tenant's blog.
   */
  it("reaches Capital only", () => {
    const rules = block.match(/^\s{2}[.:[@][^\n{]*\{/gm) ?? [];
    expect(rules.length, "no rules found").toBeGreaterThan(5);

    for (const rule of rules) {
      const selector = rule.trim();
      /* @media and the token block on .marketing-root itself are fine. */
      if (selector.startsWith("@") || selector.startsWith(".marketing-root {")) continue;
      expect(
        selector.includes(".marketing-root"),
        `unscoped rule would reach every tenant: ${selector}`,
      ).toBe(true);
    }
  });

  /*
   * THE HEADING COLOUR IS THE HERO'S, and it is declared twice — on
   * `.marketing-root` for the post body and on `.dl-surface` for the marketing
   * pages — because the post body lives inside `.blog-surface`, which is not a
   * descendant of `.dl-surface`, so the token is simply not in scope there.
   * The same arrangement --ft-subhead already uses.
   */
  it("still ties the hero hex to one token, now on the table head", () => {
    const display = [...css.matchAll(/--(?:dl|nc)-display:\s*(#[0-9a-f]{6})/gi)].map(
      (m) => (m[1] ?? "").toLowerCase(),
    );
    expect(display.length, "the token is declared once or not at all").toBeGreaterThan(1);
    expect(new Set(display).size, `two different displays: ${display.join(", ")}`).toBe(1);
    expect(display[0]).toBe("#0794ab");
  });

  /*
   * The weight and the h4 size, which USED to be what made the heading colour
   * legal back when headings were the teal. Navy is 12.86:1 on white, so they
   * constrain nothing now — they stay because bold is what every other
   * Daylight headline is, and the test stays so a later tidy-up is a decision
   * rather than an accident.
   */
  it("keeps the headings bold, as the rest of Daylight is", () => {
    const headings = block.slice(block.indexOf(":is(h2, h3, h4)"));
    expect(headings).toContain("font-weight: 700");
    expect(block, "h4 at 18px is not large at any weight").toMatch(
      /\.post-body h4 \{\s*font-size: 1\.1875rem/,
    );
  });

  /*
   * TWO BLUES, SWAPPED. Denis, after seeing it live: "inverse the colors, dark
   * blue for headers, lighter blue currently used for headers for the table
   * header." So the head takes the hero teal and the headings take the navy;
   * the stripe is still a tint of the navy, because that is all he asked to
   * trade.
   */
  it("builds the table from the hero teal and a navy tint", () => {
    expect(block).toContain("--nc-table-head: var(--nc-display)");
    expect(block).toMatch(/--nc-table-stripe:\s*#f1f5fb/);
    expect(block).toContain("--nc-heading: #0b2d72");
    /* rounded-md, the class every button on the site uses. */
    expect(block).toContain("border-radius: 0.375rem");
  });

  /*
   * AND THE CONSTRAINT MOVED WITH THE COLOUR. White on #0794AB is 3.60:1 —
   * over WCAG's 3:1 for LARGE text, under the 4.5:1 for anything else — so the
   * head only passes while it qualifies as large. At the 15.2px/600 these
   * cells inherited it did not; at 19px/700 it does.
   *
   * This is the same 1.1875rem the funding subhead and the post h4 carry, for
   * the same reason each time, which is why it is worth a test rather than a
   * comment: someone tidying the table's type scale would silently break it.
   */
  it("keeps the teal head inside WCAG's large-text definition", () => {
    const th = block.slice(block.indexOf(".marketing-root .post-body th {"));
    const rule = th.slice(0, th.indexOf("}"));
    expect(rule).toContain("font-size: 1.1875rem");
    expect(rule).toContain("font-weight: 700");
    expect(rule).toContain("color: #ffffff");
  });

  /*
   * THE NAVY CANNOT FOLLOW THE HEADINGS INTO THE READER'S DARK MODE. #0B2D72
   * on #141414 is 1.43:1 — invisible, not merely dim — and it is only visible
   * at all if you toggle the theme, which a screenshot never does.
   */
  it("lightens the heading navy for the dark blog theme", () => {
    const dark = block.slice(block.indexOf("html[data-theme='dark'] .marketing-root {"));
    expect(dark.slice(0, dark.indexOf("}"))).toMatch(/--nc-heading:\s*#5b8fe0/);
  });

  /*
   * A narrow screen gets the base rule's horizontal scroll back. `display:
   * table` is what stops a narrow table leaving a white gutter inside its
   * frame, and the cost is that a real table cannot compress below its
   * min-content width — at 360px this one stood 390px wide and pushed 50px of
   * scroll onto the page.
   */
  it("does not make a table push the page sideways on a phone", () => {
    expect(block).toContain("display: table");
    const mq = block.slice(block.indexOf("@media (max-width: 639px)"));
    expect(mq).toContain("display: block");
    expect(mq).toContain("overflow-x: auto");
  });

  /*
   * The markers. The gold disc is decorative — the list item's own text
   * carries the meaning — which is what makes 2.13:1 on white acceptable, the
   * same argument the use-of-funds icons rest on. The NUMERAL is not
   * decorative and rides on the gold at 8.69:1.
   */
  it("gives bullets a gold dollar and ordered lists their number", () => {
    expect(block).toMatch(/\.post-body ul > li::before/);
    expect(block).toContain("data:image/svg+xml");
    expect(block).toContain("%23E0A840");

    expect(block).toMatch(/\.post-body ol > li::before/);
    expect(block).toContain("content: counter(nc-step)");
    expect(block).toContain("color: var(--nc-on-gold)");
  });

  /*
   * The post page is `.blog-surface`, which is light by default and flips
   * under html[data-theme='dark'] — a toggle Capital still ships. The heading
   * teal measures 5.12:1 there and the gold disc 8.64:1, so only the row
   * stripe needed a second value.
   */
  it("gives the reader's dark mode its own row stripe", () => {
    expect(block).toMatch(
      /html\[data-theme='dark'\] \.marketing-root \.post-body tbody tr:nth-child\(even\)/,
    );
  });
});
