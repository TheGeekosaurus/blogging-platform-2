import Link from 'next/link';

/**
 * The top of a screen: what you are looking at, optionally a sentence about it,
 * and optionally one control.
 *
 * WHY THIS EXISTS. The class string `text-xl font-semibold tracking-tight` was
 * copy-pasted onto an <h1> twenty-four times, and the flex row around it seven
 * times. Both are one decision — how a page announces itself — recorded in
 * twenty-four places, so changing it meant changing twenty-four files and
 * missing one. The two screens that had already drifted (Keywords and Roadmap
 * carry a bare <h1> with no wrapper, Links uses `items-baseline`) are the
 * evidence that it was already happening.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It takes no `className`, and the actions
 * slot is an arbitrary node rather than a `buttonLabel`/`buttonHref` pair. A
 * header either looks like every other header or it is not this component;
 * giving it an escape hatch would let the drift back in through the prop.
 */
export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  /** One sentence under the title. Prose, so it takes a node, not a string. */
  description?: React.ReactNode;
  /** The right-hand slot: usually one `btn btn-primary` link. */
  actions?: React.ReactNode;
  /** For a screen reached from a list, e.g. Built in Code under Pages. */
  back?: { href: string; label: string };
}) {
  return (
    <header>
      {back ? (
        <Link
          href={back.href}
          className="mb-2 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[14px] w-[14px]"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          {back.label}
        </Link>
      ) : null}

      {/*
        `items-center`, not `items-baseline`. Links used baseline, which is
        right when the right-hand slot is text and wrong when it is a button:
        aligning a button's label baseline to the heading's drops the whole
        control a few pixels below centre. Centre is correct for the common
        case, and text in the slot reads fine either way.
      */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>

      {description ? (
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">{description}</p>
      ) : null}
    </header>
  );
}
