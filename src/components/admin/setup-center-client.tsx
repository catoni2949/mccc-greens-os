"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SetupStatus = {
  appVersion: string;
  dbUrlConfigured: boolean;
  openaiConfigured: boolean;
  migrations: { id: string; applied: boolean; appliedAt?: string }[];
  pendingMigrationCount: number;
  seeds: { id: string; applied: boolean; appliedAt?: string }[];
  tableChecks: Record<string, boolean>;
  allTablesPresent: boolean;
  storageOk: boolean;
  lastSynthesisAt: string | null;
};

export function SetupCenterClient() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/setup/status");
    const data = await res.json();
    if (!res.ok) toast.error(data.error ?? "Failed to load status");
    else setStatus(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function action(
    key: string,
    url: string,
    options?: RequestInit,
    successMsg?: string
  ) {
    setBusy(key);
    try {
      const res = await fetch(url, options);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? data.message ?? "Action failed");
        return;
      }
      toast.success(successMsg ?? "Done");
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading setup status…</p>;
  }
  if (!status) {
    return <p className="text-sm text-red-600">Could not load setup status.</p>;
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {!status.dbUrlConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">Automatic migrations are not configured.</p>
          <p className="mt-2">
            Add <code className="text-xs">SUPABASE_DB_URL</code> to{" "}
            <code className="text-xs">.env.local</code> (server-only Postgres connection
            string from Supabase → Project Settings → Database). Redeploy, then return
            here.
          </p>
        </div>
      )}

      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase text-slate-500">System</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>App version: {status.appVersion}</li>
          <li>
            OpenAI:{" "}
            {status.openaiConfigured ? (
              <Badge className="bg-green-100 text-green-800">configured</Badge>
            ) : (
              <Badge variant="secondary">missing OPENAI_API_KEY</Badge>
            )}
          </li>
          <li>
            Storage bucket <code>mccc-greens</code>:{" "}
            {status.storageOk ? "OK" : "not found"}
          </li>
          <li>
            Last synthesis:{" "}
            {status.lastSynthesisAt
              ? new Date(status.lastSynthesisAt).toLocaleString()
              : "never"}
          </li>
          <li>
            Tables:{" "}
            {status.allTablesPresent ? (
              <span className="text-green-700">all present</span>
            ) : (
              <span className="text-amber-700">some missing — run migrations</span>
            )}
          </li>
        </ul>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">
          Migrations ({status.pendingMigrationCount} pending)
        </h2>
        <ul className="mb-4 max-h-48 overflow-auto text-xs text-slate-600">
          {status.migrations.map((m) => (
            <li key={m.id}>
              {m.applied ? "✓" : "○"} {m.id}
            </li>
          ))}
        </ul>
        <Button
          type="button"
          disabled={!status.dbUrlConfigured || busy !== null}
          onClick={() =>
            action(
              "migrations",
              "/api/admin/setup/migrations",
              { method: "POST" },
              "Migrations applied"
            )
          }
        >
          {busy === "migrations" ? "Running…" : "Run pending migrations"}
        </Button>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">Seeds</h2>
        <ul className="mb-4 text-xs text-slate-600">
          {status.seeds.map((s) => (
            <li key={s.id}>
              {s.applied ? "✓" : "○"} {s.id}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!status.dbUrlConfigured || busy !== null}
            onClick={() =>
              action(
                "seeds",
                "/api/admin/setup/seeds",
                { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
                "Seeds applied"
              )
            }
          >
            Run governance seeds
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!status.dbUrlConfigured || busy !== null}
            onClick={() => {
              if (!confirm("Re-run all governance seeds? (idempotent upserts)")) return;
              action(
                "seeds-force",
                "/api/admin/setup/seeds",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ force: true }),
                },
                "Seeds re-applied"
              );
            }}
          >
            Re-run seeds (confirm)
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase text-slate-500">
          Operations
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() =>
              action("verify", "/api/admin/setup/verify", { method: "POST" }, "Verify complete")
            }
          >
            Verify database
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!status.openaiConfigured || busy !== null}
            onClick={() =>
              action(
                "light",
                "/api/admin/setup/synthesis",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ mode: "light" }),
                },
                "Light synthesis done"
              )
            }
          >
            Run light synthesis
          </Button>
          <Button
            type="button"
            disabled={!status.openaiConfigured || busy !== null}
            className="bg-green-700 text-white hover:bg-green-800"
            onClick={() =>
              action(
                "full",
                "/api/admin/setup/synthesis",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ mode: "full" }),
                },
                "Full synthesis started"
              )
            }
          >
            Run full governance synthesis
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={() =>
              action(
                "memory",
                "/api/admin/setup/rebuild-memory",
                { method: "POST" },
                "Operational memory rebuilt"
              )
            }
          >
            Rebuild operational memory
          </Button>
        </div>
      </section>
    </div>
  );
}
