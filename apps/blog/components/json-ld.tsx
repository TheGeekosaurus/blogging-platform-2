import {
  buildPostSchemas,
  postAuthorName,
  readSnippets,
  serializeJsonLd,
  type PostDetail,
  type SchemaNode,
  type SiteRow,
} from '@blog/core';

/**
 * Structured data, as JSON-LD script tags.
 *
 * Emitted as JSON-LD rather than microdata so the markup stays clean. The
 * nodes themselves are built and validated in @blog/core — this file is only
 * the boundary where they become HTML, which is why the escaping lives there
 * with tests around it rather than here as a private helper.
 *
 * One script per node, not one `@graph`. A malformed node then costs exactly
 * itself: a consumer that chokes on the FAQ an author just pasted still reads
 * the BlogPosting. Sharing one script would put every node on the page behind
 * the worst one on it.
 */
export function JsonLd({ nodes }: { nodes: SchemaNode[] }) {
  if (nodes.length === 0) return null;

  return (
    <>
      {nodes.map((node, index) => (
        <script
          // Index keys: this list is render-time output with no identity of its
          // own, never reordered and never re-keyed by anything else.
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(node) }}
        />
      ))}
    </>
  );
}

export function PostJsonLd({
  site,
  post,
  description,
  imageUrl,
}: {
  site: SiteRow;
  post: PostDetail;
  description: string;
  /*
   * Built by the page, which has SUPABASE_URL. Passing it rather than calling
   * mediaPublicUrl inside the schema builder is what keeps that builder
   * importable from the admin's client-side editor panel.
   */
  imageUrl?: string | null;
}) {
  const generated = buildPostSchemas({
    site,
    post,
    author: postAuthorName(post),
    description,
    imageUrl,
    category: post.categories[0],
  });

  /*
   * Generated first, then the author's own.
   *
   * Additive on purpose: a snippet added in the editor never replaces the
   * BlogPosting or the breadcrumbs, which is why the editor panel lists those
   * two as already handled. An author who genuinely wants to override one can
   * emit their own node of the same type — later nodes are what a consumer
   * sees last — but nothing here silently drops the generated pair.
   */
  return <JsonLd nodes={[...generated, ...readSnippets(post.structured_data)]} />;
}
