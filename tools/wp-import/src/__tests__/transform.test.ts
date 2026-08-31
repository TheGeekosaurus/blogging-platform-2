import { describe, expect, it } from 'vitest';

import {
  rewriteInternalUrls,
  splitMoreTag,
  stripGutenbergComments,
  stripShortcodes,
  transformWordPressContent,
  unwrapCaptionShortcode,
  wpautop,
} from '../transform';

describe('stripGutenbergComments', () => {
  it('removes opening and closing block delimiters but keeps the content', () => {
    const input = '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->';
    expect(stripGutenbergComments(input)).toBe('<p>Hello</p>');
  });

  it('removes self-closing blocks with JSON attributes', () => {
    const input = '<!-- wp:spacer {"height":20} /--><p>After</p>';
    expect(stripGutenbergComments(input)).toBe('<p>After</p>');
  });

  it('removes blocks whose attributes span multiple lines', () => {
    const input = '<!-- wp:image {\n"id":12,\n"sizeSlug":"large"\n} --><figure></figure>';
    expect(stripGutenbergComments(input)).toBe('<figure></figure>');
  });

  it('leaves non-WordPress comments alone', () => {
    const input = '<!-- a normal note --><p>x</p>';
    expect(stripGutenbergComments(input)).toBe(input);
  });
});

describe('splitMoreTag', () => {
  it('splits on a bare more tag', () => {
    const result = splitMoreTag('<p>Teaser</p><!--more--><p>Rest</p>');
    expect(result.found).toBe(true);
    expect(result.before).toBe('<p>Teaser</p>');
    expect(result.after).toBe('<p>Rest</p>');
  });

  it('splits on a labelled more tag', () => {
    const result = splitMoreTag('<p>Teaser</p><!--more Keep reading--><p>Rest</p>');
    expect(result.found).toBe(true);
    expect(result.before).toBe('<p>Teaser</p>');
    expect(result.after).toBe('<p>Rest</p>');
  });

  it('reports not found when absent', () => {
    const result = splitMoreTag('<p>All of it</p>');
    expect(result.found).toBe(false);
    expect(result.before).toBe('<p>All of it</p>');
    expect(result.after).toBe('');
  });
});

describe('unwrapCaptionShortcode', () => {
  it('converts a caption into figure/figcaption', () => {
    const input =
      '[caption id="attachment_1" align="alignnone" width="300"]' +
      '<img src="https://old.test/a.png" alt="A" /> A photo of a thing[/caption]';
    const out = unwrapCaptionShortcode(input);

    expect(out).toBe(
      '<figure><img src="https://old.test/a.png" alt="A" />' +
        '<figcaption>A photo of a thing</figcaption></figure>',
    );
  });

  it('handles an image wrapped in a link', () => {
    const input =
      '[caption width="300"]<a href="https://old.test/full.png">' +
      '<img src="https://old.test/thumb.png" /></a> Linked caption[/caption]';
    const out = unwrapCaptionShortcode(input);

    expect(out).toContain('<figure><a href="https://old.test/full.png">');
    expect(out).toContain('<figcaption>Linked caption</figcaption>');
  });

  it('omits figcaption when there is no caption text', () => {
    const input = '[caption width="300"]<img src="https://old.test/a.png" />[/caption]';
    expect(unwrapCaptionShortcode(input)).toBe(
      '<figure><img src="https://old.test/a.png" /></figure>',
    );
  });

  it('converts several captions in one document', () => {
    const input =
      '[caption]<img src="/a.png" /> One[/caption]<p>mid</p>[caption]<img src="/b.png" /> Two[/caption]';
    const out = unwrapCaptionShortcode(input);
    expect(out.match(/<figure>/g)).toHaveLength(2);
    expect(out).toContain('<p>mid</p>');
  });
});

describe('stripShortcodes', () => {
  it('removes a paired shortcode and reports its name', () => {
    const { html, dropped } = stripShortcodes('<p>a</p>[gallery ids="1,2"]inner[/gallery]<p>b</p>');
    expect(html).toBe('<p>a</p><p>b</p>');
    expect(dropped).toContain('gallery');
  });

  it('removes a self-closing shortcode', () => {
    const { html, dropped } = stripShortcodes('<p>a</p>[gallery ids="1,2"]');
    expect(html).toBe('<p>a</p>');
    expect(dropped).toContain('gallery');
  });

  it('keeps the URL from an [embed] shortcode as a link', () => {
    const { html, dropped } = stripShortcodes('[embed]https://youtu.be/abc[/embed]');
    expect(html).toContain('href="https://youtu.be/abc"');
    expect(dropped).toContain('embed');
  });

  it('does not treat bracketed numbers as shortcodes', () => {
    // Footnote markers must survive — a name has to start with a letter.
    const { html, dropped } = stripShortcodes('<p>See note [1] and [2].</p>');
    expect(html).toBe('<p>See note [1] and [2].</p>');
    expect(dropped).toHaveLength(0);
  });

  it('reports each distinct shortcode once', () => {
    const { dropped } = stripShortcodes('[foo][foo][bar]');
    expect(dropped.sort()).toEqual(['bar', 'foo']);
  });
});

describe('wpautop', () => {
  it('wraps bare-newline classic content in paragraphs', () => {
    const input = 'First paragraph.\n\nSecond paragraph.';
    expect(wpautop(input)).toBe('<p>First paragraph.</p>\n<p>Second paragraph.</p>');
  });

  it('converts single newlines inside a paragraph to line breaks', () => {
    expect(wpautop('line one\nline two')).toBe('<p>line one<br />line two</p>');
  });

  it('leaves content that already has block markup untouched', () => {
    const input = '<p>Already wrapped.</p>\n\n<p>And again.</p>';
    expect(wpautop(input)).toBe(input);
  });

  it('does not double-wrap Gutenberg output', () => {
    const input = '<h2>Heading</h2>\n\n<p>Body</p>';
    expect(wpautop(input)).toBe(input);
  });

  it('returns an empty string for whitespace-only input', () => {
    expect(wpautop('   \n  ')).toBe('');
  });

  it('wraps content whose only tags are inline', () => {
    expect(wpautop('some <strong>bold</strong> text')).toBe(
      '<p>some <strong>bold</strong> text</p>',
    );
  });
});

describe('rewriteInternalUrls', () => {
  it('makes internal links relative', () => {
    const out = rewriteInternalUrls(
      '<a href="https://old.test/some-post">link</a>',
      'https://old.test',
    );
    expect(out).toBe('<a href="/some-post">link</a>');
  });

  it('rewrites a bare origin link to the root path', () => {
    const out = rewriteInternalUrls('<a href="https://old.test">home</a>', 'https://old.test');
    expect(out).toBe('<a href="/">home</a>');
  });

  it('leaves external links alone', () => {
    const input = '<a href="https://other.test/x">out</a>';
    expect(rewriteInternalUrls(input, 'https://old.test')).toBe(input);
  });

  it('leaves wp-content links absolute, because those images still live there', () => {
    const input = '<a href="https://old.test/wp-content/uploads/a.pdf">pdf</a>';
    expect(rewriteInternalUrls(input, 'https://old.test')).toBe(input);
  });

  it('does not touch image sources', () => {
    const input = '<img src="https://old.test/wp-content/uploads/a.png">';
    expect(rewriteInternalUrls(input, 'https://old.test')).toBe(input);
  });

  it('is a no-op when no old domain is known', () => {
    const input = '<a href="https://old.test/x">link</a>';
    expect(rewriteInternalUrls(input, undefined)).toBe(input);
  });
});

describe('transformWordPressContent — end to end', () => {
  it('cleans a Gutenberg post', () => {
    const input = [
      '<!-- wp:paragraph -->',
      '<p>Intro paragraph.</p>',
      '<!-- /wp:paragraph -->',
      '<!-- wp:heading -->',
      '<h2>A heading</h2>',
      '<!-- /wp:heading -->',
    ].join('\n');

    const result = transformWordPressContent(input);

    expect(result.html).toContain('<p>Intro paragraph.</p>');
    expect(result.html).toContain('<h2>A heading</h2>');
    expect(result.html).not.toContain('wp:');
    expect(result.droppedShortcodes).toHaveLength(0);
  });

  it('cleans a classic post with bare newlines', () => {
    const result = transformWordPressContent('First para.\n\nSecond para.');
    expect(result.html).toBe('<p>First para.</p>\n<p>Second para.</p>');
  });

  it('derives an excerpt from the more tag', () => {
    const result = transformWordPressContent('<p>The teaser.</p><!--more--><p>The rest.</p>');
    expect(result.excerptFromMore).toBe('The teaser.');
    // Both halves remain in the body.
    expect(result.html).toContain('The teaser.');
    expect(result.html).toContain('The rest.');
  });

  it('reports dropped shortcodes and keeps the surrounding content', () => {
    const result = transformWordPressContent(
      '<p>Before</p>[gallery ids="1,2"]<p>After</p>',
    );
    expect(result.droppedShortcodes).toContain('gallery');
    expect(result.html).toContain('Before');
    expect(result.html).toContain('After');
    expect(result.html).not.toContain('gallery');
  });

  it('sanitises hostile imported content', () => {
    const result = transformWordPressContent(
      '<p>ok</p><script>alert(1)</script><p onclick="x()">bad</p>',
    );
    expect(result.html).not.toContain('script');
    expect(result.html).not.toContain('onclick');
    expect(result.html).toContain('<p>ok</p>');
  });

  it('combines captions, shortcodes and link rewriting in one pass', () => {
    const input =
      '[caption width="300"]<img src="https://old.test/wp-content/a.png" /> A cap[/caption]' +
      '<p>See <a href="https://old.test/other-post">other</a>.</p>' +
      '[contact-form-7 id="5"]';

    const result = transformWordPressContent(input, { oldDomain: 'https://old.test' });

    expect(result.html).toContain('<figcaption>A cap</figcaption>');
    expect(result.html).toContain('href="/other-post"');
    // The image URL stays absolute — it still lives on the old host.
    expect(result.html).toContain('https://old.test/wp-content/a.png');
    expect(result.droppedShortcodes).toContain('contact-form-7');
  });

  it('handles empty content without throwing', () => {
    const result = transformWordPressContent('');
    expect(result.html).toBe('');
    expect(result.excerptFromMore).toBeNull();
  });
});
