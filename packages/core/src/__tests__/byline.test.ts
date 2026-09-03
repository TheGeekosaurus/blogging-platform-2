import { describe, expect, it } from 'vitest';

import { postAuthorName, socialLinks } from '../queries';
import { SOCIAL_PLATFORMS } from '../database.types';

/**
 * Five things render an author — the post sidebar, the post card, the JSON-LD,
 * the OG image and <dc:creator> in the feed — and all five go through
 * `postAuthorName`. That is the point of it: attaching a record to an imported
 * post, or clearing the text on one that has a record, must not leave a byline
 * showing in some places and blank in others.
 */
const record = (name: string) => ({
  id: 'a1',
  slug: 'a',
  name,
  title: null,
  bio: null,
  social: {},
  avatar: null,
});

describe('postAuthorName', () => {
  it('prefers the attached record over the free-text field', () => {
    expect(
      postAuthorName({ byline: record('Denis Beaulieu'), author_name: 'denis' }),
    ).toBe('Denis Beaulieu');
  });

  it('falls back to the text when no record is attached', () => {
    // This is the imported-post case, and the reason author_name still exists.
    expect(postAuthorName({ byline: null, author_name: 'denis' })).toBe('denis');
  });

  it('is null when neither is set, rather than an empty string', () => {
    // Every consumer branches on truthiness; '' would render an empty byline
    // separator instead of omitting the byline.
    expect(postAuthorName({ byline: null, author_name: null })).toBeNull();
  });

  it('still prefers the record when the text field is empty', () => {
    expect(postAuthorName({ byline: record('Denis'), author_name: null })).toBe('Denis');
  });
});

describe('socialLinks', () => {
  it('returns entries in a fixed platform order, not object key order', () => {
    const out = socialLinks({
      linkedin: 'https://linkedin.com/in/x',
      facebook: 'https://facebook.com/x',
    });
    expect(out.map((entry) => entry.platform)).toEqual(['facebook', 'linkedin']);
  });

  it('drops a platform that is absent, blank, or only whitespace', () => {
    expect(socialLinks({ facebook: '', instagram: '   ' })).toEqual([]);
  });

  /*
   * These values end up in an href. A stored `javascript:` URL is a scripting
   * vector, not a broken link — and the admin is not the only way a row can be
   * written, so the filter has to run at render time too.
   */
  it('drops anything that is not an http(s) URL', () => {
    const out = socialLinks({
      facebook: 'javascript:alert(1)',
      instagram: 'data:text/html,<script>x</script>',
      x: 'ftp://example.com',
      youtube: '/relative/path',
      linkedin: 'https://linkedin.com/in/ok',
    });
    expect(out).toEqual([{ platform: 'linkedin', url: 'https://linkedin.com/in/ok' }]);
  });

  it('accepts http as well as https', () => {
    expect(socialLinks({ x: 'http://x.com/y' })).toHaveLength(1);
  });

  it('handles a null or missing social column', () => {
    expect(socialLinks(null)).toEqual([]);
    expect(socialLinks(undefined)).toEqual([]);
    expect(socialLinks({})).toEqual([]);
  });

  it('covers every platform the admin form offers', () => {
    // If a platform is added to SOCIAL_PLATFORMS but the helper stops handling
    // it, the form would collect a value that never renders.
    const all = Object.fromEntries(
      SOCIAL_PLATFORMS.map((platform) => [platform, `https://example.com/${platform}`]),
    );
    expect(socialLinks(all)).toHaveLength(SOCIAL_PLATFORMS.length);
  });
});
