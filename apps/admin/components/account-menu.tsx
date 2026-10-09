'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

import type { SiteRow } from '@blog/core';

import { signOut } from '@/app/actions/auth';
import { SiteSwitcher } from '@/components/site-switcher';

/**
 * The account, in the foot of the rail.
 *
 * It lived there once, moved into a top bar, and is back — see the layout's
 * docstring for why the bar went. Three things are in it: which site you are
 * editing, the site settings, and the way out. They belong together because
 * none of them is a destination you navigate to while working; they are the
 * things you do to the workspace rather than inside it.
 *
 * THIS IS THE FIRST FLOATING PANEL IN THE ADMIN. Everything else that opens
 * here is a <details> that expands in flow — the SEO tree, the SEO override
 * blocks, the proof form's paste box — and none of them needs light-dismiss,
 * because pushing the page down is its own acknowledgement. A panel that
 * covers content does need it, and `<details>` gives you none of the three
 * behaviours below. Hence state and three listeners rather than the house
 * pattern.
 *
 * IT IS NOT role="menu". That role constrains its children to `menuitem`, and
 * this panel holds a <select> and two <form>s — a select inside a menu role is
 * a lie to a screen reader, which would then announce a listbox as a menu item.
 * What this is is a disclosure: `aria-expanded` and `aria-controls` on the
 * trigger, a plain labelled region for the panel, and ordinary controls inside
 * it that each announce themselves. Please do not "fix" this to role="menu".
 */
export function AccountMenu({
  email,
  sites,
  currentSiteId,
  collapsed = false,
}: {
  email: string | null;
  sites: SiteRow[];
  currentSiteId: string;
  collapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const pathname = usePathname();

  /*
   * Close when the route changes.
   *
   * THE ONE THAT GETS FORGOTTEN, and the reason this effect has a comment
   * three times its length. The rail is rendered by the layout, so it does not
   * unmount on a client-side navigation: clicking "Site settings" swaps the
   * page *underneath* a panel that stays exactly where it was, covering the
   * screen you just asked for. The same bug, in the blog's header, is written
   * up at length in components/marketing/daylight/use-dismiss-menus.ts.
   *
   * Switching SITE is deliberately not covered by this: it is a form post to
   * the same path, so `pathname` does not change and the panel stays open with
   * the new site named in it. That is the right feedback for an action whose
   * only visible effect is elsewhere.
   */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /*
   * Settings left the nav list for this panel, and took the rail's sense of
   * place with it: on /settings nothing in the rail was marked current, so the
   * screen looked like it belonged to no section at all. The control you
   * reached it through stays lit instead — which is what an open section does
   * one level up, and is true in the same way.
   */
  const onSettings = pathname === '/settings' || pathname.startsWith('/settings/');

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      // Focus goes back to the trigger, not to wherever it was before the
      // panel opened — the panel is gone and its controls are unmounted.
      trigger.current?.focus();
    }

    /*
     * `pointerdown`, not `click`: a click fires after the button it lands on
     * has already acted, so a click on a card elsewhere would run that card's
     * handler with the panel still up. Down is when the intent is expressed.
     */
    function onPointerDown(event: PointerEvent) {
      const el = wrapper.current;
      if (!el || !(event.target instanceof Node)) return;
      if (el.contains(event.target)) return;
      setOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={wrapper}
      className={`relative border-t border-white/[0.08] py-3 ${collapsed ? 'px-2' : 'px-3'}`}
    >
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-controls={panelId}
        /* Not aria-current: this button is not a link to the current page, it
           is the control that page was opened from. The <a> inside the panel
           carries that, and does so only while the panel is open. */
        data-current={onSettings ? '' : undefined}
        className={`rail-account ${collapsed ? 'rail-account-collapsed' : ''}`}
      >
        <span aria-hidden="true" className="rail-account-avatar">
          {/* The same mark the Authors section uses, at the same weight. */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[17px] w-[17px]"
          >
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 20a7 7 0 0 1 14 0" />
          </svg>
        </span>

        {/*
          The email, which is the one thing the deleted top bar actually
          showed. `title` carries it in full, because 16rem of rail truncates
          anything longer than about twenty characters.
        */}
        {/* Collapsed, the address is the button's accessible name and nothing
            else — the avatar is aria-hidden and there is no room for a label. */}
        <span
          className={collapsed ? 'sr-only' : 'min-w-0 flex-1 truncate text-left'}
          title={email ?? ''}
        >
          {email ?? 'Account'}
        </span>

        {collapsed ? null : (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-[15px] w-[15px] shrink-0 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        )}
      </button>

      {/*
        Rendered only while open, so its controls are not in the tab order the
        rest of the time — and rendered AFTER the trigger in the DOM, which is
        what makes Tab walk into it despite the panel sitting above on screen.

        It drops UP on desktop and DOWN below `lg`, because the rail is a strip
        across the top of the page at that width and up would be off-screen.
      */}
      {open ? (
        <div
          id={panelId}
          aria-label="Account"
          className={`account-panel absolute top-full z-50 mt-2 lg:bottom-full lg:top-auto lg:mt-0 lg:mb-2 lg:w-[17.5rem] ${
            collapsed ? 'left-2 w-[15rem]' : 'left-3 right-3 lg:right-auto'
          }`}
        >
          <div className="px-3 pb-3 pt-3">
            <SiteSwitcher sites={sites} currentId={currentSiteId} />
          </div>

          <div className="border-t border-line py-1">
            <Link
              href="/settings"
              aria-current={onSettings ? 'page' : undefined}
              className="account-item"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[17px] w-[17px] shrink-0 text-ink-muted"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.2a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4Z" />
              </svg>
              Site settings
            </Link>

            {/*
              Still the same server action as a plain form post — moving the
              account into a client component changed where the form is
              rendered, not how signing out works.
            */}
            <form action={signOut}>
              <button type="submit" className="account-item">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-[17px] w-[17px] shrink-0 text-ink-muted"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="m16 17 5-5-5-5" />
                  <path d="M21 12H9" />
                </svg>
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
