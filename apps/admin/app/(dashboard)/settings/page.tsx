import { SettingsForm } from '@/components/settings-form';
import { PageHeader } from '@/components/ui/page-header';
import { requireCurrentSite } from '@/lib/current-site';
import { snippetsToText } from '@/lib/structured-data';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const site = await requireCurrentSite();

  return (
    <div className="space-y-6">
      <PageHeader title="Site settings" />
      <SettingsForm site={site} snippets={snippetsToText(site.structured_data)} />
    </div>
  );
}
