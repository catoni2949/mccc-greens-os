"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BACKFILL_SESSION_KEY } from "@/lib/backfill/source-types";
import type { BackfillReviewSession } from "@/lib/backfill/review-types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function BibleImportClient() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function extract() {
    if (text.trim().length < 50) {
      toast.error("Paste at least 50 characters of source material");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/backfill/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: "chair_note",
          text: text.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Extraction failed");
        return;
      }
      sessionStorage.setItem(BACKFILL_SESSION_KEY, JSON.stringify(data as BackfillReviewSession));
      router.push("/admin/backfill/review?filter=governance");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <Label htmlFor="bible-import">Institutional source text</Label>
      <Textarea
        id="bible-import"
        className="min-h-[240px] font-mono text-sm"
        placeholder="Paste minutes, policies, chair notes, or USGA excerpts to enrich Bible sections and institutional decisions…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button
        type="button"
        disabled={loading}
        className="bg-green-700 text-white hover:bg-green-800"
        onClick={extract}
      >
        {loading ? "Extracting…" : "Extract for Bible & decisions"}
      </Button>
      <p className="text-sm text-slate-500">
        Admin access required. Review focuses on governance sections and institutional
        decisions; use{" "}
        <a href="/admin/backfill" className="text-green-700 hover:underline">
          full backfill
        </a>{" "}
        for meetings and operational records.
      </p>
    </div>
  );
}
