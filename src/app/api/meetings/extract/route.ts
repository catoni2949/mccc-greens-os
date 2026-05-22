import { NextResponse } from "next/server";
import { extractMeetingIntelligence } from "@/lib/meeting-extraction";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const meetingId = body?.meetingId as string | undefined;
    const transcript = body?.transcript as string | undefined;

    if (!meetingId || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "meetingId and transcript are required" },
        { status: 400 }
      );
    }

    const hasAi =
      Boolean(process.env.OPENAI_API_KEY) ||
      Boolean(process.env.ANTHROPIC_API_KEY);

    if (hasAi) {
      // Placeholder: real AI integration later; fall through to heuristics for now
    }

    const result = extractMeetingIntelligence(transcript);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
