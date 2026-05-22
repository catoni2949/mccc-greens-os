"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import type { CapitalItem, StrategicProject } from "@/lib/database.types";
import {
  ACTION_OWNERS,
  ACTION_PRIORITIES,
  CAPITAL_ITEM_TYPES,
  CAPITAL_STATUSES,
  TARGET_SEASONS,
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

export function CapitalItemForm({
  item,
  projects,
}: {
  item?: CapitalItem | null;
  projects: Pick<StrategicProject, "id" | "title">[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: item?.title ?? "",
    item_type: item?.item_type ?? "",
    estimated_cost: item?.estimated_cost?.toString() ?? "",
    target_year: item?.target_year?.toString() ?? "",
    target_season: item?.target_season ?? "",
    priority: item?.priority ?? "Medium",
    status: item?.status ?? "Under Review",
    owner: item?.owner ?? "",
    funding_notes: item?.funding_notes ?? "",
    board_status: item?.board_status ?? "",
    linked_project_id: item?.linked_project_id ?? "",
    notes: item?.notes ?? "",
  });

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        item_type: item.item_type ?? "",
        estimated_cost: item.estimated_cost?.toString() ?? "",
        target_year: item.target_year?.toString() ?? "",
        target_season: item.target_season ?? "",
        priority: item.priority,
        status: item.status,
        owner: item.owner ?? "",
        funding_notes: item.funding_notes ?? "",
        board_status: item.board_status ?? "",
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
      item_type: form.item_type || null,
      estimated_cost: form.estimated_cost
        ? parseFloat(form.estimated_cost)
        : null,
      target_year: form.target_year ? parseInt(form.target_year, 10) : null,
      target_season: form.target_season || null,
      priority: form.priority,
      status: form.status,
      owner: form.owner || null,
      funding_notes: form.funding_notes || null,
      board_status: form.board_status || null,
      linked_project_id: form.linked_project_id || null,
      notes: form.notes || null,
    };

    if (item?.id) {
      const { error } = await supabase
        .from("capital_items")
        .update(payload)
        .eq("id", item.id);
      if (toastSupabaseError(error)) {
        setSaving(false);
        return;
      }
      toast.success("Capital item updated");
      router.push(`/capital/${item.id}`);
    } else {
      const { data, error } = await supabase
        .from("capital_items")
        .insert(payload)
        .select("id")
        .single();
      if (toastSupabaseError(error) || !data?.id) {
        setSaving(false);
        return;
      }
      toast.success("Capital item created");
      router.push(`/capital/${data.id}`);
    }
    router.refresh();
    setSaving(false);
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
          <Label>Item type</Label>
          <Select
            value={form.item_type || "__none__"}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                item_type: !v || v === "__none__" ? "" : String(v),
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {CAPITAL_ITEM_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              {CAPITAL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="cost">Estimated cost ($)</Label>
          <Input
            id="cost"
            type="number"
            min={0}
            step="0.01"
            value={form.estimated_cost}
            onChange={(e) =>
              setForm((f) => ({ ...f, estimated_cost: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Target year</Label>
          <Input
            id="year"
            type="number"
            value={form.target_year}
            onChange={(e) =>
              setForm((f) => ({ ...f, target_year: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={form.priority}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, priority: v ? String(v) : f.priority }))
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
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Target season</Label>
          <Select
            value={form.target_season || "__none__"}
            onValueChange={(v) =>
              setForm((f) => ({
                ...f,
                target_season: !v || v === "__none__" ? "" : String(v),
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {TARGET_SEASONS.map((s) => (
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
        <Label htmlFor="board">Board status</Label>
        <Input
          id="board"
          value={form.board_status}
          onChange={(e) =>
            setForm((f) => ({ ...f, board_status: e.target.value }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="funding">Funding notes</Label>
        <Textarea
          id="funding"
          value={form.funding_notes}
          onChange={(e) =>
            setForm((f) => ({ ...f, funding_notes: e.target.value }))
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
          {saving ? "Saving…" : item?.id ? "Save changes" : "Create item"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
