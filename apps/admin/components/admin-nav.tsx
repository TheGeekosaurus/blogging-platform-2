'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * The left rail, laid out the way WordPress lays its own out: one column of
 * sections, each with a submenu that opens when you are inside that section.
 *
 * WHY A CLIENT COMPONENT. The active section is a function of the current path,
 * and a server component cannot read it — the alternative is threading a
 * pathname prop down from every route, which is a change to eight files to
 * avoid one small boundary. Nothing else here is stateful: no hover menus, no
 * toggles, no effects.
 *
 * WordPress opens a submenu on hover as well as on section. That is deliberately
 * not copied: a hover-only menu is unusable by keyboard and on touch, and the
 * two-level structure is shallow enough that showing the current section's
 * children is enough to navigate by.
 *
 * NO "ADD NEW" CHILDREN, which WordPress does have and this used to copy.
 * Denis, 2026-10-08: "why do we even have 'add new' submenus? It just doesn't
 * make sense, it should just be a button in the page directly to create new."
 * Every one of those four routes already had that button — "New post", "New
 * page", "New block", "New campaign" — and /authors/new had always worked that
 * way with no nav child at all, so the submenus were a second door onto a page
 * that already had one.
 *
 * The same reasoning removed "All Posts", "All Pages", "All Blocks" and "All
 * Campaigns": each pointed at the href of the section heading directly above
 * it. What is left as a child is what is genuinely somewhere else — Categories
 * & Tags at /terms, and Built in Code at /pages/coded, neither of which has
 * another way in from the rail.
 */

type NavChild = { href: string; label: string };
type NavSection = {
  href: string;
  label: string;
  icon: React.ReactNode;
  children?: NavChild[];
  /**
   * A small-caps heading rendered ABOVE this section.
   *
   * Grouping, not new navigation. The rail had grown to nine sections in one
   * undifferentiated column, which is the length at which a list stops being
   * scannable and starts being read top to bottom every time. These are the
   * boundaries that were already implicit in the order.
   */
  group?: string;
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
    group: 'Content',
    href: '/posts',
    label: 'Posts',
    icon: (
      <Icon>
        <path d="M4 5h16M4 10h16M4 15h10" />
        <path d="M14 19l2-2 4 4-2 2z" />
      </Icon>
    ),
    children: [{ href: '/terms', label: 'Categories & Tags' }],
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
    children: [{ href: '/pages/coded', label: 'Built in Code' }],
  },
  /*
   * Its own section rather than a child of Posts or Pages: it reads the body of
   * both and reports across them, so filing it under either would hide it from
   * someone working in the other.
   */
  {
    group: 'Structure',
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
  /*
   * One SEO section with two children, sitting above Media because it is
   * upstream of everything below it: the research decides what gets written,
   * and the roadmap says where each page has got to. Keywords first — a page
   * exists there before it reaches the roadmap, and the rail reads in that
   * order.
   */
  {
    group: 'Planning',
    href: '/keywords',
    label: 'SEO',
    icon: (
      <Icon>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </Icon>
    ),
    children: [
      { href: '/keywords', label: 'Keywords' },
      { href: '/roadmap', label: 'Roadmap' },
    ],
  },
  {
    group: 'Library',
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
    // "CTAs", because an email capture is now one KIND of block among several
    // and most of them are links. The ROUTE stays /lead-magnets: renaming it
    // would break every bookmark and in-app link for a label change, and the
    // table it reads is still called lead_magnets for the reasons 0016 gives.
    label: 'CTAs',
    icon: (
      <Icon>
        {/* A horseshoe magnet: the outer arc, the inner one, and the two poles. */}
        <path d="M4 4h5v8a3 3 0 0 0 6 0V4h5v8a8 8 0 0 1-16 0z" />
        <path d="M4 9h5M15 9h5" />
      </Icon>
    ),
  },
  {
    href: '/social-proof',
    label: 'Social proof',
    icon: (
      <Icon>
        {/* A toast in the corner of a page: the page, then the card. */}
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <rect x="6" y="13" width="10" height="4" rx="2" />
      </Icon>
    ),
  },
  /*
   * Settings is NOT here. It sits in the account panel at the foot of the rail
   * with the site switcher and Sign out — see components/account-menu.tsx. The
   * three of them are what you do TO the workspace, and this list is where you
   * go inside it. Removing it took the `Configuration` group with it, which was
   * a heading introducing one item.
   */
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

/*
 * A plain prefix match, which it was NOT until the submenus were thinned.
 *
 * It used to walk the siblings and give a deep path to the longest href that
 * matched it, for two pairs that no longer exist: "Add New" at /posts/new,
 * which would otherwise light up while you edited an existing post, and
 * "All Pages" at /pages, which /pages/coded starts with. Both are gone — no
 * child is a prefix of a sibling any more, so there is nothing left to
 * disambiguate.
 *
 * IF YOU ADD A CHILD THAT IS A PREFIX OF ANOTHER, this has to go back to the
 * longest-match version, or both will be marked current at once. Git has it.
 */
function isChildActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-3">
      <ul className="flex flex-col gap-0.5">
        {SECTIONS.map((section) => {
          const active = isSectionActive(section, pathname);

          return (
            <li key={section.href}>
              {/*
                The heading is rendered inside the <li> of the section it
                introduces rather than as an <li> of its own, so the list stays
                a list of navigation items — a bare text <li> among links is an
                item a screen reader counts and cannot go to.
              */}
              {section.group ? (
                <p role="presentation" className="rail-heading">
                  {section.group}
                </p>
              ) : null}

              <Link
                href={section.href}
                aria-current={active ? 'page' : undefined}
                className={`rail-link ${active ? 'rail-link-active' : ''}`}
              >
                {section.icon}
                {section.label}
              </Link>

              {active && section.children ? (
                <ul className="mt-0.5 flex flex-col gap-0.5">
                  {section.children.map((child) => {
                    const childActive = isChildActive(child.href, pathname);
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          aria-current={childActive ? 'page' : undefined}
                          className={`rail-sublink ${
                            childActive ? 'rail-sublink-active' : ''
                          }`}
                        >
                          <span aria-hidden="true" className="rail-dot" />
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
