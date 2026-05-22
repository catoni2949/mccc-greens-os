import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { MeetingForm } from "@/components/meetings/meeting-form";
import type { Meeting } from "@/lib/database.types";

export default async function EditMeetingPage({
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
      <PageHeader title="Edit Meeting" />
      <MeetingForm meeting={data as Meeting} />
    </div>
  );
}
