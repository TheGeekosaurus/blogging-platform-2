/**
 * The list table, and the card it floats in.
 *
 * The `.data-table` class already kept the seven list screens from drifting
 * apart — its own comment in globals.css says so. What it could not keep
 * together is everything AROUND the table: the card, the `overflow-x-auto`
 * that stops a wide table pushing the page sideways, and the top margin. Those
 * were retyped on every screen, and two screens already carry a paragraph of
 * comment each explaining the same `overflow-x-auto` decision.
 *
 * THIS DOES NOT OWN CELLS, and that is the point. A generic table that takes
 * `columns={[{key, header, render}]}` would funnel every cell through a render
 * callback, and the cells here are genuinely different — a thumbnail beside a
 * link, a chip, a right-aligned count, a <code>. The markup is not the
 * duplication; the chrome is. So callers still write their own thead and
 * tbody, and get the chrome for free.
 */
export function DataTable({
  children,
  card = true,
  className,
}: {
  children: React.ReactNode;
  /**
   * False for a table already inside a section — the leads list on a CTA, and
   * the rules list on Redirects, both of which sit under an <h2> on a surface
   * that is already a card. Wrapping those again would draw a box inside a box.
   */
  card?: boolean;
  className?: string;
}) {
  const table = (
    <table className={`data-table ${card ? '' : 'mt-3'} ${className ?? ''}`}>
      {children}
    </table>
  );

  if (!card) return table;
  return <div className="card mt-6 overflow-x-auto">{table}</div>;
}
