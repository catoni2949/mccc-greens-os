import type { SupabaseClient } from "@supabase/supabase-js";
import {
  combinedRelevanceScore,
  extractHoleNumbers,
  mentionKeyFromTitle,
} from "@/lib/operational-memory/text-similarity";
import { formatDate } from "@/lib/format";

export type RelatedHistoryContext = {
  entityType: "meeting" | "action" | "tree" | "strategic" | "capital";
  entityId?: string;
  title: string;
  hole_or_area?: string | null;
  category?: string | null;
  boardOnly?: boolean;
};

export type RelatedHistoryItem = {
  kind:
    | "meeting"
    | "action"
    | "decision"
    | "strategic"
    | "tree"
    | "capital"
    | "feedback"
    | "board";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  score: number;
  boardRelevant?: boolean;
};

export type RelatedHistoryResult = {
  queryKey: string;
  items: RelatedHistoryItem[];
};

const MIN_SCORE = 0.22;
const MAX_ITEMS = 12;

function buildQuery(ctx: RelatedHistoryContext): string {
  return [ctx.title, ctx.hole_or_area, ctx.category].filter(Boolean).join(" ");
}

export async function findRelatedHistory(
  supabase: SupabaseClient,
  ctx: RelatedHistoryContext
): Promise<RelatedHistoryResult> {
  const query = buildQuery(ctx);
  const queryHoles = extractHoleNumbers(query);
  const queryKey = mentionKeyFromTitle(ctx.title);
  const items: RelatedHistoryItem[] = [];

  const [
    meetingsRes,
    actionsRes,
    projectsRes,
    treesRes,
    capitalRes,
    feedbackRes,
    mentionsRes,
  ] = await Promise.all([
    supabase
      .from("meetings")
      .select("id, title, meeting_date, meeting_type, summary, decisions")
      .order("meeting_date", { ascending: false, nullsFirst: false })
      .limit(80),
    supabase.from("action_items").select("*").order("updated_at", { ascending: false }).limit(120),
    supabase.from("strategic_projects").select("*").order("updated_at", { ascending: false }).limit(80),
    supabase.from("tree_items").select("*").order("updated_at", { ascending: false }).limit(80),
    supabase.from("capital_items").select("*").order("updated_at", { ascending: false }).limit(80),
    supabase.from("member_feedback").select("*").order("updated_at", { ascending: false }).limit(60),
    supabase
      .from("discussion_mentions")
      .select("id, meeting_id, mention_label, excerpt, board_relevant, entity_type, entity_id")
      .ilike("mention_key", `%${queryKey.split("-")[0] ?? ""}%`)
      .limit(20),
  ]);

  const push = (item: RelatedHistoryItem) => {
    if (ctx.entityId && item.id === ctx.entityId) return;
    if (items.some((x) => x.kind === item.kind && x.id === item.id)) return;
    if (item.score < MIN_SCORE) return;
    if (ctx.boardOnly && !item.boardRelevant) return;
    items.push(item);
  };

  for (const m of meetingsRes.data ?? []) {
    if (ctx.entityType === "meeting" && m.id === ctx.entityId) continue;
    const blob = [m.title, m.summary, m.decisions].filter(Boolean).join(" ");
    const score = combinedRelevanceScore(query, blob, {
      holeQuery: queryHoles,
      holeTarget: extractHoleNumbers(blob),
    });
    push({
      kind: "meeting",
      id: m.id,
      title: m.title,
      subtitle: `${formatDate(m.meeting_date)} · ${m.meeting_type}`,
      href: `/meetings/${m.id}`,
      score,
      boardRelevant: /board/i.test(blob),
    });
    if (m.decisions?.trim()) {
      const dScore = combinedRelevanceScore(query, m.decisions, {
        holeQuery: queryHoles,
        holeTarget: extractHoleNumbers(m.decisions),
      });
      if (dScore >= MIN_SCORE) {
        push({
          kind: "decision",
          id: `${m.id}-decisions`,
          title: `Decisions — ${m.title}`,
          subtitle: formatDate(m.meeting_date),
          href: `/meetings/${m.id}`,
          score: dScore * 0.95,
          boardRelevant: /board|vote|approval/i.test(m.decisions),
        });
      }
    }
  }

  for (const a of actionsRes.data ?? []) {
    const blob = [a.title, a.notes, a.hole_or_area, a.category].filter(Boolean).join(" ");
    push({
      kind: "action",
      id: a.id,
      title: a.title,
      subtitle: `${a.owner ?? "Unassigned"} · ${a.status}`,
      href: `/actions/${a.id}`,
      score: combinedRelevanceScore(query, blob, {
        holeQuery: queryHoles,
        holeTarget: extractHoleNumbers(blob),
        categoryMatch: Boolean(ctx.category && a.category === ctx.category),
      }),
      boardRelevant: a.board_relevance,
    });
  }

  for (const p of projectsRes.data ?? []) {
    const blob = [p.title, p.strategic_rationale, p.hole_or_area, p.category].filter(Boolean).join(" ");
    push({
      kind: "strategic",
      id: p.id,
      title: p.title,
      subtitle: p.status,
      href: `/strategic-plan/${p.id}`,
      score: combinedRelevanceScore(query, blob, {
        holeQuery: queryHoles,
        holeTarget: extractHoleNumbers(blob),
      }),
      boardRelevant: Boolean(p.board_status?.trim()),
    });
  }

  for (const t of treesRes.data ?? []) {
    const blob = [t.title, t.rationale, t.hole_or_area, t.issue].filter(Boolean).join(" ");
    push({
      kind: "tree",
      id: t.id,
      title: t.title,
      subtitle: [t.hole_or_area, t.committee_status].filter(Boolean).join(" · "),
      href: `/trees/${t.id}`,
      score: combinedRelevanceScore(query, blob, {
        holeQuery: queryHoles,
        holeTarget: extractHoleNumbers(blob),
      }),
      boardRelevant: /pending|notified/i.test(t.board_status ?? ""),
    });
  }

  for (const c of capitalRes.data ?? []) {
    const blob = [c.title, c.notes, c.item_type, c.funding_notes].filter(Boolean).join(" ");
    push({
      kind: "capital",
      id: c.id,
      title: c.title,
      subtitle: [c.status, c.priority].filter(Boolean).join(" · "),
      href: `/capital/${c.id}`,
      score: combinedRelevanceScore(query, blob),
      boardRelevant: Boolean(c.board_status?.trim()),
    });
  }

  for (const f of feedbackRes.data ?? []) {
    const blob = [f.topic, f.feedback_text, f.category].filter(Boolean).join(" ");
    push({
      kind: "feedback",
      id: f.id,
      title: f.topic,
      subtitle: f.status ?? "Open",
      href: "/communications",
      score: combinedRelevanceScore(query, blob),
    });
  }

  if (!mentionsRes.error) {
    for (const mention of mentionsRes.data ?? []) {
      push({
        kind: "meeting",
        id: mention.meeting_id,
        title: mention.mention_label,
        subtitle: "Prior discussion mention",
        href: `/meetings/${mention.meeting_id}`,
        score: 0.55,
        boardRelevant: mention.board_relevant,
      });
    }
  }

  items.sort((a, b) => b.score - a.score);
  return { queryKey, items: items.slice(0, MAX_ITEMS) };
}
