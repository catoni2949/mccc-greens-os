import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { requireBackfillAdmin } from "@/lib/admin-access";
import { PageHeader } from "@/components/page-header";
import { BackfillReviewClient } from "@/components/admin/backfill-review-client";

export default async function AdminBackfillReviewPage() {
  const supabase = createClient();
  await requireBackfillAdmin(supabase);

  return (
    <div>
      <PageHeader title="Backfill review" />
      <p className="-mt-4 mb-6 text-sm text-slate-600">
        Choose create, link to existing, or skip for each item. Nothing is saved until
        you apply.
      </p>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading review…</p>}>
        <BackfillReviewClient />
      </Suspense>
    </div>
  );
}
