import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBackfillAdminUser } from "@/lib/admin-access";
import { applyBackfillSelections } from "@/lib/backfill/apply-backfill";
import type { BackfillApplyPayload } from "@/lib/backfill/review-types";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();
  if (!isBackfillAdminUser(profile, user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = (await request.json()) as BackfillApplyPayload;

  try {
    const result = await applyBackfillSelections(supabase, payload);
    const { runTargetedGovernanceSynthesis } = await import(
      "@/lib/governance/auto-synthesis"
    );
    const actions = payload.actionItems?.filter((a) => a.included) ?? [];
    const synthesis = await runTargetedGovernanceSynthesis(supabase, {
      source: "backfill_applied",
      text: payload.rawSourceText ?? "",
      actionTitles: actions.map((a) => a.title),
      treeTitles: payload.treeItems?.filter((t) => t.included).map((t) => t.title),
      projectTitles: payload.strategicProjects
        ?.filter((p) => p.included)
        .map((p) => p.title),
      capitalTitles: payload.capitalItems
        ?.filter((c) => c.included)
        .map((c) => c.title),
      feedbackTopics: payload.memberFeedback
        ?.filter((f) => f.included)
        .map((f) => f.topic),
      hasBoardRelevance: actions.some((a) => a.board_relevance),
    });
    return NextResponse.json({
      ok: true,
      ...result,
      governance: synthesis,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Apply failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
