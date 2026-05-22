"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import type { StrategicProject, TreeItem } from "@/lib/database.types";
import {
  PERMIT_STATUSES,
  TARGET_SEASONS,
  TREE_BOARD_STATUSES,
  TREE_COMMITTEE_STATUSES,
  TREE_ISSUES,
  TREE_TYPES,
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

export function TreeItemForm({
  item,
  projects,
}: {
  item?: TreeItem | null;
  projects: Pick<StrategicProject, "id" | "title">[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: item?.title ?? "",
    hole_or_area: item?.hole_or_area ?? "",
    tree_type: item?.tree_type ?? "",
    issue: item?.issue ?? "",
    rationale: item?.rationale ?? "",
    turf_impact: item?.turf_impact ?? "",
    tree_health_impact: item?.tree_health_impact ?? "",
    safety_impact: item?.safety_impact ?? "",
    shot_value_impact: item?.shot_value_impact ?? "",
    permit_status: item?.permit_status ?? "Not Required",
    committee_status: item?.committee_status ?? "Open",
    board_status: item?.board_status ?? "Not Required",
    target_season: item?.target_season ?? "",
    linked_project_id: item?.linked_project_id ?? "",
    notes: item?.notes ?? "",
  });

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        hole_or_area: item.hole_or_area ?? "",
        tree_type: item.tree_type ?? "",
        issue: item.issue ?? "",
        rationale: item.rationale ?? "",
        turf_impact: item.turf_impact ?? "",
        tree_health_impact: item.tree_health_impact ?? "",
        safety_impact: item.safety_impact ?? "",
        shot_value_impact: item.shot_value_impact ?? "",
        permit_status: item.permit_status,
        committee_status: item.committee_status,
        board_status: item.board_status,
        target_season: item.target_season ?? "",
        linked_project_id: item.linked_project_id ?? "",
        notes: item.notes ?? "",
      });
    }
  }, [item]);

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
      tree_type: form.tree_type || null,
      issue: form.issue || null,
      rationale: form.rationale || null,
      turf_impact: form.turf_impact || null,
      tree_health_impact: form.tree_health_impact || null,
      safety_impact: form.safety_impact || null,
      shot_value_impact: form.shot_value_impact || null,
      permit_status: form.permit_status,
      committee_status: form.committee_status,
      board_status: form.board_status,
      target_season: form.target_season || null,
      linked_project_id: form.linked_project_id || null,
      notes: form.notes || null,
    };

    if (item?.id) {
      const { error } = await supabase
        .from("tree_items")
        .update(payload)
        .eq("id", item.id);
      if (toastSupabaseError(error)) {
        setSaving(false);
        return;
      }
      toast.success("Tree item updated");
      router.push(`/trees/${item.id}`);
    } else {
      const { data, error } = await supabase
        .from("tree_items")
        .insert(payload)
        .select("id")
        .single();
      if (toastSupabaseError(error) || !data?.id) {
        setSaving(false);
        return;
      }
      toast.success("Tree item created");
      router.push(`/trees/${data.id}`);
    }
    router.refresh();
    setSaving(false);
  }

  function optionalSelect(
    label: string,
    key: "tree_type" | "issue" | "target_season",
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
      <div className="grid gap-4 sm:grid-cols-2">
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
        {optionalSelect("Tree type", "tree_type", TREE_TYPES)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {optionalSelect("Issue", "issue", TREE_ISSUES)}
        {optionalSelect("Target season", "target_season", TARGET_SEASONS)}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Permit</Label>
          <Select
            value={form.permit_status}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                permit_status: v ? String(v) : f.permit_status,
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERMIT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Committee status</Label>
          <Select
            value={form.committee_status}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                committee_status: v ? String(v) : f.committee_status,
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TREE_COMMITTEE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Board status</Label>
          <Select
            value={form.board_status}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                board_status: v ? String(v) : f.board_status,
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TREE_BOARD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
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
      {(
        [
          ["Rationale", "rationale"],
          ["Turf impact", "turf_impact"],
          ["Tree health impact", "tree_health_impact"],
          ["Safety impact", "safety_impact"],
          ["Shot value impact", "shot_value_impact"],
          ["Notes", "notes"],
        ] as const
      ).map(([label, key]) => (
        <div key={key} className="space-y-2">
          <Label>{label}</Label>
          <Textarea
            value={form[key]}
            onChange={(e) =>
              setForm((f) => ({ ...f, [key]: e.target.value }))
            }
            rows={key === "notes" ? 2 : 3}
          />
        </div>
      ))}
      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          disabled={saving}
          className="bg-green-700 text-white hover:bg-green-800"
        >
          {saving ? "Saving…" : item?.id ? "Save changes" : "Create item"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
