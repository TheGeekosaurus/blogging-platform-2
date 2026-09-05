import { describe, expect, it } from 'vitest';

import {
  AUTO_POST_SCHEMAS,
  MAX_SNIPPETS,
  MAX_SNIPPET_BYTES,
  SCHEMA_TEMPLATES,
  buildPostSchemas,
  checkSnippetBudget,
  parseSnippet,
  readSnippets,
  serializeJsonLd,
  snippetLabel,
} from '../structured-data';
import { pageUrl, postPath } from '../urls';
import type { SiteRow } from '../database.types';

const site = {
  name: 'Nanotom Capital',
  base_url: 'https://nanotom.test',
  locale: 'en',
  logo_url: null,
} as unknown as SiteRow;

const post = {
  slug: 'why-this-blog-is-fast',
  title: 'Why this blog is fast',
  seo_title: null,
  published_at: '2026-01-05T12:00:00.000Z',
  updated_at: '2026-02-01T09:30:00.000Z',
  reading_minutes: 7,
};

describe('parseSnippet', () => {
  it('accepts a node and reports its type', () => {
    const result = parseSnippet('{"@type":"FAQPage","mainEntity":[]}');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.label).toBe('FAQPage');
    expect(result.node).toEqual({ '@type': 'FAQPage', mainEntity: [] });
  });

  it('strips a pasted @context rather than rejecting it', () => {
    // Google's own examples include it, so pasting one is the normal case —
    // and the renderer adds its own, which would then be a duplicate key.
    const result = parseSnippet('{"@context":"https://schema.org","@type":"Person","name":"D"}');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.node).toEqual({ '@type': 'Person', name: 'D' });
    expect(result.node).not.toHaveProperty('@context');
  });

  it('keeps a node typed with several types', () => {
    const result = parseSnippet('{"@type":["Product","Book"]}');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Not truncated to the first: a node claiming both claims both.
    expect(result.label).toBe('Product + Book');
  });

  it('rejects malformed JSON, quoting the parser', () => {
    const result = parseSnippet('{"@type":"FAQPage",}');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('Not valid JSON');
  });

  it('rejects an array with an actionable message', () => {
    const result = parseSnippet('[{"@type":"Person"},{"@type":"Person"}]');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    // Says what to do about it, not just that it is wrong.
    expect(result.error).toContain('separate snippets');
  });

  it('rejects a bare value', () => {
    expect(parseSnippet('"FAQPage"').ok).toBe(false);
    expect(parseSnippet('42').ok).toBe(false);
    expect(parseSnippet('null').ok).toBe(false);
  });

  it('rejects a node with no @type', () => {
    const result = parseSnippet('{"name":"No type here"}');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('@type');
  });

  it('rejects an empty snippet', () => {
    expect(parseSnippet('   \n  ').ok).toBe(false);
  });

  it('rejects a snippet over the per-snippet ceiling', () => {
    const huge = JSON.stringify({ '@type': 'Article', text: 'x'.repeat(MAX_SNIPPET_BYTES) });
    const result = parseSnippet(huge);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain('16 KB');
  });

  it('measures the ceiling in bytes, not characters', () => {
    // A multi-byte character costs what it costs on the wire. Counting
    // characters would let a snippet through at three times the budget.
    const wide = JSON.stringify({ '@type': 'Article', text: 'é'.repeat(MAX_SNIPPET_BYTES) });

    expect(wide.length).toBeLessThan(MAX_SNIPPET_BYTES * 2);
    expect(parseSnippet(wide).ok).toBe(false);
  });
});

describe('checkSnippetBudget', () => {
  it('passes a normal set', () => {
    expect(checkSnippetBudget([{ '@type': 'FAQPage' }])).toBeNull();
  });

  it('catches too many snippets', () => {
    const many = Array.from({ length: MAX_SNIPPETS + 1 }, () => ({ '@type': 'Thing' }));
    expect(checkSnippetBudget(many)).toContain(String(MAX_SNIPPETS));
  });

  it('catches a set that is individually fine and collectively too big', () => {
    // The case a per-snippet limit cannot see: every node legal, the page
    // ruined. 8 x 10KB is under the 16KB snippet cap and over the 64KB total.
    const nodes = Array.from({ length: 8 }, () => ({
      '@type': 'Article',
      text: 'x'.repeat(10 * 1024),
    }));

    expect(nodes.every((node) => parseSnippet(JSON.stringify(node)).ok)).toBe(true);
    expect(checkSnippetBudget(nodes)).toContain('64 KB');
  });
});

describe('readSnippets', () => {
  it('returns an empty list for anything that is not an array', () => {
    expect(readSnippets(null)).toEqual([]);
    expect(readSnippets(undefined)).toEqual([]);
    expect(readSnippets({})).toEqual([]);
    expect(readSnippets('[]')).toEqual([]);
  });

  it('drops elements that are not objects', () => {
    /*
     * The database only guarantees an array. A row can arrive from an import or
     * a SQL editor, and this value is written into a <script> tag — so junk is
     * dropped rather than trusted or thrown over.
     */
    const stored = [{ '@type': 'FAQPage' }, 'not a node', null, 42, ['nested'], { '@type': 'Person' }];

    expect(readSnippets(stored)).toEqual([{ '@type': 'FAQPage' }, { '@type': 'Person' }]);
  });

  it('strips a stored @context', () => {
    expect(readSnippets([{ '@context': 'https://example.com', '@type': 'Person' }])).toEqual([
      { '@type': 'Person' },
    ]);
  });

  it('caps a runaway stored array', () => {
    const many = Array.from({ length: MAX_SNIPPETS + 5 }, () => ({ '@type': 'Thing' }));
    expect(readSnippets(many)).toHaveLength(MAX_SNIPPETS);
  });
});

describe('serializeJsonLd', () => {
  it('adds the context and stays parseable', () => {
    const parsed = JSON.parse(serializeJsonLd({ '@type': 'Person', name: 'D' }));

    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('Person');
  });

  it('cannot be broken out of with a closing script tag', () => {
    /*
     * The whole reason this function exists. Without the escape, the `</script>`
     * inside the title closes the tag and the rest of the JSON is parsed as
     * markup — with an author-supplied payload after it.
     */
    const hostile = { '@type': 'Article', headline: 'Break </script><img src=x onerror=alert(1)>' };
    const output = serializeJsonLd(hostile);

    expect(output).not.toContain('</script>');
    expect(output).not.toContain('<img');
    expect(output).toContain('\\u003c');

    // Escaped for the page, identical once parsed.
    expect(JSON.parse(output).headline).toBe(hostile.headline);
  });

  it('escapes the line separators that are legal in JSON and not in JS', () => {
    // Written as escapes, not literals: these two characters are invisible in
    // every editor, and a test whose subject can be deleted by accident is a
    // test that quietly stops testing.
    const headline = `a\u2028b\u2029c`;
    const output = serializeJsonLd({ '@type': 'Article', headline });

    expect(output).not.toContain('\u2028');
    expect(output).not.toContain('\u2029');
    expect(JSON.parse(output).headline).toBe(headline);
  });

  it('escapes ampersands without changing the value', () => {
    const output = serializeJsonLd({ '@type': 'Article', headline: 'Kirk &amp; Sons' });

    expect(output).not.toContain('&');
    expect(JSON.parse(output).headline).toBe('Kirk &amp; Sons');
  });
});

describe('buildPostSchemas', () => {
  const [article, breadcrumb] = buildPostSchemas({
    site,
    post,
    author: 'Denis Beaulieu',
    description: 'A short description.',
  });

  it('emits a BlogPosting and a BreadcrumbList, in that order', () => {
    expect(article!['@type']).toBe('BlogPosting');
    expect(breadcrumb!['@type']).toBe('BreadcrumbList');
  });

  it('gives the post the SAME url as its canonical and its last breadcrumb', () => {
    /*
     * The bug this replaces: the url was built as pageUrl(site, `/${slug}`),
     * so a post had THREE urls — this one, the canonical tag, and the final
     * breadcrumb item — and `/<slug>/` belongs to the page catch-all route, so
     * it resolved to another page or to a 404.
     */
    const canonical = pageUrl(site, postPath(post.slug));
    const trail = breadcrumb!.itemListElement as Array<{ item: string }>;

    expect(article!.url).toBe(canonical);
    expect((article!.mainEntityOfPage as { '@id': string })['@id']).toBe(canonical);
    expect(trail.at(-1)!.item).toBe(canonical);
    expect(canonical).toBe('https://nanotom.test/blog/why-this-blog-is-fast/');
  });

  it('omits the image and the logo when there is neither', () => {
    expect(article).not.toHaveProperty('image');
    expect(article!.publisher).not.toHaveProperty('logo');
  });

  it('carries the featured image and the publisher logo when they exist', () => {
    const [withMedia] = buildPostSchemas({
      site: { ...site, logo_url: 'https://cdn.test/logo.png' },
      post,
      author: null,
      description: 'x',
      imageUrl: 'https://cdn.test/hero.jpg',
    });

    expect(withMedia!.image).toBe('https://cdn.test/hero.jpg');
    expect(withMedia!.publisher).toMatchObject({
      logo: { '@type': 'ImageObject', url: 'https://cdn.test/logo.png' },
    });
  });

  it('absolutises a site-relative logo path', () => {
    const [withMedia] = buildPostSchemas({
      site: { ...site, logo_url: '/logo.png' },
      post,
      author: null,
      description: 'x',
    });

    expect(withMedia!.publisher).toMatchObject({
      logo: { url: 'https://nanotom.test/logo.png' },
    });
  });

  it('drops the author entirely rather than emitting an empty one', () => {
    const [anonymous] = buildPostSchemas({ site, post, author: null, description: 'x' });
    expect(anonymous).not.toHaveProperty('author');
  });

  it('adds the category rung to the trail when there is one', () => {
    const [, withCategory] = buildPostSchemas({
      site,
      post,
      author: null,
      description: 'x',
      category: { slug: 'funding', name: 'Funding' },
    });

    const names = (withCategory!.itemListElement as Array<{ name: string }>).map((i) => i.name);
    expect(names).toEqual(['Nanotom Capital', 'Blog', 'Funding', 'Why this blog is fast']);
  });

  it('numbers the trail from 1 with no gaps', () => {
    const positions = (breadcrumb!.itemListElement as Array<{ position: number }>).map(
      (i) => i.position,
    );
    expect(positions).toEqual([1, 2, 3]);
  });
});

describe('what the editor promises', () => {
  it('describes every type the blog actually generates', () => {
    /*
     * The panel tells an author these are handled, and the author acts on that
     * by NOT adding the snippet themselves. A promise about schema that is no
     * longer emitted is worse than no promise at all, so the list is held
     * against the builder rather than maintained from memory.
     */
    const emitted = buildPostSchemas({ site, post, author: null, description: 'x' }).map((node) =>
      snippetLabel(node),
    );

    expect(emitted.length).toBeGreaterThan(0);
    for (const type of emitted) {
      expect(AUTO_POST_SCHEMAS.map((auto) => auto.type)).toContain(type);
    }
    // And nothing in the list that is not emitted.
    for (const auto of AUTO_POST_SCHEMAS) {
      expect(emitted).toContain(auto.type);
    }
  });
});

describe('SCHEMA_TEMPLATES', () => {
  it('offers a starting point and an escape hatch', () => {
    expect(SCHEMA_TEMPLATES.length).toBeGreaterThan(5);
    expect(SCHEMA_TEMPLATES.map((t) => t.id)).toContain('custom');
  });

  it.each(SCHEMA_TEMPLATES)('$id is valid the moment it is added', (template) => {
    // A template that fails its own validator would open the card on a red
    // error, which reads as the panel being broken rather than unfinished.
    const result = parseSnippet(template.json);

    expect(result.ok, `${template.id}: ${result.ok ? '' : result.error}`).toBe(true);
  });

  it('carries no @context of its own', () => {
    for (const template of SCHEMA_TEMPLATES) {
      expect(template.json).not.toContain('@context');
    }
  });

  it('has unique ids', () => {
    const ids = SCHEMA_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
