'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import type { SiteRow } from '@blog/core';

import { AccountMenu } from '@/components/account-menu';
import { AdminNav } from '@/components/admin-nav';

/**
 * The frame: the rail, whether it is collapsed, and the column beside it.
 *
 * WHY A CLIENT COMPONENT AROUND SERVER CHILDREN. Two things here are functions
 * of the current path and of a user preference, and a server layout can read
 * neither. `children` is still rendered on the server and passed through as a
 * prop, so nothing inside a page is pulled across the boundary — only the
 * frame is.
 *
 * THE COOKIE IS THE STATE, not localStorage with a cookie mirroring it. The
 * server has to know the rail's width to render the first frame, or the page
 * paints wide and snaps narrow; the only thing the server can read is a
 * cookie, so that is where it lives. Keeping a second copy in localStorage
 * would buy nothing and give two sources of truth that can disagree — which
 * they do, the moment a second tab changes it.
 */
const RAIL_COOKIE = 'admin_rail_collapsed';

/**
 * Screens that take the whole window. On these the rail is collapsed and the
 * toggle is gone: the builder owns the viewport, its own sidebar is where the
 * work happens, and the rail is only the way out.
 */
function isWorkspace(pathname: string): boolean {
  return (
    /^\/lead-magnets\/(new|[^/]+)$/.test(pathname) &&
    !pathname.endsWith('/lead-magnets')
  );
}

export function AdminShell({
  defaultCollapsed,
  email,
  sites,
  currentSiteId,
  children,
}: {
  defaultCollapsed: boolean;
  email: string | null;
  sites: SiteRow[];
  currentSiteId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [preference, setPreference] = useState(defaultCollapsed);

  const workspace = isWorkspace(pathname);
  const collapsed = workspace || preference;

  function toggle() {
    const next = !preference;
    setPreference(next);
    // A year, path-wide, lax: it is a layout preference, not a credential.
    document.cookie = `${RAIL_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }

  return (
    <div
      className={`min-h-screen lg:flex ${
        workspace ? 'lg:h-screen lg:overflow-hidden' : ''
      }`}
    >
      <div
        data-collapsed={collapsed ? '' : undefined}
        className={`flex flex-col bg-rail transition-[width] duration-200 lg:sticky lg:top-0 lg:h-screen lg:shrink-0 ${
          collapsed ? 'lg:w-[4.5rem]' : 'lg:w-[16rem]'
        }`}
      >
        <div
          className={`flex pb-3 pt-5 ${
            collapsed
              ? 'flex-col items-center gap-2 px-2'
              : 'items-center gap-2.5 px-5'
          }`}
        >
          {/*
            A mark rather than a logo. There is no admin logo asset, and
            inventing branding for someone else's product is not this change's
            job — a violet square with the product's initial reads as a place
            for one without pretending to be one. Collapsed, it is the only
            thing left up here, which is what a mark is for.
          */}
          <Link
            href="/posts"
            aria-label="Blog admin"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-brand"
          >
            B
          </Link>
          {collapsed ? null : (
            <span className="truncate text-[0.9375rem] font-semibold tracking-tight text-rail-ink-strong">
              Blog admin
            </span>
          )}

          {/*
            The toggle is not rendered at all in a workspace, rather than
            rendered disabled: a control that cannot do anything is worse than
            no control, and there is nothing to explain — the rail is narrow
            because you opened a builder, and leaving the builder widens it.
          */}
          {workspace ? null : (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand the menu' : 'Collapse the menu'}
              className={`rail-toggle ${collapsed ? '' : 'ml-auto'}`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[16px] w-[16px]"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <path d="M9 4v16" />
              </svg>
              <span aria-hidden="true" className="rail-tip">
                {collapsed ? 'Expand the menu' : 'Collapse the menu'}
              </span>
            </button>
          )}
        </div>

        {/* `flex-1` is on the nav, so the account sits at the bottom of a
            full-height rail and directly under the last section on a short one. */}
        <AdminNav collapsed={collapsed} />
        <AccountMenu
          email={email}
          sites={sites}
          currentSiteId={currentSiteId}
          collapsed={collapsed}
        />
      </div>

      {/*
        A workspace gets the bare column: no padding and no page scroll, so it
        can pin its own header and scroll its two panes independently. Every
        other screen keeps the normal content gutter.
      */}
      <main
        className={
          workspace
            ? 'min-w-0 flex-1 lg:h-screen lg:overflow-hidden'
            : 'min-w-0 flex-1 px-4 pb-10 pt-6 lg:px-8 lg:pt-8'
        }
      >
        {children}
      </main>
    </div>
  );
}
