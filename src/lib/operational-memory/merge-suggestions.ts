import type { SupabaseClient } from "@supabase/supabase-js";
import { titleSimilarity, mentionKeyFromTitle } from "@/lib/operational-memory/text-similarity";

export type MergeSuggestion = {
  proposedTitle: string;
  entityType: "action" | "tree" | "strategic" | "capital";
  matchType: "update_existing" | "relate_existing";
  existingId: string;
  existingTitle: string;
  score: number;
  href: string;
  rationale: string;
};

const MERGE_THRESHOLD = 0.62;

export async function findMergeSuggestions(
  supabase: SupabaseClient,
  items: {
    entityType: MergeSuggestion["entityType"];
    title: string;
  }[]
): Promise<MergeSuggestion[]> {
  const suggestions: MergeSuggestion[] = [];

  const [actions, trees, projects, capital] = await Promise.all([
    supabase.from("action_items").select("id, title").limit(200),
    supabase.from("tree_items").select("id, title").limit(200),
    supabase.from("strategic_projects").select("id, title").limit(200),
    supabase.from("capital_items").select("id, title").limit(200),
  ]);

  const pools: Record<
    MergeSuggestion["entityType"],
    { id: string; title: string; href: string }[]
  > = {
    action: (actions.data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      href: `/actions/${r.id}`,
    })),
    tree: (trees.data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      href: `/trees/${r.id}`,
    })),
    strategic: (projects.data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      href: `/strategic-plan/${r.id}`,
    })),
    capital: (capital.data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      href: `/capital/${r.id}`,
    })),
  };

  for (const item of items) {
    const pool = pools[item.entityType];
    const key = mentionKeyFromTitle(item.title);
    let best: { id: string; title: string; href: string; score: number } | null =
      null;

    for (const row of pool) {
      const score = titleSimilarity(item.title, row.title);
      const keyMatch =
        mentionKeyFromTitle(row.title) === key ? 0.15 : 0;
      const total = Math.min(1, score + keyMatch);
      if (!best || total > best.score) {
        best = { ...row, score: total };
      }
    }

    if (best && best.score >= MERGE_THRESHOLD) {
      suggestions.push({
        proposedTitle: item.title,
        entityType: item.entityType,
        matchType:
          item.entityType === "action" ? "relate_existing" : "update_existing",
        existingId: best.id,
        existingTitle: best.title,
        score: best.score,
        href: best.href,
        rationale:
          item.entityType === "capital" || item.entityType === "tree"
            ? "Likely the same topic—consider updating the existing record instead of creating a duplicate."
            : "Similar existing record—link or merge instead of duplicating.",
      });
    }
  }

  return suggestions.sort((a, b) => b.score - a.score);
}
