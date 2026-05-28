import fs from "fs";
import path from "path";
import { createSetupSql } from "@/lib/setup/db";

const BOOTSTRAP = `
CREATE TABLE IF NOT EXISTS app_seeds (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
`;

const SEED_FILES = [
  "seed_governance.sql",
  "seed_governance_bible_framework.sql",
] as const;

export function listSeedFiles(): string[] {
  const dir = path.join(process.cwd(), "supabase");
  return SEED_FILES.filter((f) => fs.existsSync(path.join(dir, f)));
}

export async function getSeedStatus(): Promise<
  { id: string; applied: boolean; appliedAt?: string }[]
> {
  const files = listSeedFiles();
  const url = process.env.SUPABASE_DB_URL?.trim();
  if (!url) {
    return files.map((id) => ({ id, applied: false }));
  }
  const sql = createSetupSql();
  try {
    await sql.unsafe(BOOTSTRAP);
    const rows = await sql<{ id: string; applied_at: Date }[]>`
      SELECT id, applied_at FROM app_seeds
    `;
    const map = new Map(rows.map((r) => [r.id, r.applied_at.toISOString()]));
    return files.map((id) => ({
      id,
      applied: map.has(id),
      appliedAt: map.get(id),
    }));
  } catch {
    return files.map((id) => ({ id, applied: false }));
  } finally {
    await sql.end();
  }
}

export type RunSeedsResult = {
  applied: string[];
  skipped: string[];
  failed?: { id: string; message: string };
  force?: boolean;
};

export async function runSeeds(options?: {
  force?: boolean;
  ids?: string[];
}): Promise<RunSeedsResult> {
  const sql = createSetupSql();
  const dir = path.join(process.cwd(), "supabase");
  const result: RunSeedsResult = {
    applied: [],
    skipped: [],
    force: options?.force,
  };
  const targets = options?.ids?.length
    ? options.ids
    : listSeedFiles();

  try {
    await sql.unsafe(BOOTSTRAP);
    const appliedRows = await sql<{ id: string }[]>`
      SELECT id FROM app_seeds
    `;
    const applied = new Set(appliedRows.map((r) => r.id));

    for (const id of targets) {
      if (applied.has(id) && !options?.force) {
        result.skipped.push(id);
        continue;
      }
      const filePath = path.join(dir, id);
      if (!fs.existsSync(filePath)) continue;
      const body = fs.readFileSync(filePath, "utf8");
      try {
        await sql.begin(async (tx) => {
          await tx.unsafe(body);
          await tx`
            INSERT INTO app_seeds (id) VALUES (${id})
            ON CONFLICT (id) DO UPDATE SET applied_at = now()
          `;
        });
        result.applied.push(id);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Seed failed";
        result.failed = { id, message };
        return result;
      }
    }
    return result;
  } finally {
    await sql.end();
  }
}
