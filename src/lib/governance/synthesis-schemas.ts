import { z } from "zod";

export const sectionSynthesisSchema = z.object({
  summary: z.string(),
  synthesized_body: z.string(),
  why_exists: z.string(),
  historical_context: z.string(),
  risks_if_ignored: z.string(),
  history_examples: z.string(),
  supporting_quotes: z
    .array(
      z.object({
        quote: z.string(),
        meeting_id: z.string().nullable().optional(),
        meeting_title: z.string().nullable().optional(),
        label: z.string().nullable().optional(),
      })
    )
    .max(6),
  supporting_meeting_ids: z.array(z.string()).max(12),
  supporting_decision_ids: z.array(z.string()).max(12),
  recurring_themes: z.array(z.string()).max(8),
});

export const intelligenceSchema = z.object({
  recurring_themes: z.array(z.string()).max(12),
  unresolved_strategic_topics: z.array(z.string()).max(10),
  board_sensitive_issues: z.array(z.string()).max(10),
  repeated_member_concerns: z.array(z.string()).max(10),
  recurring_operational_risks: z.array(z.string()).max(10),
  governance_gaps: z.array(z.string()).max(10),
  stale_unresolved_decisions: z.array(z.string()).max(10),
  heavily_discussed_topics: z.array(z.string()).max(10),
  continuity_risks: z.array(z.string()).max(10),
  narrative_summary: z.string(),
});

export const decisionRationaleSchema = z.object({
  rationale_summary: z.string(),
  alternatives_considered: z.string(),
  historical_context: z.string(),
  expected_outcome: z.string(),
  downstream_implications: z.string(),
  lessons_learned: z.string(),
  related_meeting_ids: z.array(z.string()).max(8),
});

export const markdownArtifactSchema = z.object({
  body_markdown: z.string(),
  key_points: z.array(z.string()).max(12).optional(),
});
