import { redirect } from 'next/navigation';

import { signOut } from '@/app/actions/auth';
import { AdminNav } from '@/components/admin-nav';
import { SiteSwitcher } from '@/components/site-switcher';
import { getCurrentSite, listMySites } from '@/lib/current-site';
import { getCurrentUser } from '@/lib/supabase/server';

/**
 * The dashboard shell: a dark rail on the left, a bar across the top of the
 * content, and cards floating on a tinted canvas.
 *
 * The rail still holds the site switcher at the top, for the reason it always
 * did: it is the widest-scoped control in the app, and every list, editor and
 * URL below it is scoped to whatever it says.
 *
 * WHAT THE TOP BAR IS FOR. It holds the account, which used to sit in the foot
 * of the rail. Nothing was added to fill it — no search box, no notification
 * bell, no theme switch — because none of those exist yet and a row of dead
 * icons is a worse lie than an empty bar. It earns its place by moving the one
 * thing that was there into the corner people look for it in, and by giving the
 * content column a consistent top edge to hang from.
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

  const [sites, site] = await Promise.all([listMySites(), getCurrentSite()]);

  return (
    <div className="min-h-screen lg:flex">
      <div className="flex flex-col bg-rail lg:sticky lg:top-0 lg:h-screen lg:w-[16rem] lg:shrink-0">
        <div className="flex items-center gap-2.5 px-5 pb-1 pt-5">
          {/*
            A mark rather than a logo. There is no admin logo asset, and
            inventing branding for someone else's product is not this change's
            job — a violet square with the product's initial reads as a place
            for one without pretending to be one.
          */}
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-brand"
          >
            B
          </span>
          <span className="text-[0.9375rem] font-semibold tracking-tight text-rail-ink-strong">
            Blog admin
          </span>
        </div>

        <div className="px-5 py-4">
          <SiteSwitcher sites={sites} currentId={site?.id ?? ''} />
        </div>

        <AdminNav />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 bg-canvas/80 px-4 py-3 backdrop-blur-sm lg:px-6 lg:py-4">
          <div className="card flex items-center justify-between gap-4 px-4 py-2.5">
            {/* Pushes the account right on its own, without an empty flex
                child that a screen reader would have to step over. */}
            <div className="min-w-0">
              <p className="truncate text-sm text-ink" title={user.email ?? ''}>
                {user.email}
              </p>
            </div>

            <form action={signOut} className="shrink-0">
              <button type="submit" className="btn btn-ghost btn-sm">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 pb-10 pt-1 lg:px-6">
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
        </main>
      </div>
    </div>
  );
}
