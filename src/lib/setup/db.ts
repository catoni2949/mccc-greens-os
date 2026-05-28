import postgres from "postgres";

export function getSetupDbUrl(): string | null {
  const url = process.env.SUPABASE_DB_URL?.trim();
  return url || null;
}

export function createSetupSql() {
  const url = getSetupDbUrl();
  if (!url) {
    throw new Error("SUPABASE_DB_URL is not configured");
  }
  return postgres(url, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 30,
  });
}
