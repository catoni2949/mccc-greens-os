"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import type { MemberFeedback, StrategicProject } from "@/lib/database.types";
import {
  ACTION_OWNERS,
  FEEDBACK_CATEGORIES,
  FEEDBACK_SOURCES,
  FEEDBACK_STATUSES,
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

export function MemberFeedbackForm({
  item,
  projects,
  onSuccess,
}: {
  item?: MemberFeedback | null;
  projects: Pick<StrategicProject, "id" | "title">[];
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    topic: item?.topic ?? "",
    category: item?.category ?? "",
    feedback_text: item?.feedback_text ?? "",
    source: item?.source ?? "",
    status: item?.status ?? "Open",
    owner: item?.owner ?? "",
    linked_project_id: item?.linked_project_id ?? "",
    notes: item?.notes ?? "",
  });

  useEffect(() => {
    if (item) {
      setForm({
        topic: item.topic,
        category: item.category ?? "",
        feedback_text: item.feedback_text ?? "",
        source: item.source ?? "",
        status: item.status,
        owner: item.owner ?? "",
        linked_project_id: item.linked_project_id ?? "",
        notes: item.notes ?? "",
      });
    }
  }, [item]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.topic.trim()) {
      toast.error("Topic is required");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      topic: form.topic.trim(),
      category: form.category || null,
      feedback_text: form.feedback_text || null,
      source: form.source || null,
      status: form.status,
      owner: form.owner || null,
      linked_project_id: form.linked_project_id || null,
      notes: form.notes || null,
    };

    if (item?.id) {
      const { error } = await supabase
        .from("member_feedback")
        .update(payload)
        .eq("id", item.id);
      if (toastSupabaseError(error)) {
        setSaving(false);
        return;
      }
      toast.success("Feedback updated");
    } else {
      const { error } = await supabase.from("member_feedback").insert(payload);
      if (toastSupabaseError(error)) {
        setSaving(false);
        return;
      }
      toast.success("Feedback recorded");
    }
    onSuccess();
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="topic">Topic *</Label>
        <Input
          id="topic"
          value={form.topic}
          onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {FEEDBACK_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Source</Label>
          <Select
            value={form.source || "__none__"}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                source: !v || v === "__none__" ? "" : String(v),
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {FEEDBACK_SOURCES.map((s) => (
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
              {FEEDBACK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
              <SelectValue />
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
        </div>
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
            <SelectValue />
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
        <Label htmlFor="feedback">Feedback</Label>
        <Textarea
          id="feedback"
          value={form.feedback_text}
          onChange={(e) =>
            setForm((f) => ({ ...f, feedback_text: e.target.value }))
          }
          rows={4}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={2}
        />
      </div>
      <Button
        type="submit"
        disabled={saving}
        className="w-full bg-green-700 text-white hover:bg-green-800"
      >
        {saving ? "Saving…" : item?.id ? "Save" : "Add feedback"}
      </Button>
    </form>
  );
}
