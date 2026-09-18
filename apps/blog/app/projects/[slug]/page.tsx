import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { LabsProject } from '@/components/marketing/labs/project';
import { PROJECTS, projectBySlug } from '@/components/marketing/labs/projects-content';
import { isNntmLabs } from '@/lib/marketing';

/*
 * One page per project, from the registry in labs/projects-content.ts.
 *
 * A dynamic segment rather than a file per project: the page is one layout
 * with different content, so adding a case study should be a row of data and
 * nothing else. `generateStaticParams` turns the registry into static pages at
 * build time, so this costs no more at runtime than three separate files would.
 *
 * NO `dynamicParams = false`, deliberately. It would be harmless here — these
 * slugs are code, so a new project cannot exist without a deploy — but
 * `__tests__/route-config.test.ts` bans it on every [param] route, and that ban
 * is worth more than the microseconds it saves: the one time it was set, on the
 * post route, every post published since the last deploy 404'd permanently and
 * publishing appeared to work. An unknown slug here still 404s, via the
 * `notFound()` below; it is simply decided per request rather than at build.
 *
 * NOTE THERE IS NO /projects INDEX yet. The nav's "Projects" item is therefore
 * still unlinked, which is deliberate: a link to a page that does not exist is
 * the failure `labs.test.ts` guards against. Build the index and give the nav
 * item its href in the same change.
 *
 * Gated on SITE_SLUG like the other coded routes: `apps/blog` is deployed once
 * per blog from one codebase, so an ungated static route would serve these
 * pages — and shadow any database page at the same path — on every other
 * blog's domain.
 */
export const dynamic = 'force-static';
export const revalidate = false;

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projectBySlug(slug);

  if (!project) return {};

  return {
    title: project.title,
    description: project.description,
    alternates: { canonical: `/projects/${project.slug}` },
    /*
     * ⚠️ NOINDEX WHILE THE COPY IS PLACEHOLDER. This page carries a real
     * company's name beside content that describes nothing that happened —
     * see the warning at the top of labs/projects-content.ts. Submitting that
     * to a search engine publishes a claim about somebody else's business.
     * Remove this once the case study is written, and only then.
     */
    robots: { index: false, follow: true },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!isNntmLabs()) notFound();

  const { slug } = await params;
  const project = projectBySlug(slug);

  if (!project) notFound();

  return <LabsProject project={project} />;
}
