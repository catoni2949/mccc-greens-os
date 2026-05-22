"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import { DRAFT_SUMMARY_PLACEHOLDER } from "@/lib/meeting-extraction";
import type { Meeting } from "@/lib/database.types";
import { PanelCard } from "@/components/panel-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function MeetingTranscriptIntakeClient({
  meeting,
}: {
  meeting: Meeting;
}) {
  const [transcript, setTranscript] = useState(meeting.raw_transcript ?? "");
  const [summary, setSummary] = useState(meeting.summary ?? "");
  const [preview, setPreview] = useState(
    meeting.raw_transcript?.slice(0, 500) ?? ""
  );
  const [saving, setSaving] = useState(false);

  const canExtract = Boolean(transcript.trim());

  async function onSave() {
    if (!transcript.trim()) {
      toast.error("Paste a transcript first");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const trimmed = transcript.trim();
    const payload: { raw_transcript: string; summary?: string } = {
      raw_transcript: trimmed,
    };
    if (!summary.trim()) {
      payload.summary = DRAFT_SUMMARY_PLACEHOLDER;
    }
    const { error } = await supabase
      .from("meetings")
      .update(payload)
      .eq("id", meeting.id);
    if (toastSupabaseError(error)) {
      setSaving(false);
      return;
    }
    setPreview(trimmed.slice(0, 500));
    if (payload.summary) setSummary(payload.summary);
    toast.success("Transcript saved");
    setSaving(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <PanelCard title="Transcript" className="p-6">
        <div className="space-y-4">
          <Label htmlFor="transcript">Raw transcript</Label>
          <Textarea
            id="transcript"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={22}
            className="min-h-[400px] font-mono text-sm"
            placeholder="Paste transcript here…"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={saving}
              onClick={onSave}
              className="bg-green-700 text-white hover:bg-green-800"
            >
              {saving ? "Saving…" : "Save transcript"}
            </Button>
            {canExtract ? (
              <Link
                href={`/meetings/${meeting.id}/extract`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Extract intelligence
              </Link>
            ) : (
              <Button type="button" variant="outline" disabled>
                Extract intelligence
              </Button>
            )}
            <Link
              href={`/meetings/${meeting.id}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Meeting command center
            </Link>
          </div>
        </div>
      </PanelCard>
      <PanelCard title="Preview" className="p-6">
        <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
          {preview || "Save to preview transcript excerpt…"}
        </pre>
      </PanelCard>
    </div>
  );
}
