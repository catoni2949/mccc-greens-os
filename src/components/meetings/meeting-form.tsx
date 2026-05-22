"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import type { Meeting } from "@/lib/database.types";
import { MEETING_TYPES, MEETING_STATUSES } from "@/lib/constants";
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

function emptyMeeting(): Partial<Meeting> {
  return {
    title: "",
    meeting_type: "Greens Committee",
    meeting_date: null,
    start_time: null,
    status: "Scheduled",
    attendees: "",
    agenda: "",
    notes: "",
    next_meeting_date: null,
  };
}

export function MeetingForm({
  meeting,
}: {
  meeting?: Meeting | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Meeting>>(
    meeting ? { ...meeting } : emptyMeeting()
  );

  function set<K extends keyof Meeting>(key: K, value: Meeting[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: form.title.trim(),
      meeting_type: form.meeting_type ?? "Greens Committee",
      meeting_date: form.meeting_date || null,
      start_time: form.start_time || null,
      status: form.status ?? "Scheduled",
      attendees: form.attendees || null,
      agenda: form.agenda || null,
      notes: form.notes || null,
      next_meeting_date: form.next_meeting_date || null,
    };

    if (meeting?.id) {
      const { error } = await supabase
        .from("meetings")
        .update(payload)
        .eq("id", meeting.id);
      if (toastSupabaseError(error)) {
        setSaving(false);
        return;
      }
      toast.success("Meeting updated");
      router.push(`/meetings/${meeting.id}`);
    } else {
      const { data, error } = await supabase
        .from("meetings")
        .insert(payload)
        .select("id")
        .single();
      if (toastSupabaseError(error) || !data?.id) {
        setSaving(false);
        return;
      }
      toast.success("Meeting created");
      router.push(`/meetings/${data.id}`);
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
          value={form.title ?? ""}
          onChange={(e) => set("title", e.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Meeting type</Label>
          <Select
            value={form.meeting_type ?? "Greens Committee"}
            onValueChange={(v) => v && set("meeting_type", String(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEETING_TYPES.map((t) => (
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
            value={form.status ?? "Scheduled"}
            onValueChange={(v) => v && set("status", String(v))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEETING_STATUSES.map((s) => (
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
          <Label htmlFor="meeting_date">Meeting date</Label>
          <Input
            id="meeting_date"
            type="date"
            value={form.meeting_date ?? ""}
            onChange={(e) => set("meeting_date", e.target.value || null)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_time">Start time</Label>
          <Input
            id="start_time"
            type="time"
            value={form.start_time?.slice(0, 5) ?? ""}
            onChange={(e) => set("start_time", e.target.value || null)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="next_meeting_date">Next meeting date</Label>
        <Input
          id="next_meeting_date"
          type="date"
          value={form.next_meeting_date ?? ""}
          onChange={(e) =>
            set("next_meeting_date", e.target.value || null)
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="attendees">Attendees (comma-separated)</Label>
        <Textarea
          id="attendees"
          value={form.attendees ?? ""}
          onChange={(e) => set("attendees", e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agenda">Agenda</Label>
        <Textarea
          id="agenda"
          value={form.agenda ?? ""}
          onChange={(e) => set("agenda", e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={form.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={4}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          disabled={saving}
          className="bg-green-700 text-white hover:bg-green-800"
        >
          {saving ? "Saving…" : meeting?.id ? "Save changes" : "Create meeting"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
