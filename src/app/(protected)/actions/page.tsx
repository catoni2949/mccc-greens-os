"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { toastSupabaseError } from "@/lib/supabase-errors";
import type { ActionItem, Meeting, StrategicProject } from "@/lib/database.types";
import { formatDate } from "@/lib/format";
import { actionIsOverdue } from "@/lib/action-workflow";
import { ACTION_CATEGORIES, ACTION_OWNERS, ACTION_PRIORITIES } from "@/lib/constants";
import { PriorityBadge, StatusBadge } from "@/lib/status-badge";
import { PageHeader } from "@/components/page-header";
import { ActionItemForm } from "@/components/actions/action-item-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  isCompletedStatus,
  isHighPriority,
  matchesStatusFilter,
  searchMatchesTitle,
} from "@/lib/list-filters";

type Tab = "open" | "high" | "board" | "overdue" | "completed";

const statusFilterOptions = [
  "All",
  "Open",
  "In Progress",
  "Waiting",
  "Deferred",
] as const;

export default function ActionsPage() {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [meetings, setMeetings] = useState<Pick<Meeting, "id" | "title">[]>(
    []
  );
  const [projects, setProjects] = useState<
    Pick<StrategicProject, "id" | "title">[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("open");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statusFilterOptions)[number]>("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ActionItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [actionsRes, meetingsRes, projectsRes] = await Promise.all([
      supabase.from("action_items").select("*").order("created_at", {
        ascending: false,
      }),
      supabase
        .from("meetings")
        .select("id, title")
        .order("meeting_date", { ascending: false }),
      supabase
        .from("strategic_projects")
        .select("id, title")
        .order("title"),
    ]);
    if (toastSupabaseError(actionsRes.error)) {
      setLoading(false);
      return;
    }
    toastSupabaseError(meetingsRes.error);
    toastSupabaseError(projectsRes.error);
    setItems((actionsRes.data ?? []) as ActionItem[]);
    setMeetings((meetingsRes.data ?? []) as Pick<Meeting, "id" | "title">[]);
    setProjects(
      (projectsRes.data ?? []) as Pick<StrategicProject, "id" | "title">[]
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const meetingTitle = useMemo(() => {
    const map = new Map(meetings.map((m) => [m.id, m.title]));
    return (id: string | null) => (id ? map.get(id) : undefined);
  }, [meetings]);

  const projectTitle = useMemo(() => {
    const map = new Map(projects.map((p) => [p.id, p.title]));
    return (id: string | null) => (id ? map.get(id) : undefined);
  }, [projects]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!searchMatchesTitle(item.title, search)) return false;
      if (ownerFilter !== "All" && item.owner !== ownerFilter) return false;
      if (categoryFilter !== "All" && item.category !== categoryFilter)
        return false;
      if (
        priorityFilter !== "All" &&
        item.priority.toLowerCase() !== priorityFilter.toLowerCase()
      )
        return false;

      if (tab === "open") {
        if (isCompletedStatus(item.status)) return false;
        if (!matchesStatusFilter(item.status, statusFilter)) return false;
        return true;
      }
      if (tab === "high") {
        return isHighPriority(item.priority) && !isCompletedStatus(item.status);
      }
      if (tab === "board") {
        return item.board_relevance && !isCompletedStatus(item.status);
      }
      if (tab === "overdue") {
        return actionIsOverdue(item.due_date, item.status);
      }
      return isCompletedStatus(item.status);
    });
  }, [
    items,
    search,
    tab,
    statusFilter,
    ownerFilter,
    categoryFilter,
    priorityFilter,
  ]);

  async function quickStatus(id: string, status: string) {
    const supabase = createClient();
    const payload: Record<string, unknown> = { status };
    if (status.toLowerCase() === "completed") {
      payload.completed_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("action_items")
      .update(payload)
      .eq("id", id);
    if (toastSupabaseError(error)) return;
    toast.success(`Marked ${status}`);
    load();
  }

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(item: ActionItem) {
    setEditing(item);
    setDialogOpen(true);
  }

  function onFormSuccess() {
    setDialogOpen(false);
    setEditing(null);
    load();
  }

  return (
    <div>
      <PageHeader title="Action Items" />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          className="bg-green-700 text-white hover:bg-green-800 sm:order-2"
          onClick={openCreate}
        >
          New Action Item
        </Button>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["open", "Open"],
              ["high", "High Priority"],
              ["board", "Board Relevant"],
              ["overdue", "Overdue"],
              ["completed", "Completed"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium",
                tab === key
                  ? "bg-green-700 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-white"
        />
        {tab === "open" && (
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as (typeof statusFilterOptions)[number])
            }
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusFilterOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={ownerFilter} onValueChange={(v) => setOwnerFilter(String(v))}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All owners</SelectItem>
            {ACTION_OWNERS.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(String(v))}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All categories</SelectItem>
            {ACTION_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter}
          onValueChange={(v) => setPriorityFilter(String(v))}
        >
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {ACTION_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white py-16 text-slate-500 shadow-sm">
          <CheckSquare className="h-10 w-10 text-slate-300" />
          <p>No action items in this view</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Meeting</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Quick</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td
                    className="cursor-pointer px-4 py-3 font-medium text-slate-900"
                    onClick={() => openEdit(item)}
                  >
                    {item.title}
                    {item.board_relevance && (
                      <span className="ml-2 text-xs text-red-600">Board</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.owner ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={item.status}
                      priority={item.priority}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={item.priority} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.category ?? "—"}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3",
                      actionIsOverdue(item.due_date, item.status) &&
                        "font-medium text-red-600"
                    )}
                  >
                    {formatDate(item.due_date)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.hole_or_area ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {item.source_meeting_id ? (
                      <Link
                        href={`/meetings/${item.source_meeting_id}`}
                        className="text-green-700 hover:underline"
                      >
                        {meetingTitle(item.source_meeting_id) ?? "Meeting"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {item.linked_project_id ? (
                      <Link
                        href={`/strategic-plan/${item.linked_project_id}`}
                        className="text-green-700 hover:underline"
                      >
                        {projectTitle(item.linked_project_id) ?? "Project"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => quickStatus(item.id, "In Progress")}
                      >
                        Progress
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => quickStatus(item.id, "Waiting")}
                      >
                        Waiting
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => quickStatus(item.id, "Completed")}
                      >
                        Done
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(item)}
                      >
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Action Item" : "New Action Item"}
            </DialogTitle>
          </DialogHeader>
          <ActionItemForm
            item={editing}
            meetings={meetings}
            projects={projects}
            onSuccess={onFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
