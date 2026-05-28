import type { SupabaseClient } from "@supabase/supabase-js";
import { buildChairDashboard, buildMeetingPrepTopics } from "@/lib/operational-memory/chair-dashboard";
import { actionIsOverdue } from "@/lib/action-workflow";
import type { ActionItem } from "@/lib/database.types";

export type ExecutiveChairSection = {
  title: string;
  items: { label: string; href: string; meta?: string }[];
};

export async function buildExecutiveChairSections(
  supabase: SupabaseClient
): Promise<{ primary: ExecutiveChairSection[]; advanced: ExecutiveChairSection[] }> {
  const all = await buildChairDashboard(supabase);
  const byTitle = new Map(all.map((s) => [s.title, s]));

  const { data: actions } = await supabase.from("action_items").select("*");
  const open = ((actions ?? []) as ActionItem[]).filter(
    (a) => a.status?.toLowerCase() !== "completed"
  );
  const todayPriorities = open
    .filter(
      (a) =>
        actionIsOverdue(a.due_date, a.status) ||
        a.priority === "High"
    )
    .slice(0, 8)
    .map((a) => ({
      label: a.title,
      href: `/actions/${a.id}`,
      meta: a.owner ?? a.priority,
    }));

  const prep = await buildMeetingPrepTopics(supabase);

  const primary: ExecutiveChairSection[] = [
    { title: "Today's priorities", items: todayPriorities },
    {
      title: "Board prep",
      items: byTitle.get("Board-prep items")?.items ?? [],
    },
    {
      title: "Open chair risks",
      items: [
        ...(byTitle.get("Strategic plan blockers")?.items ?? []).slice(0, 4),
        ...(byTitle.get("Capital pending funding")?.items ?? []).slice(0, 4),
        ...(byTitle.get("Unresolved tree discussions")?.items ?? [])
          .filter((i) => /board|pending/i.test(i.meta ?? ""))
          .slice(0, 3),
      ],
    },
    {
      title: "Succession readiness",
      items: [
        {
          label: "Chair transition & handoff brief",
          href: "/governance/transition",
          meta: "Record transitions + intelligence brief",
        },
        {
          label: "Onboarding / offboarding checklists",
          href: "/governance/onboarding",
        },
      ],
    },
    {
      title: "Upcoming meeting prep",
      items: [
        ...(byTitle.get("Upcoming meeting agenda candidates")?.items ?? []).slice(0, 4),
        ...prep.slice(0, 6).map((p) => ({
          label: p.label,
          href: p.href,
          meta: p.reason,
        })),
      ],
    },
    {
      title: "Unresolved recurring issues",
      items: [
        ...(byTitle.get("Discussed 3+ times without resolution")?.items ?? []),
        ...(byTitle.get("Recently discussed topics")?.items ?? []).slice(0, 4),
      ],
    },
  ];

  const advanced = all.filter(
    (s) =>
      !primary.some((p) => p.title === s.title) &&
      !["Board-prep items", "Upcoming meeting agenda candidates"].includes(s.title)
  );

  return { primary, advanced };
}
