'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * The left rail, laid out the way WordPress lays its own out: one column of
 * sections, each with a submenu that opens when you are inside that section.
 *
 * WHY A CLIENT COMPONENT, when the rest of the dashboard shell is not. The
 * active section is a function of the current path, and a server component
 * cannot read it — the alternative is threading a pathname prop down from every
 * route, which is a change to eight files to avoid one small boundary. Nothing
 * else here is stateful: no hover menus, no toggles, no effects.
 *
 * WordPress opens a submenu on hover as well as on section. That is deliberately
 * not copied: a hover-only menu is unusable by keyboard and on touch, and the
 * two-level structure is shallow enough that showing the current section's
 * children is enough to navigate by.
 */

type NavChild = { href: string; label: string };
type NavSection = {
  href: string;
  label: string;
  icon: React.ReactNode;
  children?: NavChild[];
};

/** 20px line icons on a 24 grid, so they sit on the same rhythm as the labels. */
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px] shrink-0"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const SECTIONS: NavSection[] = [
  {
    href: '/posts',
    label: 'Posts',
    icon: (
      <Icon>
        <path d="M4 5h16M4 10h16M4 15h10" />
        <path d="M14 19l2-2 4 4-2 2z" />
      </Icon>
    ),
    children: [
      { href: '/posts', label: 'All Posts' },
      { href: '/posts/new', label: 'Add New' },
      { href: '/terms', label: 'Categories & Tags' },
    ],
  },
  {
    href: '/pages',
    label: 'Pages',
    icon: (
      <Icon>
        <path d="M14 3v5h5" />
        <path d="M6 3h8l5 5v13H6z" />
        <path d="M9 13h7M9 17h5" />
      </Icon>
    ),
    children: [
      { href: '/pages', label: 'All Pages' },
      { href: '/pages/coded', label: 'Built in Code' },
      { href: '/pages/new', label: 'Add New' },
    ],
  },
  /*
   * Its own section rather than a child of Posts or Pages: it reads the body of
   * both and reports across them, so filing it under either would hide it from
   * someone working in the other.
   */
  {
    href: '/links',
    label: 'Links',
    icon: (
      <Icon>
        <path d="M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1L11.5 4.5" />
        <path d="M14 11a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.5-1.4" />
      </Icon>
    ),
  },
  /*
   * Beside Links rather than under Settings: both are about how URLs on this
   * site resolve, and a redirect is content work — the person fixing a moved
   * post is not the person configuring the site.
   */
  {
    href: '/redirects',
    label: 'Redirects',
    icon: (
      <Icon>
        <path d="M4 17h11a4 4 0 0 0 0-8H7" />
        <path d="m10 6 3 3-3 3" />
      </Icon>
    ),
  },
  {
    href: '/media',
    label: 'Media',
    icon: (
      <Icon>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="8.5" cy="9.5" r="1.5" />
        <path d="m4 17 5-5 4 4 2.5-2.5L20 17" />
      </Icon>
    ),
  },
  {
    href: '/authors',
    label: 'Authors',
    icon: (
      <Icon>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </Icon>
    ),
  },
  /*
   * Below Authors rather than under Posts, though it only appears on posts: an
   * offer outlives the article it runs on and is aimed at a category or a tag
   * as often as at one post, so filing it inside Posts would put it under the
   * narrowest of the things it targets.
   */
  {
    href: '/lead-magnets',
    label: 'Lead magnets',
    icon: (
      <Icon>
        {/* A horseshoe magnet: the outer arc, the inner one, and the two poles. */}
        <path d="M4 4h5v8a3 3 0 0 0 6 0V4h5v8a8 8 0 0 1-16 0z" />
        <path d="M4 9h5M15 9h5" />
      </Icon>
    ),
    children: [
      { href: '/lead-magnets', label: 'All Offers' },
      { href: '/lead-magnets/new', label: 'Add New' },
    ],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (
      <Icon>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.2a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4Z" />
      </Icon>
    ),
  },
];

/**
 * Which section a path belongs to.
 *
 * `/terms` lives under Posts and `/pages/coded` under Pages, so this cannot be
 * a prefix match on the section href alone — it checks the children too. The
 * longest matching href wins, which keeps `/pages/coded` out of `/pages`.
 */
function isSectionActive(section: NavSection, pathname: string): boolean {
  const hrefs = [section.href, ...(section.children ?? []).map((child) => child.href)];
  return hrefs.some((href) => pathname === href || pathname.startsWith(`${href}/`));
}

function isChildActive(href: string, pathname: string, siblings: NavChild[]): boolean {
  if (pathname === href) return true;
  // A deeper path (/posts/<id>) belongs to the longest sibling it starts with,
  // so "Add New" does not light up while you are editing an existing post.
  if (!pathname.startsWith(`${href}/`)) return false;
  return !siblings.some(
    (sibling) =>
      sibling.href.length > href.length &&
      (pathname === sibling.href || pathname.startsWith(`${sibling.href}/`)),
  );
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto py-2">
      <ul className="flex flex-col">
        {SECTIONS.map((section) => {
          const active = isSectionActive(section, pathname);

          return (
            <li key={section.href}>
              <Link
                href={section.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm no-underline transition-colors ${
                  active
                    ? 'bg-[var(--color-wp-nav-active)] font-semibold text-white'
                    : 'text-[var(--color-wp-nav-ink)] hover:bg-white/5 hover:text-white'
                }`}
              >
                {section.icon}
                {section.label}
              </Link>

              {active && section.children ? (
                <ul className="bg-[var(--color-wp-nav-sub)] py-1.5">
                  {section.children.map((child) => {
                    const childActive = isChildActive(
                      child.href,
                      pathname,
                      section.children ?? [],
                    );
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          aria-current={childActive ? 'page' : undefined}
                          className={`block py-1.5 pl-[3.1rem] pr-4 text-[0.8125rem] no-underline transition-colors ${
                            childActive
                              ? 'font-semibold text-white'
                              : 'text-[var(--color-wp-nav-ink)] hover:text-white'
                          }`}
                        >
                          {child.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
