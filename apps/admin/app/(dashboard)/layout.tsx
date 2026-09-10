import { redirect } from 'next/navigation';

import { signOut } from '@/app/actions/auth';
import { AdminNav } from '@/components/admin-nav';
import { SiteSwitcher } from '@/components/site-switcher';
import { getCurrentSite, listMySites } from '@/lib/current-site';
import { getCurrentUser } from '@/lib/supabase/server';

/**
 * The dashboard shell: a fixed dark rail on the left, content on the right —
 * the shape WordPress uses, because that is the shape the people using this
 * already know.
 *
 * The site switcher sits at the very top of the rail rather than off in a
 * corner. It is the widest-scoped control in the app: every list, every editor
 * and every URL below it is scoped to whatever it says, so it belongs above the
 * navigation it changes the meaning of.
 *
 * The rail does not collapse on small screens; it becomes a horizontal strip
 * above the content instead. A slide-out drawer would need state, and this is a
 * desktop editing tool — the phone case worth supporting is "look something up",
 * not "lay out a post".
 */
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
    <div className="min-h-screen bg-[var(--color-wp-canvas)] lg:flex">
      <div className="flex flex-col bg-[var(--color-wp-nav)] lg:sticky lg:top-0 lg:h-screen lg:w-[13.75rem] lg:shrink-0">
        <div className="border-b border-white/10 px-4 py-3">
          <SiteSwitcher sites={sites} currentId={site?.id ?? ''} />
        </div>

        <AdminNav />

        <div className="border-t border-white/10 px-4 py-3">
          <p className="truncate text-xs text-[var(--color-wp-nav-ink)]" title={user.email ?? ''}>
            {user.email}
          </p>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-1 text-xs text-[var(--color-wp-nav-ink)] underline hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      <main className="min-w-0 flex-1 px-6 py-8 lg:px-10">
        {site ? (
          children
        ) : (
          <div className="max-w-2xl rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
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
