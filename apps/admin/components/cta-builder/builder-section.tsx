'use client';

/**
 * One group of controls in the builder's sidebar, as a card that opens.
 *
 * CONTROLLED, not a <details>, and that is not a stylistic preference. The
 * builder has to be able to OPEN a section it did not open itself: a field
 * inside a closed section can fail validation, and a browser reporting
 * "please fill in this field" while pointing at nothing is worse than no
 * validation at all. See the invalid handler in cta-builder.tsx.
 *
 * The open body sits on a tint with white controls, rather than white on
 * white. It is the one thing that makes a long sidebar readable at a glance:
 * the section you are working in is a different colour from the seven you are
 * not.
 */
export function BuilderSection({
  id,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  /** A word or two on the right of the header: the current choice, usually. */
  summary?: string;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section data-section={id} className={`builder-section ${open ? 'is-open' : ''}`}>
      <h3>
        <button
          type="button"
          onClick={() => onToggle(id)}
          aria-expanded={open}
          aria-controls={`${id}-body`}
          className="builder-section-head"
        >
          <span className="builder-section-title">{title}</span>
          {summary && !open ? (
            <span className="builder-section-summary">{summary}</span>
          ) : null}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`builder-chevron ${open ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </h3>

      {/*
        `hidden` rather than unmounting: an unmounted control is not in the
        form, so closing a section would silently drop every value in it on
        save. This is a form, not a tab strip.
      */}
      <div id={`${id}-body`} hidden={!open} className="builder-section-body">
        {children}
      </div>
    </section>
  );
}
