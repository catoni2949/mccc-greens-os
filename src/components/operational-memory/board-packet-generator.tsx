"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function BoardPacketGenerator({
  meetingId,
  initialMarkdown,
}: {
  meetingId: string;
  initialMarkdown: string;
}) {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const preview = useMemo(() => markdown.slice(0, 4000), [markdown]);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}/board-packet`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not generate packet");
        return;
      }
      setMarkdown(data.markdown);
      toast.success("Board packet refreshed");
    } catch {
      toast.error("Request failed");
    }
    setLoading(false);
  }

  async function copy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={refresh}
        >
          {loading ? "Refreshing…" : "Refresh packet"}
        </Button>
        <Button
          type="button"
          size="sm"
          className="bg-green-700 text-white hover:bg-green-800"
          onClick={copy}
        >
          {copied ? "Copied" : "Copy markdown"}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled title="PDF export later">
          Export PDF (soon)
        </Button>
      </div>
      <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-800">
        {preview}
        {markdown.length > 4000 ? "\n\n…" : ""}
      </pre>
    </div>
  );
}
