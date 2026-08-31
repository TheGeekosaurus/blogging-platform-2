import { SettingsForm } from '@/components/settings-form';
import { requireCurrentSite } from '@/lib/current-site';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const site = await requireCurrentSite();

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">Site settings</h1>
      <SettingsForm site={site} />
    </>
  );
}
