import {
  pageUrl,
  postAuthorName,
  postBreadcrumbs,
  type PostDetail,
  type SiteRow,
} from '@blog/core';

/**
 * Structured data for a post.
 *
 * Emitted as a JSON-LD script rather than microdata so the markup stays clean.
 * JSON.stringify output is escaped for `<` before injection — a title containing
 * `</script>` would otherwise break out of the tag.
 */
function serialize(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function PostJsonLd({
  site,
  post,
  description,
}: {
  site: SiteRow;
  post: PostDetail;
  description: string;
}) {
  const url = pageUrl(site, `/${post.slug}`);
  const category = post.categories[0];
  const author = postAuthorName(post);

  const article = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seo_title ?? post.title,
    description,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    inLanguage: site.locale,
    ...(author
      ? { author: { '@type': 'Person', name: author } }
      : {}),
    publisher: { '@type': 'Organization', name: site.name, url: pageUrl(site, '/') },
    ...(post.reading_minutes ? { timeRequired: `PT${post.reading_minutes}M` } : {}),
  };

  /*
   * Built from `postBreadcrumbs`, the same call the visible trail on the page
   * makes. Hand-writing this list again is how the markup and the structured
   * data end up describing different trails.
   */
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: postBreadcrumbs(site, post, category).map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: pageUrl(site, crumb.path),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(article) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialize(breadcrumb) }}
      />
    </>
  );
}
