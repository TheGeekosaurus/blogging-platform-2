/**
 * What a screen says when it has nothing to show.
 *
 * Every list had one of these and no two agreed: `mt-10 text-ink-muted`,
 * `mt-6 text-sm text-ink-muted`, `mt-2 text-sm text-ink-muted`. Same sentence
 * shape, three sizes and three spacings, so the pages looked subtly unlike
 * each other at exactly the moment a new user sees them for the first time.
 *
 * The WORDS stay with the page, because they are specific and should be:
 * "No posts match" after a filter is a different message from "None yet", and
 * flattening them into a `noun` prop would produce the generic "No items
 * found" that tells nobody anything.
 */
export function EmptyState({
  children,
  tight = false,
}: {
  children: React.ReactNode;
  /** For an empty state nested in a section rather than under a page header. */
  tight?: boolean;
}) {
  return (
    <p className={`${tight ? 'mt-3' : 'mt-6'} text-sm text-ink-muted`}>{children}</p>
  );
}
