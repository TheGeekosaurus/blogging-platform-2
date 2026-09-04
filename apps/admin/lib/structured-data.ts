import { checkSnippetBudget, parseSnippet, readSnippets, type SchemaNode } from '@blog/core';

/**
 * Read the schema markup panel's textareas out of a submitted form.
 *
 * The panel gives every snippet textarea name="structured_data", so this is
 * getAll() over one name in document order — the same shape as term_ids. There
 * is no hidden field to reconcile and no index to trust.
 *
 * Shared by savePost, savePage and saveSettings, which store the same column on
 * three different tables. The three had no reason to disagree about what a
 * valid snippet is, and this is what stops them drifting into it.
 */
export function readStructuredData(
  formData: FormData,
): { nodes: SchemaNode[] } | { error: string } {
  const submitted = formData.getAll('structured_data').map(String);
  const nodes: SchemaNode[] = [];

  for (const [index, text] of submitted.entries()) {
    // An emptied textarea is a deletion, not an error. Clearing the box is the
    // obvious way to remove a snippet, and refusing the whole save for it would
    // teach authors to distrust the panel.
    if (!text.trim()) continue;

    const parsed = parseSnippet(text);

    /*
     * One bad snippet fails the whole save, rather than being dropped.
     *
     * Silently discarding it would be worse than it sounds: the author would
     * see "Saved", reload, and find their markup gone with no indication why.
     * The number matches the panel's own labelling so there is something to
     * look at.
     */
    if (!parsed.ok) return { error: `Schema snippet ${index + 1} — ${parsed.error}` };

    nodes.push(parsed.node);
  }

  const overBudget = checkSnippetBudget(nodes);
  if (overBudget) return { error: `Schema markup — ${overBudget}` };

  return { nodes };
}

/**
 * Stored nodes as editable text, for the panel's initial value.
 *
 * Re-indented rather than round-tripped: whitespace is not stored, so an
 * author's own formatting does not survive a save either way, and two-space
 * JSON is what the templates produce.
 */
export function snippetsToText(value: unknown): string[] {
  return readSnippets(value).map((node) => JSON.stringify(node, null, 2));
}
