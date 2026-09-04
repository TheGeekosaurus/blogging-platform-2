import type { SchemaNode, SiteRow, TermRow } from './database.types';
import { postBreadcrumbs } from './breadcrumbs';
import { pageUrl, postPath } from './urls';

/**
 * Schema.org structured data: templates, validation, and the nodes the blog
 * generates on its own.
 *
 * Deliberately free of `process.env` and of any import that reaches it, so a
 * `'use client'` component can pull SCHEMA_TEMPLATES and parseSnippet straight
 * out of @blog/core. That is the SOCIAL_PLATFORMS arrangement — the list of
 * platforms lives in core and drives the admin form, its validation and the
 * renderer, so the three cannot disagree. See apps/admin/__tests__/client-env
 * .test.ts for what happens when a client component reaches an env var.
 *
 * Two boundaries matter here and they are not the same boundary:
 *
 *   parseSnippet  — write time. Rejects, with a message an author can act on.
 *   readSnippets  — read time. Never rejects; drops what it cannot use.
 *
 * Write-time validation cannot be the only check, because a row can also
 * arrive from an import, a SQL editor, or a version of this code that
 * validated less. Read time is what stands between a stored value and a
 * `<script>` tag, exactly as socialLinks() stands between a stored
 * `javascript:` URL and an `href`.
 */

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

/*
 * These pages are statically generated, so a snippet is not fetched on demand —
 * it is inlined into the HTML every reader downloads, forever. A stray paste of
 * a whole product catalogue would be invisible in the admin and permanent on
 * the page, which is why there is a ceiling at all.
 */

export const MAX_SNIPPETS = 20;
export const MAX_SNIPPET_BYTES = 16 * 1024;
export const MAX_TOTAL_BYTES = 64 * 1024;

const CONTEXT = 'https://schema.org';

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function isPlainObject(value: unknown): value is SchemaNode {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Human-readable size, for an error an author has to act on.
 *
 * "16 KB" beats "16384 bytes" when the next step is deciding what to cut.
 */
function describeBytes(bytes: number): string {
  return bytes < 1024 ? `${bytes} bytes` : `${Math.round(bytes / 1024)} KB`;
}

// ---------------------------------------------------------------------------
// Reading a stored node
// ---------------------------------------------------------------------------

/**
 * The `@type` of a node, for a panel header or an error message.
 *
 * schema.org allows an array of types on one node, which is rare but legal, so
 * this joins rather than picking the first — a node typed both Product and
 * Book should not be labelled as only one of them.
 */
export function snippetLabel(node: SchemaNode): string {
  const type = node['@type'];

  if (typeof type === 'string' && type.trim()) return type.trim();

  if (Array.isArray(type)) {
    const names = type.filter((item): item is string => typeof item === 'string' && !!item.trim());
    if (names.length > 0) return names.join(' + ');
  }

  return 'Untyped';
}

/**
 * Everything usable in a stored `structured_data` value.
 *
 * Total permissiveness about the CONTENTS of a node is intentional — schema.org
 * is open-ended and this cannot know which properties a type wants. What it
 * does guarantee is the only thing the renderer relies on: an array of plain
 * objects, none of them carrying its own `@context`, and no more of them than
 * the budget allows.
 */
export function readSnippets(value: unknown): SchemaNode[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(isPlainObject)
    .slice(0, MAX_SNIPPETS)
    .map((node) => {
      // Stripped rather than kept: the renderer adds one per script tag, and a
      // stored '@context' would either duplicate it or override it with
      // something else.
      const { '@context': _context, ...rest } = node;
      return rest;
    });
}

// ---------------------------------------------------------------------------
// Parsing what an author typed
// ---------------------------------------------------------------------------

export type ParsedSnippet =
  | { ok: true; node: SchemaNode; label: string }
  | { ok: false; error: string };

/**
 * Validate one snippet as an author typed it.
 *
 * Called from BOTH the admin panel (for the live "valid" line) and the server
 * action (for the actual gate). That is the point of it living here: a panel
 * with its own rules would eventually call something valid that the action
 * then refuses, and the author would have no way to tell which was right.
 *
 * The rules are the ones a JSON-LD node cannot function without:
 *
 *   - it parses,
 *   - it is a single object, not an array or a bare value,
 *   - it has an `@type`.
 *
 * Nothing beyond that. Whether a Product needs an `offers` is Google's rule,
 * not ours, and it changes without warning — enforcing it here would block
 * markup that is perfectly valid for some other consumer.
 */
export function parseSnippet(text: string): ParsedSnippet {
  const trimmed = text.trim();

  if (!trimmed) return { ok: false, error: 'This snippet is empty.' };

  const size = byteLength(trimmed);
  if (size > MAX_SNIPPET_BYTES) {
    return {
      ok: false,
      error:
        `This snippet is ${describeBytes(size)}, over the ` +
        `${describeBytes(MAX_SNIPPET_BYTES)} limit for one snippet.`,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Not valid JSON — ${message}` };
  }

  if (Array.isArray(parsed)) {
    return {
      ok: false,
      error: 'This is a list of nodes. Add them as separate snippets, one object each.',
    };
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, error: 'A snippet must be a JSON object, starting with {.' };
  }

  // Same strip as readSnippets, and for the same reason — but here it is a
  // silent fix rather than a rejection: pasting a node with its @context
  // still attached is what Google's own examples encourage.
  const { '@context': _context, ...node } = parsed;

  const label = snippetLabel(node);
  if (label === 'Untyped') {
    return {
      ok: false,
      error: 'A snippet needs an "@type", e.g. "@type": "FAQPage".',
    };
  }

  return { ok: true, node, label };
}

/**
 * The whole-record ceiling, checked after the individual snippets pass.
 *
 * Separate from parseSnippet because it is not a property of any one snippet:
 * twenty perfectly legal 4 KB nodes are twenty perfectly legal nodes and 80 KB
 * of markup on every page.
 */
export function checkSnippetBudget(nodes: SchemaNode[]): string | null {
  if (nodes.length > MAX_SNIPPETS) {
    return `That is ${nodes.length} snippets. The limit is ${MAX_SNIPPETS}.`;
  }

  const total = byteLength(JSON.stringify(nodes));
  if (total > MAX_TOTAL_BYTES) {
    return (
      `These snippets come to ${describeBytes(total)} together, over the ` +
      `${describeBytes(MAX_TOTAL_BYTES)} limit. They are inlined into every ` +
      `copy of the page, so this is a page-weight limit rather than a storage one.`
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/**
 * One node as the text of a `<script type="application/ld+json">`.
 *
 * This is the entire barrier at a dangerouslySetInnerHTML boundary, so it
 * escapes more than the one character that strictly matters:
 *
 *   <  — the one that does. `</script>` inside any string value would
 *        otherwise close the tag and turn the rest of the JSON into markup.
 *   >  — closes the `]]>` sequence, which matters if this is ever served as
 *        XHTML rather than HTML.
 *   &  — so an entity in the source cannot be re-interpreted before the JSON
 *        parser sees it.
 *   U+2028 / U+2029 — legal in JSON strings and illegal as raw characters in a
 *        JavaScript string. Harmless in ld+json, which is parsed as JSON, and
 *        a syntax error the moment anyone copies this helper for a script that
 *        is not. Cheap enough to just not have the trap.
 *
 * The escapes are all inside JSON string literals, so the parsed value is
 * byte-identical to the input either way.
 */
export function serializeJsonLd(node: SchemaNode): string {
  return JSON.stringify({ '@context': CONTEXT, ...node })
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

// ---------------------------------------------------------------------------
// The nodes the blog writes by itself
// ---------------------------------------------------------------------------

export interface PostSchemaInput {
  site: Pick<SiteRow, 'name' | 'base_url' | 'locale' | 'logo_url'>;
  post: {
    slug: string;
    title: string;
    seo_title: string | null;
    published_at: string;
    updated_at: string;
    reading_minutes: number | null;
  };
  /** Resolved through postAuthorName at the call site, never read off the post. */
  author: string | null;
  description: string;
  /**
   * The featured image, absolute.
   *
   * A parameter rather than something built here: mediaPublicUrl() reads
   * server-only SUPABASE_URL, and importing it would make this module unusable
   * from a client component — which is the whole reason the module is shaped
   * this way. Built where the variable exists, passed down as data.
   */
  imageUrl?: string | null;
  category?: Pick<TermRow, 'slug' | 'name'>;
}

/**
 * BlogPosting + BreadcrumbList for a post.
 *
 * Lifted out of apps/blog/components/json-ld.tsx so it can be tested, and so
 * AUTO_POST_SCHEMAS below can be checked against what is actually emitted
 * rather than describing it from memory.
 */
export function buildPostSchemas({
  site,
  post,
  author,
  description,
  imageUrl,
  category,
}: PostSchemaInput): SchemaNode[] {
  /*
   * postPath(), not '/' + slug.
   *
   * This was `pageUrl(site, `/${post.slug}`)`, which put a THIRD url on a page
   * that already had one: the canonical tag and the last breadcrumb item both
   * say /blog/<slug>/, and this said /<slug>/ — a path that belongs to the
   * page catch-all route and so resolves to some other page or to a 404.
   */
  const url = pageUrl(site, postPath(post.slug));

  const article: SchemaNode = {
    '@type': 'BlogPosting',
    headline: post.seo_title ?? post.title,
    description,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    inLanguage: site.locale,
    ...(author ? { author: { '@type': 'Person', name: author } } : {}),
    // Google's Article guidance asks for an image and a publisher logo, and
    // without them the rich result cannot be earned however correct the rest
    // is. Both were absent: logo_url was stored and read by nothing at all.
    ...(imageUrl ? { image: imageUrl } : {}),
    publisher: {
      '@type': 'Organization',
      name: site.name,
      url: pageUrl(site, '/'),
      ...(site.logo_url ? { logo: { '@type': 'ImageObject', url: absolutise(site, site.logo_url) } } : {}),
    },
    ...(post.reading_minutes ? { timeRequired: `PT${post.reading_minutes}M` } : {}),
  };

  /*
   * Built from `postBreadcrumbs`, the same call the visible trail on the page
   * makes. Hand-writing this list again is how the markup and the structured
   * data end up describing different trails.
   */
  const breadcrumb: SchemaNode = {
    '@type': 'BreadcrumbList',
    itemListElement: postBreadcrumbs(site, post, category).map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: pageUrl(site, crumb.path),
    })),
  };

  return [article, breadcrumb];
}

/** A stored logo may be a full URL or a site-relative path; accept either. */
function absolutise(site: Pick<SiteRow, 'base_url'>, value: string): string {
  return /^https?:\/\//i.test(value) ? value : pageUrl(site, value);
}

/**
 * What the admin panel tells an author is already handled.
 *
 * Here rather than in the component so a test can hold it against
 * buildPostSchemas — a panel that promises schema the blog stopped emitting is
 * worse than a panel that promises nothing, because the author acts on it by
 * not adding the snippet themselves.
 */
export const AUTO_POST_SCHEMAS: Array<{ type: string; summary: string }> = [
  {
    type: 'BlogPosting',
    summary: 'Headline, description, publish and updated dates, author, publisher, featured image.',
  },
  {
    type: 'BreadcrumbList',
    summary: 'The same trail shown above the title.',
  },
];

// ---------------------------------------------------------------------------
// Templates for the "+" menu
// ---------------------------------------------------------------------------

/**
 * Starting points, not schemas.
 *
 * Each is a real node with placeholder values, formatted the way the textarea
 * will show it. They exist so the common cases are two clicks and an edit
 * rather than a trip to schema.org, and 'custom' exists so the list never
 * becomes the limit on what can be added.
 *
 * `@context` is absent on purpose — the renderer adds it. An author who pastes
 * one anyway is fine; parseSnippet strips it.
 */
export interface SchemaTemplate {
  id: string;
  label: string;
  json: string;
}

function template(id: string, label: string, node: unknown): SchemaTemplate {
  return { id, label, json: JSON.stringify(node, null, 2) };
}

export const SCHEMA_TEMPLATES: SchemaTemplate[] = [
  template('faq', 'FAQ', {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'A question a reader actually asks',
        acceptedAnswer: { '@type': 'Answer', text: 'The answer, in plain prose.' },
      },
    ],
  }),
  template('howto', 'How-to', {
    '@type': 'HowTo',
    name: 'How to do the thing',
    totalTime: 'PT30M',
    step: [
      { '@type': 'HowToStep', name: 'First step', text: 'What to do.' },
      { '@type': 'HowToStep', name: 'Second step', text: 'What to do next.' },
    ],
  }),
  template('product', 'Product', {
    '@type': 'Product',
    name: 'Product name',
    description: 'One sentence.',
    brand: { '@type': 'Brand', name: 'Brand' },
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'CAD',
      availability: 'https://schema.org/InStock',
    },
  }),
  template('service', 'Service', {
    '@type': 'Service',
    name: 'Service name',
    serviceType: 'What kind of service',
    description: 'One sentence.',
    provider: { '@type': 'Organization', name: 'Your company' },
    areaServed: 'Canada',
  }),
  template('event', 'Event', {
    '@type': 'Event',
    name: 'Event name',
    startDate: '2026-01-01T18:00:00-05:00',
    endDate: '2026-01-01T21:00:00-05:00',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: 'Venue',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '1 Example St',
        addressLocality: 'Montreal',
        addressRegion: 'QC',
        postalCode: 'H0H 0H0',
        addressCountry: 'CA',
      },
    },
  }),
  template('video', 'Video', {
    '@type': 'VideoObject',
    name: 'Video title',
    description: 'One sentence.',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    uploadDate: '2026-01-01',
    duration: 'PT2M30S',
    contentUrl: 'https://example.com/video.mp4',
  }),
  template('organization', 'Organization', {
    '@type': 'Organization',
    name: 'Your company',
    url: 'https://example.com',
    logo: 'https://example.com/logo.png',
    sameAs: ['https://www.linkedin.com/company/example'],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@example.com',
    },
  }),
  template('localbusiness', 'Local business', {
    '@type': 'LocalBusiness',
    name: 'Your company',
    url: 'https://example.com',
    telephone: '+1-555-000-0000',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '1 Example St',
      addressLocality: 'Montreal',
      addressRegion: 'QC',
      postalCode: 'H0H 0H0',
      addressCountry: 'CA',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:00',
      },
    ],
  }),
  template('website', 'Website + site search', {
    '@type': 'WebSite',
    name: 'Your site',
    url: 'https://example.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://example.com/search/?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }),
  template('person', 'Person', {
    '@type': 'Person',
    name: 'Full name',
    jobTitle: 'Title',
    url: 'https://example.com/about/',
    sameAs: ['https://www.linkedin.com/in/example'],
  }),
  template('breadcrumb', 'Breadcrumbs', {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://example.com/' },
      { '@type': 'ListItem', position: 2, name: 'This page', item: 'https://example.com/this-page/' },
    ],
  }),
  template('custom', 'Empty (write your own)', { '@type': 'Thing', name: 'Replace @type and add properties' }),
];
