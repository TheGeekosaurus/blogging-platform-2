/**
 * The SocialJuice review wall used by the live site's TESTIMONIALS section.
 *
 * Verified frameable: the embed URL returns 200 with no X-Frame-Options and no
 * frame-ancestors directive, so it embeds directly with no wrapper script.
 */
export function TestimonialWall() {
  return (
    <iframe
      src="https://embed.socialjuice.io/wall/9690?s=nntm-capital"
      title="Customer reviews"
      loading="lazy"
      className="w-full border-0"
      style={{ height: 620 }}
    />
  );
}
