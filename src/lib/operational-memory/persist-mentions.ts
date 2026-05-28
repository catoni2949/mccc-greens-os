import type { SupabaseClient } from "@supabase/supabase-js";
import { mentionKeyFromTitle } from "@/lib/operational-memory/text-similarity";

export async function recordDiscussionMention(
  supabase: SupabaseClient,
  input: {
    meetingId: string;
    entityType: string;
    entityId?: string | null;
    label: string;
    excerpt?: string | null;
    boardRelevant?: boolean;
  }
) {
  const key = mentionKeyFromTitle(input.label);
  await supabase.from("discussion_mentions").insert({
    meeting_id: input.meetingId,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    mention_key: key,
    mention_label: input.label,
    excerpt: input.excerpt ?? null,
    board_relevant: input.boardRelevant ?? false,
  });
}

export async function upsertMeetingTopic(
  supabase: SupabaseClient,
  input: {
    meetingId: string;
    label: string;
    holeNumber?: number | null;
    category?: string | null;
    boardRelevant?: boolean;
  }
) {
  const topic_key = mentionKeyFromTitle(input.label);
  const { data: existing } = await supabase
    .from("meeting_topics")
    .select("id, discussion_count")
    .eq("meeting_id", input.meetingId)
    .eq("topic_key", topic_key)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("meeting_topics")
      .update({
        discussion_count: (existing.discussion_count ?? 1) + 1,
        last_discussed_at: new Date().toISOString(),
        topic_label: input.label,
      })
      .eq("id", existing.id);
    return;
  }

  await supabase.from("meeting_topics").insert({
    meeting_id: input.meetingId,
    topic_key,
    topic_label: input.label,
    hole_number: input.holeNumber ?? null,
    category: input.category ?? null,
    board_relevant: input.boardRelevant ?? false,
  });
}

export async function linkEntities(
  supabase: SupabaseClient,
  source: { type: string; id: string },
  target: { type: string; id: string },
  linkType = "related",
  strength = 0.7
) {
  await supabase.from("entity_links").insert({
    source_type: source.type,
    source_id: source.id,
    target_type: target.type,
    target_id: target.id,
    link_type: linkType,
    strength,
  });
}
