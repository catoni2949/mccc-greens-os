import type { SupabaseClient } from "@supabase/supabase-js";
import { BIBLE_FRAMEWORK_SECTIONS } from "@/lib/governance/bible-framework";

export type BibleGenerateSection = {
  slug: string;
  title: string;
  markdown: string;
};

export async function assembleBibleFromData(
  supabase: SupabaseClient
): Promise<{ fullMarkdown: string; sections: BibleGenerateSection[] }> {
  const [
    governance,
    decisionsRes,
    meetings,
    projects,
    trees,
    capital,
    mentions,
  ] = await Promise.all([
    supabase.from("governance_sections").select("slug, title, body, summary").order("sort_order"),
    supabase
      .from("institutional_decisions")
      .select("title, decision_date, rationale, governance_section_slug")
      .order("decision_date", { ascending: false })
      .limit(40),
    supabase
      .from("meetings")
      .select("title, meeting_date, summary, decisions")
      .order("meeting_date", { ascending: false })
      .limit(15),
    supabase.from("strategic_projects").select("title, status, strategic_rationale").limit(25),
    supabase.from("tree_items").select("title, hole_or_area, rationale, committee_status").limit(25),
    supabase.from("capital_items").select("title, status, priority").limit(25),
    supabase
      .from("discussion_mentions")
      .select("mention_label, excerpt, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const decisions = { data: decisionsRes.error ? [] : decisionsRes.data ?? [] };

  const govBySlug = new Map(
    (governance.data ?? []).map((g) => [g.slug, g])
  );

  const sections: BibleGenerateSection[] = BIBLE_FRAMEWORK_SECTIONS.map((frame) => {
    const existing = govBySlug.get(frame.slug);
    const relatedDecisions = decisions.data.filter(
      (d) => d.governance_section_slug === frame.slug
    );

    const lines: string[] = [];
    lines.push(`# ${frame.title}`);
    if (existing?.summary) lines.push(`\n${existing.summary}\n`);
    if (existing?.body?.trim()) {
      lines.push(existing.body.trim());
    } else {
      lines.push("_No stored body yet — populated from institutional data below._\n");
    }

    if (relatedDecisions.length) {
      lines.push("\n## Institutional decisions\n");
      for (const d of relatedDecisions) {
        lines.push(
          `- **${d.title}**${d.decision_date ? ` (${d.decision_date})` : ""}: ${d.rationale ?? ""}`
        );
      }
    }

    const slugHints: Record<string, string[]> = {
      "tree-management-philosophy": ["tree"],
      "forward-family-tee-philosophy": ["tee", "family", "forward"],
      "bunker-program-sand-strategy": ["bunker", "sand"],
      "strategic-plan-governance": ["strategic"],
      "capital-equipment-planning": ["capital", "equipment", "mower"],
      "historical-decisions-rationale": ["decision"],
      "meeting-cadence-agenda-structure": ["meeting"],
    };
    const hints = slugHints[frame.slug] ?? [];

    const relevantMeetings = (meetings.data ?? []).filter((m) => {
      const blob = `${m.title} ${m.summary ?? ""} ${m.decisions ?? ""}`.toLowerCase();
      return hints.length === 0 || hints.some((h) => blob.includes(h));
    });
    if (relevantMeetings.length && hints.length) {
      lines.push("\n## Recent meetings\n");
      for (const m of relevantMeetings.slice(0, 5)) {
        lines.push(
          `- ${m.title}${m.meeting_date ? ` (${m.meeting_date})` : ""}${m.summary ? `: ${m.summary.slice(0, 120)}…` : ""}`
        );
      }
    }

    if (frame.slug.includes("tree") && trees.data?.length) {
      lines.push("\n## Tree program (from records)\n");
      for (const t of trees.data.slice(0, 8)) {
        lines.push(`- ${t.title}${t.hole_or_area ? ` · ${t.hole_or_area}` : ""} (${t.committee_status})`);
      }
    }
    if (frame.slug.includes("capital") && capital.data?.length) {
      lines.push("\n## Capital (from records)\n");
      for (const c of capital.data.slice(0, 8)) {
        lines.push(`- ${c.title} — ${c.status}, ${c.priority} priority`);
      }
    }
    if (frame.slug.includes("strategic") && projects.data?.length) {
      lines.push("\n## Strategic projects\n");
      for (const p of projects.data.slice(0, 8)) {
        lines.push(`- ${p.title} (${p.status})`);
      }
    }

    if (frame.slug === "historical-decisions-rationale" && mentions.data?.length) {
      lines.push("\n## Discussion themes (recent)\n");
      for (const m of mentions.data.slice(0, 10)) {
        lines.push(`- ${m.mention_label}${m.excerpt ? `: ${m.excerpt.slice(0, 80)}…` : ""}`);
      }
    }

    return {
      slug: frame.slug,
      title: frame.title,
      markdown: lines.join("\n"),
    };
  });

  const fullMarkdown = sections.map((s) => s.markdown).join("\n\n---\n\n");
  return { fullMarkdown, sections };
}
