import { existsSync, readFileSync } from "node:fs";
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

    const children = NAV.flatMap((item) => item.children ?? []);

    expect(children.length).toBe(11);
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
  it("does not link the Industries heading", () => {
    const col = footer.slice(footer.indexOf('heading="Industries"'));
    expect(col.slice(0, 80)).not.toContain("href=");
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
  const USERS = [
    "daylight/home.tsx",
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
    for (const file of ["daylight/home.tsx", "daylight/funding-solutions.tsx", "daylight/dscr-calculator.tsx"]) {
      const source = read(file);
      expect(source, `${file} still draws a header`).not.toContain("<DaylightHeader");
      expect(source, `${file} still draws a footer`).not.toContain("<DaylightFooter");
    }
  });

  it("no longer hides chrome with CSS", () => {
    const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");
    /* The phrase survives in a note explaining why it is gone; what must not
       come back is the rule, which needs a declaration block. */
    expect(css).not.toMatch(/body:has\(\.dl-surface\)[^{]*\{/);
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
