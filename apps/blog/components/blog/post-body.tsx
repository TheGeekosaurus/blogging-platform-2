import { splitBodyIntoBlocks, type CtaBlockView } from '@blog/core';
import { CtaBlock, CtaLinkButton } from '@blog/ui';

import { CtaEmailForm } from './cta-email-form';

/**
 * A post body, with its in-content CTA blocks rendered as components.
 *
 * The body used to be one `dangerouslySetInnerHTML`. It cannot stay that way
 * now that a block can be a capture form with its own state — so the HTML is
 * split around the markers an author inserted, and each run is echoed out as
 * before with a real component between them.
 *
 * A marker whose block is MISSING — deleted, deactivated, or renamed — renders
 * nothing at all. Not a placeholder and not an error: a published article is
 * read by people who do not know an offer was retired, and the worst outcome
 * here is a hole in the middle of a paragraph where a card used to be.
 */
export function PostBody({
  html,
  blocks,
}: {
  html: string;
  blocks: Map<string, CtaBlockView>;
}) {
  const segments = splitBodyIntoBlocks(html);

  return (
    <div className="post-body">
      {segments.map((segment, index) => {
        if (segment.kind === 'html') {
          return (
            /*
             * `display: contents` so this wrapper is not a box.
             *
             * `.post-body > *` carries the vertical rhythm and the reading
             * measure, and wrapping runs of prose in real divs would hand both
             * to the wrapper instead of to the paragraphs inside it — the
             * article would lose its spacing and run full width.
             */
            <div
              key={index}
              style={{ display: 'contents' }}
              dangerouslySetInnerHTML={{ __html: segment.html }}
            />
          );
        }

        const block = blocks.get(segment.slug);
        if (!block) return null;

        return (
          <CtaBlock
            key={index}
            block={block}
            action={
              block.kind === 'email' ? (
                <CtaEmailForm block={block} />
              ) : (
                <CtaLinkButton block={block} />
              )
            }
          />
        );
      })}
    </div>
  );
}
