"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BACKFILL_SOURCE_TYPES,
  BACKFILL_SESSION_KEY,
  type BackfillSourceType,
} from "@/lib/backfill/source-types";
import type { BackfillReviewSession } from "@/lib/backfill/review-types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function BackfillIntakeClient() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<BackfillSourceType>("meeting_minutes");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function onFile(file: File | null) {
    if (!file) return;
    const t = await file.text();
    setText(t);
    toast.success(`Loaded ${file.name}`);
  }

  async function extract() {
    if (text.trim().length < 50) {
      toast.error("Paste or upload at least 50 characters of source text");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backfill/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceType, text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Extraction failed");
        return;
      }
      sessionStorage.setItem(BACKFILL_SESSION_KEY, JSON.stringify(data as BackfillReviewSession));
      router.push("/admin/backfill/review");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <Label htmlFor="source-type">Source type</Label>
        <select
          id="source-type"
          className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value as BackfillSourceType)}
        >
          {Object.entries(BACKFILL_SOURCE_TYPES).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
        <Label htmlFor="source-text">Source text</Label>
        <Textarea
          id="source-text"
          className="mt-2 min-h-[280px] font-mono text-sm"
          placeholder="Paste minutes, agenda, email, transcript, USGA report, or chair notes…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Label className="cursor-pointer text-sm text-green-700">
            Upload file
            <input
              type="file"
              accept=".txt,.md,.csv,text/plain"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </Label>
          <span className="text-xs text-slate-500">{text.length.toLocaleString()} characters</span>
        </div>
      </div>

      <Button
        type="button"
        disabled={loading}
        className="bg-green-700 text-white hover:bg-green-800"
        onClick={extract}
      >
        {loading ? "Extracting…" : "Extract Backfill Intelligence"}
      </Button>
      <p className="text-sm text-slate-500">
        Uses OpenAI only. Nothing is written until you approve items on the review screen.
      </p>
    </div>
  );
}
