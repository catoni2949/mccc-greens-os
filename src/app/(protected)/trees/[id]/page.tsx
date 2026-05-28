import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/lib/status-badge";
import { RelatedHistoryPanel } from "@/components/operational-memory/related-history-panel";
import type { ActionItem, TreeItem } from "@/lib/database.types";

export default async function TreeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [itemRes, actionsRes] = await Promise.all([
    supabase.from("tree_items").select("*").eq("id", params.id).single(),
    supabase
      .from("action_items")
      .select("*")
      .ilike("category", "%Tree%")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (itemRes.error || !itemRes.data) notFound();
  const item = itemRes.data as TreeItem;
  const relatedActions = ((actionsRes.data ?? []) as ActionItem[]).filter(
    (a) =>
      (item.hole_or_area &&
        a.hole_or_area?.toLowerCase() === item.hole_or_area.toLowerCase()) ||
      a.title.toLowerCase().includes(item.title.toLowerCase().slice(0, 12))
  );

  const fields: { label: string; value: string | null | undefined }[] = [
    { label: "Hole or area", value: item.hole_or_area },
    { label: "Tree type", value: item.tree_type },
    { label: "Issue", value: item.issue },
    { label: "Permit status", value: item.permit_status },
    { label: "Committee status", value: item.committee_status },
    { label: "Board status", value: item.board_status },
    { label: "Target season", value: item.target_season },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{item.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={item.committee_status} />
            <StatusBadge status={item.permit_status} />
            <StatusBadge status={item.board_status} />
          </div>
        </div>
        <Link
          href={`/trees/${item.id}/edit`}
          className={cn(
            buttonVariants(),
            "bg-green-700 text-white hover:bg-green-800"
          )}
        >
          Edit
        </Link>
      </div>
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
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
        {(
          [
            ["Rationale", item.rationale],
            ["Turf impact", item.turf_impact],
            ["Tree health impact", item.tree_health_impact],
            ["Safety impact", item.safety_impact],
            ["Shot value impact", item.shot_value_impact],
            ["Notes", item.notes],
          ] as const
        ).map(
          ([label, value]) =>
            value && (
              <div key={label} className="mt-4">
                <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
                <p className="mt-1 whitespace-pre-wrap text-slate-600">{value}</p>
              </div>
            )
        )}
      </div>

      <div className="mt-6">
        <RelatedHistoryPanel
          context={{
            entityType: "tree",
            entityId: item.id,
            title: item.title,
            hole_or_area: item.hole_or_area,
          }}
        />
      </div>

      <div className="mt-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Related action items
        </h2>
        {relatedActions.length === 0 ? (
          <p className="text-slate-500">No related action items</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {relatedActions.map((a) => (
              <li key={a.id} className="py-3 first:pt-0">
                <Link
                  href={`/actions/${a.id}`}
                  className="font-medium text-green-700 hover:underline"
                >
                  {a.title}
                </Link>
                <p className="text-sm text-slate-500">
                  {a.owner ?? "Unassigned"} · {a.status}
                  {a.source_meeting_id && (
                    <>
                      {" "}
                      ·{" "}
                      <Link
                        href={`/meetings/${a.source_meeting_id}`}
                        className="text-green-700 hover:underline"
                      >
                        Source meeting
                      </Link>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
