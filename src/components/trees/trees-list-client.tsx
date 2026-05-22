"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TreePine } from "lucide-react";
import type { TreeItem } from "@/lib/database.types";
import { StatusBadge } from "@/lib/status-badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { matchesStatusFilter, searchMatchesTitle } from "@/lib/list-filters";

export function TreesListClient({ items }: { items: TreeItem[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const statuses = useMemo(() => {
    const set = new Set(items.map((i) => i.committee_status));
    return ["All", ...Array.from(set).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (!searchMatchesTitle(i.title, search)) return false;
      if (!matchesStatusFilter(i.committee_status, statusFilter)) return false;
      return true;
    });
  }, [items, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search trees…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-white"
        />
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium",
                statusFilter === s
                  ? "bg-green-700 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white py-16 text-slate-500 shadow-sm">
          <TreePine className="size-10 text-slate-300" />
          <p>No tree items match your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((i) => (
            <Link
              key={i.id}
              href={`/trees/${i.id}`}
              className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900">{i.title}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {i.hole_or_area ?? "—"} · {i.tree_type ?? "—"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={i.committee_status} />
                <StatusBadge status={i.permit_status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
