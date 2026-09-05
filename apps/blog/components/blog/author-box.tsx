import Image from 'next/image';

import {
  mediaPublicUrl,
  socialLinks,
  type Byline,
  type SocialPlatform,
} from '@blog/core';

/**
 * The "About the author" block at the foot of a post.
 *
 * Rendered only when the post has an author RECORD. A post with just a
 * free-text byline gets nothing: a box holding one name, an empty photo frame
 * and no bio advertises missing data rather than building the credibility the
 * block exists for. Imported posts keep their byline under the title, which is
 * all they have to say.
 *
 * Icons are inline SVG. Five glyphs is not worth an icon dependency, and the
 * theme control and contents chevron already set that precedent.
 */
const ICONS: Record<SocialPlatform, React.ReactNode> = {
  facebook: (
    <path d="M13.5 9H12V7.5c0-.6.2-1 1-1h1V4.6c-.4 0-1-.1-1.7-.1-1.8 0-3 1.1-3 3.1V9H6.8v2.3h2.5V20h2.7v-8.7h1.9L14.2 9Z" />
  ),
  instagram: (
    <>
      <path d="M12 2.9c2.9 0 3.3 0 4.5.07 1.1.05 1.6.23 2 .38.5.2.9.44 1.3.83.4.4.63.78.83 1.28.15.4.33.9.38 2 .06 1.2.07 1.6.07 4.5s0 3.3-.07 4.5c-.05 1.1-.23 1.6-.38 2a3.4 3.4 0 0 1-.83 1.3 3.4 3.4 0 0 1-1.3.83c-.4.15-.9.33-2 .38-1.2.06-1.6.07-4.5.07s-3.3 0-4.5-.07c-1.1-.05-1.6-.23-2-.38a3.4 3.4 0 0 1-1.28-.83 3.4 3.4 0 0 1-.83-1.3c-.15-.4-.33-.9-.38-2C2.9 15.3 2.9 14.9 2.9 12s0-3.3.07-4.5c.05-1.1.23-1.6.38-2 .2-.5.44-.88.83-1.28.4-.39.78-.63 1.28-.83.4-.15.9-.33 2-.38C8.7 2.9 9.1 2.9 12 2.9Zm0 1.8c-2.85 0-3.2.01-4.34.06-.87.04-1.3.18-1.6.29-.4.15-.68.34-.98.64-.3.3-.49.58-.64.98-.11.3-.25.73-.29 1.6C4.1 8.8 4.09 9.15 4.09 12s.01 3.2.06 4.34c.04.87.18 1.3.29 1.6.15.4.34.68.64.98.3.3.58.49.98.64.3.11.73.25 1.6.29 1.14.05 1.49.06 4.34.06s3.2-.01 4.34-.06c.87-.04 1.3-.18 1.6-.29.4-.15.68-.34.98-.64.3-.3.49-.58.64-.98.11-.3.25-.73.29-1.6.05-1.14.06-1.49.06-4.34s-.01-3.2-.06-4.34c-.04-.87-.18-1.3-.29-1.6a2.6 2.6 0 0 0-.64-.98 2.6 2.6 0 0 0-.98-.64c-.3-.11-.73-.25-1.6-.29C15.2 4.71 14.85 4.7 12 4.7Z" />
      <path d="M12 15.03a3.03 3.03 0 1 1 0-6.06 3.03 3.03 0 0 1 0 6.06Zm0-7.7a4.67 4.67 0 1 0 0 9.34 4.67 4.67 0 0 0 0-9.34Zm5.95-.19a1.09 1.09 0 1 1-2.18 0 1.09 1.09 0 0 1 2.18 0Z" />
    </>
  ),
  x: (
    <path d="M17.2 3h2.9l-6.35 7.26L21 21h-5.9l-4.2-5.5L6.1 21H3.2l6.6-7.55L3 3h5.9l4 5.25L17.2 3Zm-1.05 16.2h1.6L7.9 4.7H6.2l9.95 14.5Z" />
  ),
  youtube: (
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77C22 15.2 22 12 22 12s0-3.2-.4-4.8ZM10 15.2V8.8L15.5 12 10 15.2Z" />
  ),
  linkedin: (
    <>
      <path d="M6.94 5.5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0ZM6.6 8.9H3.4V20h3.2V8.9Z" />
      <path d="M9.2 8.9h3.06v1.52h.04a3.35 3.35 0 0 1 3.02-1.66c3.23 0 3.83 2.13 3.83 4.89V20h-3.2v-5.5c0-1.31-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V20H9.2V8.9Z" />
    </>
  ),
};

const LABELS: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  x: 'X',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
};

export function AuthorBox({ byline }: { byline: Byline }) {
  // Filtered a second time here, not only on save: this is the last gate before
  // a stored value becomes an href, and the admin is not the only way a row can
  // be written.
  const socials = socialLinks(byline.social);

  return (
    <section
      aria-labelledby="author-box-heading"
      className="mt-12 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-6 sm:p-8"
    >
      <div className="flex flex-col gap-6 sm:flex-row">
        {byline.avatar ? (
          <Image
            src={mediaPublicUrl(byline.avatar.storage_path)}
            alt={byline.avatar.alt ?? ''}
            width={280}
            height={280}
            /* Square rather than round: the reference uses a portrait crop, and
               a larger circle starts to read as an avatar chip. */
            className="h-32 w-32 shrink-0 rounded-lg object-cover sm:h-36 sm:w-36"
          />
        ) : null}

        <div className="min-w-0">
          <h2
            id="author-box-heading"
            className="text-sm font-semibold text-[var(--color-ink-muted)]"
          >
            About the author
          </h2>

          <p className="mt-1 text-xl font-semibold text-[var(--color-accent)]">
            {byline.name}
          </p>

          {byline.title ? (
            <p className="mt-0.5 text-[var(--color-ink)]">{byline.title}</p>
          ) : null}

          {byline.bio ? (
            <p className="mt-3 text-sm leading-[1.7] text-[var(--color-ink-muted)]">
              {byline.bio}
            </p>
          ) : null}

          {socials.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="text-sm text-[var(--color-ink-muted)]">
                Follow the expert:
              </span>

              <ul className="flex list-none items-center gap-2.5">
                {socials.map(({ platform, url }) => (
                  <li key={platform}>
                    <a
                      href={url}
                      target="_blank"
                      /* noreferrer as well as noopener: these are the author's
                         own profiles, but the target is still a third party. */
                      rel="noopener noreferrer me"
                      className="flex h-8 w-8 items-center justify-center rounded-md !text-[var(--color-ink-muted)] no-underline transition-colors hover:!text-[var(--color-accent)]"
                    >
                      <span className="sr-only">{`${byline.name} on ${LABELS[platform]}`}</span>
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="h-[18px] w-[18px]"
                        fill="currentColor"
                      >
                        {ICONS[platform]}
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
