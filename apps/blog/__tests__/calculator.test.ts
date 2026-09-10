import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * /calc — the page, rather than the arithmetic behind it.
 *
 * The maths is covered by funding-calc.test.ts. What is left here is the wiring
 * that fails silently: a coded route missing from the registry, a static route
 * that is not gated to the Capital deployment, a rewrite left in place that
 * races the page it was replaced by, and the disclaimer disappearing off a page
 * whose numbers are modelled rather than quoted.
 */

const ROOT = join(__dirname, '..');

async function render() {
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { LoanCalculator } = await import('../components/marketing/ft/loan-calculator');

  return renderToStaticMarkup(React.createElement(LoanCalculator));
}

describe('the /calc route', () => {
  it('is registered as a coded route, so it reaches the sitemap and the admin', async () => {
    const { codedRoutesFor, NNTM_CAPITAL_SLUG } = await import('@blog/core');
    const calc = codedRoutesFor(NNTM_CAPITAL_SLUG).find((route) => route.path === 'calc');

    /*
     * Silent by construction, like every other entry in that registry: the page
     * renders, the nav links to it, and it is simply absent from /sitemap.xml
     * and from the admin's Pages screen with nothing to say so.
     */
    expect(calc, 'calc missing from CODED_SITES').toBeTruthy();
    expect(calc?.index).toBe(true);
  });

  it('is gated on the Capital deployment, not served from every blog', () => {
    const route = readFileSync(join(ROOT, 'app', 'calc', 'page.tsx'), 'utf8');

    expect(route).toContain('isNntmCapital()');
    expect(route).toContain('notFound()');
  });

  /*
   * The rewrite this page replaced sent /calc to calc.nanotomcapital.com. Left
   * in place it would be a second answer for the same path — which of the two
   * wins is a detail of Next's routing order, and nobody should have to know it
   * to predict what the site serves.
   */
  it('has no rewrite left pointing at the old calculator deployment', () => {
    const config = readFileSync(join(ROOT, 'next.config.ts'), 'utf8');
    const code = config.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    expect(code).not.toContain('calc.nanotomcapital.com');
    expect(code).not.toContain('rewrites');
  });

  it('is where the nav, the homepage tile and the footer all point', async () => {
    const { NAV } = await import('../components/marketing/brand');
    const { HERO } = await import('../components/marketing/ft/content');
    const footer = readFileSync(join(ROOT, 'components', 'marketing', 'site-footer.tsx'), 'utf8');
    const code = footer.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

    expect(NAV.some((item) => item.href === '/calc')).toBe(true);
    expect(HERO.tiles.some((tile) => tile.href === '/calc')).toBe(true);
    expect(code).toContain('href="/calc"');
    // The old subdomain link, which the header never used and the footer did.
    expect(code).not.toContain('calc.nanotomcapital.com');
  });
});

describe('the /calc page', () => {
  it('renders its copy', async () => {
    const html = await render();
    const { CALCULATOR, REQUIREMENTS } = await import('../components/marketing/ft/content');

    expect(html).toContain(CALCULATOR.heading);
    expect(html).toContain(REQUIREMENTS.heading);
    for (const assurance of CALCULATOR.assurances) {
      expect(html, assurance).toContain(assurance);
    }
  });

  /*
   * The pricing in lib/funding-calc.ts is modelled, not Nanotom's rate card. A
   * page quoting payments a lender has not committed to has to say so on the
   * page, so this fails if the line is ever tidied away.
   */
  it('carries the disclaimer beside the figures', async () => {
    const html = await render();

    expect(html).toContain('not an offer of credit');
    expect(html).toContain('Nothing on this page is a commitment to lend');
  });

  it('offers every product, and an estimate for the default one', async () => {
    const html = await render();
    const { PRODUCTS } = await import('../lib/funding-calc');

    for (const product of PRODUCTS) {
      expect(html, product.name).toContain(product.name);
    }

    // The panel is populated on the first paint rather than waiting for input.
    expect(html).toContain('Estimated weekly payment');
    expect(html).toMatch(/\$[\d,]+/);
  });

  it('sends both conversion paths somewhere real', async () => {
    const html = await render();
    const { CONTACT, CTA_HREF } = await import('../components/marketing/brand');

    expect(html).toContain(`href="${CTA_HREF}"`);
    expect(html).toContain(CONTACT.phoneHref);
  });

  /*
   * The band above the footer already renders a Get Funded button on every page
   * but /get-funded. A second one in the page's own closing section stacks two
   * identical gold buttons, which reads as a bug rather than as emphasis.
   */
  it('leaves the closing Get Funded button to the footer band', () => {
    const page = readFileSync(
      join(ROOT, 'components', 'marketing', 'ft', 'loan-calculator.tsx'),
      'utf8',
    );

    expect(page).not.toContain('<CtaButton');
  });
});
