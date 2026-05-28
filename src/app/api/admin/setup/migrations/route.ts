import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBackfillAdminUser } from "@/lib/admin-access";
import { runPendingMigrations } from "@/lib/setup/migrations";
import { getSetupDbUrl } from "@/lib/setup/db";

export async function POST() {
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
      {
        error:
          "SUPABASE_DB_URL is not configured. Add it to .env.local (server-only) for automatic migrations.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await runPendingMigrations();
    if (result.failed) {
      return NextResponse.json(
        {
          ok: false,
          ...result,
          message: `Migration ${result.failed.id} failed: ${result.failed.message}`,
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Migration runner failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
