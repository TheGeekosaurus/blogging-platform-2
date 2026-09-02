import { ThemeToggle } from '@/components/blog/theme-toggle';

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
export function ReadingColumn({
  children,
  themeToggle = true,
}: {
  children: React.ReactNode;
  /**
   * Whether to render the theme control at the foot of the column.
   *
   * The stored preference applies to every /blog page — it has to, or the index
   * would contradict the post you just came from — so each of these pages needs
   * a way to switch, or a reader could only change it from inside a post.
   *
   * The index opts out: it puts the control beside its own headline, and two
   * controls on one page would not just look wrong, they would be two radio
   * groups fighting over the same setting.
   */
  themeToggle?: boolean;
}) {
  return (
    <div className="blog-surface">
      <div className="mx-auto w-full max-w-3xl px-5 py-10">
        {children}

        {themeToggle ? (
          <div className="mt-14 border-t border-[var(--color-line)] pt-8">
            <ThemeToggle />
          </div>
        ) : null}
      </div>
    </div>
  );
}
