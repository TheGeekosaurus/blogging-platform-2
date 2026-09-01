/**
 * The reading column for every blog route.
 *
 * This container used to live in the root layout, where it constrained the whole
 * site. Marketing pages need the full viewport, so it moved down here — the net
 * effect for /blog/** is nil, which is what the layout test keeps true.
 */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-3xl px-5 py-10">{children}</div>;
}
