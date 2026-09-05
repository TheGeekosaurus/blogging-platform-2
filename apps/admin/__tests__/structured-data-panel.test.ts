import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { AUTO_POST_SCHEMAS, SCHEMA_TEMPLATES } from '@blog/core';

import {
  StructuredDataPanel,
  type StructuredDataVariant,
} from '@/components/editor/structured-data-panel';

/**
 * The schema markup panel, server-rendered.
 *
 * What matters here is the wiring, not the clicking. The panel has no hidden
 * inputs: the TEXTAREAS are the form fields, each named `structured_data`, and
 * the action reads them with getAll() under that exact name. Nothing else in
 * the codebase would notice if that name were changed or dropped — the save
 * would simply start storing an empty list, on every post, silently.
 *
 * Interaction (clicking + Add, editing, Remove) is not covered: this repo has
 * no DOM test environment, and adding one for this component alone is a bigger
 * change than the component. The behaviour behind those clicks — what a
 * template produces and how it validates — is tested in @blog/core instead.
 */

const render = (variant: StructuredDataVariant, defaultSnippets: string[] = []) =>
  renderToStaticMarkup(createElement(StructuredDataPanel, { variant, defaultSnippets }));

const textareaNames = (html: string) =>
  [...html.matchAll(/<textarea[^>]*\bname="([^"]*)"/g)].map(([, name]) => name);

describe('StructuredDataPanel — the field wiring', () => {
  it('names every snippet textarea what the action reads', () => {
    const html = render('post', ['{"@type":"FAQPage"}', '{"@type":"Person"}']);

    // readStructuredData does formData.getAll('structured_data'). Both boxes
    // must answer to that one name or the second silently stops saving.
    expect(textareaNames(html)).toEqual(['structured_data', 'structured_data']);
  });

  it('uses no hidden inputs', () => {
    /*
     * Deliberate, and the reason removal cannot desync: there is no mirrored
     * copy of the list to keep in step with the textareas. If a hidden field
     * ever appears here, the "remove a snippet" path needs re-examining.
     */
    expect(render('post', ['{"@type":"Person"}'])).not.toContain('type="hidden"');
  });

  it('renders the stored snippets as their editable text', () => {
    const html = render('site', ['{\n  "@type": "Organization"\n}']);

    expect(html).toContain('&quot;@type&quot;: &quot;Organization&quot;');
  });

  it('renders no textarea when there is nothing stored', () => {
    expect(textareaNames(render('page'))).toEqual([]);
  });

  it('offers every template in the menu', () => {
    const html = render('post');

    for (const template of SCHEMA_TEMPLATES) {
      expect(html).toContain(`value="${template.id}"`);
      expect(html).toContain(template.label);
    }
  });
});

describe('StructuredDataPanel — what it tells the author', () => {
  it('lists the generated schema on a post, so it is not added twice', () => {
    const html = render('post');

    for (const auto of AUTO_POST_SCHEMAS) {
      expect(html).toContain(auto.type);
    }
    expect(html).toMatch(/no need to add these/i);
  });

  it('does not claim anything is automatic on a page', () => {
    // Pages genuinely get none, and saying otherwise would stop an author
    // adding the markup their page actually needs.
    const html = render('page');

    expect(html).not.toMatch(/no need to add these/i);
    expect(html).not.toContain('BreadcrumbList');
    expect(html).toMatch(/Pages get none automatically/i);
  });

  it('says site markup applies everywhere', () => {
    expect(render('site')).toMatch(/every page/i);
  });

  it('shows the count so a collapsed panel is not a hiding place', () => {
    expect(render('post', ['{"@type":"Person"}', '{"@type":"Thing"}'])).toContain(
      'Schema markup (2)',
    );
    expect(render('post')).not.toContain('Schema markup (');
  });

  it('labels a card by its type and flags a broken one', () => {
    const html = render('post', ['{"@type":"FAQPage"}', '{"@type":"Person",}']);

    expect(html).toContain('Valid JSON-LD');
    expect(html).toMatch(/Not valid JSON/);
  });

  it('treats a blank card as a pending deletion, not an error', () => {
    const html = render('post', ['   ']);

    expect(html).toMatch(/dropped when you save/i);
    expect(html).not.toMatch(/Not valid JSON/);
  });
});
