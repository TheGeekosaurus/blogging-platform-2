import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { CtaBlockView } from '@blog/core';

import { PostBody } from '@/components/blog/post-body';

/**
 * The body is no longer one blob of HTML, and the ways that can go wrong are
 * all invisible: a missing block leaves a hole, a stray wrapper swallows the
 * article's spacing, and the order of the pieces is the order of the argument
 * the post is making.
 *
 * Static markup only — there is no DOM here, so this covers what a reader is
 * served, which for a link block is everything.
 */

const block = (over: Partial<CtaBlockView> = {}): CtaBlockView => ({
  slug: 'calc',
  kind: 'link',
  layout: 'banner',
  theme: 'surface',
  accentBorder: false,
  eyebrow: null,
  heading: 'Compare your blended rate',
  body: null,
  buttonLabel: 'Open the calculator',
  href: '/calculators/dscr-calculator',
  consentText: null,
  collectName: false,
  successMessage: 'Check your inbox.',
  image: null,
  ...over,
});

const render = (html: string, blocks: Array<[string, CtaBlockView]> = [['calc', block()]]) =>
  renderToStaticMarkup(createElement(PostBody, { html, blocks: new Map(blocks) }));

describe('PostBody', () => {
  it('renders a block where the marker was, between the prose', () => {
    const out = render('<p>Before</p><div data-cta="calc"></div><p>After</p>');

    expect(out).toContain('Before');
    expect(out).toContain('Open the calculator');
    expect(out).toContain('After');
    // The argument's order is the page's order.
    expect(out.indexOf('Before')).toBeLessThan(out.indexOf('Open the calculator'));
    expect(out.indexOf('Open the calculator')).toBeLessThan(out.indexOf('After'));
  });

  it('renders NOTHING for a marker whose block is gone', () => {
    /*
     * The case that matters most. A retired or renamed offer leaves markers
     * behind in published posts, and a reader who never knew it existed must
     * not be shown a hole, a placeholder or an error — just the article.
     */
    const out = render('<p>Before</p><div data-cta="deleted"></div><p>After</p>', []);

    expect(out).toContain('Before');
    expect(out).toContain('After');
    expect(out).not.toContain('cta-block');
  });

  it('does not wrap prose in a box that would steal its layout', () => {
    /*
     * `.post-body > *` carries the vertical rhythm and the reading measure, so
     * a real div around each run of HTML would hand both to the wrapper and
     * leave the paragraphs inside it unspaced and full width. `display:
     * contents` is what keeps the paragraphs as the children.
     */
    const out = render('<p>Prose</p><div data-cta="calc"></div>');
    expect(out).toContain('display:contents');
  });

  it('still renders a body with no blocks at all', () => {
    const out = render('<p>Just prose</p>', []);
    expect(out).toContain('Just prose');
    expect(out).toContain('class="post-body"');
  });

  it('renders an email block as a form rather than a link', () => {
    const out = render('<div data-cta="calc"></div>', [
      ['calc', block({ kind: 'email', href: null, buttonLabel: 'Send it to me' })],
    ]);
    expect(out).toContain('<form');
    expect(out).toContain('type="email"');
    expect(out).not.toContain('href="/calculators/dscr-calculator"');
  });
});
