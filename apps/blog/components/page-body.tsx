import type { PageRow } from '@blog/core';

/**
 * Renders a page's stored HTML.
 *
 * `content_html` was sanitised on write by sanitizePageHtml, so this is a plain
 * string echo — no client JavaScript and no per-request sanitisation.
 *
 * The template decides the wrapper, and that is the whole point of the column:
 * a marketing page carries its own layout and CSS, so wrapping it in the blog's
 * typographic container would fight it.
 */
export function PageBody({ page }: { page: Pick<PageRow, 'content_html' | 'template'> }) {
  if (page.template === 'full') {
    return <div dangerouslySetInnerHTML={{ __html: page.content_html }} />;
  }

  return (
    <div className="post-body" dangerouslySetInnerHTML={{ __html: page.content_html }} />
  );
}
