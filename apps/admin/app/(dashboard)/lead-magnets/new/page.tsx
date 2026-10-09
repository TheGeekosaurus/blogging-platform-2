import { CtaBuilder } from '@/components/cta-builder/cta-builder';
import { requireCurrentSite } from '@/lib/current-site';
import { listAllTerms, listMediaOptions, listPostOptions } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function NewLeadMagnetPage() {
  const site = await requireCurrentSite();
  const [terms, posts, media] = await Promise.all([
    listAllTerms(site.id),
    listPostOptions(site.id),
    listMediaOptions(site.id),
  ]);

  /* No PageHeader: the builder takes the window and carries its own bar, with
     the block's name where a page title would be. See components/admin-shell. */
  return (
    <CtaBuilder
      terms={terms}
      posts={posts}
      media={media}
      values={{
        name: '',
        slug: '',
        heading: '',
        body: '',
        buttonLabel: '',
        successMessage: '',
        collectName: false,
        imageId: null,
        consentText: '',
        assetUrl: '',
        /*
          On by default, unlike a post, which starts as a draft. An offer with
          no targeting rules appears nowhere regardless, so the safe state is
          already the default one — and making a new offer live is otherwise a
          step everybody forgets and then debugs.
        */
        active: true,
        // A new block starts as the thing most of them are: a card with a
        // button, in the site's own surface colour.
        kind: 'link',
        href: '',
        layout: 'banner',
        theme: 'surface',
        accentBorder: false,
        eyebrow: '',
        categoryIds: [],
        tagIds: [],
        postIds: [],
        siteWide: false,
    }}
    />
  );
}
