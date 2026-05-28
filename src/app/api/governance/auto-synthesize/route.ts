import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { runTargetedGovernanceSynthesis } from "@/lib/governance/auto-synthesis";
import type { AutoSynthesisSource } from "@/lib/governance/auto-synthesis";

const bodySchema = z.object({
  source: z.enum([
    "transcript_saved",
    "meeting_extract",
    "backfill_applied",
    "governance_import",
    "institutional_decision",
  ]),
  meetingId: z.string().optional(),
  text: z.string().optional(),
  actionTitles: z.array(z.string()).optional(),
  treeTitles: z.array(z.string()).optional(),
  projectTitles: z.array(z.string()).optional(),
  capitalTitles: z.array(z.string()).optional(),
  feedbackTopics: z.array(z.string()).optional(),
  hasBoardRelevance: z.boolean().optional(),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  let text = parsed.data.text ?? "";
  if (parsed.data.meetingId) {
    const { data: meeting } = await supabase
      .from("meetings")
      .select("summary, decisions, raw_transcript")
      .eq("id", parsed.data.meetingId)
      .single();
    if (meeting) {
      text = [text, meeting.summary, meeting.decisions, meeting.raw_transcript]
        .filter(Boolean)
        .join("\n");
    }
  }

  const result = await runTargetedGovernanceSynthesis(supabase, {
    source: parsed.data.source as AutoSynthesisSource,
    text,
    actionTitles: parsed.data.actionTitles,
    treeTitles: parsed.data.treeTitles,
    projectTitles: parsed.data.projectTitles,
    capitalTitles: parsed.data.capitalTitles,
    feedbackTopics: parsed.data.feedbackTopics,
    hasBoardRelevance: parsed.data.hasBoardRelevance,
    hasTranscript: Boolean(text.length > 200),
  });

  return NextResponse.json({
    operationalMemoryUpdated: true,
    bibleSectionsUpdated: result.sectionTitles,
    ...result,
  });
}
