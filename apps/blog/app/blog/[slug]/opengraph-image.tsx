import { ImageResponse } from 'next/og';

import { getPostBySlug, listPublishedSlugs } from '@blog/core';

import { getClient, getSite } from '@/lib/site';

export const alt = 'Post preview';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';


export async function generateStaticParams() {
  const site = await getSite();
  const slugs = await listPublishedSlugs(getClient(), site.id);
  return slugs.map((slug) => ({ slug }));
}

/**
 * Social preview card, generated at build time alongside the page.
 *
 * Uses only system-default fonts: loading a webfont here would add a network
 * fetch to every page build for no visual gain at this size.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getSite();
  const post = await getPostBySlug(getClient(), site.id, decodeURIComponent(slug));

  const title = post?.title ?? site.name;
  const byline = [post?.author_name, site.name].filter(Boolean).join(' · ');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#101216',
          color: '#e9ecf1',
          padding: '72px',
        }}
      >
        <div
          style={{
            fontSize: title.length > 70 ? 56 : 72,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            display: 'flex',
          }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 28 }}>
          <div style={{ width: 44, height: 6, background: '#7ea8ff', display: 'flex' }} />
          <div style={{ color: '#9aa4b2', display: 'flex' }}>{byline}</div>
        </div>
      </div>
    ),
    size,
  );
}
