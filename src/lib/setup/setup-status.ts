import { createClient } from "@/lib/supabase/server";
import { getMigrationStatus } from "@/lib/setup/migrations";
import { getSeedStatus } from "@/lib/setup/seeds";
import fs from "fs";
import path from "path";

const REQUIRED_TABLES = [
  "meetings",
  "action_items",
  "governance_sections",
  "institutional_decisions",
  "meeting_topics",
  "discussion_mentions",
  "governance_artifacts",
  "app_migrations",
] as const;

export async function getSetupStatus() {
  const supabase = createClient();
  const dbUrlConfigured = Boolean(process.env.SUPABASE_DB_URL?.trim());
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY?.trim());

  const migrationStatus = await getMigrationStatus();
  const seedStatus = dbUrlConfigured ? await getSeedStatus() : [];

  const tableChecks: Record<string, boolean> = {};
  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select("*").limit(1);
    tableChecks[table] = !error;
  }

  let storageOk = false;
  try {
    const { data, error } = await supabase.storage.listBuckets();
    storageOk =
      !error && (data ?? []).some((b) => b.name === "mccc-greens");
  } catch {
    storageOk = false;
  }

  let lastSynthesisAt: string | null = null;
  const { data: sections } = await supabase
    .from("governance_sections")
    .select("last_synthesized_at")
    .order("last_synthesized_at", { ascending: false })
    .limit(1);
  if (sections?.[0]?.last_synthesized_at) {
    lastSynthesisAt = sections[0].last_synthesized_at;
  } else {
    const { data: art } = await supabase
      .from("governance_artifacts")
      .select("last_synthesized_at")
      .order("last_synthesized_at", { ascending: false })
      .limit(1);
    lastSynthesisAt = art?.[0]?.last_synthesized_at ?? null;
  }

  const pendingMigrations = migrationStatus.files.filter((f) => !f.applied);

  return {
    appVersion: JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "package.json"), "utf8")
    ).version as string,
    dbUrlConfigured,
    openaiConfigured,
    migrations: migrationStatus.files,
    pendingMigrationCount: pendingMigrations.length,
    seeds: seedStatus,
    tableChecks,
    allTablesPresent: Object.values(tableChecks).every(Boolean),
    storageOk,
    lastSynthesisAt,
  };
}

export async function verifyDatabase() {
  const status = await getSetupStatus();
  const missingTables = Object.entries(status.tableChecks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);
  return {
    ok:
      status.allTablesPresent &&
      status.pendingMigrationCount === 0 &&
      missingTables.length === 0,
    missingTables,
    pendingMigrations: status.migrations
      .filter((m) => !m.applied)
      .map((m) => m.id),
    storageOk: status.storageOk,
  };
}
