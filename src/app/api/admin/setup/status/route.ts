import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isBackfillAdminUser } from "@/lib/admin-access";
import { getSetupStatus } from "@/lib/setup/setup-status";

export async function GET() {
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

  const status = await getSetupStatus();
  return NextResponse.json(status);
}
