import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { buildTimeline, formatTimelineDate } from "@/lib/operational-memory/timeline";
import { TimelineFilters } from "@/components/operational-memory/timeline-filters";

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: {
    hole?: string;
    category?: string;
    board?: string;
    owner?: string;
    theme?: string;
  };
}) {
  const supabase = createClient();
  const events = await buildTimeline(supabase, {
    hole: searchParams.hole,
    category: searchParams.category,
    boardOnly: searchParams.board === "1",
    owner: searchParams.owner,
    theme:
      searchParams.theme === "strategic" ||
      searchParams.theme === "tree" ||
      searchParams.theme === "capital"
        ? searchParams.theme
        : "all",
  });

  return (
    <div>
      <PageHeader title="Operational timeline" />
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        Institutional memory across meetings, decisions, actions, and programs.
      </p>
      <TimelineFilters />
      <div className="mt-6 space-y-2">
        {events.length === 0 ? (
          <p className="text-sm text-slate-500">No events match these filters.</p>
        ) : (
          events.map((e) => (
            <Link
              key={`${e.category}-${e.id}`}
              href={e.href}
              className="flex flex-col gap-0.5 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-900">{e.title}</p>
                <p className="text-sm text-slate-500">{e.subtitle}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                <span className="rounded bg-slate-100 px-2 py-0.5 capitalize">
                  {e.category}
                </span>
                <span>{formatTimelineDate(e.date)}</span>
                {e.boardRelevant ? (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-800">
                    board
                  </span>
                ) : null}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
