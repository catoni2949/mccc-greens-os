"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function GovernanceSynthesizeButton({
  mode = "full",
  label,
}: {
  mode?: "full" | "sections" | "intelligence" | "evolution" | "chair_brief";
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch("/api/governance/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, maxSections: mode === "sections" ? 18 : undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Synthesis failed");
        return;
      }
      toast.success(
        `Synthesis complete: ${data.sectionsUpdated} sections, ${data.decisionsUpdated} decisions, artifacts: ${(data.artifactsUpdated as string[]).join(", ") || "none"}`
      );
      if (data.errors?.length) {
        toast.message(`${data.errors.length} partial errors — check console`);
        console.warn(data.errors);
      }
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={loading}
      onClick={run}
      className="border-green-700 text-green-800 hover:bg-green-50"
    >
      {loading ? "Synthesizing…" : label ?? "Run governance synthesis"}
    </Button>
  );
}
