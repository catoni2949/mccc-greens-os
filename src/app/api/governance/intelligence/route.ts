import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeIntelligenceAnalytics } from "@/lib/governance/intelligence-analytics";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const analytics = await computeIntelligenceAnalytics(supabase);

  const { data: artifact } = await supabase
    .from("governance_artifacts")
    .select("body_json, body_markdown, last_synthesized_at")
    .eq("artifact_key", "intelligence_dashboard")
    .maybeSingle();

  const { data: evolution } = await supabase
    .from("governance_artifacts")
    .select("body_markdown, last_synthesized_at")
    .eq("artifact_key", "committee_evolution")
    .maybeSingle();

  const { data: chairBrief } = await supabase
    .from("governance_artifacts")
    .select("body_markdown, last_synthesized_at")
    .eq("artifact_key", "outgoing_chair_brief")
    .maybeSingle();

  return NextResponse.json({
    analytics,
    synthesis: artifact?.body_json ?? null,
    synthesisNarrative: artifact?.body_markdown ?? null,
    lastSynthesizedAt: artifact?.last_synthesized_at ?? null,
    committeeEvolution: evolution?.body_markdown ?? null,
    evolutionSynthesizedAt: evolution?.last_synthesized_at ?? null,
    outgoingChairBrief: chairBrief?.body_markdown ?? null,
    chairBriefSynthesizedAt: chairBrief?.last_synthesized_at ?? null,
  });
}
