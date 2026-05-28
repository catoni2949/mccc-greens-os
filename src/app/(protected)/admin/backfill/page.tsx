import { createClient } from "@/lib/supabase/server";
import { requireBackfillAdmin } from "@/lib/admin-access";
import { PageHeader } from "@/components/page-header";
import { BackfillIntakeClient } from "@/components/admin/backfill-intake-client";

export default async function AdminBackfillPage() {
  const supabase = createClient();
  await requireBackfillAdmin(supabase);

  return (
    <div>
      <PageHeader title="Historical backfill" />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-slate-600">
        Import real minutes, agendas, USGA reports, transcripts, and email summaries.
        OpenAI extraction only — review every record before it is written.
      </p>
      <BackfillIntakeClient />
    </div>
  );
}
