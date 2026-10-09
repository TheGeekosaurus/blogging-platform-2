import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin-shell';
import { getCurrentSite, listMySites } from '@/lib/current-site';
import { getCurrentUser } from '@/lib/supabase/server';

/**
 * The dashboard shell: a dark rail on the left, and cards floating on a tinted
 * canvas. Nothing above the content.
 *
 * THERE WAS A TOP BAR HERE. It held the account — the signed-in email and a
 * Sign out button — and the docstring it carried defended itself like this:
 * "Nothing was added to fill it — no search box, no notification bell, no theme
 * switch — because none of those exist yet and a row of dead icons is a worse
 * lie than an empty bar." Both halves of that are true, and together they are
 * the argument for deleting it. Denis, 2026-10-08: "Remove the top bar."
 *
 * So the account is back in the foot of the rail, where it started, and the
 * site switcher has gone in with it — see components/account-menu.tsx.
 *
 * THE FRAME ITSELF IS A CLIENT COMPONENT now, because the rail collapses and
 * two things decide whether it is collapsed: a preference, and whether the
 * current route is a full-window workspace. Neither is knowable here. What IS
 * knowable here is the cookie, and reading it on the server is the whole point
 * — the rail renders at its final width in the first frame instead of painting
 * wide and snapping narrow after hydration.
 *
 * The rail does not collapse on small screens; it becomes a horizontal strip
 * above the content instead. A slide-out drawer would need state, and this is a
 * desktop editing tool — the phone case worth supporting is "look something
 * up", not "lay out a post".
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getUser(), not getSession() — see lib/supabase/server.ts.
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [sites, site, jar] = await Promise.all([
    listMySites(),
    getCurrentSite(),
    cookies(),
  ]);

  return (
    <AdminShell
      defaultCollapsed={jar.get('admin_rail_collapsed')?.value === 'true'}
      email={user.email ?? null}
      sites={sites}
      currentSiteId={site?.id ?? ''}
    >
      {site ? (
        children
      ) : (
        <div className="card max-w-2xl border-l-4 border-l-warning px-5 py-4 text-sm">
          <p className="font-medium text-ink">
            This account is not a member of any site.
          </p>
          <p className="mt-1 text-ink-muted">
            Signing in worked, but every query returns nothing until a{' '}
            <code>site_members</code> row exists. See{' '}
            <code>docs/DEPLOYMENT.md</code>.
          </p>
        </div>
      )}
    </AdminShell>
  );
}
