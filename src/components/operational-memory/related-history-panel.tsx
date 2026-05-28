import Link from "next/link";
import { findRelatedHistory, type RelatedHistoryContext } from "@/lib/operational-memory/related-history";
import { createClient } from "@/lib/supabase/server";

export async function RelatedHistoryPanel({
  context,
  title = "Related history",
}: {
  context: RelatedHistoryContext;
  title?: string;
}) {
  const supabase = createClient();
  const { items, queryKey } = await findRelatedHistory(supabase, context);

  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h2>
        <span className="text-xs text-slate-400">key: {queryKey}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">
          No prior meetings or records matched this topic yet.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`} className="py-2.5 first:pt-0">
              <Link href={item.href} className="group block">
                <p className="text-sm font-medium text-green-700 group-hover:underline">
                  {item.title}
                </p>
                <p className="text-xs text-slate-500">
                  {item.subtitle}
                  <span className="ml-2 text-slate-400">
                    {item.kind}
                    {item.boardRelevant ? " · board" : ""}
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-slate-400">
        Similarity: keyword overlap, hole numbers, and titles. Future: vector search on
        transcripts.
      </p>
    </section>
  );
}
