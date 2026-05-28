import type { SupabaseClient } from "@supabase/supabase-js";
import { formatDate } from "@/lib/format";

export type TimelineEvent = {
  id: string;
  date: string | null;
  sortKey: string;
  category:
    | "meeting"
    | "decision"
    | "action"
    | "strategic"
    | "tree"
    | "capital"
    | "communication";
  title: string;
  subtitle: string;
  href: string;
  hole?: string | null;
  owner?: string | null;
  boardRelevant?: boolean;
};

export type TimelineFilters = {
  hole?: string;
  category?: string;
  boardOnly?: boolean;
  owner?: string;
  theme?: "strategic" | "tree" | "capital" | "all";
};

export async function buildTimeline(
  supabase: SupabaseClient,
  filters: TimelineFilters = {}
): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  const [meetings, actions, projects, trees, capital, feedback] = await Promise.all([
    supabase.from("meetings").select("*").order("meeting_date", { ascending: false }),
    supabase.from("action_items").select("*").order("created_at", { ascending: false }),
    supabase.from("strategic_projects").select("*").order("created_at", { ascending: false }),
    supabase.from("tree_items").select("*").order("created_at", { ascending: false }),
    supabase.from("capital_items").select("*").order("created_at", { ascending: false }),
    supabase.from("member_feedback").select("*").order("created_at", { ascending: false }),
  ]);

  for (const m of meetings.data ?? []) {
    events.push({
      id: m.id,
      date: m.meeting_date,
      sortKey: m.meeting_date ?? m.created_at,
      category: "meeting",
      title: m.title,
      subtitle: m.meeting_type,
      href: `/meetings/${m.id}`,
      boardRelevant: /board/i.test([m.summary, m.decisions].join(" ")),
    });
    if (m.decisions?.trim()) {
      events.push({
        id: `${m.id}-d`,
        date: m.meeting_date,
        sortKey: m.meeting_date ?? m.created_at,
        category: "decision",
        title: `Decisions — ${m.title}`,
        subtitle: "Recorded decisions",
        href: `/meetings/${m.id}`,
        boardRelevant: /board|vote/i.test(m.decisions),
      });
    }
  }

  for (const a of actions.data ?? []) {
    events.push({
      id: a.id,
      date: a.due_date ?? a.created_at.slice(0, 10),
      sortKey: a.created_at,
      category: "action",
      title: a.title,
      subtitle: `${a.owner ?? "—"} · ${a.status}`,
      href: `/actions/${a.id}`,
      hole: a.hole_or_area,
      owner: a.owner,
      boardRelevant: a.board_relevance,
    });
  }

  for (const p of projects.data ?? []) {
    events.push({
      id: p.id,
      date: p.created_at.slice(0, 10),
      sortKey: p.created_at,
      category: "strategic",
      title: p.title,
      subtitle: p.status,
      href: `/strategic-plan/${p.id}`,
      hole: p.hole_or_area,
      boardRelevant: Boolean(p.board_status?.trim()),
    });
  }

  for (const t of trees.data ?? []) {
    events.push({
      id: t.id,
      date: t.created_at.slice(0, 10),
      sortKey: t.created_at,
      category: "tree",
      title: t.title,
      subtitle: t.committee_status,
      href: `/trees/${t.id}`,
      hole: t.hole_or_area,
      boardRelevant: /pending/i.test(t.board_status ?? ""),
    });
  }

  for (const c of capital.data ?? []) {
    events.push({
      id: c.id,
      date: c.created_at.slice(0, 10),
      sortKey: c.created_at,
      category: "capital",
      title: c.title,
      subtitle: c.status,
      href: `/capital/${c.id}`,
      owner: c.owner,
      boardRelevant: Boolean(c.board_status?.trim()),
    });
  }

  for (const f of feedback.data ?? []) {
    events.push({
      id: f.id,
      date: f.created_at.slice(0, 10),
      sortKey: f.created_at,
      category: "communication",
      title: f.topic,
      subtitle: f.category ?? "Member feedback",
      href: "/communications",
    });
  }

  let filtered = events;

  if (filters.boardOnly) {
    filtered = filtered.filter((e) => e.boardRelevant);
  }
  if (filters.owner) {
    const o = filters.owner.toLowerCase();
    filtered = filtered.filter((e) => e.owner?.toLowerCase().includes(o));
  }
  if (filters.hole) {
    const h = filters.hole.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.hole?.toLowerCase().includes(h) ||
        e.title.toLowerCase().includes(h) ||
        e.subtitle.toLowerCase().includes(h)
    );
  }
  if (filters.category && filters.category !== "all") {
    filtered = filtered.filter((e) => e.category === filters.category);
  }
  if (filters.theme === "strategic") {
    filtered = filtered.filter((e) => e.category === "strategic" || e.category === "meeting");
  }
  if (filters.theme === "tree") {
    filtered = filtered.filter((e) => e.category === "tree" || e.category === "meeting");
  }
  if (filters.theme === "capital") {
    filtered = filtered.filter((e) => e.category === "capital" || e.category === "meeting");
  }

  filtered.sort((a, b) => (a.sortKey < b.sortKey ? 1 : -1));
  return filtered;
}

export function formatTimelineDate(iso: string | null): string {
  return formatDate(iso);
}
