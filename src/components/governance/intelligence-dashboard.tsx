"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { IntelligenceAnalytics } from "@/lib/governance/intelligence-analytics";

type IntelligencePayload = {
  analytics: IntelligenceAnalytics;
  synthesis: Record<string, string[] | string> | null;
  synthesisNarrative: string | null;
  lastSynthesizedAt: string | null;
  committeeEvolution: string | null;
  evolutionSynthesizedAt: string | null;
  outgoingChairBrief: string | null;
  chairBriefSynthesizedAt: string | null;
};

function ListBlock({
  title,
  items,
}: {
  title: string;
  items: string[] | { label: string; href?: string; meta?: string }[];
}) {
  if (!items.length) return null;
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <ul className="space-y-1 text-sm text-slate-700">
        {items.map((item, i) => {
          if (typeof item === "string") {
            return <li key={i}>{item}</li>;
          }
          return (
            <li key={i}>
              {item.href ? (
                <Link href={item.href} className="text-green-700 hover:underline">
                  {item.label}
                </Link>
              ) : (
                item.label
              )}
              {item.meta ? (
                <span className="text-slate-500"> — {item.meta}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function IntelligenceDashboard() {
  const [data, setData] = useState<IntelligencePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/governance/intelligence")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading governance intelligence…</p>;
  }
  if (!data) {
    return <p className="text-sm text-red-600">Failed to load intelligence.</p>;
  }

  const syn = data.synthesis as Record<string, string[]> | null;
  const a = data.analytics;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/setup" className="text-sm text-green-700 hover:underline">
          System setup (migrations & synthesis)
        </Link>
        {data.lastSynthesizedAt ? (
          <span className="text-xs text-slate-500">
            Last synthesized {new Date(data.lastSynthesizedAt).toLocaleString()}
          </span>
        ) : (
          <span className="text-xs text-amber-700">
            No AI synthesis yet — run synthesis with OPENAI_API_KEY
          </span>
        )}
      </div>

      {data.synthesisNarrative ? (
        <div className="rounded-xl border border-green-100 bg-green-50/50 p-5">
          <h2 className="text-sm font-semibold text-green-900">Institutional read</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-green-950">
            {data.synthesisNarrative}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <ListBlock
          title="Recurring themes (analytics)"
          items={a.recurringThemes.map((t) => `${t.label} (×${t.count})`)}
        />
        <ListBlock
          title="Recurring themes (synthesis)"
          items={syn?.recurring_themes ?? []}
        />
        <ListBlock
          title="Unresolved strategic"
          items={a.unresolvedStrategic.map((p) => ({
            label: p.title,
            href: p.href,
            meta: p.status,
          }))}
        />
        <ListBlock
          title="Unresolved strategic (synthesis)"
          items={syn?.unresolved_strategic_topics ?? []}
        />
        <ListBlock title="Board-sensitive" items={a.boardSensitive} />
        <ListBlock
          title="Board-sensitive (synthesis)"
          items={syn?.board_sensitive_issues ?? []}
        />
        <ListBlock
          title="Member concerns"
          items={a.memberConcerns.map((m) => `${m.topic} (${m.status})`)}
        />
        <ListBlock
          title="Member concerns (synthesis)"
          items={syn?.repeated_member_concerns ?? []}
        />
        <ListBlock title="Operational risks" items={a.operationalRisks} />
        <ListBlock
          title="Operational risks (synthesis)"
          items={syn?.recurring_operational_risks ?? []}
        />
        <ListBlock
          title="Governance gaps"
          items={a.governanceGaps.map((g) => ({
            label: g.title,
            href: `/governance/bible/${g.slug}`,
          }))}
        />
        <ListBlock
          title="Governance gaps (synthesis)"
          items={syn?.governance_gaps ?? []}
        />
        <ListBlock
          title="Stale decisions"
          items={a.staleDecisions.map((d) => d.title)}
        />
        <ListBlock
          title="Heavily discussed"
          items={a.heavilyDiscussed}
        />
        <ListBlock title="Continuity risks" items={a.continuityRisks} />
        <ListBlock
          title="Continuity risks (synthesis)"
          items={syn?.continuity_risks ?? []}
        />
      </div>

      {data.committeeEvolution ? (
        <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Committee evolution</h2>
          {data.evolutionSynthesizedAt ? (
            <p className="text-xs text-slate-500">
              Synthesized {new Date(data.evolutionSynthesizedAt).toLocaleString()}
            </p>
          ) : null}
          <div className="prose prose-sm mt-4 max-w-none whitespace-pre-wrap text-slate-800">
            {data.committeeEvolution}
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Regenerate via{" "}
            <Link href="/admin/setup" className="text-green-700 hover:underline">
              System setup → full synthesis
            </Link>
          </p>
        </section>
      ) : (
        <p className="text-sm text-slate-500">
          Run{" "}
          <Link href="/admin/setup" className="text-green-700 hover:underline">
            full synthesis
          </Link>{" "}
          to generate committee evolution.
        </p>
      )}

      {data.outgoingChairBrief ? (
        <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Outgoing Chair Intelligence Brief
          </h2>
          {data.chairBriefSynthesizedAt ? (
            <p className="text-xs text-slate-500">
              Synthesized {new Date(data.chairBriefSynthesizedAt).toLocaleString()}
            </p>
          ) : null}
          <div className="prose prose-sm mt-4 max-w-none whitespace-pre-wrap text-slate-800">
            {data.outgoingChairBrief}
          </div>
          <div className="mt-3 flex gap-2 text-sm">
            <Link href="/admin/setup" className="text-green-700 hover:underline">
              Regenerate (full synthesis)
            </Link>
            <Link href="/governance/transition" className="text-green-700 hover:underline">
              Chair transition →
            </Link>
          </div>
        </section>
      ) : (
        <p className="text-sm text-slate-500">
          Generate via{" "}
          <Link href="/admin/setup" className="text-green-700 hover:underline">
            System setup → full synthesis
          </Link>
        </p>
      )}
    </div>
  );
}
