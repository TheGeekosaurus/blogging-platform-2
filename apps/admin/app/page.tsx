/**
 * Placeholder.
 *
 * The admin dashboard is phase 4. This app exists now only so the monorepo
 * structure and its Vercel project are established, and so `pnpm -r build`
 * covers it. Everything real — auth, the posts list, the Tiptap editor,
 * taxonomy management — arrives in the next pass.
 *
 * Until then, content is managed with tools/wp-import or direct SQL.
 */
export default function AdminPlaceholder() {
  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Blog admin</h1>
      <p className="mt-4 text-slate-600">
        Not built yet — the dashboard lands in phase 4. For now, import content with{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm">pnpm wp-import</code>.
      </p>
    </main>
  );
}
