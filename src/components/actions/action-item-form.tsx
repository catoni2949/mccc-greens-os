"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import type { ActionItem, Meeting, StrategicProject } from "@/lib/database.types";
import {
  ACTION_CATEGORIES,
  ACTION_OWNERS,
  ACTION_PRIORITIES,
  ACTION_STATUSES,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ActionItemForm({
  item,
  meetings,
  projects,
  onSuccess,
  defaultSourceMeetingId,
}: {
  item?: ActionItem | null;
  meetings: Pick<Meeting, "id" | "title">[];
  projects: Pick<StrategicProject, "id" | "title">[];
  onSuccess: () => void;
  defaultSourceMeetingId?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: item?.title ?? "",
    owner: item?.owner ?? "",
    status: item?.status ?? "Open",
    priority: item?.priority ?? "Medium",
    category: item?.category ?? "",
    due_date: item?.due_date ?? "",
    hole_or_area: item?.hole_or_area ?? "",
    board_relevance: item?.board_relevance ?? false,
    source_meeting_id:
      item?.source_meeting_id ?? defaultSourceMeetingId ?? "",
    linked_project_id: item?.linked_project_id ?? "",
    notes: item?.notes ?? "",
  });

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        owner: item.owner ?? "",
        status: item.status,
        priority: item.priority,
        category: item.category ?? "",
        due_date: item.due_date ?? "",
        hole_or_area: item.hole_or_area ?? "",
        board_relevance: item.board_relevance,
        source_meeting_id: item.source_meeting_id ?? "",
        linked_project_id: item.linked_project_id ?? "",
        notes: item.notes ?? "",
      });
    } else if (defaultSourceMeetingId) {
      setForm((f) => ({
        ...f,
        source_meeting_id: defaultSourceMeetingId,
      }));
    }
  }, [item, defaultSourceMeetingId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const markCompleted = form.status === "Completed";
    const payload = {
      title: form.title.trim(),
      owner: form.owner || null,
      status: markCompleted ? "Completed" : form.status,
      priority: form.priority,
      category: form.category || null,
      due_date: form.due_date || null,
      hole_or_area: form.hole_or_area || null,
      board_relevance: form.board_relevance,
      source_meeting_id: form.source_meeting_id || null,
      linked_project_id: form.linked_project_id || null,
      notes: form.notes || null,
      completed_at: markCompleted
        ? new Date().toISOString()
        : form.status !== "Completed"
          ? null
          : item?.completed_at ?? null,
    };

    if (item?.id) {
      const { error } = await supabase
        .from("action_items")
        .update(payload)
        .eq("id", item.id);
      if (toastSupabaseError(error)) {
        setSaving(false);
        return;
      }
      toast.success("Action item updated");
    } else {
      const { error } = await supabase.from("action_items").insert(payload);
      if (toastSupabaseError(error)) {
        setSaving(false);
        return;
      }
      toast.success("Action item created");
    }
    onSuccess();
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ai-title">Title *</Label>
        <Input
          id="ai-title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Owner</Label>
          <Select
            value={form.owner || "__none__"}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                owner: !v || v === "__none__" ? "" : String(v),
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {ACTION_OWNERS.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="Or type custom owner"
            value={form.owner}
            onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
            className="mt-2"
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, status: v ? String(v) : f.status }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={form.priority}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                priority: v ? String(v) : f.priority,
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={form.category || "__none__"}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                category: !v || v === "__none__" ? "" : String(v),
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {ACTION_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="due_date">Due date</Label>
          <Input
            id="due_date"
            type="date"
            value={form.due_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, due_date: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hole">Hole or area</Label>
          <Input
            id="hole"
            value={form.hole_or_area}
            onChange={(e) =>
              setForm((f) => ({ ...f, hole_or_area: e.target.value }))
            }
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.board_relevance}
          onChange={(e) =>
            setForm((f) => ({ ...f, board_relevance: e.target.checked }))
          }
          className="h-4 w-4 rounded border-slate-300"
        />
        Board relevance
      </label>

      <div className="space-y-2">
        <Label>Source meeting</Label>
        <Select
          value={form.source_meeting_id || "__none__"}
          onValueChange={(v) =>
            setForm((f) => ({
              ...f,
              source_meeting_id: !v || v === "__none__" ? "" : String(v),
            }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {meetings.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Linked project</Label>
        <Select
          value={form.linked_project_id || "__none__"}
          onValueChange={(v) =>
            setForm((f) => ({
              ...f,
              linked_project_id: !v || v === "__none__" ? "" : String(v),
            }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={3}
        />
      </div>

      <Button
        type="submit"
        disabled={saving}
        className="w-full bg-green-700 text-white hover:bg-green-800"
      >
        {saving ? "Saving…" : item?.id ? "Save" : "Create"}
      </Button>
    </form>
  );
}
