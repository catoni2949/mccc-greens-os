import type { SupabaseClient } from "@supabase/supabase-js";
import { titleSimilarity, mentionKeyFromTitle } from "@/lib/operational-memory/text-similarity";

export type DuplicateEntityType =
  | "meeting"
  | "action"
  | "strategic"
  | "tree"
  | "capital"
  | "feedback"
  | "committee_member"
  | "governance_section"
  | "institutional_decision";

export type DuplicateCandidate = {
  id: string;
  title: string;
  score: number;
  href: string;
};

const THRESHOLD = 0.58;

export async function findDuplicateCandidates(
  supabase: SupabaseClient,
  entityType: DuplicateEntityType,
  title: string,
  slug?: string
): Promise<DuplicateCandidate[]> {
  const key = slug ? slug.toLowerCase() : mentionKeyFromTitle(title);
  let rows: { id: string; title: string; href: string; extra?: string }[] = [];

  switch (entityType) {
    case "meeting": {
      const { data } = await supabase
        .from("meetings")
        .select("id, title, meeting_date")
        .order("meeting_date", { ascending: false })
        .limit(80);
      rows = (data ?? []).map((r) => ({
        id: r.id,
        title: `${r.title}${r.meeting_date ? ` (${r.meeting_date})` : ""}`,
        href: `/meetings/${r.id}`,
      }));
      break;
    }
    case "action": {
      const { data } = await supabase.from("action_items").select("id, title").limit(200);
      rows = (data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        href: `/actions/${r.id}`,
      }));
      break;
    }
    case "strategic": {
      const { data } = await supabase.from("strategic_projects").select("id, title").limit(200);
      rows = (data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        href: `/strategic-plan/${r.id}`,
      }));
      break;
    }
    case "tree": {
      const { data } = await supabase.from("tree_items").select("id, title").limit(200);
      rows = (data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        href: `/trees/${r.id}`,
      }));
      break;
    }
    case "capital": {
      const { data } = await supabase.from("capital_items").select("id, title").limit(200);
      rows = (data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        href: `/capital/${r.id}`,
      }));
      break;
    }
    case "feedback": {
      const { data } = await supabase.from("member_feedback").select("id, topic").limit(200);
      rows = (data ?? []).map((r) => ({
        id: r.id,
        title: r.topic,
        href: `/communications`,
      }));
      break;
    }
    case "committee_member": {
      const { data } = await supabase.from("committee_members").select("id, full_name").limit(100);
      rows = (data ?? []).map((r) => ({
        id: r.id,
        title: r.full_name,
        href: `/committee`,
      }));
      break;
    }
    case "governance_section": {
      const { data } = await supabase
        .from("governance_sections")
        .select("id, slug, title")
        .limit(50);
      rows = (data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        href: `/governance/bible/${r.slug}`,
        extra: r.slug,
      }));
      break;
    }
    case "institutional_decision": {
      const { data } = await supabase
        .from("institutional_decisions")
        .select("id, title")
        .limit(100);
      rows = (data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        href: `/governance`,
      }));
      break;
    }
  }

  const scored: DuplicateCandidate[] = [];
  for (const row of rows) {
    let score = titleSimilarity(title, row.title);
    if (entityType === "governance_section" && row.extra) {
      if (row.extra === key || mentionKeyFromTitle(row.extra) === key) score = 1;
    } else if (mentionKeyFromTitle(row.title) === key) {
      score = Math.min(1, score + 0.12);
    }
    if (score >= THRESHOLD) {
      scored.push({ id: row.id, title: row.title, score, href: row.href });
    }
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, 5);
}
