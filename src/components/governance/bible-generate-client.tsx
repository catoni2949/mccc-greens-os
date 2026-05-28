"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Section = { slug: string; title: string; markdown: string };

export function BibleGenerateClient() {
  const [fullMarkdown, setFullMarkdown] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updateSections, setUpdateSections] = useState(false);

  useEffect(() => {
    fetch("/api/governance/bible/generate")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          toast.error(data.error);
          return;
        }
        setFullMarkdown(data.fullMarkdown ?? "");
        setSections(data.sections ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function copy() {
    await navigator.clipboard.writeText(fullMarkdown);
    toast.success("Copied full Bible markdown");
  }

  async function saveSnapshots() {
    setSaving(true);
    const res = await fetch("/api/governance/bible/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sections, updateSections }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error ?? "Save failed");
      return;
    }
    toast.success(
      `Saved ${data.snapshotCount} snapshots${updateSections ? " and updated sections" : ""}`
    );
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Assembling from Greens OS data…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={copy}>
          Copy full markdown
        </Button>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={updateSections}
            onChange={(e) => setUpdateSections(e.target.checked)}
          />
          Also update live governance section bodies
        </label>
        <Button
          type="button"
          disabled={saving}
          className="bg-green-700 text-white hover:bg-green-800"
          onClick={saveSnapshots}
        >
          {saving ? "Saving…" : "Save as governance snapshots"}
        </Button>
      </div>

      <pre className="max-h-[480px] overflow-auto rounded-xl border border-slate-100 bg-white p-4 text-xs whitespace-pre-wrap text-slate-800 shadow-sm">
        {fullMarkdown || "(No content — run migrations and seed framework, or add records.)"}
      </pre>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase text-slate-500">By section</h3>
        {sections.map((s) => (
          <details key={s.slug} className="rounded-lg border border-slate-100 bg-white p-3">
            <summary className="cursor-pointer font-medium text-green-800">
              {s.title}
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto text-xs whitespace-pre-wrap text-slate-600">
              {s.markdown}
            </pre>
          </details>
        ))}
      </div>
    </div>
  );
}
