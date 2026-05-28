import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EXTRACTION_MODEL } from "@/lib/meeting-extraction-openai";
import { BIBLE_FRAMEWORK_SECTIONS } from "@/lib/governance/bible-framework";
import {
  corpusDigest,
  corpusSliceForSection,
  gatherGovernanceCorpus,
} from "@/lib/governance/gather-corpus";
import {
  CHAIR_BRIEF_SYNTHESIS_USER,
  DECISION_RATIONALE_USER,
  EVOLUTION_SYNTHESIS_USER,
  GOVERNANCE_SYNTHESIS_SYSTEM,
  INTELLIGENCE_SYNTHESIS_USER,
  sectionSynthesisUserPrompt,
} from "@/lib/governance/synthesize-prompts";
import {
  decisionRationaleSchema,
  intelligenceSchema,
  markdownArtifactSchema,
  sectionSynthesisSchema,
} from "@/lib/governance/synthesis-schemas";
import { computeIntelligenceAnalytics } from "@/lib/governance/intelligence-analytics";
import { buildChairDashboard } from "@/lib/operational-memory/chair-dashboard";

export type SynthesizeMode =
  | "sections"
  | "decisions"
  | "intelligence"
  | "evolution"
  | "chair_brief"
  | "full";

export type SynthesizeResult = {
  sectionsUpdated: number;
  decisionsUpdated: number;
  artifactsUpdated: string[];
  errors: string[];
};

function openaiClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENAI_API_KEY is required for governance synthesis");
  return new OpenAI({ apiKey });
}

export async function synthesizeGovernanceSection(
  client: OpenAI,
  sectionTitle: string,
  sectionSlug: string,
  corpusSlice: string
) {
  const completion = await client.chat.completions.parse({
    model: EXTRACTION_MODEL,
    messages: [
      { role: "system", content: GOVERNANCE_SYNTHESIS_SYSTEM },
      {
        role: "user",
        content: sectionSynthesisUserPrompt(sectionTitle, sectionSlug, corpusSlice),
      },
    ],
    response_format: zodResponseFormat(sectionSynthesisSchema, "section_synthesis"),
    temperature: 0.25,
  });
  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) throw new Error(`No synthesis for ${sectionSlug}`);
  return parsed;
}

export async function runGovernanceSynthesis(
  supabase: SupabaseClient,
  mode: SynthesizeMode = "full",
  options?: { slugs?: string[]; maxSections?: number }
): Promise<SynthesizeResult> {
  const client = openaiClient();
  const corpus = await gatherGovernanceCorpus(supabase);
  const result: SynthesizeResult = {
    sectionsUpdated: 0,
    decisionsUpdated: 0,
    artifactsUpdated: [],
    errors: [],
  };

  const slugs =
    options?.slugs ??
    BIBLE_FRAMEWORK_SECTIONS.map((s) => s.slug);
  const maxSections = options?.maxSections ?? slugs.length;

  if (mode === "sections" || mode === "full") {
    for (const frame of BIBLE_FRAMEWORK_SECTIONS.filter((f) =>
      slugs.includes(f.slug)
    ).slice(0, maxSections)) {
      try {
        const slice = corpusSliceForSection(corpus, frame.slug);
        const syn = await synthesizeGovernanceSection(
          client,
          frame.title,
          frame.slug,
          slice
        );
        const sourceCount =
          syn.supporting_meeting_ids.length +
          syn.supporting_decision_ids.length +
          syn.supporting_quotes.length;

        await supabase
          .from("governance_sections")
          .update({
            summary: syn.summary,
            synthesized_body: syn.synthesized_body,
            why_exists: syn.why_exists,
            historical_context: syn.historical_context,
            risks_if_ignored: syn.risks_if_ignored,
            history_examples: syn.history_examples,
            supporting_meeting_ids: syn.supporting_meeting_ids,
            supporting_decision_ids: syn.supporting_decision_ids,
            supporting_quotes: syn.supporting_quotes,
            source_count: sourceCount,
            source_grounding: {
              meeting_ids: syn.supporting_meeting_ids,
              decision_ids: syn.supporting_decision_ids,
              recurring_themes: syn.recurring_themes,
            },
            last_synthesized_at: new Date().toISOString(),
          })
          .eq("slug", frame.slug);
        result.sectionsUpdated++;
      } catch (e) {
        result.errors.push(
          `${frame.slug}: ${e instanceof Error ? e.message : "failed"}`
        );
      }
    }
  }

  if (mode === "decisions" || mode === "full") {
    for (const dec of corpus.institutional_decisions.slice(0, 20)) {
      try {
        const hints = corpusSliceForSection(
          corpus,
          dec.governance_section_slug ?? "historical-decisions-rationale"
        );
        const completion = await client.chat.completions.parse({
          model: EXTRACTION_MODEL,
          messages: [
            { role: "system", content: GOVERNANCE_SYNTHESIS_SYSTEM },
            {
              role: "user",
              content: DECISION_RATIONALE_USER(dec.title, hints),
            },
          ],
          response_format: zodResponseFormat(
            decisionRationaleSchema,
            "decision_rationale"
          ),
          temperature: 0.25,
        });
        const parsed = completion.choices[0]?.message?.parsed;
        if (!parsed) continue;
        await supabase
          .from("institutional_decisions")
          .update({
            rationale_summary: parsed.rationale_summary,
            alternatives_considered: parsed.alternatives_considered,
            historical_context: parsed.historical_context,
            expected_outcome: parsed.expected_outcome,
            downstream_implications: parsed.downstream_implications,
            lessons_learned: parsed.lessons_learned,
            related_meeting_ids: parsed.related_meeting_ids,
            last_synthesized_at: new Date().toISOString(),
          })
          .eq("id", dec.id);
        result.decisionsUpdated++;
      } catch (e) {
        result.errors.push(
          `decision ${dec.id}: ${e instanceof Error ? e.message : "failed"}`
        );
      }
    }
  }

  const digest = corpusDigest(corpus);
  const analytics = await computeIntelligenceAnalytics(supabase);

  if (mode === "intelligence" || mode === "full") {
    try {
      const completion = await client.chat.completions.parse({
        model: EXTRACTION_MODEL,
        messages: [
          { role: "system", content: GOVERNANCE_SYNTHESIS_SYSTEM },
          {
            role: "user",
            content: `${INTELLIGENCE_SYNTHESIS_USER}\n\nAnalytics snapshot:\n${JSON.stringify(analytics, null, 2)}\n\nCorpus:\n${digest.slice(0, 35000)}`,
          },
        ],
        response_format: zodResponseFormat(intelligenceSchema, "intelligence"),
        temperature: 0.3,
      });
      const parsed = completion.choices[0]?.message?.parsed;
      if (parsed) {
        await supabase.from("governance_artifacts").upsert({
          artifact_key: "intelligence_dashboard",
          title: "Governance intelligence",
          body_markdown: parsed.narrative_summary,
          body_json: { ...parsed, analytics },
          source_grounding: { corpus_meetings: corpus.meetings.map((m) => m.id) },
          last_synthesized_at: new Date().toISOString(),
        });
        result.artifactsUpdated.push("intelligence_dashboard");
      }
    } catch (e) {
      result.errors.push(
        `intelligence: ${e instanceof Error ? e.message : "failed"}`
      );
    }
  }

  if (mode === "evolution" || mode === "full") {
    try {
      const completion = await client.chat.completions.parse({
        model: EXTRACTION_MODEL,
        messages: [
          { role: "system", content: GOVERNANCE_SYNTHESIS_SYSTEM },
          {
            role: "user",
            content: `${EVOLUTION_SYNTHESIS_USER}\n\n${digest.slice(0, 40000)}`,
          },
        ],
        response_format: zodResponseFormat(
          markdownArtifactSchema,
          "evolution"
        ),
        temperature: 0.3,
      });
      const parsed = completion.choices[0]?.message?.parsed;
      if (parsed) {
        await supabase.from("governance_artifacts").upsert({
          artifact_key: "committee_evolution",
          title: "Committee evolution",
          body_markdown: parsed.body_markdown,
          body_json: { key_points: parsed.key_points ?? [] },
          source_grounding: { meeting_ids: corpus.meetings.map((m) => m.id) },
          last_synthesized_at: new Date().toISOString(),
        });
        result.artifactsUpdated.push("committee_evolution");
      }
    } catch (e) {
      result.errors.push(
        `evolution: ${e instanceof Error ? e.message : "failed"}`
      );
    }
  }

  if (mode === "chair_brief" || mode === "full") {
    try {
      const chairSections = await buildChairDashboard(supabase);
      const chairDigest = chairSections
        .map(
          (s) =>
            `## ${s.title}\n` +
            s.items.map((i) => `- ${i.label}${i.meta ? ` (${i.meta})` : ""}`).join("\n")
        )
        .join("\n\n");

      const completion = await client.chat.completions.parse({
        model: EXTRACTION_MODEL,
        messages: [
          { role: "system", content: GOVERNANCE_SYNTHESIS_SYSTEM },
          {
            role: "user",
            content: `${CHAIR_BRIEF_SYNTHESIS_USER}\n\n## Chair dashboard\n${chairDigest}\n\n## Corpus\n${digest.slice(0, 30000)}`,
          },
        ],
        response_format: zodResponseFormat(
          markdownArtifactSchema,
          "chair_brief"
        ),
        temperature: 0.35,
      });
      const parsed = completion.choices[0]?.message?.parsed;
      if (parsed) {
        await supabase.from("governance_artifacts").upsert({
          artifact_key: "outgoing_chair_brief",
          title: "Outgoing Chair Intelligence Brief",
          body_markdown: parsed.body_markdown,
          body_json: { key_points: parsed.key_points ?? [] },
          source_grounding: {
            chair_sections: chairSections.map((s) => s.title),
          },
          last_synthesized_at: new Date().toISOString(),
        });
        result.artifactsUpdated.push("outgoing_chair_brief");
      }
    } catch (e) {
      result.errors.push(
        `chair_brief: ${e instanceof Error ? e.message : "failed"}`
      );
    }
  }

  return result;
}
