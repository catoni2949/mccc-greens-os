import type { SupabaseClient } from "@supabase/supabase-js";
import { upsertMeetingTopic } from "@/lib/operational-memory/persist-mentions";

export async function rebuildOperationalMemory(
  supabase: SupabaseClient
): Promise<{ meetingsProcessed: number; topicsUpserted: number }> {
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, summary, decisions")
    .order("meeting_date", { ascending: false })
    .limit(20);

  let topicsUpserted = 0;
  for (const m of meetings ?? []) {
    const blob = [m.title, m.summary, m.decisions].filter(Boolean).join(" ");
    const tokens = blob
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 5)
      .slice(0, 12);
    const unique = Array.from(new Set(tokens));
    for (const t of unique) {
      await upsertMeetingTopic(supabase, {
        meetingId: m.id,
        label: t,
        category: "rebuild",
      });
      topicsUpserted++;
    }
    const { data: actions } = await supabase
      .from("action_items")
      .select("title")
      .eq("source_meeting_id", m.id);
    for (const a of actions ?? []) {
      await upsertMeetingTopic(supabase, {
        meetingId: m.id,
        label: a.title,
        category: "action",
      });
      topicsUpserted++;
    }
  }

  return {
    meetingsProcessed: meetings?.length ?? 0,
    topicsUpserted,
  };
}
