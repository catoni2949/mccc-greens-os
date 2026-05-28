import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { findMergeSuggestions } from "@/lib/operational-memory/merge-suggestions";

const bodySchema = z.object({
  items: z.array(
    z.object({
      entityType: z.enum(["action", "tree", "strategic", "capital"]),
      title: z.string().min(1),
    })
  ),
});

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const supabase = createClient();
    const suggestions = await findMergeSuggestions(supabase, parsed.data.items);
    return NextResponse.json({ suggestions });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Merge lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
