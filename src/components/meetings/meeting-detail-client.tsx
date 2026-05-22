"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import type { ActionItem, FileRecord, Meeting } from "@/lib/database.types";
import { formatDate, formatTime, attendeeCount } from "@/lib/format";
import { StatusBadge } from "@/lib/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MeetingFilesPanel } from "@/components/meetings/meeting-files-panel";
import { cn } from "@/lib/utils";

const tabs = [
  "Overview",
  "Transcript",
  "Decisions & Summary",
  "Action Items",
  "Files",
] as const;

export function MeetingDetailClient({
  meeting,
  actionItems,
  files,
}: {
  meeting: Meeting;
  actionItems: ActionItem[];
  files: FileRecord[];
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [transcript, setTranscript] = useState(meeting.raw_transcript ?? "");
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [summary, setSummary] = useState(meeting.summary ?? "");
  const [decisions, setDecisions] = useState(meeting.decisions ?? "");
  const [savingField, setSavingField] = useState<string | null>(null);

  async function saveField(
    field: "raw_transcript" | "summary" | "decisions",
    value: string
  ) {
    setSavingField(field);
    const supabase = createClient();
    const { error } = await supabase
      .from("meetings")
      .update({ [field]: value || null })
      .eq("id", meeting.id);
    if (toastSupabaseError(error)) {
      setSavingField(null);
      return;
    }
    toast.success("Saved");
    if (field === "raw_transcript") setEditingTranscript(false);
    setSavingField(null);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "border-green-700 text-green-700"
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">
                Date
              </dt>
              <dd className="text-slate-900">
                {formatDate(meeting.meeting_date)}
                {meeting.start_time
                  ? ` · ${formatTime(meeting.start_time)}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">
                Type
              </dt>
              <dd>
                <StatusBadge status={meeting.meeting_type} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">
                Status
              </dt>
              <dd>
                <StatusBadge status={meeting.status} />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">
                Attendees ({attendeeCount(meeting.attendees)})
              </dt>
              <dd className="whitespace-pre-wrap text-slate-900">
                {meeting.attendees || "—"}
              </dd>
            </div>
          </dl>
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Agenda</h3>
            <p className="mt-1 whitespace-pre-wrap text-slate-600">
              {meeting.agenda || "—"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Notes</h3>
            <p className="mt-1 whitespace-pre-wrap text-slate-600">
              {meeting.notes || "—"}
            </p>
          </div>
          {meeting.next_meeting_date && (
            <p className="text-sm text-slate-500">
              Next meeting: {formatDate(meeting.next_meeting_date)}
            </p>
          )}
        </div>
      )}

      {tab === "Transcript" && (
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          {editingTranscript ? (
            <div className="space-y-3">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={16}
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  className="bg-green-700 text-white hover:bg-green-800"
                  disabled={savingField === "raw_transcript"}
                  onClick={() => saveField("raw_transcript", transcript)}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTranscript(meeting.raw_transcript ?? "");
                    setEditingTranscript(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-800">
                {meeting.raw_transcript || "No transcript yet."}
              </pre>
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => setEditingTranscript(true)}
              >
                Edit Transcript
              </Button>
            </>
          )}
        </div>
      )}

      {tab === "Decisions & Summary" && (
        <div className="space-y-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              Summary
            </h3>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={6}
            />
            <Button
              className="mt-2 bg-green-700 text-white hover:bg-green-800"
              size="sm"
              disabled={savingField === "summary"}
              onClick={() => saveField("summary", summary)}
            >
              Save summary
            </Button>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              Decisions
            </h3>
            <Textarea
              value={decisions}
              onChange={(e) => setDecisions(e.target.value)}
              rows={6}
            />
            <Button
              className="mt-2 bg-green-700 text-white hover:bg-green-800"
              size="sm"
              disabled={savingField === "decisions"}
              onClick={() => saveField("decisions", decisions)}
            >
              Save decisions
            </Button>
          </div>
        </div>
      )}

      {tab === "Action Items" && (
        <div className="rounded-xl border border-slate-100 bg-white shadow-sm">
          {actionItems.length === 0 ? (
            <p className="py-12 text-center text-slate-500">
              No action items linked to this meeting
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {actionItems.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <Link
                    href="/actions"
                    className="font-medium text-green-700 hover:underline"
                  >
                    {a.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-500">
                    <span>{a.owner ?? "Unassigned"}</span>
                    <StatusBadge status={a.status} priority={a.priority} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "Files" && (
        <MeetingFilesPanel meetingId={meeting.id} initialFiles={files} />
      )}
    </div>
  );
}
