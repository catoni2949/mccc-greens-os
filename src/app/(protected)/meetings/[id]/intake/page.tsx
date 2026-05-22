import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { MeetingTranscriptIntakeClient } from "@/components/meetings/meeting-transcript-intake-client";
import { formatDate } from "@/lib/format";
import type { Meeting } from "@/lib/database.types";

export default async function MeetingIntakePage({
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

  const meeting = data as Meeting;

  return (
    <div>
      <PageHeader title="Meeting Transcript Intake" />
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        {meeting.title} · {formatDate(meeting.meeting_date)}
      </p>
      <MeetingTranscriptIntakeClient meeting={meeting} />
    </div>
  );
}
