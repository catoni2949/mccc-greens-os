import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildBoardPacketMarkdown } from "@/lib/operational-memory/board-packet";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const markdown = await buildBoardPacketMarkdown(supabase, params.id);
    return NextResponse.json({ markdown });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to build packet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
