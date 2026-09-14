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

describe('the editor chrome follows the caret', () => {
  it('registers Link exactly once', () => {
    /*
     * StarterKit already bundles Link. Importing @tiptap/extension-link and
     * adding it to the extensions array registered a SECOND mark under the same
     * name — Tiptap said so in the console ("Duplicate extension names found:
     * ['link']") and nothing else did. Links still rendered; editing them was
     * unpredictable, which is the likeliest reason clicking one never showed
     * its URL. Configure it through StarterKit instead.
     */
    expect(EDITOR).not.toContain("from '@tiptap/extension-link'");
    expect(EDITOR).toMatch(/StarterKit\.configure\(\{[\s\S]*?link:\s*\{/);
  });

  it('subscribes to editor state, or every isActive read is stale', () => {
    /*
     * The component otherwise re-renders only from setHtml in onUpdate, which
     * fires on CONTENT changes — so moving the caret changed nothing on screen.
     * Bold stayed lit after clicking away from bold text, and the link button
     * never became "Edit link".
     */
    expect(EDITOR).toContain('useEditorState(');
  });

  it('does not select on the transaction number', () => {
    /*
     * Selecting on it re-renders for EVERY transaction, including the ones
     * BubbleMenu dispatches while repositioning — a render loop that React
     * aborts with "Maximum update depth exceeded". Select a summary of the
     * active marks, which changes only when the answer does.
     */
    expect(EDITOR).not.toMatch(/selector:\s*\(\{\s*transactionNumber\s*\}\)/);
  });

  it('pins the toolbar so it survives a long post', () => {
    // The original complaint: select text two thousand pixels down, then scroll
    // all the way up to find the button.
    expect(EDITOR).toContain('sticky top-0');
  });

  it('shows a bubble beside the selection', () => {
    expect(EDITOR).toContain("from '@tiptap/react/menus'");
    expect(EDITOR).toContain('<BubbleMenu');
  });

  it('keeps the bubble open for a caret inside a link, and while editing one', () => {
    /*
     * Tiptap hides the bubble on an empty selection by default. Two cases need
     * it anyway: a caret resting in a link (how you discover an existing one)
     * and the moment the URL field takes focus, which would otherwise close the
     * editor as it opened.
     */
    expect(EDITOR).toMatch(/editingLink \|\| instance\.isActive\('link'\) \|\| from !== to/);
  });

  it('edits links in place rather than through window.prompt', () => {
    // Comments stripped: the image picker's docstring still names the prompt
    // while explaining why IT stopped using one, and that is not a call.
    const code = EDITOR.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    expect(code).not.toContain('window.prompt');
    expect(code).toContain('LinkEditor');
  });
});

describe('the link editor', () => {
  const LINK_EDITOR = readFileSync(
    join(__dirname, '..', 'components', 'editor', 'link-editor.tsx'),
    'utf8',
  );

  it('prefills the existing href', () => {
    // The reported bug: the prompt gave no sign of what was already there.
    expect(LINK_EDITOR).toContain("editor.getAttributes('link').href");
  });

  it('validates against the sanitiser instead of guessing', () => {
    // A scheme the sanitiser strips is a silently deleted link.
    expect(LINK_EDITOR).toContain('normaliseLinkHref');
  });

  it('extends the mark range before writing', () => {
    /*
     * Without it, applying a link to a caret INSIDE an existing one rewrites
     * only the part after the cursor — one visual link, secretly two marks
     * with different hrefs.
     */
    expect(LINK_EDITOR).toContain("extendMarkRange('link')");
  });

  it('offers Remove, so a link can be taken off without deleting the text', () => {
    expect(LINK_EDITOR).toContain('unsetLink()');
  });

  it('stops Enter from submitting the whole post form', () => {
    // It sits inside the post form; Enter would otherwise save the post.
    expect(LINK_EDITOR).toMatch(/key === 'Enter'[\s\S]{0,80}preventDefault/);
  });
});
