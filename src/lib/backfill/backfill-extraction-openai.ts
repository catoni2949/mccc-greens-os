import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { EXTRACTION_MODEL } from "@/lib/meeting-extraction-openai";
import {
  backfillExtractionResultSchema,
  type BackfillExtractionResult,
} from "@/lib/backfill/backfill-extraction-schema";
import type { BackfillSourceType } from "@/lib/backfill/source-types";
import { BIBLE_SECTION_SLUGS } from "@/lib/governance/bible-framework";

const SYSTEM = `You are the institutional archivist for Merion Cricket Club Greens Committee.

Extract structured records from historical source material (minutes, agendas, emails, transcripts, USGA reports, chair notes, board prep).

Rules:
- Use only facts present in the source; do not invent owners, dates, or costs.
- Assign each record a unique clientKey (e.g. "m1", "a3", "g2").
- confidence >= 0.55 only; omit weaker items.
- For governanceSections, prefer slugs from this Bible framework when content matches: ${BIBLE_SECTION_SLUGS.join(", ")}.
- meetings: at most one primary meeting per document unless clearly multiple dates.
- institutionalDecisions: enduring policy or committee decisions with rationale.
- meetingTopics / discussionMentions: tie to meetingClientKey when a meeting is extracted.
- entityLinks: only when two extracted labels clearly relate.

Known institutional context (use when supported by source text):
- Ryan became chair May 2026; Mike Zehr minutes; Stacey 5-min board updates.
- Strategic plan: committee review → planning committee → board fall approval → town halls.
- Ted Robinson sympathetic restoration; USGA 2019 themes (forward tees, bunkers, irrigation, OM testing, fairway verticutting).
- Tree program: dead/airflow/sunlight/replanting; non-dead removals need committee + board awareness.
- Family tees, scorecard review, no red/gray tournament flags in member play; bunker sand #10 and #2 left greenside.
- Member education: ball marks, cups, bunkers, course care, newsletter/social.`;

function sourceLabel(type: BackfillSourceType): string {
  return type.replace(/_/g, " ");
}

export async function extractBackfillIntelligenceOpenAI(
  sourceType: BackfillSourceType,
  text: string
): Promise<BackfillExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.parse({
    model: EXTRACTION_MODEL,
    messages: [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `Source type: ${sourceLabel(sourceType)}

Extract backfill intelligence. Return JSON matching schema.

Source text:
---
${text}
---`,
      },
    ],
    response_format: zodResponseFormat(
      backfillExtractionResultSchema,
      "backfill_extraction"
    ),
    temperature: 0.2,
  });

  const parsed = completion.choices[0]?.message?.parsed;
  if (!parsed) throw new Error("OpenAI returned no parsed backfill extraction");

  const min = 0.55;
  const f = <T extends { confidence: number }>(arr: T[]) =>
    arr.filter((x) => x.confidence >= min);

  return {
    sourceSummary: parsed.sourceSummary.trim(),
    meetings: f(parsed.meetings),
    actionItems: f(parsed.actionItems),
    strategicProjects: f(parsed.strategicProjects),
    treeItems: f(parsed.treeItems),
    capitalItems: f(parsed.capitalItems),
    memberFeedback: f(parsed.memberFeedback),
    committeeMembers: f(parsed.committeeMembers),
    governanceSections: f(parsed.governanceSections),
    institutionalDecisions: f(parsed.institutionalDecisions),
    meetingTopics: f(parsed.meetingTopics),
    discussionMentions: f(parsed.discussionMentions),
    entityLinks: f(parsed.entityLinks),
  };
}
