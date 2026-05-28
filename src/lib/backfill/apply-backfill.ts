import type { SupabaseClient } from "@supabase/supabase-js";
import {
  linkEntities,
  recordDiscussionMention,
  upsertMeetingTopic,
} from "@/lib/operational-memory/persist-mentions";
import type { BackfillApplyPayload } from "@/lib/backfill/review-types";

export async function applyBackfillSelections(
  supabase: SupabaseClient,
  payload: BackfillApplyPayload
): Promise<{ meetingIds: Record<string, string>; created: number; linked: number }> {
  const meetingIds: Record<string, string> = {};
  let created = 0;
  let linked = 0;
  const labelToId = new Map<string, string>();

  for (const row of payload.meetings) {
    if (row.disposition === "skip") continue;
    if (row.disposition === "link" && row.linkToId) {
      meetingIds[row.clientKey] = row.linkToId;
      linked++;
      continue;
    }
    const { data, error } = await supabase
      .from("meetings")
      .insert({
        title: row.title,
        meeting_date: row.meeting_date,
        meeting_type: row.meeting_type ?? "Greens Committee",
        status: row.status ?? "Completed",
        attendees: row.attendees,
        agenda: row.agenda,
        summary: row.summary,
        decisions: row.decisions,
        notes: row.notes,
        raw_transcript: payload.rawSourceText?.slice(0, 50000) ?? null,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Meeting insert failed");
    meetingIds[row.clientKey] = data.id;
    labelToId.set(row.title, data.id);
    created++;
  }

  const primaryMeetingId =
    Object.values(meetingIds)[0] ?? payload.defaultMeetingId ?? null;

  async function meetingIdFor(clientKey: string | null | undefined) {
    if (clientKey && meetingIds[clientKey]) return meetingIds[clientKey];
    return primaryMeetingId;
  }

  for (const row of payload.committeeMembers) {
    if (row.disposition === "skip") continue;
    if (row.disposition === "link" && row.linkToId) {
      linked++;
      continue;
    }
    const { error } = await supabase.from("committee_members").insert({
      full_name: row.full_name,
      role: row.role,
      status: row.status ?? "Active",
      email: row.email,
      notes: row.notes,
    });
    if (error) throw new Error(error.message);
    created++;
  }

  for (const row of payload.strategicProjects) {
    if (row.disposition === "skip") continue;
    if (row.disposition === "link" && row.linkToId) {
      labelToId.set(row.title, row.linkToId);
      linked++;
      continue;
    }
    const mid = await meetingIdFor(row.meetingClientKey);
    const { data, error } = await supabase
      .from("strategic_projects")
      .insert({
        title: row.title,
        hole_or_area: row.hole_or_area,
        category: row.category,
        priority_tier: row.priority_tier,
        strategic_rationale: row.strategic_rationale,
        notes: row.notes,
        source_meeting_id: mid,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Strategic insert failed");
    labelToId.set(row.title, data.id);
    created++;
  }

  for (const row of payload.treeItems) {
    if (row.disposition === "skip") continue;
    if (row.disposition === "link" && row.linkToId) {
      labelToId.set(row.title, row.linkToId);
      linked++;
      continue;
    }
    const { data, error } = await supabase
      .from("tree_items")
      .insert({
        title: row.title,
        hole_or_area: row.hole_or_area,
        tree_type: row.tree_type,
        rationale: row.rationale,
        permit_status: row.permit_status ?? "Not Required",
        committee_status: row.committee_status ?? "Open",
        board_status: row.board_status ?? "Not Required",
        target_season: row.target_season,
        notes: row.notes,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Tree insert failed");
    labelToId.set(row.title, data.id);
    created++;
  }

  for (const row of payload.capitalItems) {
    if (row.disposition === "skip") continue;
    if (row.disposition === "link" && row.linkToId) {
      labelToId.set(row.title, row.linkToId);
      linked++;
      continue;
    }
    const { data, error } = await supabase
      .from("capital_items")
      .insert({
        title: row.title,
        item_type: row.item_type,
        estimated_cost: row.estimated_cost,
        target_year: row.target_year,
        priority: row.priority,
        status: row.status ?? "Under Review",
        notes: row.notes,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Capital insert failed");
    labelToId.set(row.title, data.id);
    created++;
  }

  for (const row of payload.actionItems) {
    if (row.disposition === "skip") continue;
    if (row.disposition === "link" && row.linkToId) {
      linked++;
      const mid = await meetingIdFor(row.meetingClientKey);
      if (mid) {
        await recordDiscussionMention(supabase, {
          meetingId: mid,
          entityType: "action_item",
          entityId: row.linkToId,
          label: row.title,
        });
      }
      continue;
    }
    const mid = await meetingIdFor(row.meetingClientKey);
    const { data, error } = await supabase
      .from("action_items")
      .insert({
        title: row.title,
        owner: row.owner,
        priority: row.priority,
        category: row.category,
        due_date: row.due_date,
        hole_or_area: row.hole_or_area,
        board_relevance: row.board_relevance,
        notes: row.notes,
        source_meeting_id: mid,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Action insert failed");
    labelToId.set(row.title, data.id);
    if (mid) {
      await recordDiscussionMention(supabase, {
        meetingId: mid,
        entityType: "action_item",
        entityId: data.id,
        label: row.title,
        boardRelevant: row.board_relevance,
      });
    }
    created++;
  }

  for (const row of payload.memberFeedback) {
    if (row.disposition === "skip") continue;
    if (row.disposition === "link") {
      linked++;
      continue;
    }
    const { error } = await supabase.from("member_feedback").insert({
      topic: row.topic,
      category: row.category,
      feedback_text: row.feedback_text,
      source: row.source ?? payload.sourceLabel,
      status: row.status ?? "Open",
      owner: row.owner,
      notes: row.notes,
    });
    if (error) throw new Error(error.message);
    created++;
  }

  for (const row of payload.governanceSections) {
    if (row.disposition === "skip") continue;
    if (row.disposition === "link" && row.linkToId) {
      if (row.body?.trim()) {
        const { data: existing } = await supabase
          .from("governance_sections")
          .select("body")
          .eq("id", row.linkToId)
          .single();
        const merged = [existing?.body ?? "", row.body].filter(Boolean).join("\n\n");
        await supabase
          .from("governance_sections")
          .update({ body: merged })
          .eq("id", row.linkToId);
      }
      linked++;
      continue;
    }
    const { error } = await supabase.from("governance_sections").upsert(
      {
        slug: row.slug,
        title: row.title,
        category: row.category ?? "standards",
        summary: row.summary,
        body: row.body ?? "",
        published: true,
      },
      { onConflict: "slug" }
    );
    if (error) throw new Error(error.message);
    created++;
  }

  for (const row of payload.institutionalDecisions) {
    if (row.disposition === "skip") continue;
    if (row.disposition === "link") {
      linked++;
      continue;
    }
    const mid = await meetingIdFor(row.meetingClientKey);
    const { error } = await supabase.from("institutional_decisions").insert({
      title: row.title,
      decision_date: row.decision_date,
      category: row.category,
      rationale: row.rationale,
      implementation_notes: row.implementation_notes,
      governance_section_slug: row.governance_section_slug,
      source_meeting_id: mid,
    });
    if (error) throw new Error(error.message);
    created++;
  }

  for (const row of payload.meetingTopics) {
    if (row.disposition === "skip") continue;
    const mid = await meetingIdFor(row.meetingClientKey);
    if (!mid) continue;
    await upsertMeetingTopic(supabase, {
      meetingId: mid,
      label: row.topic_label,
      holeNumber: row.hole_number,
      category: row.category,
      boardRelevant: row.board_relevant,
    });
    created++;
  }

  for (const row of payload.discussionMentions) {
    if (row.disposition === "skip") continue;
    const mid = await meetingIdFor(row.meetingClientKey);
    if (!mid) continue;
    await recordDiscussionMention(supabase, {
      meetingId: mid,
      entityType: row.entity_type ?? "topic",
      label: row.mention_label,
      excerpt: row.excerpt,
      boardRelevant: row.board_relevant,
    });
    created++;
  }

  for (const row of payload.entityLinks) {
    if (row.disposition === "skip") continue;
    const sourceId = labelToId.get(row.source_label);
    const targetId = labelToId.get(row.target_label);
    if (!sourceId || !targetId) continue;
    await linkEntities(
      supabase,
      { type: "backfill", id: sourceId },
      { type: "backfill", id: targetId },
      row.link_type ?? "related"
    );
    created++;
  }

  return { meetingIds, created, linked };
}
