import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SiteRow } from '@blog/core';

/**
 * Guards the dangerouslySetInnerHTML boundary.
 *
 * The public renderer echoes posts.content_html with no read-time sanitisation,
 * so whatever savePost() stores is what executes in a reader's browser. These
 * tests assert on the row actually handed to the database, not on the input.
 */

const site = {
  id: 'site-1',
  slug: 'demo',
  base_url: 'https://demo.test',
  locale: 'en',
} as SiteRow;

/** Captures the row passed to .insert() / .update(). */
const captured: { insert?: Record<string, unknown>; update?: Record<string, unknown> } = {};

vi.mock('@/lib/current-site', () => ({
  requireCurrentSite: async () => site,
}));

vi.mock('@/lib/revalidate', () => ({
  revalidateSite: async () => ({ ok: true }),
}));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => {
      if (table === 'post_terms') {
        return {
          delete: () => ({ eq: async () => ({ error: null }) }),
          insert: async () => ({ error: null }),
        };
      }
      return {
        select: () => ({
          eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        }),
        insert: (row: Record<string, unknown>) => {
          captured.insert = row;
          return {
            select: () => ({ single: async () => ({ data: { id: 'new-post' }, error: null }) }),
          };
        },
      };
    },
  }),
}));

const { savePost } = await import('../app/actions/posts');

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

beforeEach(() => {
  delete captured.insert;
  delete captured.update;
});

describe('savePost — sanitisation on write', () => {
  it('strips a script tag before it reaches the database', async () => {
    await savePost({}, form({
      title: 'Hostile',
      content_html: '<p>fine</p><script>alert(1)</script>',
    }));

    const stored = captured.insert?.content_html as string;
    expect(stored).toBe('<p>fine</p>');
    expect(stored).not.toContain('script');
  });

  it('strips inline event handlers', async () => {
    await savePost({}, form({
      title: 'Hostile',
      content_html: '<p onclick="steal()">text</p>',
    }));

    expect(captured.insert?.content_html).toBe('<p>text</p>');
  });

  it('strips javascript: URLs', async () => {
    await savePost({}, form({
      title: 'Hostile',
      content_html: '<a href="javascript:alert(1)">click</a>',
    }));

    expect(captured.insert?.content_html as string).not.toContain('javascript:');
  });

  it('keeps legitimate formatting intact', async () => {
    await savePost({}, form({
      title: 'Normal',
      content_html: '<h2>Heading</h2><p>Some <strong>bold</strong> text.</p>',
    }));

    const stored = captured.insert?.content_html as string;
    expect(stored).toContain('<h2>Heading</h2>');
    expect(stored).toContain('<strong>bold</strong>');
  });
});

describe('savePost — derived fields', () => {
  it('derives a slug from the title when none is given', async () => {
    await savePost({}, form({ title: 'Hello There World', content_html: '<p>x</p>' }));
    expect(captured.insert?.slug).toBe('hello-there-world');
  });

  it('prefers an explicit slug, normalised', async () => {
    await savePost({}, form({
      title: 'Anything',
      slug: 'My Custom Slug',
      content_html: '<p>x</p>',
    }));
    expect(captured.insert?.slug).toBe('my-custom-slug');
  });

  it('generates an excerpt from the body when none is given', async () => {
    await savePost({}, form({
      title: 'T',
      content_html: '<p>The opening sentence of the post.</p>',
    }));
    expect(captured.insert?.excerpt).toContain('The opening sentence');
  });

  it('keeps an author-written excerpt', async () => {
    await savePost({}, form({
      title: 'T',
      excerpt: 'Hand written.',
      content_html: '<p>Body text here.</p>',
    }));
    expect(captured.insert?.excerpt).toBe('Hand written.');
  });

  it('computes reading time from the sanitised body', async () => {
    await savePost({}, form({
      title: 'T',
      content_html: `<p>${'word '.repeat(400)}</p>`,
    }));
    expect(captured.insert?.reading_minutes).toBe(2);
  });

  it('stamps published_at when created as published', async () => {
    await savePost({}, form({ title: 'T', status: 'published', content_html: '<p>x</p>' }));
    expect(captured.insert?.published_at).toBeTruthy();
  });

  it('leaves published_at null for a draft', async () => {
    await savePost({}, form({ title: 'T', status: 'draft', content_html: '<p>x</p>' }));
    expect(captured.insert?.published_at).toBeNull();
  });

  it('refuses an unknown status rather than storing it', async () => {
    await savePost({}, form({ title: 'T', status: 'nonsense', content_html: '<p>x</p>' }));
    expect(captured.insert?.status).toBe('draft');
  });

  it('rejects an empty title', async () => {
    const result = await savePost({}, form({ title: '   ', content_html: '<p>x</p>' }));
    expect(result.error).toBeTruthy();
    expect(captured.insert).toBeUndefined();
  });
});

describe('savePost — slug is one segment', () => {
  it('rejects a slug containing a slash instead of flattening it', async () => {
    // This silently produced "blog-test-post" from "/blog/test-post" and gave a
    // URL nobody asked for. Posts always live under /blog/, so a slash is a
    // mistake worth surfacing rather than absorbing.
    const result = await savePost({}, form({
      title: 'Test',
      slug: '/blog/test-post',
      content_html: '<p>x</p>',
    }));

    expect(result.error).toMatch(/single URL segment/i);
    expect(captured.insert).toBeUndefined();
  });

  it('rejects a full URL pasted into the slug', async () => {
    const result = await savePost({}, form({
      title: 'Test',
      slug: 'https://example.com/blog/test-post',
      content_html: '<p>x</p>',
    }));

    expect(result.error).toBeTruthy();
    expect(captured.insert).toBeUndefined();
  });

  it('still accepts an ordinary slug', async () => {
    await savePost({}, form({ title: 'Test', slug: 'my-post', content_html: '<p>x</p>' }));
    expect(captured.insert?.slug).toBe('my-post');
  });
});

describe('savePost — schema markup snippets', () => {
  /**
   * The panel names every snippet textarea `structured_data`, so what arrives
   * is repeated entries under one key. The `form()` helper above takes a plain
   * object and cannot express that, which is the whole shape under test.
   */
  function withSnippets(snippets: string[], fields: Record<string, string> = {}): FormData {
    const data = form({ title: 'T', content_html: '<p>x</p>', ...fields });
    for (const snippet of snippets) data.append('structured_data', snippet);
    return data;
  }

  it('stores nothing when the panel was never opened', async () => {
    await savePost({}, form({ title: 'T', content_html: '<p>x</p>' }));
    expect(captured.insert?.structured_data).toEqual([]);
  });

  it('stores snippets as parsed nodes, in the order they appear', async () => {
    // Order is the reason the textareas are the fields rather than a serialised
    // blob: getAll() returns them in document order, so the list a reader gets
    // is the list the author arranged.
    await savePost({}, withSnippets([
      '{"@type":"FAQPage","mainEntity":[]}',
      '{"@type":"Person","name":"Denis"}',
    ]));

    expect(captured.insert?.structured_data).toEqual([
      { '@type': 'FAQPage', mainEntity: [] },
      { '@type': 'Person', name: 'Denis' },
    ]);
  });

  it('drops an emptied textarea instead of failing the save', async () => {
    // Clearing the box is the obvious way to remove a snippet. Refusing the
    // save for it would teach authors to distrust the panel.
    await savePost({}, withSnippets(['{"@type":"Person"}', '   ', '']));

    expect(captured.insert?.structured_data).toEqual([{ '@type': 'Person' }]);
  });

  it('strips a pasted @context', async () => {
    await savePost({}, withSnippets(['{"@context":"https://schema.org","@type":"Person"}']));

    expect(captured.insert?.structured_data).toEqual([{ '@type': 'Person' }]);
  });

  it('refuses the whole save on a malformed snippet, writing nothing', async () => {
    /*
     * Not "save the good ones and drop the bad one": the author would see
     * "Saved", reload, and find their markup gone with no indication why. The
     * post body is also unwritten here, which is the point — a half-applied
     * save is worse than a rejected one.
     */
    const result = await savePost({}, withSnippets([
      '{"@type":"FAQPage"}',
      '{"@type":"Person",}',
    ]));

    expect(result.error).toMatch(/snippet 2/i);
    expect(result.error).toMatch(/not valid json/i);
    expect(captured.insert).toBeUndefined();
  });

  it('numbers the rejected snippet as the panel labels it', async () => {
    // Including blanks, so "snippet 3" is the third box on screen and not the
    // third non-empty one.
    const result = await savePost({}, withSnippets(['{"@type":"Person"}', '', 'nonsense']));

    expect(result.error).toMatch(/snippet 3/i);
  });

  it('rejects a node with no @type', async () => {
    const result = await savePost({}, withSnippets(['{"name":"anonymous"}']));

    expect(result.error).toMatch(/@type/);
    expect(captured.insert).toBeUndefined();
  });

  it('rejects a set that is over the page-weight budget', async () => {
    const fat = JSON.stringify({ '@type': 'Article', text: 'x'.repeat(10 * 1024) });
    const result = await savePost({}, withSnippets(Array.from({ length: 8 }, () => fat)));

    expect(result.error).toMatch(/64 KB/);
    expect(captured.insert).toBeUndefined();
  });

  it('keeps a </script> payload as data rather than rejecting it', async () => {
    // Legal JSON and legitimate content — an article about script tags. It is
    // the renderer's escaping that makes it safe, not a ban here.
    await savePost({}, withSnippets([
      '{"@type":"Article","headline":"Closing tags: </script>"}',
    ]));

    expect(captured.insert?.structured_data).toEqual([
      { '@type': 'Article', headline: 'Closing tags: </script>' },
    ]);
  });
});
