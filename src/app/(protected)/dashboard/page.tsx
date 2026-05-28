import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addDaysIso } from "@/lib/action-workflow";
import { formatDate, todayIsoDate } from "@/lib/format";
import { StatusBadge } from "@/lib/status-badge";
import { PanelCard, StatCard } from "@/components/panel-card";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  ActionItem,
  CapitalItem,
  Meeting,
  StrategicProject,
  TreeItem,
} from "@/lib/database.types";

function money(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function DashboardPage() {
  const supabase = createClient();
  const today = todayIsoDate();
  const weekOut = addDaysIso(7);
  const monthOut = addDaysIso(30);

  const [
    actionsRes,
    meetingsRes,
    projectsRes,
    treesRes,
    capitalRes,
    decisionsRes,
  ] = await Promise.all([
    supabase.from("action_items").select("*"),
    supabase
      .from("meetings")
      .select("*")
      .gte("meeting_date", today)
      .lte("meeting_date", monthOut)
      .order("meeting_date", { ascending: true })
      .limit(10),
    supabase.from("strategic_projects").select("*"),
    supabase.from("tree_items").select("*"),
    supabase.from("capital_items").select("*"),
    supabase
      .from("meetings")
      .select("id, title, meeting_date, decisions")
      .not("decisions", "is", null)
      .neq("decisions", "")
      .order("meeting_date", { ascending: false })
      .limit(3),
  ]);

  const actions = (actionsRes.data ?? []) as ActionItem[];
  const openActions = actions.filter(
    (a) => a.status?.toLowerCase() !== "completed"
  );
  const highOpen = openActions.filter(
    (a) => a.priority?.toLowerCase() === "high"
  );
  const overdue = openActions.filter(
    (a) => a.due_date && a.due_date < today
  );
  const boardActions = openActions.filter((a) => a.board_relevance);
  const dueThisWeek = openActions.filter(
    (a) => a.due_date && a.due_date >= today && a.due_date <= weekOut
  );

  const projects = (projectsRes.data ?? []) as StrategicProject[];
  const activeProjects = projects.filter((p) => {
    const s = p.status?.toLowerCase() ?? "";
    return s !== "completed" && s !== "deferred";
  });

  const trees = (treesRes.data ?? []) as TreeItem[];
  const openTrees = trees.filter(
    (t) => t.committee_status?.toLowerCase() !== "completed"
  );

  const capital = (capitalRes.data ?? []) as CapitalItem[];
  const capitalWatch = capital.filter((c) => {
    const s = c.status?.toLowerCase() ?? "";
    return s !== "completed" && s !== "deferred" && s !== "cancelled";
  });

  const upcomingMeetings = (meetingsRes.data ?? []) as Meeting[];
  const nextMeeting = upcomingMeetings[0] ?? null;

  const boardProjects = projects.filter(
    (p) =>
      p.board_status?.trim() &&
      p.board_status.toLowerCase() !== "approved"
  );

  const treeBoardWatch = openTrees.filter((t) => {
    const b = t.board_status?.toLowerCase() ?? "";
    return b === "pending" || b === "notified";
  });

  const tierGroups = [
    "Tier 1 Foundational",
    "Tier 2 High Member Visibility",
    "Tier 3 Signature Transformational",
  ] as const;

  const recentDecisions = (decisionsRes.data ?? []) as Pick<
    Meeting,
    "id" | "title" | "meeting_date" | "decisions"
  >[];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Dashboard" />
        <div className="flex flex-wrap gap-2">
          <Link
            href="/search"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Global search
          </Link>
          <Link
            href="/timeline"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Timeline
          </Link>
          <Link
            href="/chair"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Chair center
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-4">
        <StatCard label="Open Actions" value={openActions.length} href="/actions" />
        <StatCard
          label="High Priority"
          value={highOpen.length}
          href="/actions"
        />
        <StatCard label="Overdue" value={overdue.length} href="/actions" />
        <StatCard
          label="Board Relevant"
          value={boardActions.length}
          href="/actions"
        />
        <StatCard
          label="Upcoming Meeting"
          value={nextMeeting ? formatDate(nextMeeting.meeting_date) : "—"}
          sub={nextMeeting?.title}
          href={nextMeeting ? `/meetings/${nextMeeting.id}` : "/meetings"}
        />
        <StatCard
          label="Active Projects"
          value={activeProjects.length}
          href="/strategic-plan"
        />
        <StatCard label="Tree Items Open" value={openTrees.length} href="/trees" />
        <StatCard
          label="Capital Under Review"
          value={capitalWatch.length}
          href="/capital"
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <PanelCard title="This week — due actions">
          {dueThisWeek.length === 0 ? (
            <p className="text-slate-500">Nothing due in the next 7 days</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {dueThisWeek.slice(0, 8).map((a) => (
                <li key={a.id} className="py-2">
                  <Link href="/actions" className="font-medium text-green-700">
                    {a.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {a.owner ?? "Unassigned"} · Due {formatDate(a.due_date)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>
        <PanelCard title="Upcoming meetings (30 days)" href="/meetings">
          {upcomingMeetings.length === 0 ? (
            <p className="text-slate-500">No upcoming meetings</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcomingMeetings.map((m) => (
                <li key={m.id} className="py-2">
                  <Link
                    href={`/meetings/${m.id}`}
                    className="font-medium text-green-700"
                  >
                    {m.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {formatDate(m.meeting_date)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <PanelCard title="Board relevant — actions">
          {boardActions.length === 0 ? (
            <p className="text-slate-500">None flagged</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {boardActions.slice(0, 6).map((a) => (
                <li key={a.id} className="py-2">
                  <span className="font-medium">{a.title}</span>
                  <StatusBadge status={a.status} priority={a.priority} />
                </li>
              ))}
            </ul>
          )}
        </PanelCard>
        <PanelCard title="Board watch — projects & trees">
          <ul className="space-y-2 text-sm text-slate-700">
            {boardProjects.slice(0, 4).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/strategic-plan/${p.id}`}
                  className="text-green-700 hover:underline"
                >
                  {p.title}
                </Link>{" "}
                — {p.board_status}
              </li>
            ))}
            {treeBoardWatch.slice(0, 4).map((t) => (
              <li key={t.id}>
                <Link href={`/trees/${t.id}`} className="text-green-700 hover:underline">
                  {t.title}
                </Link>{" "}
                — board {t.board_status}
              </li>
            ))}
            {boardProjects.length === 0 && treeBoardWatch.length === 0 && (
              <li className="text-slate-500">No board watch items</li>
            )}
          </ul>
        </PanelCard>
      </div>

      <PanelCard title="Strategic plan snapshot" href="/strategic-plan" className="mb-6">
        <div className="grid gap-4 md:grid-cols-3">
          {tierGroups.map((tier) => {
            const group = activeProjects
              .filter((p) => p.priority_tier === tier)
              .slice(0, 5);
            return (
              <div key={tier}>
                <h3 className="text-xs font-semibold uppercase text-slate-500">
                  {tier.replace("Tier ", "T").split(" ")[0]}
                </h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {group.length === 0 ? (
                    <li className="text-slate-400">—</li>
                  ) : (
                    group.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/strategic-plan/${p.id}`}
                          className="text-green-700 hover:underline"
                        >
                          {p.title}
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </PanelCard>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <PanelCard title="Tree watchlist" href="/trees">
          {openTrees.length === 0 ? (
            <p className="text-slate-500">No open tree items</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {openTrees.slice(0, 6).map((t) => (
                <li key={t.id} className="py-2 text-sm">
                  <Link href={`/trees/${t.id}`} className="font-medium text-green-700">
                    {t.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    Permit {t.permit_status} · Board {t.board_status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>
        <PanelCard title="Capital watchlist" href="/capital">
          {capitalWatch.length === 0 ? (
            <p className="text-slate-500">No capital items in review</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {capitalWatch.slice(0, 6).map((c) => (
                <li key={c.id} className="py-2 text-sm">
                  <Link
                    href={`/capital/${c.id}`}
                    className="font-medium text-green-700"
                  >
                    {c.title}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {money(c.estimated_cost)} · {c.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>
      </div>

      <PanelCard title="Recent meeting decisions" href="/meetings">
        {recentDecisions.length === 0 ? (
          <p className="text-slate-500">No decisions recorded</p>
        ) : (
          <div className="space-y-4">
            {recentDecisions.map((m) => (
              <blockquote
                key={m.id}
                className="border-l-4 border-green-700 pl-4"
              >
                <Link
                  href={`/meetings/${m.id}`}
                  className="text-sm font-medium text-green-700"
                >
                  {m.title} · {formatDate(m.meeting_date)}
                </Link>
                <p className="mt-1 line-clamp-3 text-sm italic text-slate-600">
                  {m.decisions}
                </p>
              </blockquote>
            ))}
          </div>
        )}
      </PanelCard>
    </div>
  );
}
