import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Analytics } from '@/components/analytics';

/**
 * Tracking is one GTM container per site, read from that site's row.
 *
 * What these guard is the regression that was live until now: the component was
 * mounted only when the deployment's slug was `nntm-capital`, so Nanotom Labs
 * and every database-driven blog had no tracking — and setting the old
 * NEXT_PUBLIC_GTM_ID on those projects did nothing, because the component that
 * read it was never rendered. Nothing errored. The container simply stayed
 * empty, which reads as a Tag Manager problem rather than a missing feature.
 *
 * Half of this is rendered and half is asserted against source. `<Script>`
 * emits nothing through renderToStaticMarkup — it hands the script to Next's
 * own loader, which needs a request context — so the inline snippet is not
 * observable here. The <noscript> iframe is plain JSX and is, and it carries
 * the same id, which makes it a faithful proxy for "was this container
 * emitted at all". The snippet itself is pinned by source assertions below.
 *
 * createElement rather than JSX, and .ts rather than .tsx, for the reason
 * json-ld.test.ts gives: the blog's vitest project has no JSX transform.
 */
const render = (containerId: string | null) =>
  renderToStaticMarkup(createElement(Analytics, { containerId }));

describe('what reaches the page', () => {
  it('loads the container the site row names', () => {
    expect(render('GTM-W5D5NV8X')).toContain(
      'https://www.googletagmanager.com/ns.html?id=GTM-W5D5NV8X',
    );
  });

  it('emits nothing at all for a site with no container', () => {
    // Not an empty <noscript>, not a tag pointing at an empty id — nothing. A
    // site without tracking should be indistinguishable from one built before
    // tracking existed.
    expect(render(null)).toBe('');
    expect(render('')).toBe('');
  });

  it('emits nothing for a container id that is not one', () => {
    // A GA4 measurement id is the likeliest wrong paste. Rendering it would
    // request a container that cannot exist, on every page.
    expect(render('G-ABC123')).toBe('');
  });

  it('normalises a retyped id rather than dropping it', () => {
    expect(render('gtm-w5d5nv8x')).toContain('id=GTM-W5D5NV8X');
  });

  /*
   * The row is public (0002_rls.sql) and writable from the admin and from SQL,
   * and the value lands inside an inline script. If validation is ever lifted
   * out of this component on the grounds that the admin already checks, this is
   * the test that should stop it.
   */
  it('refuses a value that would break out of the inline script', () => {
    expect(render("GTM-ABC123');alert(1);//")).toBe('');
    expect(render('GTM-ABC123</script><script>alert(1)</script>')).toBe('');
  });
});

const read = (...parts: string[]) => readFileSync(join(__dirname, '..', ...parts), 'utf8');

/**
 * Source with block comments stripped: both files explain the design they
 * replaced in prose, and naming NEXT_PUBLIC_GTM_ID to say it is gone must not
 * read as still using it.
 *
 * Block comments only — no `//` rule. A line-comment strip also eats the `//`
 * in every `https://`, which silently truncates the GTM snippet this file then
 * asserts against. That is not hypothetical: it is what the first version of
 * this helper did, and the assertion below caught it.
 */
const code = (...parts: string[]) =>
  read(...parts)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

describe('the inline snippet', () => {
  const source = code('components', 'analytics.tsx');

  it('interpolates the validated id, never the raw prop', () => {
    // The whole safety argument rests on this one substitution. Passing
    // `containerId` straight through would typecheck, render correctly for
    // every good value, and reintroduce the injection.
    expect(source).toContain("'${id}');");
    expect(source).not.toContain('${containerId}');
  });

  it('validates before it emits', () => {
    expect(source).toContain('readGtmContainerId(containerId)');
    expect(source).toContain('if (!id) return null;');
  });

  it('stays off the critical rendering path', () => {
    expect(source).toContain('strategy="afterInteractive"');
  });
});

describe('every site can have a container, not just Capital', () => {
  const layout = code('app', 'layout.tsx');

  it('mounts the tag on every deployment', () => {
    expect(layout).toContain('<Analytics containerId={site.gtm_container_id} />');
  });

  it('does not gate the tag on a slug', () => {
    // The gate this replaced. `marketing` and `labs` still exist and still
    // choose the chrome — what they must no longer decide is whether a site is
    // allowed to be measured.
    expect(layout).not.toMatch(/(marketing|labs|coded)[^\n]*\?[^\n]*<Analytics/);
    expect(layout).not.toMatch(/<Analytics[^\n]*:\s*null/);
  });
});

/*
 * The environment variable is gone, and staying gone.
 *
 * It was never per-site in any useful way: `NEXT_PUBLIC_` values are inlined at
 * build time, so changing a container meant a redeploy, and the variable only
 * had an effect on one of the three kinds of site. Reintroducing it as a
 * fallback would recreate the exact ambiguity that made the old `analytics_id`
 * field a trap — two places to set one value, and no way to tell from either
 * which one the site is using.
 */
describe('there is one place a container id lives', () => {
  it('is not read from the environment anywhere in the blog', () => {
    const files = [
      ['components', 'analytics.tsx'],
      ['app', 'layout.tsx'],
    ];

    for (const parts of files) {
      expect(code(...parts), parts.join('/')).not.toContain('NEXT_PUBLIC_GTM_ID');
    }
  });

  it('is not the dead analytics_id column', () => {
    // Dropped in 0012. It was saved by the admin and read by nothing, so
    // filling it in produced no tracking and no error.
    expect(code('components', 'analytics.tsx')).not.toContain('analytics_id');
    expect(code('app', 'layout.tsx')).not.toContain('analytics_id');
  });
});
