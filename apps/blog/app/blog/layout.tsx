/**
 * Pass-through.
 *
 * This layout used to supply the reading column for everything under /blog. The
 * post page is now a full-bleed two-column design, and a route cannot escape an
 * ancestor layout's wrapper — so the column moved into <ReadingColumn>, applied
 * by the index and archive routes that want it.
 *
 * Kept as a file rather than deleted: /blog is where a blog-wide concern would
 * belong if one appears (a shared breadcrumb, a feed <link>), and re-adding a
 * layout later is easy to get wrong in exactly the way described above.
 */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
