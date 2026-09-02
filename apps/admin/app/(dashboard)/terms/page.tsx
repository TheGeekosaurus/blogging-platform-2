import { categoryPath, flattenTermTree, tagPath } from '@blog/core';

import { deleteTerm } from '@/app/actions/terms';
import { CategoryParentPicker } from '@/components/category-parent-picker';
import { NewTermForm } from '@/components/new-term-form';
import { requireCurrentSite } from '@/lib/current-site';
import { countPostsPerTerm, listAllTerms } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function TermsPage() {
  const site = await requireCurrentSite();
  const [terms, counts] = await Promise.all([
    listAllTerms(site.id),
    countPostsPerTerm(site.id),
  ]);

  const allCategories = terms.filter((term) => term.kind === 'category');
  const tags = terms.filter((term) => term.kind === 'tag');

  /*
   * Categories render as a tree: parents followed by their children, indented by
   * depth. Tags cannot nest, so they stay a flat list.
   */
  const categoryTree = flattenTermTree(allCategories);

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Categories &amp; tags</h1>

      <div className="mt-6 max-w-3xl">
        <NewTermForm categories={categoryTree} />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Categories</h2>
        <p className="mt-1 text-sm text-slate-600">
          Categories nest. A category&apos;s archive lists posts from its
          subcategories too, so tagging a post with the most specific one is enough.
          The URL stays <code className="text-xs">/blog/category/&lt;slug&gt;</code> at
          any depth, so moving a category never breaks a link.
        </p>

        {categoryTree.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">None yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
            {categoryTree.map(({ term, depth }) => {
              const direct = counts.get(term.id) ?? 0;

              return (
                <li key={term.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span
                    className="flex items-center gap-1.5"
                    style={{ paddingLeft: `${depth * 1.25}rem` }}
                  >
                    {depth > 0 ? (
                      <span aria-hidden="true" className="text-slate-400">
                        └
                      </span>
                    ) : null}
                    <span className="font-medium">{term.name}</span>
                  </span>

                  <code className="text-xs text-slate-500">{categoryPath(term.slug)}</code>
                  <span className="text-sm text-slate-500">
                    {direct} {direct === 1 ? 'post' : 'posts'}
                  </span>

                  <div className="ml-auto flex items-center gap-3">
                    <CategoryParentPicker
                      termId={term.id}
                      currentParentId={term.parent_id}
                      categories={categoryTree}
                    />
                    <form action={deleteTerm}>
                      <input type="hidden" name="id" value={term.id} />
                      <button type="submit" className="text-sm text-red-700 underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Tags</h2>

        {tags.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">None yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
            {tags.map((term) => {
              const used = counts.get(term.id) ?? 0;

              return (
                <li key={term.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="font-medium">{term.name}</span>
                  <code className="text-xs text-slate-500">{tagPath(term.slug)}</code>
                  <span className="text-sm text-slate-500">
                    {used} {used === 1 ? 'post' : 'posts'}
                  </span>
                  <form action={deleteTerm} className="ml-auto">
                    <input type="hidden" name="id" value={term.id} />
                    <button type="submit" className="text-sm text-red-700 underline">
                      Delete
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-8 text-sm text-slate-500">
        Deleting a term leaves its posts intact — they just lose that label. Deleting a
        parent category moves its children to the top level rather than deleting them.
      </p>
    </>
  );
}
