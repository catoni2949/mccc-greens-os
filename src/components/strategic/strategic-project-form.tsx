"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import type { StrategicProject } from "@/lib/database.types";
import {
  COST_CLASSES,
  DISRUPTION_LEVELS,
  LABOR_TYPES,
  MEMBER_VISIBILITY,
  PRIORITY_TIERS,
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
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

export function StrategicProjectForm({
  project,
}: {
  project?: StrategicProject | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: project?.title ?? "",
    hole_or_area: project?.hole_or_area ?? "",
    category: project?.category ?? "",
    status: project?.status ?? "Concept",
    priority_tier: project?.priority_tier ?? "",
    estimated_cost_class: project?.estimated_cost_class ?? "",
    labor_type: project?.labor_type ?? "",
    disruption_level: project?.disruption_level ?? "",
    member_visibility: project?.member_visibility ?? "",
    board_status: project?.board_status ?? "",
    strategic_rationale: project?.strategic_rationale ?? "",
    dependencies: project?.dependencies ?? "",
    notes: project?.notes ?? "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: form.title.trim(),
      hole_or_area: form.hole_or_area || null,
      category: form.category || null,
      status: form.status,
      priority_tier: form.priority_tier || null,
      estimated_cost_class: form.estimated_cost_class || null,
      labor_type: form.labor_type || null,
      disruption_level: form.disruption_level || null,
      member_visibility: form.member_visibility || null,
      board_status: form.board_status || null,
      strategic_rationale: form.strategic_rationale || null,
      dependencies: form.dependencies || null,
      notes: form.notes || null,
    };

    if (project?.id) {
      const { error } = await supabase
        .from("strategic_projects")
        .update(payload)
        .eq("id", project.id);
      if (toastSupabaseError(error)) {
        setSaving(false);
        return;
      }
      toast.success("Project updated");
      router.push(`/strategic-plan/${project.id}`);
    } else {
      const { data, error } = await supabase
        .from("strategic_projects")
        .insert(payload)
        .select("id")
        .single();
      if (toastSupabaseError(error) || !data?.id) {
        setSaving(false);
        return;
      }
      toast.success("Project created");
      router.push(`/strategic-plan/${data.id}`);
    }
    router.refresh();
    setSaving(false);
  }

  function field(
    label: string,
    key: keyof typeof form,
    options: readonly string[]
  ) {
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Select
          value={form[key] || "__none__"}
          onValueChange={(v) =>
            setForm((f) => ({
              ...f,
              [key]: !v || v === "__none__" ? "" : String(v),
            }))
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-2xl space-y-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm"
    >
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
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

      <div className="grid gap-4 sm:grid-cols-2">
        {field("Category", "category", PROJECT_CATEGORIES)}
        {field("Status", "status", PROJECT_STATUSES)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {field("Priority tier", "priority_tier", PRIORITY_TIERS)}
        {field("Estimated cost", "estimated_cost_class", COST_CLASSES)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {field("Labor type", "labor_type", LABOR_TYPES)}
        {field("Disruption level", "disruption_level", DISRUPTION_LEVELS)}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {field("Member visibility", "member_visibility", MEMBER_VISIBILITY)}
        <div className="space-y-2">
          <Label htmlFor="board_status">Board status</Label>
          <Input
            id="board_status"
            value={form.board_status}
            onChange={(e) =>
              setForm((f) => ({ ...f, board_status: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rationale">Strategic rationale</Label>
        <Textarea
          id="rationale"
          value={form.strategic_rationale}
          onChange={(e) =>
            setForm((f) => ({ ...f, strategic_rationale: e.target.value }))
          }
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dependencies">Dependencies</Label>
        <Textarea
          id="dependencies"
          value={form.dependencies}
          onChange={(e) =>
            setForm((f) => ({ ...f, dependencies: e.target.value }))
          }
          rows={3}
        />
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

      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          disabled={saving}
          className="bg-green-700 text-white hover:bg-green-800"
        >
          {saving ? "Saving…" : project?.id ? "Save changes" : "Create project"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
