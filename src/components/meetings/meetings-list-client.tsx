"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { Meeting } from "@/lib/database.types";
import { formatDate, attendeeCount } from "@/lib/format";
import { StatusBadge } from "@/lib/status-badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { matchesStatusFilter, searchMatchesTitle } from "@/lib/list-filters";

const statusFilters = ["All", "Scheduled", "Completed"] as const;

export function MeetingsListClient({ meetings }: { meetings: Meeting[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusFilters)[number]>("All");

  const filtered = useMemo(() => {
    const list = Array.isArray(meetings) ? meetings : [];
    return list.filter((m) => {
      if (!searchMatchesTitle(m.title, search)) return false;
      if (!matchesStatusFilter(m.status, statusFilter)) return false;
      return true;
    });
  }, [meetings, search, statusFilter]);

  const list = Array.isArray(meetings) ? meetings : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-white"
        />
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                statusFilter === s
                  ? "bg-green-700 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white py-16 text-slate-500 shadow-sm">
          <CalendarDays className="h-10 w-10 text-slate-300" />
          <p>
            {list.length === 0
              ? "No meetings yet"
              : "No meetings match your filters"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="hidden md:grid md:grid-cols-[1fr_auto_auto_auto_auto] md:gap-4 md:border-b md:border-slate-100 md:bg-slate-50 md:px-4 md:py-2 md:text-xs md:font-semibold md:uppercase md:text-slate-500">
            <span>Title</span>
            <span>Type</span>
            <span>Date</span>
            <span>Status</span>
            <span>Attendees</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {filtered.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/meetings/${m.id}`}
                  className="grid gap-2 px-4 py-4 transition-colors hover:bg-slate-50 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center md:gap-4"
                >
                  <span className="font-medium text-slate-900">{m.title}</span>
                  <StatusBadge status={m.meeting_type} />
                  <span className="text-sm text-slate-600">
                    {formatDate(m.meeting_date)}
                  </span>
                  <StatusBadge status={m.status} />
                  <span className="text-sm text-slate-500">
                    {attendeeCount(m.attendees)} attendees
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
