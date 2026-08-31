import Link from 'next/link';
import { redirect } from 'next/navigation';

import { signOut } from '@/app/actions/auth';
import { SiteSwitcher } from '@/components/site-switcher';
import { getCurrentSite, listMySites } from '@/lib/current-site';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getUser(), not getSession() — see lib/supabase/server.ts.
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [sites, site] = await Promise.all([listMySites(), getCurrentSite()]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-6">
            <Link href="/posts" className="font-semibold tracking-tight">
              Blog admin
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/pages">Pages</Link>
              <Link href="/posts">Posts</Link>
              <Link href="/terms">Categories &amp; tags</Link>
              <Link href="/media">Media</Link>
              <Link href="/settings">Settings</Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {site ? <SiteSwitcher sites={sites} currentId={site.id} /> : null}
            <form action={signOut}>
              <button type="submit" className="text-sm text-slate-600 underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {site ? (
          children
        ) : (
          <div className="rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">This account is not a member of any site.</p>
            <p className="mt-1">
              Signing in worked, but every query returns nothing until a{' '}
              <code>site_members</code> row exists. See <code>docs/DEPLOYMENT.md</code>.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
