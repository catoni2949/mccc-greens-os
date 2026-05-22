"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import { DRAFT_SUMMARY_PLACEHOLDER } from "@/lib/meeting-extraction";
import type { Meeting } from "@/lib/database.types";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function MeetingTranscriptIntakePage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingId, setMeetingId] = useState("");
  const [transcript, setTranscript] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("meetings")
        .select("id, title, meeting_date, raw_transcript, summary")
        .order("meeting_date", { ascending: false, nullsFirst: false });
      if (toastSupabaseError(error)) {
        setLoading(false);
        return;
      }
      setMeetings((data ?? []) as Meeting[]);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const m = meetings.find((x) => x.id === meetingId);
    if (m) setTranscript(m.raw_transcript ?? "");
  }, [meetingId, meetings]);

  async function onSave() {
    if (!meetingId) {
      toast.error("Select a meeting");
      return;
    }
    if (!transcript.trim()) {
      toast.error("Paste a transcript first");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const current = meetings.find((m) => m.id === meetingId);
    const payload: { raw_transcript: string; summary?: string } = {
      raw_transcript: transcript.trim(),
    };
    if (!current?.summary?.trim()) {
      payload.summary = DRAFT_SUMMARY_PLACEHOLDER;
    }
    const { error } = await supabase
      .from("meetings")
      .update(payload)
      .eq("id", meetingId);
    if (toastSupabaseError(error)) {
      setSaving(false);
      return;
    }
    setPreview(transcript.trim().slice(0, 800));
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId
          ? {
              ...m,
              raw_transcript: transcript.trim(),
              summary: m.summary?.trim() ? m.summary : payload.summary ?? null,
            }
          : m
      )
    );
    toast.success("Transcript saved");
    setSaving(false);
  }

  return (
    <div>
      <PageHeader title="Meeting Transcript Intake" />
      <p className="-mt-4 mb-6 text-sm text-slate-500">
        Paste raw transcript text and attach it to a meeting record.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="max-w-3xl space-y-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm lg:max-w-none">
          <div className="space-y-2">
            <Label>Meeting</Label>
            {loading ? (
              <p className="text-sm text-slate-500">Loading meetings…</p>
            ) : (
              <Select
                value={meetingId || "__none__"}
                onValueChange={(v) =>
                  setMeetingId(!v || v === "__none__" ? "" : String(v))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose meeting" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select a meeting…</SelectItem>
                  {meetings.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title} · {formatDate(m.meeting_date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="transcript">Raw transcript</Label>
            <Textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={18}
              className="min-h-[360px] font-mono text-sm"
              placeholder="Paste transcript here…"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={saving}
              onClick={onSave}
              className="bg-green-700 text-white hover:bg-green-800"
            >
              {saving ? "Saving…" : "Save transcript"}
            </Button>
            {meetingId && (
              <Link
                href={`/meetings/${meetingId}/extract`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Extract intelligence
              </Link>
            )}
            {meetingId && (
              <Link
                href={`/meetings/${meetingId}`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Meeting command center
              </Link>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Preview</h2>
          <pre className="mt-2 max-h-[480px] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
            {preview || "Save to preview transcript…"}
          </pre>
        </div>
      </div>
    </div>
  );
}
