import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/lib/status-badge";
import { Badge } from "@/components/ui/badge";
import { RelatedHistoryPanel } from "@/components/operational-memory/related-history-panel";
import type { ActionItem, StrategicProject } from "@/lib/database.types";

export default async function StrategicProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const [projectRes, actionsRes] = await Promise.all([
    supabase.from("strategic_projects").select("*").eq("id", params.id).single(),
    supabase
      .from("action_items")
      .select("*")
      .eq("linked_project_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  let sourceMeeting: { id: string; title: string } | null = null;

  if (projectRes.error || !projectRes.data) notFound();

  const project = projectRes.data as StrategicProject;
  const actionItems = (actionsRes.data ?? []) as ActionItem[];

  if (project.source_meeting_id) {
    const { data } = await supabase
      .from("meetings")
      .select("id, title")
      .eq("id", project.source_meeting_id)
      .maybeSingle();
    if (data) sourceMeeting = data as { id: string; title: string };
  }

  const fields: { label: string; value: string | null | undefined }[] = [
    { label: "Hole or area", value: project.hole_or_area },
    { label: "Category", value: project.category },
    { label: "Status", value: project.status },
    { label: "Priority tier", value: project.priority_tier },
    { label: "Estimated cost", value: project.estimated_cost_class },
    { label: "Labor type", value: project.labor_type },
    { label: "Disruption", value: project.disruption_level },
    { label: "Member visibility", value: project.member_visibility },
    { label: "Board status", value: project.board_status },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {project.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {project.category && (
              <Badge variant="outline">{project.category}</Badge>
            )}
            <StatusBadge status={project.status} />
          </div>
        </div>
        <Link
          href={`/strategic-plan/${project.id}/edit`}
          className={cn(
            buttonVariants(),
            "bg-green-700 text-white hover:bg-green-800"
          )}
        >
          Edit
        </Link>
      </div>

      <div className="mb-6">
        <RelatedHistoryPanel
          context={{
            entityType: "strategic",
            entityId: project.id,
            title: project.title,
            hole_or_area: project.hole_or_area,
            category: project.category,
          }}
        />
      </div>

      <div className="mb-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs font-medium uppercase text-slate-500">
                {label}
              </dt>
              <dd className="text-slate-900">{value || "—"}</dd>
            </div>
          ))}
        </dl>
        {project.strategic_rationale && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-700">
              Strategic rationale
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-slate-600">
              {project.strategic_rationale}
            </p>
          </div>
        )}
        {sourceMeeting && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-700">Source meeting</h3>
            <Link
              href={`/meetings/${sourceMeeting.id}`}
              className="text-green-700 hover:underline"
            >
              {sourceMeeting.title}
            </Link>
          </div>
        )}
        {project.dependencies && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-700">
              Dependencies
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-slate-600">
              {project.dependencies}
            </p>
          </div>
        )}
        {project.notes && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-700">Notes</h3>
            <p className="mt-1 whitespace-pre-wrap text-slate-600">
              {project.notes}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Linked action items
        </h2>
        {actionItems.length === 0 ? (
          <p className="text-slate-500">No linked action items</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {actionItems.map((a) => (
              <li key={a.id} className="py-3 first:pt-0">
                <Link
                  href={`/actions/${a.id}`}
                  className="font-medium text-green-700 hover:underline"
                >
                  {a.title}
                </Link>
                <p className="text-sm text-slate-500">
                  {a.owner ?? "Unassigned"} · {a.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
