import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { CODED_SITES, NNTM_CAPITAL_SLUG } from '@blog/core';

/**
 * Daylight — the light-theme homepage preview at /daylight.
 *
 * A parallel build of the Nanotom Capital homepage, living beside the dark one
 * so the two can be compared without the live page moving. Everything here
 * guards a property that is easy to break silently and expensive to break: the
 * compliance text, the noindex, and the dark site staying exactly as it was.
 */

const marketing = join(__dirname, '..', 'components', 'marketing');
const read = (...parts: string[]) => readFileSync(join(marketing, ...parts), 'utf8');

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
describe('the two footers state the same legal text', () => {
  function legalParagraphs(source: string): string[] {
    const withoutComments = source.replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ');

    return [...withoutComments.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
      .map(([, inner]) =>
        (inner ?? '')
          .replace(/<[^>]+>/g, '')
          // JSX expressions: {CONTACT.legalEntity}, {' '}, {'.'} and the like.
          .replace(/\{[^}]*\}/g, '')
          .replace(/\s+/g, ' ')
          .trim(),
      )
      // The long ones are the disclaimers; the short ones are addresses and
      // copyright lines, which carry a year and are allowed to differ.
      .filter((text) => text.length > 120);
  }

  const dark = legalParagraphs(read('site-footer.tsx'));
  const daylight = legalParagraphs(read('daylight', 'site-footer.tsx'));

  it('finds the disclaimers in the live footer', () => {
    expect(dark.length).toBeGreaterThanOrEqual(4);
  });

  it('carries every one of them, verbatim, into the light one', () => {
    expect(daylight).toEqual(dark);
  });

  it('still names the unaffiliated funding providers', () => {
    // The single most important sentence in the footer: it is the one that says
    // we are not the lender. Asserted by content, not only by parity, so a
    // change that drops it from BOTH footers fails here too.
    expect(daylight.join(' ')).toContain('network of unaffiliated');
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
describe('the preview route is kept out of the index', () => {
  const route = readFileSync(join(__dirname, '..', 'app', 'daylight', 'page.tsx'), 'utf8');

  it('sets robots noindex on the route', () => {
    expect(route).toMatch(/robots:\s*\{\s*index:\s*false/);
  });

  it('follows links out of it, so nothing downstream loses its referral', () => {
    expect(route).toMatch(/follow:\s*true/);
  });

  it('is registered, so it is visible in the admin rather than appearing absent', () => {
    const paths = CODED_SITES[NNTM_CAPITAL_SLUG]?.map((r) => r.path) ?? [];
    expect(paths).toContain('daylight');
  });

  it('is registered as NOT indexable, agreeing with the route', () => {
    const entry = CODED_SITES[NNTM_CAPITAL_SLUG]?.find((r) => r.path === 'daylight');
    expect(entry?.index).toBe(false);
  });

  it('is gated on the Capital slug like every other coded route', () => {
    expect(route).toContain('isNntmCapital()');
    expect(route).toContain('notFound()');
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
describe('the shared components only gained markers', () => {
  const css = readFileSync(join(__dirname, '..', 'app', 'globals.css'), 'utf8');

  it.each(['ft-avatar', 'nc-cta', 'ft-chip'])('%s is styled only under .dl-surface', (marker) => {
    const rules = [...css.matchAll(new RegExp(`([^{}]*\\.${marker}[^{}]*)\\{`, 'g'))].map(
      ([, selector]) => (selector ?? '').trim(),
    );

    expect(rules.length, `no rule anywhere styles .${marker}`).toBeGreaterThan(0);
    for (const selector of rules) {
      expect(selector, `.${marker} is styled outside .dl-surface`).toContain('.dl-surface');
    }
  });

  it('the CTA marker adds no colour of its own in the component', () => {
    // It must be in the shared `base` string, which carries layout only — the
    // gold and the white live in `styles`, and this marker must not join them.
    const cta = read('cta-button.tsx');
    expect(cta).toContain("'nc-cta inline-block");
  });
});
