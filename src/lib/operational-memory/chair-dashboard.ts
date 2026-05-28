import type { SupabaseClient } from "@supabase/supabase-js";
import { actionIsOverdue } from "@/lib/action-workflow";
import type { ActionItem, CapitalItem, Meeting, StrategicProject, TreeItem } from "@/lib/database.types";
import { findRelatedHistory } from "@/lib/operational-memory/related-history";

export type ChairSection = {
  title: string;
  items: { label: string; href: string; meta?: string }[];
};

export async function buildChairDashboard(
  supabase: SupabaseClient
): Promise<ChairSection[]> {
  const [actionsRes, meetingsRes, treesRes, projectsRes, capitalRes] =
    await Promise.all([
      supabase.from("action_items").select("*"),
      supabase
        .from("meetings")
        .select("*")
        .order("meeting_date", { ascending: false })
        .limit(12),
      supabase.from("tree_items").select("*"),
      supabase.from("strategic_projects").select("*"),
      supabase.from("capital_items").select("*"),
    ]);

  const actions = (actionsRes.data ?? []) as ActionItem[];
  const meetings = (meetingsRes.data ?? []) as Meeting[];
  const trees = (treesRes.data ?? []) as TreeItem[];
  const projects = (projectsRes.data ?? []) as StrategicProject[];
  const capital = (capitalRes.data ?? []) as CapitalItem[];

  const open = actions.filter((a) => a.status?.toLowerCase() !== "completed");
  const overdue = open.filter((a) => actionIsOverdue(a.due_date, a.status));
  const boardPrep = open.filter((a) => a.board_relevance);

  const upcoming = meetings.filter((m) => m.status?.toLowerCase() !== "completed").slice(0, 5);

  const unresolvedTrees = trees.filter(
    (t) => !/complete|closed/i.test(t.committee_status ?? "")
  );

  const blockers = projects.filter((p) =>
    /blocked|on hold|waiting/i.test(p.status ?? "")
  );

  const capitalPending = capital.filter((c) =>
    /review|pending|submitted/i.test(c.status ?? "")
  );

  const staleTopics: { label: string; href: string; meta?: string }[] = [];
  for (const a of open.slice(0, 25)) {
    const hist = await findRelatedHistory(supabase, {
      entityType: "action",
      entityId: a.id,
      title: a.title,
      hole_or_area: a.hole_or_area,
    });
    const meetingHits = hist.items.filter((i) => i.kind === "meeting");
    if (meetingHits.length >= 3) {
      staleTopics.push({
        label: a.title,
        href: `/actions/${a.id}`,
        meta: `Discussed in ${meetingHits.length}+ meeting contexts`,
      });
    }
  }

  const recentTopics = new Map<string, number>();
  for (const m of meetings) {
    const text = [m.title, m.summary].join(" ");
    const tokens = text.toLowerCase().split(/\W+/).filter((w) => w.length > 4);
    for (const t of tokens.slice(0, 8)) {
      recentTopics.set(t, (recentTopics.get(t) ?? 0) + 1);
    }
  }

  const discussedOften = Array.from(recentTopics.entries())
    .filter(([, n]) => n >= 2)
    .slice(0, 6)
    .map(([word]) => ({
      label: `Topic keyword: ${word}`,
      href: `/search?q=${encodeURIComponent(word)}`,
    }));

  return [
    {
      title: "Overdue actions",
      items: overdue.map((a) => ({
        label: a.title,
        href: `/actions/${a.id}`,
        meta: a.owner ?? undefined,
      })),
    },
    {
      title: "Board-prep items",
      items: boardPrep.slice(0, 10).map((a) => ({
        label: a.title,
        href: `/actions/${a.id}`,
        meta: a.priority,
      })),
    },
    {
      title: "Upcoming meeting agenda candidates",
      items: upcoming.map((m) => ({
        label: m.title,
        href: `/meetings/${m.id}`,
        meta: m.meeting_date ?? undefined,
      })),
    },
    {
      title: "Unresolved tree discussions",
      items: unresolvedTrees.slice(0, 8).map((t) => ({
        label: t.title,
        href: `/trees/${t.id}`,
        meta: t.board_status ?? undefined,
      })),
    },
    {
      title: "Strategic plan blockers",
      items: blockers.map((p) => ({
        label: p.title,
        href: `/strategic-plan/${p.id}`,
        meta: p.status,
      })),
    },
    {
      title: "Capital pending funding",
      items: capitalPending.slice(0, 8).map((c) => ({
        label: c.title,
        href: `/capital/${c.id}`,
        meta: c.status,
      })),
    },
    {
      title: "Member communication needs",
      items: [],
    },
    {
      title: "Recently discussed topics",
      items: discussedOften,
    },
    {
      title: "Discussed 3+ times without resolution",
      items: staleTopics.slice(0, 8),
    },
  ];
}

export async function buildMeetingPrepTopics(
  supabase: SupabaseClient
): Promise<{ label: string; href: string; reason: string }[]> {
  const topics: { label: string; href: string; reason: string }[] = [];

  const { data: openActions } = await supabase
    .from("action_items")
    .select("*")
    .neq("status", "Completed")
    .order("updated_at", { ascending: false })
    .limit(40);

  for (const a of (openActions ?? []) as ActionItem[]) {
    if (a.board_relevance) {
      topics.push({
        label: a.title,
        href: `/actions/${a.id}`,
        reason: "Board-relevant and still open",
      });
      continue;
    }
    const hist = await findRelatedHistory(supabase, {
      entityType: "action",
      title: a.title,
      hole_or_area: a.hole_or_area,
    });
    const meetings = hist.items.filter((i) => i.kind === "meeting");
    if (meetings.length >= 3) {
      topics.push({
        label: a.title,
        href: `/actions/${a.id}`,
        reason: `Discussed across ${meetings.length} meetings without resolution`,
      });
    }
  }

  const { data: trees } = await supabase
    .from("tree_items")
    .select("*")
    .limit(30);

  for (const t of (trees ?? []) as TreeItem[]) {
    if (/pending|notified/i.test(t.board_status ?? "")) {
      topics.push({
        label: t.title,
        href: `/trees/${t.id}`,
        reason: "Tree item pending board review",
      });
    }
  }

  const unique = new Map<string, (typeof topics)[0]>();
  for (const t of topics) {
    const key = t.label.toLowerCase();
    if (!unique.has(key)) unique.set(key, t);
  }

  return Array.from(unique.values()).slice(0, 12);
}
