import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isBackfillAdminUser } from "@/lib/admin-access";
import { BACKFILL_SOURCE_TYPES } from "@/lib/backfill/source-types";
import { extractBackfillIntelligenceOpenAI } from "@/lib/backfill/backfill-extraction-openai";
import { assignClientKeys } from "@/lib/backfill/normalize-keys";
import {
  findDuplicateCandidates,
  type DuplicateEntityType,
} from "@/lib/backfill/duplicate-candidates";
import type { BackfillReviewSession, DuplicateHint } from "@/lib/backfill/review-types";

const MAX_CHARS = 120_000;

const bodySchema = z.object({
  sourceType: z.enum(
    Object.keys(BACKFILL_SOURCE_TYPES) as [keyof typeof BACKFILL_SOURCE_TYPES]
  ),
  text: z.string().min(50).max(MAX_CHARS),
});

function defaultRow<T extends { confidence: number }>(
  item: T,
  clientKey: string
) {
  return {
    ...item,
    clientKey,
    included: item.confidence >= 0.75,
    disposition: "create" as const,
  };
}

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

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return NextResponse.json(
      {
        error:
          "OPENAI_API_KEY is required for backfill extraction. Heuristic backfill is not supported.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await extractBackfillIntelligenceOpenAI(
      parsed.data.sourceType,
      parsed.data.text.trim()
    );

    const meetings = result.meetings.map((m) =>
      defaultRow(m, m.clientKey)
    );
    const actionItems = assignClientKeys(result.actionItems, "a").map((a) =>
      defaultRow(a, a.clientKey)
    );
    const strategicProjects = assignClientKeys(result.strategicProjects, "s").map(
      (p) => defaultRow(p, p.clientKey)
    );
    const treeItems = assignClientKeys(result.treeItems, "t").map((t) =>
      defaultRow(t, t.clientKey)
    );
    const capitalItems = assignClientKeys(result.capitalItems, "c").map((c) =>
      defaultRow(c, c.clientKey)
    );
    const memberFeedback = assignClientKeys(result.memberFeedback, "f").map(
      (f) => defaultRow({ ...f, topic: f.topic }, f.clientKey)
    );
    const committeeMembers = result.committeeMembers.map((m) =>
      defaultRow(m, m.clientKey)
    );
    const governanceSections = result.governanceSections.map((g) =>
      defaultRow(g, g.clientKey)
    );
    const institutionalDecisions = result.institutionalDecisions.map((d) =>
      defaultRow(d, d.clientKey)
    );
    const meetingTopics = result.meetingTopics.map((t) =>
      defaultRow(t, t.clientKey)
    );
    const discussionMentions = result.discussionMentions.map((d) =>
      defaultRow(d, d.clientKey)
    );
    const entityLinks = result.entityLinks.map((e) =>
      defaultRow(e, e.clientKey)
    );

    const duplicateHints: Record<string, DuplicateHint[]> = {};

    const hints = async (
      key: string,
      type: DuplicateEntityType,
      title: string,
      slug?: string
    ) => {
      duplicateHints[key] = await findDuplicateCandidates(
        supabase,
        type,
        title,
        slug
      );
    };

    await Promise.all([
      ...meetings.map((m) => hints(m.clientKey, "meeting", m.title)),
      ...actionItems.map((a) => hints(a.clientKey, "action", a.title)),
      ...strategicProjects.map((p) =>
        hints(p.clientKey, "strategic", p.title)
      ),
      ...treeItems.map((t) => hints(t.clientKey, "tree", t.title)),
      ...capitalItems.map((c) => hints(c.clientKey, "capital", c.title)),
      ...memberFeedback.map((f) => hints(f.clientKey, "feedback", f.topic)),
      ...committeeMembers.map((m) =>
        hints(m.clientKey, "committee_member", m.full_name)
      ),
      ...governanceSections.map((g) =>
        hints(g.clientKey, "governance_section", g.title, g.slug)
      ),
      ...institutionalDecisions.map((d) =>
        hints(d.clientKey, "institutional_decision", d.title)
      ),
    ]);

    const session: BackfillReviewSession = {
      sourceType: parsed.data.sourceType,
      sourceLabel: BACKFILL_SOURCE_TYPES[parsed.data.sourceType],
      rawSourceText: parsed.data.text.trim(),
      extractedAt: new Date().toISOString(),
      extractionMode: "openai",
      sourceSummary: result.sourceSummary,
      meetings,
      actionItems,
      strategicProjects,
      treeItems,
      capitalItems,
      memberFeedback,
      committeeMembers,
      governanceSections,
      institutionalDecisions,
      meetingTopics,
      discussionMentions,
      entityLinks,
      duplicateHints,
    };

    return NextResponse.json(session);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
