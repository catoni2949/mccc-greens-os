import Link from "next/link";
import { GOVERNANCE_CATEGORIES } from "@/lib/governance/constants";

type Section = {
  slug: string;
  title: string;
  category: string;
  summary: string | null;
  synthesized_body: string | null;
  last_synthesized_at: string | null;
  source_count?: number | null;
};

export function BibleSectionList({ sections }: { sections: Section[] }) {
  return (
    <div className="mt-6 space-y-4">
      {Object.entries(GOVERNANCE_CATEGORIES).map(([cat, label]) => {
        const items = sections.filter((s) => s.category === cat);
        if (!items.length) return null;
        return (
          <details
            key={cat}
            className="group rounded-xl border border-slate-100 bg-white shadow-sm"
            open
          >
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
              {label}{" "}
              <span className="font-normal text-slate-400">({items.length})</span>
            </summary>
            <ul className="divide-y divide-slate-50 border-t border-slate-100 px-2 pb-2">
              {items.map((s) => {
                const updated = Boolean(s.synthesized_body?.trim());
                return (
                  <li key={s.slug}>
                    <Link
                      href={`/governance/bible/${s.slug}`}
                      className="block rounded-lg px-3 py-3 hover:bg-slate-50"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-green-800">{s.title}</span>
                        {updated ? (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800">
                            Updated
                          </span>
                        ) : (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-900">
                            Needs synthesis
                          </span>
                        )}
                        {(s.source_count ?? 0) > 0 ? (
                          <span className="text-xs text-slate-500">
                            {s.source_count} sources
                          </span>
                        ) : null}
                      </div>
                      {s.summary ? (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {s.summary}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
