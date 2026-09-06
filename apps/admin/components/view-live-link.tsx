/**
 * "Open on the live site" — the icon at the end of a row in the Pages and
 * Posts lists.
 *
 * Two things this deliberately does not do:
 *
 * 1. It does not render for a row that is not live. A draft, a scheduled post
 *    and a page dated in the future all 404 on the blog, and an icon that
 *    silently leads to a 404 is worse than no icon — the author cannot tell
 *    whether the link is broken or their content is. Callers gate on isLive()
 *    from @blog/core, which is the same rule the public queries filter on.
 *
 * 2. It is not icon-ONLY to a screen reader. `<a>` with nothing but an inline
 *    SVG inside announces as "link" and nothing else. The label is real text,
 *    visually hidden, and it names the row so a list of twenty of these is
 *    twenty distinct links rather than twenty identical ones. `title` gives
 *    sighted users the same thing on hover.
 */
export function ViewLiveLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  /*
   * Positioning is the caller's, not this component's. A row that already has
   * an `ml-auto` element (the Posts list pushes its date right) would otherwise
   * have two auto margins splitting the free space between them instead of one
   * pushing everything over.
   */
  className?: string;
}) {
  const text = `Open ${label} on the live site`;

  return (
    <a
      href={href}
      target="_blank"
      /*
       * noreferrer alongside noopener: target="_blank" otherwise hands the
       * opened page a window.opener handle back into the admin.
       */
      rel="noopener noreferrer"
      title={text}
      className={`shrink-0 rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 ${className ?? ''}`}
    >
      <span className="sr-only">{text}</span>
      <ExternalLinkIcon />
    </a>
  );
}

/** Box with an arrow leaving it — the conventional "opens elsewhere" mark. */
function ExternalLinkIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.5 2.5H13.5V6.5" />
      <path d="M13.5 2.5 7.5 8.5" />
      <path d="M12.5 9.5v3a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3" />
    </svg>
  );
}
