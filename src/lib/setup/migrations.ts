import fs from "fs";
import path from "path";
import { createSetupSql } from "@/lib/setup/db";

const BOOTSTRAP = `
CREATE TABLE IF NOT EXISTS app_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
`;

export type MigrationFileStatus = {
  id: string;
  applied: boolean;
  appliedAt?: string;
};

export function listMigrationFiles(): string[] {
  const dir = path.join(process.cwd(), "supabase", "migrations");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export async function getAppliedMigrationIds(): Promise<string[]> {
  const sql = createSetupSql();
  try {
    await sql.unsafe(BOOTSTRAP);
    const rows = await sql<{ id: string }[]>`
      SELECT id FROM app_migrations ORDER BY id
    `;
    return rows.map((r) => r.id);
  } finally {
    await sql.end();
  }
}

export async function getMigrationStatus(): Promise<{
  files: MigrationFileStatus[];
  dbConfigured: boolean;
}> {
  const dbConfigured = Boolean(process.env.SUPABASE_DB_URL?.trim());
  const files = listMigrationFiles();
  if (!dbConfigured) {
    return {
      dbConfigured: false,
      files: files.map((id) => ({ id, applied: false })),
    };
  }
  try {
    const applied = new Set(await getAppliedMigrationIds());
    const sql = createSetupSql();
    let appliedAtMap = new Map<string, string>();
    try {
      const rows = await sql<{ id: string; applied_at: Date }[]>`
        SELECT id, applied_at FROM app_migrations
      `;
      appliedAtMap = new Map(
        rows.map((r) => [r.id, r.applied_at.toISOString()])
      );
    } finally {
      await sql.end();
    }
    return {
      dbConfigured: true,
      files: files.map((id) => ({
        id,
        applied: applied.has(id),
        appliedAt: appliedAtMap.get(id),
      })),
    };
  } catch {
    return {
      dbConfigured: true,
      files: files.map((id) => ({ id, applied: false })),
    };
  }
}

export type RunMigrationResult = {
  applied: string[];
  skipped: string[];
  failed?: { id: string; message: string };
};

export async function runPendingMigrations(): Promise<RunMigrationResult> {
  const sql = createSetupSql();
  const dir = path.join(process.cwd(), "supabase", "migrations");
  const result: RunMigrationResult = { applied: [], skipped: [] };

  try {
    await sql.unsafe(BOOTSTRAP);
    const appliedRows = await sql<{ id: string }[]>`
      SELECT id FROM app_migrations
    `;
    const applied = new Set(appliedRows.map((r) => r.id));

    for (const id of listMigrationFiles()) {
      if (applied.has(id)) {
        result.skipped.push(id);
        continue;
      }
      const filePath = path.join(dir, id);
      const body = fs.readFileSync(filePath, "utf8");
      try {
        await sql.begin(async (tx) => {
          await tx.unsafe(body);
          await tx`
            INSERT INTO app_migrations (id) VALUES (${id})
          `;
        });
        result.applied.push(id);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Migration failed";
        result.failed = { id, message };
        return result;
      }
    }
    return result;
  } finally {
    await sql.end();
  }
}
