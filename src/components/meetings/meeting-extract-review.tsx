"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import type { Meeting } from "@/lib/database.types";
import type { MeetingExtractionResult } from "@/lib/meeting-extraction";
import { formatDate } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type WithInclude<T> = T & { included: boolean };

function wrap<T>(items: T[]): WithInclude<T>[] {
  return items.map((item) => ({ ...item, included: true }));
}

export function MeetingExtractReview({ meeting }: { meeting: Meeting }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState(meeting.summary ?? "");
  const [decisions, setDecisions] = useState(meeting.decisions ?? "");
  const [actions, setActions] = useState<
    WithInclude<MeetingExtractionResult["actionItems"][0]>[]
  >([]);
  const [projects, setProjects] = useState<
    WithInclude<MeetingExtractionResult["strategicProjects"][0]>[]
  >([]);
  const [trees, setTrees] = useState<
    WithInclude<MeetingExtractionResult["treeItems"][0]>[]
  >([]);
  const [capital, setCapital] = useState<
    WithInclude<MeetingExtractionResult["capitalItems"][0]>[]
  >([]);
  const [feedback, setFeedback] = useState<
    WithInclude<MeetingExtractionResult["memberFeedback"][0]>[]
  >([]);
  const [hasRun, setHasRun] = useState(false);

  async function runExtraction() {
    const transcript = meeting.raw_transcript?.trim();
    if (!transcript) {
      toast.error("Add a transcript before extracting");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/meetings/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId: meeting.id, transcript }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Extraction failed");
        setLoading(false);
        return;
      }
      const result = data as MeetingExtractionResult;
      setSummary(result.summary);
      setDecisions(result.decisions);
      setActions(wrap(result.actionItems));
      setProjects(wrap(result.strategicProjects));
      setTrees(wrap(result.treeItems));
      setCapital(wrap(result.capitalItems));
      setFeedback(wrap(result.memberFeedback));
      setHasRun(true);
      toast.success("Extraction ready for review");
    } catch {
      toast.error("Extraction request failed");
    }
    setLoading(false);
  }

  async function createSelected() {
    setSaving(true);
    const supabase = createClient();
    const sourceLabel = `${meeting.title} (${formatDate(meeting.meeting_date)})`;

    const { error: meetErr } = await supabase
      .from("meetings")
      .update({ summary, decisions })
      .eq("id", meeting.id);
    if (toastSupabaseError(meetErr)) {
      setSaving(false);
      return;
    }

    const selectedActions = actions.filter((a) => a.included);
    if (selectedActions.length) {
      const { error } = await supabase.from("action_items").insert(
        selectedActions.map((a) => ({
          title: a.title,
          owner: a.owner,
          status: "Open",
          priority: a.priority,
          category: a.category,
          due_date: a.due_date,
          hole_or_area: a.hole_or_area,
          board_relevance: a.board_relevance,
          notes: a.notes,
          source_meeting_id: meeting.id,
        }))
      );
      if (toastSupabaseError(error)) {
        setSaving(false);
        return;
      }
    }

    const selectedProjects = projects.filter((p) => p.included);
    if (selectedProjects.length) {
      const { error } = await supabase.from("strategic_projects").insert(
        selectedProjects.map((p) => ({
          title: p.title,
          hole_or_area: p.hole_or_area,
          category: p.category,
          priority_tier: p.priority_tier,
          strategic_rationale: p.strategic_rationale,
          notes: p.notes,
          source_meeting_id: meeting.id,
          status: "Concept",
        }))
      );
      if (toastSupabaseError(error)) {
        setSaving(false);
        return;
      }
    }

    const selectedTrees = trees.filter((t) => t.included);
    if (selectedTrees.length) {
      const { error } = await supabase.from("tree_items").insert(
        selectedTrees.map((t) => ({
          title: t.title,
          hole_or_area: t.hole_or_area,
          tree_type: t.tree_type,
          rationale: t.rationale,
          permit_status: t.permit_status ?? "Not Required",
          committee_status: t.committee_status ?? "Open",
          board_status: t.board_status ?? "Not Required",
          target_season: t.target_season,
          notes: t.notes,
        }))
      );
      if (toastSupabaseError(error)) {
        setSaving(false);
        return;
      }
    }

    const selectedCapital = capital.filter((c) => c.included);
    if (selectedCapital.length) {
      const { error } = await supabase.from("capital_items").insert(
        selectedCapital.map((c) => ({
          title: c.title,
          item_type: c.item_type,
          estimated_cost: c.estimated_cost,
          target_year: c.target_year,
          priority: c.priority,
          status: c.status ?? "Under Review",
          notes: c.notes,
        }))
      );
      if (toastSupabaseError(error)) {
        setSaving(false);
        return;
      }
    }

    const selectedFeedback = feedback.filter((f) => f.included);
    if (selectedFeedback.length) {
      const { error } = await supabase.from("member_feedback").insert(
        selectedFeedback.map((f) => ({
          topic: f.topic,
          category: f.category,
          feedback_text: f.feedback_text,
          source: f.source ?? sourceLabel,
          status: f.status ?? "Open",
          owner: f.owner,
          notes: f.notes,
        }))
      );
      if (toastSupabaseError(error)) {
        setSaving(false);
        return;
      }
    }

    toast.success("Selected items created");
    router.push(`/meetings/${meeting.id}`);
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Transcript preview</h2>
        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-slate-600">
          {meeting.raw_transcript?.slice(0, 2000) ||
            "(No transcript — use intake first)"}
          {(meeting.raw_transcript?.length ?? 0) > 2000 ? "…" : ""}
        </pre>
        <Button
          type="button"
          className="mt-3 bg-green-700 text-white hover:bg-green-800"
          disabled={loading}
          onClick={runExtraction}
        >
          {loading ? "Running…" : "Run extraction"}
        </Button>
      </div>

      {hasRun && (
        <>
          <Card title="Summary">
            <Textarea
              className="min-h-[160px] font-mono text-sm"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </Card>
          <Card title="Decisions & board items">
            {decisions.trim() ? (
              <ul className="mb-3 list-inside list-disc space-y-1 text-sm text-slate-700">
                {decisions
                  .split("\n")
                  .filter((l) => l.trim().startsWith("-"))
                  .slice(0, 12)
                  .map((line, i) => (
                    <li key={i}>{line.replace(/^\s*-\s*/, "")}</li>
                  ))}
              </ul>
            ) : (
              <p className="mb-3 text-sm text-slate-500">No decisions detected.</p>
            )}
            <Textarea
              className="min-h-[120px] font-mono text-sm"
              value={decisions}
              onChange={(e) => setDecisions(e.target.value)}
            />
          </Card>

          <SuggestionCard
            title="Suggested action items"
            count={actions.length}
            emptyMessage="No action items detected in transcript."
          >
            <ul className="space-y-3">
              {actions.map((a, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                >
                  <IncludeRow
                    checked={a.included}
                    onChange={(v) => {
                      const n = [...actions];
                      n[i] = { ...a, included: v };
                      setActions(n);
                    }}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {a.owner ?? "Unassigned"}
                    {a.hole_or_area ? ` · ${a.hole_or_area}` : ""}
                    {a.board_relevance ? " · Board relevant" : ""}
                  </p>
                  <Input
                    className="mt-2 bg-white"
                    value={a.title}
                    onChange={(e) => {
                      const n = [...actions];
                      n[i] = { ...a, title: e.target.value };
                      setActions(n);
                    }}
                  />
                </li>
              ))}
            </ul>
          </SuggestionCard>

          <SuggestionCard
            title="Suggested strategic projects"
            count={projects.length}
            emptyMessage="No strategic plan items detected."
          >
            <ul className="space-y-3">
              {projects.map((p, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                >
                  <IncludeRow
                    checked={p.included}
                    onChange={(v) => {
                      const n = [...projects];
                      n[i] = { ...p, included: v };
                      setProjects(n);
                    }}
                  />
                  <Input
                    className="mt-2 bg-white"
                    value={p.title}
                    onChange={(e) => {
                      const n = [...projects];
                      n[i] = { ...p, title: e.target.value };
                      setProjects(n);
                    }}
                  />
                </li>
              ))}
            </ul>
          </SuggestionCard>

          <SuggestionCard
            title="Suggested tree items"
            count={trees.length}
            emptyMessage="No tree or corridor items detected."
          >
            <ul className="space-y-3">
              {trees.map((t, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                >
                  <IncludeRow
                    checked={t.included}
                    onChange={(v) => {
                      const n = [...trees];
                      n[i] = { ...t, included: v };
                      setTrees(n);
                    }}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {[
                      t.hole_or_area,
                      t.species ?? t.tree_type,
                      t.board_relevant ? "Board relevant" : null,
                      t.committee_status,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <Input
                    className="mt-2 bg-white"
                    value={t.title}
                    onChange={(e) => {
                      const n = [...trees];
                      n[i] = { ...t, title: e.target.value };
                      setTrees(n);
                    }}
                  />
                </li>
              ))}
            </ul>
          </SuggestionCard>

          <SuggestionCard
            title="Suggested capital items"
            count={capital.length}
            emptyMessage="No capital or equipment items detected."
          >
            <ul className="space-y-3">
              {capital.map((c, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                >
                  <IncludeRow
                    checked={c.included}
                    onChange={(v) => {
                      const n = [...capital];
                      n[i] = { ...c, included: v };
                      setCapital(n);
                    }}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {[c.item_type, c.priority].filter(Boolean).join(" · ")}
                  </p>
                  <Input
                    className="mt-2 bg-white"
                    value={c.title}
                    onChange={(e) => {
                      const n = [...capital];
                      n[i] = { ...c, title: e.target.value };
                      setCapital(n);
                    }}
                  />
                </li>
              ))}
            </ul>
          </SuggestionCard>

          <SuggestionCard
            title="Suggested member feedback"
            count={feedback.length}
            emptyMessage="No member communication items detected."
          >
            <ul className="space-y-3">
              {feedback.map((f, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                >
                  <IncludeRow
                    checked={f.included}
                    onChange={(v) => {
                      const n = [...feedback];
                      n[i] = { ...f, included: v };
                      setFeedback(n);
                    }}
                  />
                  <Input
                    className="mt-2 bg-white"
                    value={f.topic}
                    onChange={(e) => {
                      const n = [...feedback];
                      n[i] = { ...f, topic: e.target.value };
                      setFeedback(n);
                    }}
                  />
                </li>
              ))}
            </ul>
          </SuggestionCard>

          <Button
            type="button"
            className="bg-green-700 text-white hover:bg-green-800"
            disabled={saving}
            onClick={createSelected}
          >
            {saving ? "Creating…" : "Create selected items"}
          </Button>
        </>
      )}

      <Link
        href={`/meetings/${meeting.id}`}
        className={cn(buttonVariants({ variant: "ghost" }))}
      >
        Back to meeting
      </Link>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

function SuggestionCard({
  title,
  count,
  emptyMessage,
  children,
}: {
  title: string;
  count: number;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        <span className="text-xs font-medium text-slate-500">{count} found</span>
      </div>
      {count === 0 ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        children
      )}
    </section>
  );
}

function IncludeRow({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      Include
    </label>
  );
}
