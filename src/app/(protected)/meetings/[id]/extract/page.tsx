import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { MeetingExtractReview } from "@/components/meetings/meeting-extract-review";
import type { Meeting } from "@/lib/database.types";

export default async function MeetingExtractPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meetings")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();

  return (
    <div>
      <PageHeader title="Review extraction" />
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        {(data as Meeting).title} — review before creating records
      </p>
      <MeetingExtractReview meeting={data as Meeting} />
    </div>
  );
}
