import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import {
  meetingExtractionResultSchema,
  type MeetingExtractionResultParsed,
} from "@/lib/meeting-extraction-schema";
import type { MeetingExtractionResult } from "@/lib/meeting-extraction";
import {
  extractHoleNumber,
  extractTreeSpecies,
} from "@/lib/meeting-extraction";

/** Change here if the model id is unavailable in your OpenAI project. */
export const EXTRACTION_MODEL = "gpt-4.1-mini";

const SYSTEM_PROMPT = `You are an executive secretary for a private golf club Greens Committee (Merion Cricket Club context).

Extract only concrete, useful operational records from meeting transcripts. Do not create an item for every mention. Prefer fewer, high-quality items. Do not invent owners, dates, costs, or locations—use null when unclear.

Separate a concise meeting summary from discrete records.

Rules:
- actionItems: real tasks with a clear owner OR a clear deliverable verb (follow up, confirm, send, schedule, vote, approve, submit, prepare, review, coordinate, contact, write, order, budget, add to agenda). No vague "we should think" or "maybe later" items. Max 12.
- strategicProjects: actual master plan / implementation / sequence / cart path / tee complex / green expansion / approval path / member vote / cost range topics—not generic "strategic plan is exciting." Max 8.
- treeItems: real tree, species, corridor, removal, permit, shade, airflow, or numbered hole/green location. No generic "tree health" without a location. Max 8.
- capitalItems: real equipment, mower, pump, irrigation, sand, mats, or budget line items—not jokes or vague "June budget" without an item. Max 8.
- memberFeedback: member-facing communication, newsletter, town hall, survey, complaints, visibility, education. Max 8.
- board_relevance on actions only when board approval, review, vote, or awareness is actually discussed.
- confidence: 0.75+ only for obvious records; 0.55–0.74 for review-worthy; omit items below 0.55 (do not include them in arrays).

Title style: short operational titles (e.g. "Hole 7 corridor oak", "Fairway mower replacement", "Dwayne to confirm board approval for Hole 7 corridor oak").`;

function buildUserPrompt(transcript: string): string {
  return `Extract structured meeting intelligence from this transcript.

Return JSON matching the schema. Keep lists within max counts. Omit low-confidence (<0.55) items entirely.

Transcript:
---
${transcript}
---`;
}

function enrichTreeItems(
  items: MeetingExtractionResultParsed["treeItems"]
): MeetingExtractionResult["treeItems"] {
  return items.map((item) => {
    const hole =
      extractHoleNumber(item.title) ??
      extractHoleNumber(item.hole_or_area ?? "");
    const species = extractTreeSpecies(item.title) ?? item.tree_type;
    const board_relevant =
      item.board_status === "Pending" ||
      /board/i.test(item.title) ||
      /board/i.test(item.rationale ?? "");

    return {
      ...item,
      hole_number: hole,
      species,
      topic: item.title,
      board_relevant,
      permit_status: item.permit_status ?? "Not Required",
      committee_status: item.committee_status ?? "In Review",
      board_status: item.board_status ?? (board_relevant ? "Pending" : "Not Required"),
    };
  });
}

function normalizeParsed(
  parsed: MeetingExtractionResultParsed
): MeetingExtractionResult {
  const minConf = 0.55;
  const filter = <T extends { confidence: number }>(arr: T[]) =>
    arr.filter((x) => x.confidence >= minConf);

  return {
    summary: parsed.summary.trim(),
    decisions: parsed.decisions.trim(),
    actionItems: filter(parsed.actionItems).slice(0, 12),
    strategicProjects: filter(parsed.strategicProjects).slice(0, 8),
    treeItems: enrichTreeItems(filter(parsed.treeItems).slice(0, 8)),
    capitalItems: filter(parsed.capitalItems).slice(0, 8),
    memberFeedback: filter(parsed.memberFeedback).slice(0, 8),
  };
}

export async function extractMeetingIntelligenceOpenAI(
  transcript: string
): Promise<MeetingExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.parse({
    model: EXTRACTION_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(transcript) },
    ],
    response_format: zodResponseFormat(
      meetingExtractionResultSchema,
      "meeting_extraction"
    ),
    temperature: 0.2,
  });

  const message = completion.choices[0]?.message;
  if (!message?.parsed) {
    throw new Error("OpenAI returned no parsed extraction");
  }

  return normalizeParsed(message.parsed);
}
