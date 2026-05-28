import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/lib/status-badge";
import { formatDate } from "@/lib/format";
import { RelatedHistoryPanel } from "@/components/operational-memory/related-history-panel";
import type { ActionItem } from "@/lib/database.types";

export default async function ActionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("action_items")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();
  const item = data as ActionItem;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{item.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={item.status} />
            <PriorityBadge priority={item.priority} />
            {item.board_relevance ? (
              <span className="text-xs font-medium text-amber-800">Board relevant</span>
            ) : null}
          </div>
        </div>
        <Link href="/actions" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to actions
        </Link>
      </div>
      <div className="mb-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Owner</dt>
            <dd>{item.owner ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Due</dt>
            <dd>{formatDate(item.due_date)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Category</dt>
            <dd>{item.category ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Hole / area</dt>
            <dd>{item.hole_or_area ?? "—"}</dd>
          </div>
        </dl>
        {item.source_meeting_id && (
          <p className="mt-4 text-sm">
            Source:{" "}
            <Link
              href={`/meetings/${item.source_meeting_id}`}
              className="text-green-700 hover:underline"
            >
              View meeting
            </Link>
          </p>
        )}
        {item.notes && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">{item.notes}</p>
        )}
      </div>
      <RelatedHistoryPanel
        context={{
          entityType: "action",
          entityId: item.id,
          title: item.title,
          hole_or_area: item.hole_or_area,
          category: item.category,
        }}
      />
    </div>
  );
}
