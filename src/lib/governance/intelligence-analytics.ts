import type { SupabaseClient } from "@supabase/supabase-js";
import { actionIsOverdue } from "@/lib/action-workflow";
import { BIBLE_FRAMEWORK_SECTIONS } from "@/lib/governance/bible-framework";

export type IntelligenceAnalytics = {
  recurringThemes: { label: string; count: number }[];
  unresolvedStrategic: { title: string; status: string; href: string }[];
  boardSensitive: { label: string; href: string; kind: string }[];
  memberConcerns: { topic: string; status: string }[];
  operationalRisks: { label: string; meta?: string }[];
  governanceGaps: { slug: string; title: string }[];
  staleDecisions: { title: string; id: string }[];
  heavilyDiscussed: { label: string; count: number; href?: string }[];
  continuityRisks: string[];
};

export async function computeIntelligenceAnalytics(
  supabase: SupabaseClient
): Promise<IntelligenceAnalytics> {
  const [
    actionsRes,
    projectsRes,
    treesRes,
    feedbackRes,
    sectionsRes,
    decisionsRes,
    topicsRes,
    transitionsRes,
  ] = await Promise.all([
    supabase.from("action_items").select("id, title, status, due_date, board_relevance"),
    supabase.from("strategic_projects").select("id, title, status"),
    supabase.from("tree_items").select("id, title, board_status, committee_status"),
    supabase.from("member_feedback").select("id, topic, status"),
    supabase
      .from("governance_sections")
      .select("slug, title, synthesized_body, last_synthesized_at"),
    supabase
      .from("institutional_decisions")
      .select("id, title, rationale_summary, last_synthesized_at"),
    supabase
      .from("meeting_topics")
      .select("id, topic_label, discussion_count, meeting_id")
      .order("discussion_count", { ascending: false })
      .limit(15),
    supabase
      .from("chair_transitions")
      .select("incoming_chair, effective_date")
      .order("effective_date", { ascending: false })
      .limit(3),
  ]);

  const actions = actionsRes.data ?? [];
  const openActions = actions.filter((a) => a.status?.toLowerCase() !== "completed");
  const overdue = openActions.filter((a) =>
    actionIsOverdue(a.due_date, a.status)
  );

  const unresolvedStrategic = (projectsRes.data ?? [])
    .filter((p) => !/complete|closed|done/i.test(p.status ?? ""))
    .slice(0, 8)
    .map((p) => ({
      title: p.title,
      status: p.status,
      href: `/strategic-plan/${p.id}`,
    }));

  const boardSensitive: IntelligenceAnalytics["boardSensitive"] = [];
  for (const a of openActions.filter((x) => x.board_relevance).slice(0, 8)) {
    boardSensitive.push({
      label: a.title,
      href: `/actions/${a.id}`,
      kind: "action",
    });
  }
  for (const t of (treesRes.data ?? []).filter((x) =>
    /pending|required/i.test(x.board_status ?? "")
  ).slice(0, 5)) {
    boardSensitive.push({
      label: t.title,
      href: `/trees/${t.id}`,
      kind: "tree",
    });
  }

  const memberConcerns = (feedbackRes.data ?? [])
    .filter((f) => f.status?.toLowerCase() !== "closed")
    .slice(0, 8)
    .map((f) => ({ topic: f.topic, status: f.status ?? "Open" }));

  const operationalRisks: IntelligenceAnalytics["operationalRisks"] = [];
  for (const a of overdue.slice(0, 6)) {
    operationalRisks.push({ label: a.title, meta: "Overdue action" });
  }

  const frameworkSlugs = new Set(BIBLE_FRAMEWORK_SECTIONS.map((s) => s.slug));
  const governanceGaps: IntelligenceAnalytics["governanceGaps"] = [];
  for (const frame of BIBLE_FRAMEWORK_SECTIONS) {
    const row = (sectionsRes.data ?? []).find((s) => s.slug === frame.slug);
    if (!row?.synthesized_body?.trim()) {
      governanceGaps.push({ slug: frame.slug, title: frame.title });
    }
  }
  for (const s of sectionsRes.data ?? []) {
    if (!frameworkSlugs.has(s.slug) && !s.synthesized_body?.trim()) {
      governanceGaps.push({ slug: s.slug, title: s.title });
    }
  }

  const staleDecisions = (decisionsRes.data ?? [])
    .filter((d) => !d.rationale_summary?.trim())
    .slice(0, 8)
    .map((d) => ({ title: d.title, id: d.id }));

  const heavilyDiscussed = (topicsRes.error ? [] : topicsRes.data ?? [])
    .slice(0, 10)
    .map((t) => ({
      label: t.topic_label,
      count: t.discussion_count ?? 1,
      href: t.meeting_id ? `/meetings/${t.meeting_id}` : undefined,
    }));

  const topicCounts = new Map<string, number>();
  for (const t of topicsRes.data ?? []) {
    const k = t.topic_label.toLowerCase();
    topicCounts.set(k, (topicCounts.get(k) ?? 0) + (t.discussion_count ?? 1));
  }
  const recurringThemes = Array.from(topicCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const continuityRisks: string[] = [];
  if (governanceGaps.length > 5) {
    continuityRisks.push(
      `${governanceGaps.length} Bible sections lack synthesized doctrine`
    );
  }
  if (staleDecisions.length) {
    continuityRisks.push(
      `${staleDecisions.length} institutional decisions lack rationale synthesis`
    );
  }
  const lastTransition = transitionsRes.data?.[0];
  if (!lastTransition) {
    continuityRisks.push("No chair transition recorded in Greens OS");
  }

  return {
    recurringThemes,
    unresolvedStrategic,
    boardSensitive,
    memberConcerns,
    operationalRisks,
    governanceGaps: governanceGaps.slice(0, 12),
    staleDecisions,
    heavilyDiscussed,
    continuityRisks,
  };
}
