import type { SupabaseClient } from "@supabase/supabase-js";
import {
  inferAffectedGovernanceSections,
  type InferInput,
} from "@/lib/governance/infer-affected-sections";
import { runGovernanceSynthesis } from "@/lib/governance/synthesize-governance";

export type AutoSynthesisSource =
  | "transcript_saved"
  | "meeting_extract"
  | "backfill_applied"
  | "governance_import"
  | "institutional_decision";

export type AutoSynthesisResult = {
  skipped: boolean;
  reason?: string;
  slugs: string[];
  sectionTitles: string[];
  sectionsUpdated: number;
  errors: string[];
};

export async function runTargetedGovernanceSynthesis(
  supabase: SupabaseClient,
  input: InferInput & { source: AutoSynthesisSource }
): Promise<AutoSynthesisResult> {
  const { slugs, titles } = inferAffectedGovernanceSections(input);

  if (!slugs.length) {
    return {
      skipped: true,
      reason: "No governance sections inferred",
      slugs: [],
      sectionTitles: [],
      sectionsUpdated: 0,
      errors: [],
    };
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return {
      skipped: true,
      reason: "OPENAI_API_KEY not configured",
      slugs,
      sectionTitles: titles,
      sectionsUpdated: 0,
      errors: [],
    };
  }

  try {
    const result = await runGovernanceSynthesis(supabase, "sections", {
      slugs,
      maxSections: Math.min(slugs.length, 6),
    });
    return {
      skipped: false,
      slugs,
      sectionTitles: titles,
      sectionsUpdated: result.sectionsUpdated,
      errors: result.errors,
    };
  } catch (e) {
    return {
      skipped: true,
      reason: e instanceof Error ? e.message : "Synthesis failed",
      slugs,
      sectionTitles: titles,
      sectionsUpdated: 0,
      errors: [],
    };
  }
}
