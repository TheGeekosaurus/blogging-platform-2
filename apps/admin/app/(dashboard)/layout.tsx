import { redirect } from 'next/navigation';

import { AccountMenu } from '@/components/account-menu';
import { AdminNav } from '@/components/admin-nav';
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
 * the argument for deleting it: a whole sticky strip, a card and a backdrop
 * blur, to carry one line of text and one button, and an empty bar is not
 * better than dead icons, it is the same admission with less in it. Denis,
 * 2026-10-08: "Remove the top bar."
 *
 * So the account is back in the foot of the rail, where it started, and the
 * site switcher has gone in with it — see components/account-menu.tsx. The rail
 * is now one list of places you can go, with one control underneath it for the
 * things you do TO the workspace rather than inside it. That also buys back the
 * vertical space the switcher's boxed panel was taking at the top, which
 * mattered: at 950px the rail had its own scrollbar and Posts was off-screen.
 *
 * The rail does not collapse on small screens; it becomes a horizontal strip
 * above the content instead. A slide-out drawer would need state, and this is a
 * desktop editing tool — the phone case worth supporting is "look something
 * up", not "lay out a post". The account panel knows about this and drops
 * downward at that width.
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
        <div className="flex items-center gap-2.5 px-5 pb-3 pt-5">
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

        {/* `flex-1` is on the nav, so this sits at the bottom of a full-height
            rail and directly under the last section on a short one. */}
        <AdminNav />
        <AccountMenu
          email={user.email ?? null}
          sites={sites}
          currentSiteId={site?.id ?? ''}
        />
      </div>

      <main className="min-w-0 flex-1 px-4 pb-10 pt-6 lg:px-8 lg:pt-8">
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
  );
}
