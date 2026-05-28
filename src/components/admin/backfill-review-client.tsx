"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { BACKFILL_SESSION_KEY } from "@/lib/backfill/source-types";
import type {
  BackfillReviewSession,
  DuplicateHint,
  ReviewRowBase,
} from "@/lib/backfill/review-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FilterMode = "all" | "governance";

function DispositionControl({
  row,
  hints,
  onChange,
}: {
  row: ReviewRowBase;
  hints: DuplicateHint[];
  onChange: (patch: Partial<ReviewRowBase>) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      <label className="flex items-center gap-1">
        <input
          type="radio"
          checked={row.disposition === "create"}
          onChange={() => onChange({ disposition: "create", linkToId: undefined })}
        />
        Create new
      </label>
      <label className="flex items-center gap-1">
        <input
          type="radio"
          checked={row.disposition === "link"}
          onChange={() => onChange({ disposition: "link" })}
        />
        Link existing
      </label>
      <label className="flex items-center gap-1">
        <input
          type="radio"
          checked={row.disposition === "skip"}
          onChange={() => onChange({ disposition: "skip", included: false })}
        />
        Skip
      </label>
      {row.disposition === "link" && hints.length > 0 && (
        <select
          className="rounded border border-slate-200 px-2 py-1"
          value={row.linkToId ?? ""}
          onChange={(e) => onChange({ linkToId: e.target.value || undefined })}
        >
          <option value="">Select match…</option>
          {hints.map((h) => (
            <option key={h.id} value={h.id}>
              {h.title} ({Math.round(h.score * 100)}%)
            </option>
          ))}
        </select>
      )}
      {hints[0] && row.disposition === "create" && (
        <span className="text-amber-700">
          Possible match:{" "}
          <Link href={hints[0].href} className="underline">
            {hints[0].title}
          </Link>
        </span>
      )}
    </div>
  );
}

function ReviewGroup<T extends ReviewRowBase & { confidence: number }>({
  title,
  items,
  hints,
  renderTitle,
  onUpdate,
}: {
  title: string;
  items: T[];
  hints: Record<string, DuplicateHint[]>;
  renderTitle: (item: T) => string;
  onUpdate: (next: T[]) => void;
}) {
  if (!items.length) return null;
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-slate-800">
        {title}{" "}
        <Badge variant="secondary">{items.filter((i) => i.included).length} selected</Badge>
      </h3>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li
            key={item.clientKey}
            className={cn(
              "rounded-lg border p-3",
              item.included ? "border-green-200 bg-green-50/40" : "border-slate-100"
            )}
          >
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.included}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...item, included: e.target.checked };
                  onUpdate(next);
                }}
              />
              <span>
                <span className="font-medium text-slate-900">{renderTitle(item)}</span>
                <span className="ml-2 text-slate-500">
                  confidence {Math.round(item.confidence * 100)}%
                </span>
              </span>
            </label>
            <DispositionControl
              row={item}
              hints={hints[item.clientKey] ?? []}
              onChange={(patch) => {
                const next = [...items];
                next[idx] = { ...item, ...patch };
                onUpdate(next);
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BackfillReviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter: FilterMode =
    searchParams.get("filter") === "governance" ? "governance" : "all";

  const [session, setSession] = useState<BackfillReviewSession | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(BACKFILL_SESSION_KEY);
    if (!raw) return;
    try {
      setSession(JSON.parse(raw) as BackfillReviewSession);
    } catch {
      toast.error("Invalid review session");
    }
  }, []);

  const counts = useMemo(() => {
    if (!session) return 0;
    const groups = [
      session.meetings,
      session.actionItems,
      session.strategicProjects,
      session.treeItems,
      session.capitalItems,
      session.memberFeedback,
      session.committeeMembers,
      session.governanceSections,
      session.institutionalDecisions,
      session.meetingTopics,
      session.discussionMentions,
      session.entityLinks,
    ];
    return groups.reduce((n, g) => n + g.filter((r) => r.included).length, 0);
  }, [session]);

  async function apply() {
    if (!session) return;
    setSaving(true);
    const pick = <T extends { included: boolean }>(rows: T[]) =>
      rows.filter((r) => r.included);

    const res = await fetch("/api/admin/backfill/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceLabel: session.sourceLabel,
        rawSourceText: session.rawSourceText,
        meetings: pick(session.meetings),
        actionItems: pick(session.actionItems),
        strategicProjects: pick(session.strategicProjects),
        treeItems: pick(session.treeItems),
        capitalItems: pick(session.capitalItems),
        memberFeedback: pick(session.memberFeedback),
        committeeMembers: pick(session.committeeMembers),
        governanceSections: pick(session.governanceSections),
        institutionalDecisions: pick(session.institutionalDecisions),
        meetingTopics: pick(session.meetingTopics),
        discussionMentions: pick(session.discussionMentions),
        entityLinks: pick(session.entityLinks),
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error ?? "Apply failed");
      return;
    }
    toast.success(
      `Applied: ${data.created} created, ${data.linked} linked to existing`
    );
    sessionStorage.removeItem(BACKFILL_SESSION_KEY);
    router.push("/governance");
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">No review session found.</p>
        <Link href="/admin/backfill" className="text-green-700 hover:underline">
          Start backfill →
        </Link>
      </div>
    );
  }

  const showOps = filter === "all";
  const hints = session.duplicateHints;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
        <p className="font-medium text-amber-950">Review before writing</p>
        <p className="mt-1 text-amber-900/90">
          {session.sourceLabel} · OpenAI · {session.sourceSummary}
        </p>
        <p className="mt-2 text-amber-900/80">{counts} items selected for apply</p>
      </div>

      {showOps && (
        <ReviewGroup
          title="Meetings"
          items={session.meetings}
          hints={hints}
          renderTitle={(m) => m.title}
          onUpdate={(meetings) => setSession({ ...session, meetings })}
        />
      )}

      {showOps && (
        <ReviewGroup
          title="Action items"
          items={session.actionItems}
          hints={hints}
          renderTitle={(a) => a.title}
          onUpdate={(actionItems) => setSession({ ...session, actionItems })}
        />
      )}

      {showOps && (
        <ReviewGroup
          title="Strategic projects"
          items={session.strategicProjects}
          hints={hints}
          renderTitle={(p) => p.title}
          onUpdate={(strategicProjects) => setSession({ ...session, strategicProjects })}
        />
      )}

      {showOps && (
        <ReviewGroup
          title="Tree items"
          items={session.treeItems}
          hints={hints}
          renderTitle={(t) => t.title}
          onUpdate={(treeItems) => setSession({ ...session, treeItems })}
        />
      )}

      {showOps && (
        <ReviewGroup
          title="Capital items"
          items={session.capitalItems}
          hints={hints}
          renderTitle={(c) => c.title}
          onUpdate={(capitalItems) => setSession({ ...session, capitalItems })}
        />
      )}

      {showOps && (
        <ReviewGroup
          title="Member feedback"
          items={session.memberFeedback}
          hints={hints}
          renderTitle={(f) => f.topic}
          onUpdate={(memberFeedback) => setSession({ ...session, memberFeedback })}
        />
      )}

      {showOps && (
        <ReviewGroup
          title="Committee members"
          items={session.committeeMembers}
          hints={hints}
          renderTitle={(m) => m.full_name}
          onUpdate={(committeeMembers) => setSession({ ...session, committeeMembers })}
        />
      )}

      <ReviewGroup
        title="Governance sections (Bible)"
        items={session.governanceSections}
        hints={hints}
        renderTitle={(g) => `${g.title} (${g.slug})`}
        onUpdate={(governanceSections) => setSession({ ...session, governanceSections })}
      />

      <ReviewGroup
        title="Institutional decisions"
        items={session.institutionalDecisions}
        hints={hints}
        renderTitle={(d) => d.title}
        onUpdate={(institutionalDecisions) =>
          setSession({ ...session, institutionalDecisions })
        }
      />

      {showOps && (
        <ReviewGroup
          title="Meeting topics"
          items={session.meetingTopics}
          hints={hints}
          renderTitle={(t) => t.topic_label}
          onUpdate={(meetingTopics) => setSession({ ...session, meetingTopics })}
        />
      )}

      {showOps && (
        <ReviewGroup
          title="Discussion mentions"
          items={session.discussionMentions}
          hints={hints}
          renderTitle={(m) => m.mention_label}
          onUpdate={(discussionMentions) =>
            setSession({ ...session, discussionMentions })
          }
        />
      )}

      {showOps && (
        <ReviewGroup
          title="Entity links"
          items={session.entityLinks}
          hints={hints}
          renderTitle={(e) => `${e.source_label} → ${e.target_label}`}
          onUpdate={(entityLinks) => setSession({ ...session, entityLinks })}
        />
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          disabled={saving || counts === 0}
          className="bg-green-700 text-white hover:bg-green-800"
          onClick={apply}
        >
          {saving ? "Applying…" : "Apply selected records"}
        </Button>
        <Link href="/admin/backfill" className="text-sm text-slate-600 hover:underline">
          ← New extraction
        </Link>
      </div>
    </div>
  );
}
