import Link from 'next/link';

import { EmptyState } from '@/components/ui/empty-state';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { requireCurrentSite } from '@/lib/current-site';
import { listProofCampaigns } from '@/lib/queries';

export const dynamic = 'force-dynamic';

const TEMPLATE_LABEL = { pill: 'Rounded', card: 'Square' } as const;
const IMAGE_LABEL = { none: 'No image', preset: 'Icon', custom: 'Your image', map: 'City map' } as const;

export default async function SocialProofPage() {
  const site = await requireCurrentSite();
  const campaigns = await listProofCampaigns(site.id);

  return (
    <>
      <PageHeader
        title="Social proof"
        actions={
          <Link href="/social-proof/new" className="btn btn-primary">
            New campaign
          </Link>
        }
        description={
          <>
            Small notifications that slide in at a corner of the page — &ldquo;James from
            San Diego, CA recently got the guide · 7 min ago&rdquo;. Each campaign cycles
            through its own list and is aimed at the pages it belongs on; where several
            match a page, the most specific wins and only one shows.
          </>
        }
      />

      {campaigns.length === 0 ? (
        <EmptyState>
          None yet. <Link href="/social-proof/new">Add one</Link>, then choose where it
          appears.
        </EmptyState>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th scope="col">Campaign</th>
              <th scope="col">Status</th>
              <th scope="col">Appears on</th>
              <th scope="col">Events</th>
              <th scope="col">Style</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td>
                  <Link href={`/social-proof/${campaign.id}`} className="font-semibold">
                    {campaign.name}
                  </Link>
                </td>
                <td className="whitespace-nowrap">
                  {campaign.active ? (
                    <span className="chip chip-success">live</span>
                  ) : (
                    <span className="chip chip-neutral">
                      off
                    </span>
                  )}
                </td>
                {/* Called out, as on Lead magnets: live but aimed at nothing looks fine everywhere else. */}
                <td className="whitespace-nowrap">
                  {campaign.includeCount === 0 ? (
                    <span className="chip chip-warning">nowhere</span>
                  ) : (
                    `${campaign.includeCount} ${campaign.includeCount === 1 ? 'rule' : 'rules'}`
                  )}
                </td>
                <td className="whitespace-nowrap">
                  {campaign.eventCount === 0 ? (
                    <span className="chip chip-warning">none</span>
                  ) : (
                    campaign.eventCount
                  )}
                </td>
                <td className="whitespace-nowrap text-sm text-ink-muted">
                  {TEMPLATE_LABEL[campaign.template]} · {IMAGE_LABEL[campaign.image_mode]}
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </>
  );
}
