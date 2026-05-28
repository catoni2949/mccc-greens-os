import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isBackfillAdminUser } from "@/lib/admin-access";
import { runSeeds } from "@/lib/setup/seeds";
import { getSetupDbUrl } from "@/lib/setup/db";

const bodySchema = z.object({
  force: z.boolean().optional(),
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

  if (!getSetupDbUrl()) {
    return NextResponse.json(
      { error: "SUPABASE_DB_URL is not configured." },
      { status: 503 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  try {
    const result = await runSeeds({ force: parsed.success && parsed.data.force });
    if (result.failed) {
      return NextResponse.json(
        {
          ok: false,
          ...result,
          message: `Seed ${result.failed.id} failed: ${result.failed.message}`,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Seed runner failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
