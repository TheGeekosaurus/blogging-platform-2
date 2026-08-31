import { describe, expect, it } from 'vitest';

import {
  htmlToPlainText,
  sanitizePageHtml,
  sanitizePostHtml,
  truncateWords,
} from '../sanitize';

/**
 * These are the tests that matter most in the whole project: `content_html` is
 * rendered with dangerouslySetInnerHTML, so anything that survives sanitisation
 * executes in a reader's browser.
 */
describe('sanitizePostHtml — hostile input', () => {
  it('removes script tags and their contents', () => {
    const out = sanitizePostHtml('<p>ok</p><script>alert(1)</script>');
    expect(out).toBe('<p>ok</p>');
    expect(out).not.toContain('alert');
  });

  it('strips inline event handlers', () => {
    const out = sanitizePostHtml('<p onclick="steal()">text</p>');
    expect(out).toBe('<p>text</p>');
    expect(out).not.toContain('onclick');
  });

  it('strips event handlers on allowed image tags', () => {
    const out = sanitizePostHtml('<img src="https://x.test/a.png" onerror="steal()">');
    expect(out).not.toContain('onerror');
    expect(out).toContain('src="https://x.test/a.png"');
  });

  it('drops javascript: hrefs', () => {
    const out = sanitizePostHtml('<a href="javascript:alert(1)">click</a>');
    expect(out).not.toContain('javascript:');
  });

  it('drops javascript: hrefs obfuscated with entities and whitespace', () => {
    const out = sanitizePostHtml('<a href="java&#115;cript:alert(1)">x</a>');
    expect(out.toLowerCase()).not.toContain('javascript:');
  });

  it('drops data: URLs on images', () => {
    const out = sanitizePostHtml('<img src="data:text/html;base64,PHNjcmlwdD4=">');
    expect(out).not.toContain('data:');
  });

  it('removes style tags and their contents', () => {
    const out = sanitizePostHtml('<style>body{display:none}</style><p>hi</p>');
    expect(out).toBe('<p>hi</p>');
    expect(out).not.toContain('display:none');
  });

  it('removes iframes from hosts that are not allowlisted', () => {
    const out = sanitizePostHtml('<iframe src="https://evil.test/x"></iframe>');
    expect(out).not.toContain('iframe');
  });

  it('keeps iframes from allowlisted embed providers', () => {
    const out = sanitizePostHtml(
      '<iframe src="https://www.youtube.com/embed/abc123"></iframe>',
    );
    expect(out).toContain('iframe');
    expect(out).toContain('youtube.com/embed/abc123');
  });

  it('removes form and input elements', () => {
    const out = sanitizePostHtml('<form action="/x"><input name="password"></form>');
    expect(out).not.toContain('<form');
    expect(out).not.toContain('<input');
  });

  it('drops an h1 so the page template keeps sole ownership of it', () => {
    const out = sanitizePostHtml('<h1>Duplicate title</h1><h2>Real heading</h2>');
    expect(out).not.toContain('<h1');
    expect(out).toContain('<h2>Real heading</h2>');
  });
});

describe('sanitizePostHtml — legitimate content survives', () => {
  it('keeps ordinary formatting, lists and links', () => {
    const input =
      '<p>Some <strong>bold</strong> and <em>italic</em>.</p>' +
      '<ul><li>one</li><li>two</li></ul>' +
      '<a href="/internal">internal</a>';
    const out = sanitizePostHtml(input);

    expect(out).toContain('<strong>bold</strong>');
    expect(out).toContain('<em>italic</em>');
    expect(out).toContain('<li>one</li>');
    expect(out).toContain('href="/internal"');
  });

  it('keeps tables, code blocks and blockquotes', () => {
    const input =
      '<table><thead><tr><th scope="col">H</th></tr></thead><tbody><tr><td>C</td></tr></tbody></table>' +
      '<pre><code>const x = 1;</code></pre>' +
      '<blockquote><p>quoted</p></blockquote>';
    const out = sanitizePostHtml(input);

    expect(out).toContain('<th scope="col">H</th>');
    expect(out).toContain('<code>const x = 1;</code>');
    expect(out).toContain('<blockquote><p>quoted</p></blockquote>');
  });

  it('keeps relative and root-relative links intact', () => {
    const out = sanitizePostHtml('<a href="/some-post">read</a>');
    expect(out).toContain('href="/some-post"');
  });

  it('adds noopener noreferrer to external links', () => {
    const out = sanitizePostHtml('<a href="https://example.test/x">out</a>');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('target="_blank"');
  });

  it('does not add target/rel to internal links', () => {
    const out = sanitizePostHtml('<a href="/local">in</a>');
    expect(out).not.toContain('target="_blank"');
  });

  it('marks body images as lazy-loaded', () => {
    const out = sanitizePostHtml('<img src="https://x.test/a.png" alt="a">');
    expect(out).toContain('loading="lazy"');
    expect(out).toContain('alt="a"');
  });

  it('preserves figure and figcaption structure', () => {
    const out = sanitizePostHtml(
      '<figure><img src="https://x.test/a.png"><figcaption>Cap</figcaption></figure>',
    );
    expect(out).toContain('<figure>');
    expect(out).toContain('<figcaption>Cap</figcaption>');
  });

  it('returns an empty string for empty input', () => {
    expect(sanitizePostHtml('')).toBe('');
  });
});

describe('htmlToPlainText', () => {
  it('strips markup and collapses whitespace', () => {
    expect(htmlToPlainText('<p>Hello   <strong>world</strong></p>\n<p>Again</p>')).toBe(
      'Hello world Again',
    );
  });

  it('decodes common entities', () => {
    expect(htmlToPlainText('<p>Tom &amp; Jerry&nbsp;win</p>')).toBe('Tom & Jerry win');
  });

  it('decodes numeric entities', () => {
    expect(htmlToPlainText('<p>caf&#233;</p>')).toBe('café');
  });

  it('does not leak script contents into text', () => {
    expect(htmlToPlainText('<script>alert(1)</script><p>safe</p>')).toBe('safe');
  });
});

describe('truncateWords', () => {
  it('leaves short text untouched', () => {
    expect(truncateWords('short', 20)).toBe('short');
  });

  it('cuts on a word boundary and appends an ellipsis', () => {
    const source = 'the quick brown fox jumps over the lazy dog';
    const out = truncateWords(source, 20);

    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(21);

    // The kept text must be a whole-word prefix of the original — i.e. the
    // original continues with a space right where the truncation happened.
    const kept = out.slice(0, -1);
    expect(source.startsWith(kept)).toBe(true);
    expect(source[kept.length]).toBe(' ');
  });
});

describe('sanitizePageHtml — the looser page profile', () => {
  it('keeps a <style> block, which posts strip', () => {
    const input = '<style>.hero{padding:4rem}</style><div class="hero">Hi</div>';
    const out = sanitizePageHtml(input);

    expect(out).toContain('<style>');
    expect(out).toContain('padding:4rem');
    // The whole reason a second profile exists.
    expect(sanitizePostHtml(input)).not.toContain('<style>');
  });

  it('keeps inline style attributes for layout', () => {
    const out = sanitizePageHtml('<div style="display:grid;gap:2rem">x</div>');
    expect(out).toContain('style="display:grid;gap:2rem"');
  });

  it('keeps an h1, since a landing page owns its own heading', () => {
    expect(sanitizePageHtml('<h1>Nanotom Capital</h1>')).toContain('<h1>');
    // Posts still drop it — the post template supplies the h1.
    expect(sanitizePostHtml('<h1>Title</h1>')).not.toContain('<h1');
  });

  it('keeps inline SVG', () => {
    const out = sanitizePageHtml(
      '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z" fill="currentColor"/></svg>',
    );
    expect(out).toContain('<svg');
    expect(out).toContain('<path');
    expect(out).toContain('d="M4 4h16v16H4z"');
  });

  it('keeps aria and data attributes', () => {
    const out = sanitizePageHtml('<button aria-label="Close" data-action="dismiss">x</button>');
    expect(out).toContain('aria-label="Close"');
    expect(out).toContain('data-action="dismiss"');
  });
});

describe('sanitizePageHtml — script execution is still not negotiable', () => {
  it('removes script tags and their contents', () => {
    const out = sanitizePageHtml('<div>ok</div><script>alert(1)</script>');
    expect(out).not.toContain('script');
    expect(out).not.toContain('alert');
  });

  it('strips inline event handlers even though style is allowed', () => {
    const out = sanitizePageHtml('<div onclick="steal()" style="color:red">x</div>');
    expect(out).not.toContain('onclick');
    expect(out).toContain('style="color:red"');
  });

  it('strips onerror from images', () => {
    const out = sanitizePageHtml('<img src="https://x.test/a.png" onerror="steal()">');
    expect(out).not.toContain('onerror');
  });

  it('drops javascript: hrefs', () => {
    const out = sanitizePageHtml('<a href="javascript:alert(1)">x</a>');
    expect(out.toLowerCase()).not.toContain('javascript:');
  });

  it('removes iframes from hosts that are not allowlisted', () => {
    const out = sanitizePageHtml('<iframe src="https://evil.test/x"></iframe>');
    expect(out).not.toContain('iframe');
  });

  it('does not permit form fields that could phish credentials', () => {
    const out = sanitizePageHtml('<form action="/x"><input name="password"></form>');
    expect(out).not.toContain('<form');
    expect(out).not.toContain('<input');
  });
});
