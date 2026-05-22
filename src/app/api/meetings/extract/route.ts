import { NextResponse } from "next/server";
import { z } from "zod";
import {
  extractMeetingIntelligence,
  type MeetingExtractionApiResponse,
} from "@/lib/meeting-extraction";
import { extractMeetingIntelligenceOpenAI } from "@/lib/meeting-extraction-openai";

const MAX_TRANSCRIPT_CHARS = 120_000;

const requestBodySchema = z.object({
  meetingId: z.string().min(1),
  transcript: z.string().min(1).max(MAX_TRANSCRIPT_CHARS),
});

function truncateTranscript(transcript: string): {
  text: string;
  truncated: boolean;
} {
  if (transcript.length <= MAX_TRANSCRIPT_CHARS) {
    return { text: transcript, truncated: false };
  }
  return {
    text: transcript.slice(0, MAX_TRANSCRIPT_CHARS),
    truncated: true,
  };
}

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = requestBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request: meetingId and transcript are required" },
        { status: 400 }
      );
    }

    const { transcript: rawTranscript } = parsed.data;
    const { text: transcript, truncated } = truncateTranscript(
      rawTranscript.trim()
    );

    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (apiKey) {
      try {
        const result = await extractMeetingIntelligenceOpenAI(transcript);
        const body: MeetingExtractionApiResponse = {
          ...result,
          extractionMode: "openai",
          ...(truncated
            ? {
                warning:
                  "Transcript was truncated for model limits; review summary and items carefully.",
              }
            : {}),
        };
        return NextResponse.json(body);
      } catch (openAiError) {
        const message =
          openAiError instanceof Error
            ? openAiError.message
            : "OpenAI extraction failed";
        const fallback = extractMeetingIntelligence(transcript);
        const body: MeetingExtractionApiResponse = {
          ...fallback,
          extractionMode: "heuristic",
          warning: `OpenAI extraction failed (${message}). Showing heuristic fallback—review carefully.`,
        };
        return NextResponse.json(body);
      }
    }

    const result = extractMeetingIntelligence(transcript);
    const body: MeetingExtractionApiResponse = {
      ...result,
      extractionMode: "heuristic",
      ...(truncated
        ? { warning: "Transcript was truncated before extraction." }
        : {
            warning:
              "No OPENAI_API_KEY configured. Using heuristic extraction—expect more noise; add OPENAI_API_KEY for LLM extraction.",
          }),
    };
    return NextResponse.json(body);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
