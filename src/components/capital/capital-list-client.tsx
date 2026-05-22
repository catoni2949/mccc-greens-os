"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DollarSign } from "lucide-react";
import type { CapitalItem } from "@/lib/database.types";
import { PriorityBadge, StatusBadge } from "@/lib/status-badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { matchesStatusFilter, searchMatchesTitle } from "@/lib/list-filters";

function formatMoney(n: number | null) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function CapitalListClient({ items }: { items: CapitalItem[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const statuses = useMemo(() => {
    const set = new Set(items.map((i) => i.status));
    return ["All", ...Array.from(set).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (!searchMatchesTitle(i.title, search)) return false;
      if (!matchesStatusFilter(i.status, statusFilter)) return false;
      return true;
    });
  }, [items, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search capital items…"
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
          <DollarSign className="size-10 text-slate-300" />
          <p>No capital items match your filters</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/capital/${i.id}`}
                      className="font-medium text-green-700 hover:underline"
                    >
                      {i.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {i.item_type ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatMoney(i.estimated_cost)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {i.target_year ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={i.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={i.status} priority={i.priority} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
