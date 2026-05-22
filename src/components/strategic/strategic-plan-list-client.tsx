"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Map } from "lucide-react";
import type { StrategicProject } from "@/lib/database.types";
import { StatusBadge } from "@/lib/status-badge";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PRIORITY_TIERS } from "@/lib/constants";
import { matchesStatusFilter, searchMatchesTitle } from "@/lib/list-filters";

const TIER_GROUPS: { key: string; label: string; match: (p: StrategicProject) => boolean }[] = [
  {
    key: "tier1",
    label: "Tier 1",
    match: (p) => p.priority_tier?.startsWith("Tier 1") ?? false,
  },
  {
    key: "tier2",
    label: "Tier 2",
    match: (p) => p.priority_tier?.startsWith("Tier 2") ?? false,
  },
  {
    key: "tier3",
    label: "Tier 3",
    match: (p) => p.priority_tier?.startsWith("Tier 3") ?? false,
  },
  {
    key: "untiered",
    label: "Untiered",
    match: (p) => !p.priority_tier?.trim(),
  },
];

export function StrategicPlanListClient({
  projects,
}: {
  projects: StrategicProject[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const statuses = useMemo(() => {
    const set = new Set(projects.map((p) => p.status));
    return ["All", ...Array.from(set).sort()];
  }, [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (!searchMatchesTitle(p.title, search)) return false;
      if (!matchesStatusFilter(p.status, statusFilter)) return false;
      return true;
    });
  }, [projects, search, statusFilter]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search projects…"
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
          <Map className="h-10 w-10 text-slate-300" />
          <p>No projects match your filters</p>
        </div>
      ) : (
        TIER_GROUPS.map((group) => {
          const groupProjects = filtered.filter(group.match);
          if (groupProjects.length === 0) return null;
          return (
            <section key={group.key}>
              <h2 className="mb-3 text-lg font-semibold text-slate-800">
                {group.label}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {groupProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/strategic-plan/${p.id}`}
                    className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <h3 className="font-semibold text-slate-900">{p.title}</h3>
                    {p.hole_or_area && (
                      <p className="mt-1 text-sm text-slate-500">
                        {p.hole_or_area}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.category && (
                        <Badge variant="outline">{p.category}</Badge>
                      )}
                      <StatusBadge status={p.status} />
                      {p.estimated_cost_class && (
                        <span className="text-xs text-slate-500">
                          {p.estimated_cost_class}
                        </span>
                      )}
                    </div>
                    {p.priority_tier && (
                      <p className="mt-2 text-xs text-slate-400">
                        {PRIORITY_TIERS.find((t) => t === p.priority_tier) ??
                          p.priority_tier}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
