import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CODED_SITES, NNTM_CAPITAL_SLUG } from "@blog/core";

/**
 * /calculators/dscr-calculator.
 *
 * The page exists to be useful about a metric, not to sell a product — Denis
 * confirmed DSCR lending is being added and is not live. That distinction is
 * the thing worth guarding here, because it is invisible in a screenshot and
 * easy to erode one helpful-sounding sentence at a time.
 */

const marketing = join(__dirname, "..", "components", "marketing");
const read = (...parts: string[]) =>
  readFileSync(join(marketing, ...parts), "utf8");

const strip = (source: string) =>
  source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ");

describe("the DSCR page does not sell a DSCR loan", () => {
  const copy = strip(read("daylight", "dscr-content.ts"));
  const page = strip(read("daylight", "dscr-calculator.tsx"));

  /*
   * The thresholds on the page are what the market asks for, not what this
   * business asks for — it has no DSCR criteria, because it has no DSCR
   * product. The caveat saying so is on the page at body size. Same rule
   * lib/funding-calc.ts states for its illustrative pricing.
   */
  it("says the thresholds are not its own", () => {
    expect(copy).toContain("not Nanotom");
    expect(copy).toContain("we do not price DSCR loans today");
    // And it is rendered, not just written down.
    expect(page).toContain("DSCR.reading.caveat");
  });

  it("says plainly that the product is not live", () => {
    expect(copy).toContain("It is not live yet");
    expect(copy).toContain("there is nothing to apply for here");
  });

  /*
   * The CTA must not route a property investor into the business-funding
   * survey, which asks about trading history and revenue. A phone number and
   * the funding-solutions index are honest; /get-funded is not, until the
   * product exists.
   */
  it("does not point the CTA at the funding application", () => {
    const band = page.slice(page.indexOf("dscr-soon"));
    expect(band).not.toContain("/get-funded");
    expect(band).toContain("CONTACT.phoneHref");
  });
});

describe("the calculator embed", () => {
  const embed = strip(read("daylight", "calc-embed.tsx"));

  /*
   * `hide_bg` is the whole reason this is mounted by hand rather than by the
   * platform's own loader, which reads only `data-calc` and lists hide_bg among
   * the keys it strips. Lose this parameter and the calculator carries its own
   * background into a page that already has one.
   */
  it("asks for a transparent calculator", () => {
    expect(embed).toContain("hide_bg=true");
    expect(embed).toContain("embed=true");
  });

  /*
   * A third-party script that fails should leave a usable calculator behind.
   * The iframe has a floor; the resizer only ever makes it taller.
   */
  it("keeps a height floor if the resizer never loads", () => {
    expect(embed).toContain("minHeight");
  });

  /*
   * The platform's loader initialises iframe-resizer with `checkOrigin: false`,
   * which accepts resize messages from anywhere. Ours names the one origin it
   * expects.
   */
  it("does not accept resize messages from any origin", () => {
    expect(embed).not.toContain("checkOrigin: false");
    expect(embed).toContain("checkOrigin: [DSCR_EMBED.origin]");
  });
});

describe("the route is registered", () => {
  const entry = CODED_SITES[NNTM_CAPITAL_SLUG]?.find(
    (r) => r.path === "calculators/dscr-calculator",
  );

  it("appears in the coded-route registry", () => {
    expect(entry).toBeDefined();
  });

  /*
   * Indexable, unlike `daylight`: this is its own content rather than the
   * homepage at a second URL, and the page is honest about the product. The
   * route file must agree — it sets no robots override.
   */
  it("is indexable, and the page does not say otherwise", () => {
    expect(entry?.index).toBe(true);

    const route = readFileSync(
      join(__dirname, "..", "app", "calculators", "dscr-calculator", "page.tsx"),
      "utf8",
    );
    expect(strip(route)).not.toContain("noindex");
    expect(strip(route)).not.toContain("index: false");
  });

  it("is gated on the Capital slug like every other coded route", () => {
    const route = readFileSync(
      join(__dirname, "..", "app", "calculators", "dscr-calculator", "page.tsx"),
      "utf8",
    );
    expect(route).toContain("isNntmCapital()");
    expect(route).toContain("notFound()");
  });
});
