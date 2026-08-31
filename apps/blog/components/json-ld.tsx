import { categoryPath, pageUrl, type PostDetail, type SiteRow } from '@blog/core';

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
    ...(post.author_name
      ? { author: { '@type': 'Person', name: post.author_name } }
      : {}),
    publisher: { '@type': 'Organization', name: site.name, url: pageUrl(site, '/') },
    ...(post.reading_minutes ? { timeRequired: `PT${post.reading_minutes}M` } : {}),
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: site.name, item: pageUrl(site, '/') },
      ...(category
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: category.name,
              item: pageUrl(site, categoryPath(category.slug)),
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: category ? 3 : 2,
        name: post.title,
        item: url,
      },
    ],
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
