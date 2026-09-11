import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SidebarPanels } from '@/components/blog/sidebar-panels';

/**
 * What the sidebar actually renders, rather than what its source says.
 *
 * The accordion exists because the rail outgrew the viewport: the contents
 * list, being last, was pushed below the fold on ordinary laptop heights. The
 * property that fixes it is that at most one body is in the document at a
 * time — and that is a claim about output, which a source-text assertion
 * cannot make.
 *
 * createElement rather than JSX, and .ts rather than .tsx, for the reason
 * json-ld.test.ts gives: the blog's vitest project has no JSX transform.
 *
 * Static markup only, so this covers the state a reader is served and not what
 * happens when they click. There is no DOM and no testing-library here, and
 * adding both to assert a useState toggle would be testing React.
 */

const TOC = createElement('nav', { 'data-test': 'toc' }, 'contents list');
const OFFER = createElement('div', { 'data-test': 'offer' }, 'capture form');

function render(props: Partial<Parameters<typeof SidebarPanels>[0]> = {}) {
  return renderToStaticMarkup(
    createElement(SidebarPanels, {
      toc: TOC,
      offer: OFFER,
      offerTitle: 'Get the Equipment Financing Toolkit',
      ...props,
    }),
  );
}

describe('the sidebar as it is served', () => {
  it('shows both panel titles', () => {
    const html = render();

    expect(html).toContain('Table of Contents');
    expect(html).toContain('Get the Equipment Financing Toolkit');
  });

  /*
   * The headline is the whole of a collapsed panel, which is why it is the
   * panel's title rather than something the card draws inside its own body.
   * Were it inside, collapsing would take it with it and leave a nameless bar.
   */
  it('keeps the offer title visible independently of its body', () => {
    const html = render({ offer: null, offerTitle: null });
    expect(html).not.toContain('Get the Equipment Financing Toolkit');

    expect(render()).toContain('Get the Equipment Financing Toolkit');
  });

  it('opens the offer and leaves the contents list closed', () => {
    const html = render();

    expect(html).toContain('capture form');
    expect(html).not.toContain('contents list');
  });

  // The invariant the whole component exists for.
  it('never has both bodies in the document', () => {
    const html = render();
    const open = (html.match(/aria-expanded="true"/g) ?? []).length;

    expect(open).toBe(1);
  });

  it('marks the closed panel as collapsed rather than omitting the state', () => {
    // A header with no aria-expanded is announced as a plain button, and a
    // reader has no way to know there is anything behind it.
    expect(render()).toContain('aria-expanded="false"');
  });

  /*
   * On a post with no offer there is nothing for the contents list to be
   * yielding to, and a rail holding one closed strip helps nobody.
   */
  it('opens the contents list when there is no offer', () => {
    const html = render({ offer: null, offerTitle: null });

    expect(html).toContain('contents list');
    expect(html).toContain('aria-expanded="true"');
  });

  it('renders nothing but the container when a post has neither', () => {
    const html = render({ toc: null, offer: null, offerTitle: null });

    expect(html).not.toContain('<section');
    expect(html).not.toContain('aria-expanded');
  });

  it('drops the contents panel entirely on a post with no headings', () => {
    const html = render({ toc: null });

    expect(html).not.toContain('Table of Contents');
    expect(html).toContain('capture form');
  });

  /*
   * The title and the eye are one control. Two would be a second tab stop
   * announcing nothing the first does not already say, and the icon has no
   * accessible name of its own to announce it with.
   */
  it('puts the title and the icon inside a single button', () => {
    const html = render();
    const buttons = (html.match(/<button/g) ?? []).length;

    expect(buttons).toBe(2);
    expect(html).toMatch(/<button[^>]*aria-expanded="true"[\s\S]*?<svg[\s\S]*?<\/button>/);
  });

  it('hides the icon from assistive technology', () => {
    expect(render()).toContain('aria-hidden="true"');
  });
});
