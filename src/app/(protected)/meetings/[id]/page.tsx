import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MeetingCommandCenter } from "@/components/meetings/meeting-command-center";
import type { ActionItem, FileRecord, Meeting, StrategicProject } from "@/lib/database.types";

export default async function MeetingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [meetingRes, actionsRes, filesRes, sourcedProjectsRes] =
    await Promise.all([
      supabase.from("meetings").select("*").eq("id", params.id).single(),
      supabase
        .from("action_items")
        .select("*")
        .eq("source_meeting_id", params.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("files")
        .select("*")
        .eq("linked_type", "meeting")
        .eq("linked_id", params.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("strategic_projects")
        .select("*")
        .eq("source_meeting_id", params.id),
    ]);

  if (meetingRes.error || !meetingRes.data) notFound();

  const meeting = meetingRes.data as Meeting;
  const actionItems = (actionsRes.data ?? []) as ActionItem[];
  const files = (filesRes.data ?? []) as FileRecord[];
  const sourcedProjects = (sourcedProjectsRes.data ?? []) as StrategicProject[];

  const linkedIds = Array.from(
    new Set(
      actionItems
        .map((a) => a.linked_project_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  let linkedViaActions: StrategicProject[] = [];
  if (linkedIds.length > 0) {
    const { data } = await supabase
      .from("strategic_projects")
      .select("*")
      .in("id", linkedIds);
    linkedViaActions = (data ?? []) as StrategicProject[];
  }

  return (
    <MeetingCommandCenter
      meeting={meeting}
      actionItems={actionItems}
      files={files}
      sourcedProjects={sourcedProjects}
      linkedViaActions={linkedViaActions}
    />
  );
}
