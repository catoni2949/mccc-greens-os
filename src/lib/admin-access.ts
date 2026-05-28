import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

export function isBackfillAdminUser(profile: {
  role: string | null;
  email: string | null;
} | null, userEmail: string | undefined): boolean {
  if (!profile && !userEmail) return false;
  const role = profile?.role ?? "";
  if (role === "admin" || role === "chair") return true;
  const allow = process.env.ADMIN_EMAILS?.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allow?.length || !userEmail) return false;
  return allow.includes(userEmail.toLowerCase());
}

export async function requireBackfillAdmin(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();
  if (!isBackfillAdminUser(profile, user.email)) {
    redirect("/dashboard");
  }
  return user;
}
