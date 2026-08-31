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
