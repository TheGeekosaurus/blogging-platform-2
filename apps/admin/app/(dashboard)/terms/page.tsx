import { categoryPath, tagPath } from '@blog/core';

import { deleteTerm } from '@/app/actions/terms';
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

  const groups = [
    { kind: 'category' as const, label: 'Categories', path: categoryPath },
    { kind: 'tag' as const, label: 'Tags', path: tagPath },
  ];

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Categories &amp; tags</h1>

      <div className="mt-6 max-w-md">
        <NewTermForm />
      </div>

      {groups.map((group) => {
        const items = terms.filter((term) => term.kind === group.kind);

        return (
          <section key={group.kind} className="mt-10">
            <h2 className="text-lg font-semibold">{group.label}</h2>

            {items.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">None yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                {items.map((term) => {
                  const used = counts.get(term.id) ?? 0;

                  return (
                    <li key={term.id} className="flex flex-wrap items-center gap-3 py-2.5">
                      <span className="font-medium">{term.name}</span>
                      <code className="text-xs text-slate-500">{group.path(term.slug)}</code>
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
        );
      })}

      <p className="mt-8 text-sm text-slate-500">
        Deleting a term leaves its posts intact — they just lose that label.
      </p>
    </>
  );
}
