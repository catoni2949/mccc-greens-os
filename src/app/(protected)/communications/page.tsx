"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import type { MemberFeedback, StrategicProject } from "@/lib/database.types";
import { StatusBadge } from "@/lib/status-badge";
import { PageHeader } from "@/components/page-header";
import { MemberFeedbackForm } from "@/components/communications/member-feedback-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { matchesStatusFilter, searchMatchesTitle } from "@/lib/list-filters";

export default function CommunicationsPage() {
  const [items, setItems] = useState<MemberFeedback[]>([]);
  const [projects, setProjects] = useState<
    Pick<StrategicProject, "id" | "title">[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MemberFeedback | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [fbRes, projRes] = await Promise.all([
      supabase
        .from("member_feedback")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("strategic_projects").select("id, title").order("title"),
    ]);
    if (toastSupabaseError(fbRes.error)) {
      setLoading(false);
      return;
    }
    toastSupabaseError(projRes.error);
    setItems((fbRes.data ?? []) as MemberFeedback[]);
    setProjects((projRes.data ?? []) as Pick<StrategicProject, "id" | "title">[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (!searchMatchesTitle(i.topic, search)) return false;
      if (!matchesStatusFilter(i.status, statusFilter)) return false;
      return true;
    });
  }, [items, search, statusFilter]);

  const statuses = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.status)))],
    [items]
  );

  return (
    <div>
      <PageHeader title="Communications" />
      <p className="-mt-4 mb-4 text-sm text-slate-500">
        Member feedback and committee follow-up
      </p>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          className="bg-green-700 text-white hover:bg-green-800 sm:order-2"
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          New Feedback
        </Button>
        <Input
          placeholder="Search topics…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-white"
        />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
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
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white py-16 text-slate-500 shadow-sm">
          <MessageSquare className="size-10 text-slate-300" />
          <p>No feedback entries yet</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => {
                  setEditing(i);
                  setDialogOpen(true);
                }}
                className="w-full rounded-xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{i.topic}</h3>
                  <StatusBadge status={i.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {i.category && (
                    <Badge variant="outline">{i.category}</Badge>
                  )}
                  {i.source && (
                    <span className="text-xs text-slate-500">{i.source}</span>
                  )}
                </div>
                {i.feedback_text && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {i.feedback_text}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  Owner: {i.owner ?? "Unassigned"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Feedback" : "New Member Feedback"}
            </DialogTitle>
          </DialogHeader>
          <MemberFeedbackForm
            item={editing}
            projects={projects}
            onSuccess={() => {
              setDialogOpen(false);
              setEditing(null);
              load();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
