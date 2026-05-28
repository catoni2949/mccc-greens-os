"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import type {
  ActionItem,
  FileRecord,
  Meeting,
  StrategicProject,
} from "@/lib/database.types";
import {
  formatDate,
  formatTime,
  attendeeCount,
} from "@/lib/format";
import { actionIsOverdue } from "@/lib/action-workflow";
import { StatusBadge, PriorityBadge } from "@/lib/status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MeetingFilesPanel } from "@/components/meetings/meeting-files-panel";
import { MeetingFollowUpPacket } from "@/components/meetings/meeting-follow-up-packet";
import { BoardPacketGenerator } from "@/components/operational-memory/board-packet-generator";
import { ActionItemForm } from "@/components/actions/action-item-form";
import { StatCard } from "@/components/panel-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const tabs = [
  "Overview",
  "Transcript",
  "Decisions & Summary",
  "Action Items",
  "Linked Projects",
  "Files",
  "Follow-up Packet",
  "Board Packet",
] as const;

function decisionsCount(decisions: string | null | undefined): number {
  if (!decisions?.trim()) return 0;
  return decisions.split(/\r?\n/).filter((l) => l.trim()).length;
}

export function MeetingCommandCenter({
  meeting,
  actionItems: initialActions,
  files,
  sourcedProjects,
  linkedViaActions,
  memorySlots,
  boardPacketMarkdown,
}: {
  meeting: Meeting;
  actionItems: ActionItem[];
  files: FileRecord[];
  sourcedProjects: StrategicProject[];
  linkedViaActions: StrategicProject[];
  memorySlots?: React.ReactNode;
  boardPacketMarkdown?: string;
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");
  const [actionItems, setActionItems] = useState(initialActions);
  const [transcript, setTranscript] = useState(meeting.raw_transcript ?? "");
  const [editingTranscript, setEditingTranscript] = useState(false);
  const [summary, setSummary] = useState(meeting.summary ?? "");
  const [decisions, setDecisions] = useState(meeting.decisions ?? "");
  const [boardSummary, setBoardSummary] = useState("");
  const [savingField, setSavingField] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<ActionItem | null>(null);

  const linkedProjects = useMemo(() => {
    const map = new Map<string, StrategicProject>();
    for (const p of [...sourcedProjects, ...linkedViaActions]) {
      map.set(p.id, p);
    }
    return Array.from(map.values());
  }, [sourcedProjects, linkedViaActions]);

  const projectsForForm = useMemo(
    () => linkedProjects.map((p) => ({ id: p.id, title: p.title })),
    [linkedProjects]
  );

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
    if (field === "raw_transcript") {
      setEditingTranscript(false);
      void fetch("/api/governance/auto-synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "transcript_saved",
          meetingId: meeting.id,
          text: value,
          hasTranscript: true,
        }),
      }).catch(() => undefined);
    }
    setSavingField(null);
  }

  async function updateActionStatus(id: string, status: string) {
    const supabase = createClient();
    const payload: Record<string, unknown> = { status };
    if (status.toLowerCase() === "completed") {
      payload.completed_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("action_items")
      .update(payload)
      .eq("id", id);
    if (toastSupabaseError(error)) return;
    setActionItems((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status,
              completed_at:
                status.toLowerCase() === "completed"
                  ? new Date().toISOString()
                  : a.completed_at,
            }
          : a
      )
    );
    toast.success("Status updated");
  }

  function reloadActions() {
    const supabase = createClient();
    supabase
      .from("action_items")
      .select("*")
      .eq("source_meeting_id", meeting.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setActionItems(data as ActionItem[]);
      });
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {meeting.title}
          </h1>
          <p className="mt-1 text-slate-600">
            {formatDate(meeting.meeting_date)}
            {meeting.start_time ? ` · ${formatTime(meeting.start_time)}` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={meeting.meeting_type} />
            <StatusBadge status={meeting.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/meetings/${meeting.id}/edit`}
            className={cn(
              buttonVariants(),
              "bg-green-700 text-white hover:bg-green-800"
            )}
          >
            Edit
          </Link>
          <Link
            href={`/meetings/${meeting.id}/intake`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Transcript intake
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={() => setTab("Follow-up Packet")}
          >
            Follow-up packet
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setTab("Board Packet")}
          >
            Generate board packet
          </Button>
          <Link
            href={`/meetings/${meeting.id}/extract`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Extract intelligence
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <button type="button" className="text-left" onClick={() => setTab("Action Items")}>
          <StatCard label="Action items" value={actionItems.length} />
        </button>
        <button
          type="button"
          className="text-left"
          onClick={() => setTab("Decisions & Summary")}
        >
          <StatCard label="Decisions" value={decisionsCount(meeting.decisions)} />
        </button>
        <button type="button" className="text-left" onClick={() => setTab("Linked Projects")}>
          <StatCard label="Linked projects" value={linkedProjects.length} />
        </button>
        <button type="button" className="text-left" onClick={() => setTab("Files")}>
          <StatCard label="Files" value={files.length} />
        </button>
      </div>

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
                Attendees ({attendeeCount(meeting.attendees)})
              </dt>
              <dd className="whitespace-pre-wrap text-slate-900">
                {meeting.attendees || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-slate-500">
                Next meeting
              </dt>
              <dd>{formatDate(meeting.next_meeting_date)}</dd>
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
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href={`/meetings/${meeting.id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Edit meeting
            </Link>
            <Link
              href={`/meetings/${meeting.id}/intake`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Transcript intake
            </Link>
          </div>
          {memorySlots ? <div className="space-y-4 pt-2">{memorySlots}</div> : null}
        </div>
      )}

      {tab === "Transcript" && (
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          {!meeting.raw_transcript && !editingTranscript ? (
            <div className="py-12 text-center">
              <p className="text-slate-600">No transcript on file yet.</p>
              <Link
                href={`/meetings/${meeting.id}/intake`}
                className={cn(
                  buttonVariants(),
                  "mt-4 bg-green-700 text-white hover:bg-green-800"
                )}
              >
                Open transcript intake
              </Link>
            </div>
          ) : editingTranscript ? (
            <div className="space-y-3">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={20}
                className="min-h-[320px] font-mono text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  className="bg-green-700 text-white hover:bg-green-800"
                  disabled={savingField === "raw_transcript"}
                  onClick={() => saveField("raw_transcript", transcript)}
                >
                  Save transcript
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
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-800">
                {meeting.raw_transcript}
              </pre>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setEditingTranscript(true)}>
                  Edit transcript
                </Button>
                <Link
                  href={`/meetings/${meeting.id}/extract`}
                  className={cn(buttonVariants({ variant: "outline" }))}
                >
                  Extract meeting intelligence
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "Decisions & Summary" && (
        <div className="space-y-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Summary</h3>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={12}
              className="min-h-[200px] font-mono text-sm leading-relaxed"
              placeholder="## Draft Summary&#10;..."
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
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Decisions</h3>
            <Textarea
              value={decisions}
              onChange={(e) => setDecisions(e.target.value)}
              rows={10}
              className="min-h-[160px] font-mono text-sm leading-relaxed"
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
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              Board-facing summary (placeholder)
            </h3>
            <Textarea
              value={boardSummary}
              onChange={(e) => setBoardSummary(e.target.value)}
              rows={6}
              className="min-h-[120px] text-sm"
              placeholder="Draft language for board packet — not persisted yet."
            />
          </div>
        </div>
      )}

      {tab === "Action Items" && (
        <div className="space-y-4">
          <Button
            className="bg-green-700 text-white hover:bg-green-800"
            onClick={() => {
              setEditingAction(null);
              setActionDialogOpen(true);
            }}
          >
            New action for this meeting
          </Button>
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
            {actionItems.length === 0 ? (
              <p className="py-12 text-center text-slate-500">No action items yet</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Quick</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {actionItems.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-3 font-medium">{a.title}</td>
                      <td className="px-4 py-3">{a.owner ?? "—"}</td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={a.priority} />
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3",
                          actionIsOverdue(a.due_date, a.status) && "text-red-600"
                        )}
                      >
                        {formatDate(a.due_date)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.status} priority={a.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateActionStatus(a.id, "In Progress")}
                          >
                            Progress
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateActionStatus(a.id, "Completed")}
                          >
                            Done
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {tab === "Linked Projects" && (
        <div className="space-y-4">
          <Link
            href="/strategic-plan/new"
            className={cn(buttonVariants(), "bg-green-700 text-white hover:bg-green-800")}
          >
            New strategic project
          </Link>
          {linkedProjects.length === 0 ? (
            <p className="rounded-xl border border-slate-100 bg-white py-12 text-center text-slate-500 shadow-sm">
              No projects linked to this meeting yet
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white shadow-sm">
              {linkedProjects.map((p) => (
                <li key={p.id} className="px-4 py-3">
                  <Link
                    href={`/strategic-plan/${p.id}`}
                    className="font-medium text-green-700 hover:underline"
                  >
                    {p.title}
                  </Link>
                  <p className="text-sm text-slate-500">
                    {p.status} · {p.priority_tier ?? "Untiered"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "Files" && (
        <MeetingFilesPanel meetingId={meeting.id} initialFiles={files} />
      )}

      {tab === "Follow-up Packet" && (
        <MeetingFollowUpPacket
          meeting={{ ...meeting, summary, decisions }}
          actionItems={actionItems}
          linkedProjects={linkedProjects}
        />
      )}

      {tab === "Board Packet" && (
        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">Board packet</h2>
          <p className="mb-4 text-sm text-slate-600">
            Executive-ready markdown from this meeting and open committee records.
          </p>
          <BoardPacketGenerator
            meetingId={meeting.id}
            initialMarkdown={boardPacketMarkdown ?? ""}
          />
        </div>
      )}

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAction ? "Edit action" : "New action item"}
            </DialogTitle>
          </DialogHeader>
          <ActionItemForm
            item={editingAction}
            defaultSourceMeetingId={meeting.id}
            meetings={[{ id: meeting.id, title: meeting.title }]}
            projects={projectsForForm}
            onSuccess={() => {
              setActionDialogOpen(false);
              setEditingAction(null);
              reloadActions();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
