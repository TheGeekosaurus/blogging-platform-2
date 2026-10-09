'use client';

import Link from 'next/link';

/**
 * The frame a full-window editing screen shares: a bar, a column of controls
 * and the thing being worked on.
 *
 * Extracted from the CTA builder the moment a second screen needed it, which
 * was immediately — Denis, 2026-10-09: "Overall the posts/pages pages should be
 * revamped. Similar to the CTAs menu, it should open a secondary left menu with
 * all the options for titles, meta images etc."
 *
 * WHAT GOES WHERE, and the rule is the same on every one of these screens:
 *
 *   the bar      what this thing is called, whether it is live, and the way
 *                out. The NAME lives here rather than in a section for a
 *                reason that is not about looks — it is required, and a
 *                required field inside a section you can close is a field you
 *                can be blocked by without seeing.
 *   the sidebar  everything ABOUT the thing. Collapsible, because eight
 *                sections open at once is the long form these replace.
 *   the stage    the thing itself: a live preview for a CTA block, the body
 *                editor for a post. Scrolls on its own so the sidebar never
 *                moves under it.
 *
 * The rail collapses to icons while one of these is open — see
 * components/admin-shell.tsx, which decides that from the route.
 */
export function Workspace({
  /** The document's own name field, rendered in the bar. */
  name,
  /** Status, a Live toggle, a View-live link: whatever belongs beside Save. */
  status,
  backHref,
  backLabel,
  /** Usually one `btn btn-primary` submit. Cancel is supplied here too. */
  actions,
  sidebar,
  children,
}: {
  name: React.ReactNode;
  status?: React.ReactNode;
  backHref: string;
  backLabel: string;
  actions: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="builder-bar">
        <Link href={backHref} className="builder-back" aria-label={backLabel}>
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
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>

        {name}
        {status}
        {actions}
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {sidebar}
        {children}
      </div>
    </div>
  );
}
