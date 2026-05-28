import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isBackfillAdminUser } from "@/lib/admin-access";
import {
  runGovernanceSynthesis,
  type SynthesizeMode,
} from "@/lib/governance/synthesize-governance";

const bodySchema = z.object({
  mode: z
    .enum(["sections", "decisions", "intelligence", "evolution", "chair_brief", "full"])
    .optional(),
  slugs: z.array(z.string()).optional(),
  maxSections: z.number().min(1).max(18).optional(),
});

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

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is required for governance synthesis" },
      { status: 503 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  const mode = (parsed.success ? parsed.data.mode : undefined) ?? "full";
  const slugs = parsed.success ? parsed.data.slugs : undefined;
  const maxSections = parsed.success ? parsed.data.maxSections : undefined;

  try {
    const result = await runGovernanceSynthesis(
      supabase,
      mode as SynthesizeMode,
      { slugs, maxSections }
    );
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Synthesis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
