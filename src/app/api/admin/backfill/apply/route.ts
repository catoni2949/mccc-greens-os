import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBackfillAdminUser } from "@/lib/admin-access";
import { applyBackfillSelections } from "@/lib/backfill/apply-backfill";
import type { BackfillApplyPayload } from "@/lib/backfill/review-types";

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

  const payload = (await request.json()) as BackfillApplyPayload;

  try {
    const result = await applyBackfillSelections(supabase, payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Apply failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
