/**
 * The centred reading column for blog index and archive pages.
 *
 * Not in `app/blog/layout.tsx`, because a layout wraps every route beneath it
 * and the post page is a full-bleed two-column design — a child cannot opt out
 * of a parent layout's container. Same reason the site-wide container moved out
 * of the root layout when the marketing pages arrived: routes that want the
 * column ask for it.
 *
 * Carries `blog-surface` so the index and archives share the post page's dark
 * ground. Without it the blog would be half dark and half light depending on
 * which page you landed on.
 */
export function ReadingColumn({ children }: { children: React.ReactNode }) {
  return (
    <div className="blog-surface">
      <div className="mx-auto w-full max-w-3xl px-5 py-10">{children}</div>
    </div>
  );
}
