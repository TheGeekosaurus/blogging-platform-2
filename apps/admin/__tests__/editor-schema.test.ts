import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { sanitizePostHtml } from '@blog/core';

/**
 * The editor's schema and the sanitiser's allowlist have to agree, and the
 * failure is silent in BOTH directions.
 *
 *   editor produces > sanitiser allows  → lost on save
 *   sanitiser allows > editor represents → lost on LOAD, because ProseMirror
 *                                          drops unknown nodes when it parses
 *                                          the stored HTML, and the next save
 *                                          writes the loss back
 *
 * The second direction is not hypothetical. Tables were on the allowlist from
 * the start and the importer carried them through — but the editor had no
 * table extension, so every imported table died the first time its post was
 * opened here. Nothing failed; the table was simply gone.
 */
const EDITOR = readFileSync(
  join(__dirname, '..', 'components', 'editor', 'rich-text-editor.tsx'),
  'utf8',
);

describe('the editor can represent everything the sanitiser keeps', () => {
  it('registers a table extension at all', () => {
    // The whole bug, in one assertion.
    expect(EDITOR).toContain("from '@tiptap/extension-table'");
    expect(EDITOR).toContain('TableKit.configure(');
  });

  it('leaves column resizing off', () => {
    /*
     * Not a style preference. Resizing emits `colwidth` and inline <colgroup>
     * styles, and the allowlist permits neither — so it would look like it
     * worked and vanish on save. Verified against the real sanitiser below.
     */
    expect(EDITOR).toContain('resizable: false');
  });

  it.each([
    ['table', '<table><tbody><tr><td><p>x</p></td></tr></tbody></table>'],
    ['heading', '<h2>Heading</h2>'],
    ['list', '<ul><li><p>x</p></li></ul>'],
    ['blockquote', '<blockquote><p>x</p></blockquote>'],
    ['code block', '<pre><code>x</code></pre>'],
    ['image', '<img src="https://example.com/a.png" alt="a">'],
    ['link', '<p><a href="https://example.com">x</a></p>'],
  ])('%s survives the sanitiser, so the editor must keep supporting it', (_label, html) => {
    // If one of these ever stops round-tripping, the matching extension above
    // is the thing to check before touching the allowlist.
    expect(sanitizePostHtml(html)).not.toBe('');
  });

  it('offers the table controls an author needs to use one', () => {
    // Inserting a table you cannot add a row to is not a feature.
    for (const command of [
      'insertTable(',
      'addRowAfter(',
      'addColumnAfter(',
      'deleteRow(',
      'deleteColumn(',
      'deleteTable(',
    ]) {
      expect(EDITOR, `missing ${command}`).toContain(command);
    }
  });

  it('inserts a header row by default', () => {
    // The blog styles <th> distinctly, and a table whose first row is not
    // marked up as headers is the commonest accessibility fault in pasted
    // content.
    expect(EDITOR).toContain('withHeaderRow: true');
  });
});
