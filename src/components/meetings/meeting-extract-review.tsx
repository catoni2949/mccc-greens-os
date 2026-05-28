"use client";

import { useMemo, useState } from "react";
import { MergeSuggestionsPanel } from "@/components/meetings/merge-suggestions-panel";
import { mentionKeyFromTitle } from "@/lib/operational-memory/text-similarity";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { toastSupabaseError } from "@/lib/supabase-errors";
import type { Meeting } from "@/lib/database.types";
import {
  CONFIDENCE_THRESHOLD,
  RECOMMENDED_SELECTION_THRESHOLD,
  type MeetingExtractionApiResponse,
  type MeetingExtractionResult,
} from "@/lib/meeting-extraction";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type WithInclude<T> = T & { included: boolean };

function wrap<T extends { confidence: number }>(
  items: T[]
): WithInclude<T>[] {
  return items.map((item) => ({
    ...item,
    included: item.confidence >= RECOMMENDED_SELECTION_THRESHOLD,
  }));
}

function selectedCount(
  actions: WithInclude<{ included: boolean }>[],
  projects: WithInclude<{ included: boolean }>[],
  trees: WithInclude<{ included: boolean }>[],
  capital: WithInclude<{ included: boolean }>[],
  feedback: WithInclude<{ included: boolean }>[]
) {
  return (
    actions.filter((a) => a.included).length +
    projects.filter((p) => p.included).length +
    trees.filter((t) => t.included).length +
    capital.filter((c) => c.included).length +
    feedback.filter((f) => f.included).length
  );
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
  const [showLowConfidence, setShowLowConfidence] = useState(false);
  const [extractionMode, setExtractionMode] = useState<
    "openai" | "heuristic" | null
  >(null);
  const [extractionWarning, setExtractionWarning] = useState<string | null>(
    null
  );

  const totalSelected = selectedCount(
    actions,
    projects,
    trees,
    capital,
    feedback
  );

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
      const result = data as MeetingExtractionApiResponse;
      setSummary(result.summary);
      setDecisions(result.decisions);
      setActions(wrap(result.actionItems));
      setProjects(wrap(result.strategicProjects));
      setTrees(wrap(result.treeItems));
      setCapital(wrap(result.capitalItems));
      setFeedback(wrap(result.memberFeedback));
      setExtractionMode(result.extractionMode);
      setExtractionWarning(result.warning ?? null);
      setHasRun(true);
      if (result.warning) {
        toast.warning(result.warning);
      } else {
        toast.success(
          result.extractionMode === "openai"
            ? "LLM extraction ready for review"
            : "Extraction ready for review"
        );
      }
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

    await persistOperationalMemory(supabase, meeting.id, {
      actions: selectedActions,
      projects: selectedProjects,
      trees: selectedTrees,
      capital: selectedCapital,
      feedback: selectedFeedback,
    });

    toast.success("Selected items created");
    router.push(`/meetings/${meeting.id}`);
    setSaving(false);
  }

  const mergeCandidates = useMemo(() => {
    if (!hasRun) return [];
    const items: { entityType: "action" | "tree" | "strategic" | "capital"; title: string }[] =
      [];
    for (const a of actions) items.push({ entityType: "action", title: a.title });
    for (const p of projects) items.push({ entityType: "strategic", title: p.title });
    for (const t of trees) items.push({ entityType: "tree", title: t.title });
    for (const c of capital) items.push({ entityType: "capital", title: c.title });
    return items;
  }, [hasRun, actions, projects, trees, capital]);

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
          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-medium">
              Review before creating. Nothing is saved until you click Create
              selected items.
            </p>
            <p className="text-amber-900/90">
              Extraction:{" "}
              <span className="font-medium">
                {extractionMode === "openai" ? "OpenAI (LLM)" : "Heuristic fallback"}
              </span>
              {extractionWarning ? ` — ${extractionWarning}` : null}
            </p>
          </div>

          <MergeSuggestionsPanel items={mergeCandidates} />

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

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={showLowConfidence}
                onChange={(e) => setShowLowConfidence(e.target.checked)}
              />
              Show low-confidence suggestions
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const rec = (c: number) => c >= RECOMMENDED_SELECTION_THRESHOLD;
                setActions(actions.map((a) => ({ ...a, included: rec(a.confidence) })));
                setProjects(projects.map((p) => ({ ...p, included: rec(p.confidence) })));
                setTrees(trees.map((t) => ({ ...t, included: rec(t.confidence) })));
                setCapital(capital.map((c) => ({ ...c, included: rec(c.confidence) })));
                setFeedback(feedback.map((f) => ({ ...f, included: rec(f.confidence) })));
              }}
            >
              Select recommended
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setActions(actions.map((a) => ({ ...a, included: false })));
                setProjects(projects.map((p) => ({ ...p, included: false })));
                setTrees(trees.map((t) => ({ ...t, included: false })));
                setCapital(capital.map((c) => ({ ...c, included: false })));
                setFeedback(feedback.map((f) => ({ ...f, included: false })));
              }}
            >
              Select none
            </Button>
          </div>

          <GroupedSuggestions
            title="Suggested action items"
            items={actions}
            showLow={showLowConfidence}
            emptyMessage="No action items detected in transcript."
            onChange={setActions}
            renderMeta={(a) => (
              <p className="mt-1 text-xs text-slate-500">
                {a.owner ?? "Unassigned"}
                {a.hole_or_area ? ` · ${a.hole_or_area}` : ""}
                {a.board_relevance ? " · Board relevant" : ""}
              </p>
            )}
            renderInput={(a, i, update) => (
              <Input
                className="mt-2 bg-white"
                value={a.title}
                onChange={(e) => update(i, { title: e.target.value })}
              />
            )}
          />

          <GroupedSuggestions
            title="Suggested strategic projects"
            items={projects}
            showLow={showLowConfidence}
            emptyMessage="No strategic plan items detected."
            onChange={setProjects}
            renderInput={(p, i, update) => (
              <Input
                className="mt-2 bg-white"
                value={p.title}
                onChange={(e) => update(i, { title: e.target.value })}
              />
            )}
          />

          <GroupedSuggestions
            title="Suggested tree items"
            items={trees}
            showLow={showLowConfidence}
            emptyMessage="No tree or corridor items detected."
            onChange={setTrees}
            renderMeta={(t) => (
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
            )}
            renderInput={(t, i, update) => (
              <Input
                className="mt-2 bg-white"
                value={t.title}
                onChange={(e) => update(i, { title: e.target.value })}
              />
            )}
          />

          <GroupedSuggestions
            title="Suggested capital items"
            items={capital}
            showLow={showLowConfidence}
            emptyMessage="No capital or equipment items detected."
            onChange={setCapital}
            renderMeta={(c) => (
              <p className="mt-1 text-xs text-slate-500">
                {[c.item_type, c.priority].filter(Boolean).join(" · ")}
              </p>
            )}
            renderInput={(c, i, update) => (
              <Input
                className="mt-2 bg-white"
                value={c.title}
                onChange={(e) => update(i, { title: e.target.value })}
              />
            )}
          />

          <GroupedSuggestions
            title="Suggested member feedback"
            items={feedback}
            showLow={showLowConfidence}
            emptyMessage="No member communication items detected."
            onChange={setFeedback}
            renderInput={(f, i, update) => (
              <Input
                className="mt-2 bg-white"
                value={f.topic}
                onChange={(e) => update(i, { topic: e.target.value })}
              />
            )}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">{totalSelected}</span>{" "}
              item{totalSelected === 1 ? "" : "s"} selected for creation
            </p>
            <Button
              type="button"
              className="bg-green-700 text-white hover:bg-green-800"
              disabled={saving || totalSelected === 0}
              onClick={createSelected}
            >
              {saving ? "Creating…" : "Create selected items"}
            </Button>
          </div>
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

function ConfidenceChip({ value }: { value: number }) {
  const high = value >= CONFIDENCE_THRESHOLD;
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-normal",
        high
          ? "border-green-200 bg-green-50 text-green-800"
          : "border-amber-200 bg-amber-50 text-amber-900"
      )}
    >
      {Math.round(value * 100)}% {high ? "high" : "low"}
    </Badge>
  );
}

function GroupedSuggestions<T extends { confidence: number }>({
  title,
  items,
  showLow,
  emptyMessage,
  onChange,
  renderMeta,
  renderInput,
}: {
  title: string;
  items: WithInclude<T>[];
  showLow: boolean;
  emptyMessage: string;
  onChange: React.Dispatch<React.SetStateAction<WithInclude<T>[]>>;
  renderMeta?: (item: WithInclude<T>) => React.ReactNode;
  renderInput: (
    item: WithInclude<T>,
    index: number,
    update: (index: number, patch: Partial<WithInclude<T>>) => void
  ) => React.ReactNode;
}) {
  const indexed = items.map((item, index) => ({ item, index }));
  const high = indexed.filter(
    ({ item }) => item.confidence >= CONFIDENCE_THRESHOLD
  );
  const low = indexed.filter(
    ({ item }) => item.confidence < CONFIDENCE_THRESHOLD
  );
  const visibleHigh = high;
  const visibleLow = showLow ? low : [];

  function updateItem(index: number, patch: Partial<WithInclude<T>>) {
    const n = [...items];
    n[index] = { ...n[index], ...patch };
    onChange(n);
  }

  function renderList(
    list: { item: WithInclude<T>; index: number }[],
    label: string
  ) {
    if (!list.length) return null;
    return (
      <div className="mb-4 last:mb-0">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </h3>
        <ul className="space-y-3">
          {list.map(({ item, index: i }) => (
              <li
                key={`${i}-${item.confidence}`}
                className="rounded-lg border border-slate-100 bg-slate-50/50 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <IncludeRow
                    checked={item.included}
                    onChange={(v) => {
                      const n = [...items];
                      n[i] = { ...n[i], included: v };
                      onChange(n);
                    }}
                  />
                  <ConfidenceChip value={item.confidence} />
                </div>
                {renderMeta?.(item)}
                {renderInput(item, i, updateItem)}
              </li>
            ))}
        </ul>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        <span className="text-xs font-medium text-slate-500">
          {high.length} high · {low.length} low confidence
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <>
          {renderList(visibleHigh, "High confidence")}
          {renderList(visibleLow, "Low confidence / needs review")}
          {!showLow && low.length > 0 && (
            <p className="text-xs text-slate-500">
              {low.length} low-confidence suggestion{low.length === 1 ? "" : "s"}{" "}
              hidden. Enable the toggle above to review.
            </p>
          )}
        </>
      )}
    </section>
  );
}

async function persistOperationalMemory(
  supabase: ReturnType<typeof createClient>,
  meetingId: string,
  selected: {
    actions: { title: string; board_relevance: boolean }[];
    projects: { title: string }[];
    trees: { title: string; board_relevant?: boolean }[];
    capital: { title: string }[];
    feedback: { topic: string }[];
  }
) {
  const mentions: {
    meeting_id: string;
    entity_type: string;
    mention_key: string;
    mention_label: string;
    board_relevant: boolean;
  }[] = [];

  const add = (entityType: string, label: string, board = false) => {
    mentions.push({
      meeting_id: meetingId,
      entity_type: entityType,
      mention_key: mentionKeyFromTitle(label),
      mention_label: label,
      board_relevant: board,
    });
  };

  for (const a of selected.actions) add("action_item", a.title, a.board_relevance);
  for (const p of selected.projects) add("strategic_project", p.title);
  for (const t of selected.trees) add("tree_item", t.title, t.board_relevant);
  for (const c of selected.capital) add("capital_item", c.title);
  for (const f of selected.feedback) add("member_feedback", f.topic);

  if (mentions.length) {
    await supabase.from("discussion_mentions").insert(mentions);
  }

  for (const label of [
    ...selected.actions.map((a) => a.title),
    ...selected.trees.map((t) => t.title),
    ...selected.capital.map((c) => c.title),
  ]) {
    const topic_key = mentionKeyFromTitle(label);
    const { data: existing } = await supabase
      .from("meeting_topics")
      .select("id, discussion_count")
      .eq("meeting_id", meetingId)
      .eq("topic_key", topic_key)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("meeting_topics")
        .update({
          discussion_count: (existing.discussion_count ?? 1) + 1,
          last_discussed_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("meeting_topics").insert({
        meeting_id: meetingId,
        topic_key,
        topic_label: label,
      });
    }
  }
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
