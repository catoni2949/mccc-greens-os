import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GOVERNANCE_CATEGORIES } from "@/lib/governance/constants";
import { SupportingHistoryPanel } from "@/components/governance/supporting-history-panel";
import type { SupportingQuote } from "@/lib/governance/governance-types";

type SectionRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string | null;
  body: string | null;
  version_label: string | null;
  synthesized_body: string | null;
  source_count: number | null;
  supporting_meeting_ids: string[] | null;
  supporting_decision_ids: string[] | null;
  supporting_quotes: SupportingQuote[] | null;
  last_synthesized_at: string | null;
  why_exists: string | null;
  historical_context: string | null;
  risks_if_ignored: string | null;
  history_examples: string | null;
};

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  return [];
}

function asQuotes(v: unknown): SupportingQuote[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => x && typeof x === "object" && "quote" in x) as SupportingQuote[];
}

export default async function CommitteeBibleSectionPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("governance_sections")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !data) notFound();

  const section = data as SectionRow;
  const categoryLabel =
    GOVERNANCE_CATEGORIES[section.category as keyof typeof GOVERNANCE_CATEGORIES] ??
    section.category;

  const doctrine =
    section.synthesized_body?.trim() ||
    section.body?.trim() ||
    null;
  const meetingIds = asStringArray(section.supporting_meeting_ids);
  const decisionIds = asStringArray(section.supporting_decision_ids);
  const quotes = asQuotes(section.supporting_quotes);

  return (
    <div>
      <Link
        href="/governance/bible"
        className="text-sm text-green-700 hover:underline"
      >
        ← Committee Bible
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">{section.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {categoryLabel} · v{section.version_label ?? "1.0"}
        {section.last_synthesized_at ? (
          <>
            {" "}
            · Synthesized{" "}
            {new Date(section.last_synthesized_at).toLocaleDateString()}
          </>
        ) : null}
        {section.source_count ? (
          <> · {section.source_count} grounded sources</>
        ) : null}
      </p>
      {section.summary ? (
        <p className="mt-4 text-slate-600">{section.summary}</p>
      ) : null}

      <article className="mt-6 rounded-xl border border-green-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-green-800">
          Institutional doctrine
        </h2>
        <div className="prose prose-sm mt-3 max-w-none whitespace-pre-wrap font-sans text-slate-800">
          {doctrine || "_Run governance synthesis to generate doctrine from committee history._"}
        </div>
      </article>

      {(section.why_exists ||
        section.historical_context ||
        section.risks_if_ignored ||
        section.history_examples) && (
        <section className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-6">
          <h2 className="text-sm font-semibold uppercase text-slate-600">
            Why this matters
          </h2>
          {section.why_exists ? (
            <div className="mt-3">
              <h3 className="text-sm font-medium text-slate-800">Why this exists</h3>
              <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                {section.why_exists}
              </p>
            </div>
          ) : null}
          {section.historical_context ? (
            <div className="mt-3">
              <h3 className="text-sm font-medium text-slate-800">Historical context</h3>
              <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                {section.historical_context}
              </p>
            </div>
          ) : null}
          {section.risks_if_ignored ? (
            <div className="mt-3">
              <h3 className="text-sm font-medium text-slate-800">Risks if ignored</h3>
              <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                {section.risks_if_ignored}
              </p>
            </div>
          ) : null}
          {section.history_examples ? (
            <div className="mt-3">
              <h3 className="text-sm font-medium text-slate-800">Examples from history</h3>
              <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                {section.history_examples}
              </p>
            </div>
          ) : null}
        </section>
      )}

      <section className="mt-6 rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase text-slate-500">
          Supporting historical evidence
        </h2>
        <div className="mt-4">
          <SupportingHistoryPanel
            meetingIds={meetingIds}
            decisionIds={decisionIds}
            quotes={quotes}
          />
        </div>
      </section>

      {section.body?.trim() &&
      section.synthesized_body?.trim() &&
      section.body !== section.synthesized_body ? (
        <details className="mt-6 rounded-xl border border-slate-100 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-600">
            Original seed / manual body
          </summary>
          <div className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
            {section.body}
          </div>
        </details>
      ) : null}
    </div>
  );
}
