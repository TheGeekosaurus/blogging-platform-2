/**
 * A labelled control, with the hint under it.
 *
 * There were two label styles in the admin and the wrong one won: `.label` is
 * defined in globals.css and was used twice, while `block text-sm font-medium`
 * — the same thing, spelled out — was used about fifty times across twelve
 * files. So the component class existed, was correct, and lost to copy-paste.
 *
 * The CONTROL is a child rather than a prop, because the admin has text
 * inputs, selects, textareas, a tag picker and a file input in this position,
 * and a `type` prop broad enough to cover them would be a worse API than
 * writing the input.
 *
 * `htmlFor` and the control's `id` still have to agree — this cannot generate
 * one, because the caller needs the id for the control and sometimes for a
 * `name` too. It is the one thing to get right at each call site.
 */
export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor: string;
  /** Rendered under the control. Prose, so it takes a node. */
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint ? <p className="hint mt-1">{hint}</p> : null}
    </div>
  );
}
