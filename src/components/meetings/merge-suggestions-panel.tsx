"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { MergeSuggestion } from "@/lib/operational-memory/merge-suggestions";

export function MergeSuggestionsPanel({
  items,
}: {
  items: { entityType: MergeSuggestion["entityType"]; title: string }[];
}) {
  const [suggestions, setSuggestions] = useState<MergeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!items.length) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/memory/merge-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        const data = await res.json();
        if (!cancelled && res.ok) {
          setSuggestions(data.suggestions ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [items]);

  if (!items.length) return null;
  if (!loading && !suggestions.length) return null;

  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
      <h2 className="text-sm font-semibold text-slate-800">Entity reuse suggestions</h2>
      <p className="mt-1 text-xs text-slate-600">
        Before creating duplicates, consider updating or linking to existing records.
      </p>
      {loading ? (
        <p className="mt-2 text-sm text-slate-500">Checking existing records…</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {suggestions.map((s) => (
            <li
              key={`${s.entityType}-${s.existingId}-${s.proposedTitle}`}
              className="rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm"
            >
              <p className="font-medium text-slate-900">{s.proposedTitle}</p>
              <p className="text-xs text-slate-600">{s.rationale}</p>
              <p className="mt-1 text-xs">
                →{" "}
                <Link href={s.href} className="text-green-700 hover:underline">
                  {s.existingTitle}
                </Link>{" "}
                ({Math.round(s.score * 100)}% match)
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
