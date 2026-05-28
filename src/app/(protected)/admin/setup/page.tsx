import { createClient } from "@/lib/supabase/server";
import { requireBackfillAdmin } from "@/lib/admin-access";
import { PageHeader } from "@/components/page-header";
import { SetupCenterClient } from "@/components/admin/setup-center-client";

export default async function AdminSetupPage() {
  const supabase = createClient();
  await requireBackfillAdmin(supabase);

  return (
    <div>
      <PageHeader title="System setup" />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-slate-600">
        Run database migrations and governance seeds from the app—no manual SQL copy/paste.
      </p>
      <SetupCenterClient />
    </div>
  );
}
