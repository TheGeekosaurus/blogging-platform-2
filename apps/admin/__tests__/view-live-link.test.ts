import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ViewLiveLink } from '@/components/view-live-link';

const read = (...parts: string[]) => readFileSync(join(__dirname, '..', ...parts), 'utf8');

const render = (props: { href: string; label: string; className?: string }) =>
  renderToStaticMarkup(createElement(ViewLiveLink, props));

describe('ViewLiveLink', () => {
  const html = render({ href: 'https://example.com/blog/a-post/', label: 'A post' });

  it('opens in a new tab without handing over window.opener', () => {
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it('has an accessible name that identifies the row', () => {
    /*
     * An <a> containing only an SVG announces as "link" and nothing else, so a
     * list of twenty of these would be twenty identical links. The label names
     * the row; `title` gives sighted users the same thing on hover.
     */
    expect(html).toContain('Open A post on the live site');
    expect(html).toContain('title="Open A post on the live site"');
    expect(html).toContain('class="sr-only"');
  });

  it('hides the icon itself from assistive tech', () => {
    // Otherwise it is announced twice — once as the label, once as graphics.
    expect(html).toContain('aria-hidden="true"');
  });

  it('lets the caller own positioning', () => {
    // Baking in ml-auto put two auto margins in the Posts row, which splits the
    // free space instead of pushing.
    expect(render({ href: '#', label: 'x' })).not.toContain('ml-auto');
    expect(render({ href: '#', label: 'x', className: 'ml-auto' })).toContain('ml-auto');
  });
});

describe('the lists only link to what is actually served', () => {
  it.each([
    ['posts', ['app', '(dashboard)', 'posts', 'page.tsx']],
    ['pages', ['app', '(dashboard)', 'pages', 'page.tsx']],
    ['links', ['app', '(dashboard)', 'links', 'page.tsx']],
  ])('%s gates the icon on isLive', (_label, parts) => {
    /*
     * The whole point of the gate. A draft, a scheduled row, or one dated in
     * the future all 404 on the blog — an icon leading there leaves the author
     * unable to tell whether the link or their content is broken.
     */
    const source = read(...parts);
    expect(source).toContain('isLive(');
    expect(source).toMatch(/isLive\([a-z]+\) \? \(/);
  });

  it('pages offers one affordance, not two', () => {
    // The coded-routes section had its own text link; a screen showing two
    // different controls for one action reads as two actions.
    const source = read('app', '(dashboard)', 'pages', 'page.tsx');
    expect(source).not.toContain('View live ↗');
  });

  it('builds both URLs from the site, never by hand', () => {
    expect(read('app', '(dashboard)', 'posts', 'page.tsx')).toContain(
      'pageUrl(site, postPath(post.slug))',
    );
    expect(read('app', '(dashboard)', 'pages', 'page.tsx')).toContain(
      'pageUrl(site, pagePath(page.path))',
    );
  });

  it('selects the column the gate needs', () => {
    // listPages did not select published_at, so isLive() could only ever have
    // seen half the rule.
    expect(read('lib', 'queries.ts')).toContain(
      "'id, slug, path, title, parent_id, template, status, published_at, updated_at'",
    );
  });

  it('the link graph selects it too, for the same gate and for link status', () => {
    /*
     * loadLinkGraph feeds isLive() twice over: once for this icon, and once to
     * decide whether an internal link points at something a visitor can
     * actually reach. Without published_at both halves silently degrade to
     * "status says published, so it must be live".
     */
    const source = read('lib', 'link-graph.ts');
    expect(source).toContain('id, title, slug, status, published_at, content_html');
    expect(source).toContain('id, title, path, status, published_at, content_html');
  });
});
