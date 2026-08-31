import { notFound } from 'next/navigation';

import { deletePage } from '@/app/actions/pages';
import { PageForm } from '@/components/page-form';
import { requireCurrentSite } from '@/lib/current-site';
import { getPageForEdit, listParentOptions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = await requireCurrentSite();

  const [page, parents] = await Promise.all([
    getPageForEdit(site.id, id),
    listParentOptions(site.id, id),
  ]);

  if (!page) notFound();

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Edit page</h1>

      <PageForm
        site={site}
        parents={parents}
        values={{
          id: page.id,
          title: page.title,
          slug: page.slug,
          parent_id: page.parent_id ?? '',
          template: page.template,
          status: page.status,
          // The unsanitised original is the better thing to edit: it is what the
          // author actually wrote, and re-saving re-applies the current allowlist.
          content_html: page.original_html ?? page.content_html,
          seo_title: page.seo_title ?? '',
          seo_description: page.seo_description ?? '',
          noindex: page.noindex,
          path: page.path,
        }}
      />

      <form action={deletePage} className="mt-10 border-t border-slate-200 pt-5">
        <input type="hidden" name="id" value={page.id} />
        <input type="hidden" name="path" value={page.path} />
        <button type="submit" className="text-sm text-red-700 underline">
          Delete this page
        </button>
        <p className="mt-1 text-xs text-slate-500">
          Any pages nested beneath it are deleted too.
        </p>
      </form>
    </>
  );
}
