import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PriorityBadge, StatusBadge } from "@/lib/status-badge";
import { RelatedHistoryPanel } from "@/components/operational-memory/related-history-panel";
import type { ActionItem, CapitalItem } from "@/lib/database.types";

function formatMoney(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function CapitalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [itemRes, actionsRes] = await Promise.all([
    supabase.from("capital_items").select("*").eq("id", params.id).single(),
    supabase
      .from("action_items")
      .select("*")
      .ilike("category", "%Capital%")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (itemRes.error || !itemRes.data) notFound();
  const item = itemRes.data as CapitalItem;
  const relatedActions = ((actionsRes.data ?? []) as ActionItem[]).filter(
    (a) =>
      a.title.toLowerCase().includes(item.title.toLowerCase().slice(0, 12)) ||
      (item.item_type &&
        a.category?.toLowerCase().includes(item.item_type.toLowerCase()))
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{item.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={item.status} priority={item.priority} />
            <PriorityBadge priority={item.priority} />
          </div>
        </div>
        <Link
          href={`/capital/${item.id}/edit`}
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
            entityType: "capital",
            entityId: item.id,
            title: item.title,
            category: item.item_type,
          }}
        />
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Type</dt>
            <dd>{item.item_type ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Cost</dt>
            <dd>{formatMoney(item.estimated_cost)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Target year</dt>
            <dd>{item.target_year ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Season</dt>
            <dd>{item.target_season ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Owner</dt>
            <dd>{item.owner ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-slate-500">Board status</dt>
            <dd>{item.board_status ?? "—"}</dd>
          </div>
        </dl>
        {item.funding_notes && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-700">Funding notes</h3>
            <p className="mt-1 whitespace-pre-wrap text-slate-600">
              {item.funding_notes}
            </p>
          </div>
        )}
        {item.notes && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-700">Notes</h3>
            <p className="mt-1 whitespace-pre-wrap text-slate-600">{item.notes}</p>
          </div>
        )}
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
