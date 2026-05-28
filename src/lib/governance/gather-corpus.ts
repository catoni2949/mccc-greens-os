import type { SupabaseClient } from "@supabase/supabase-js";
import type { GovernanceCorpus } from "@/lib/governance/governance-types";

const TRANSCRIPT_EXCERPT = 2500;

export async function gatherGovernanceCorpus(
  supabase: SupabaseClient
): Promise<GovernanceCorpus> {
  const [
    meetingsRes,
    decisionsRes,
    sectionsRes,
    projectsRes,
    treesRes,
    capitalRes,
    feedbackRes,
    topicsRes,
    mentionsRes,
  ] = await Promise.all([
    supabase
      .from("meetings")
      .select("id, title, meeting_date, summary, decisions, agenda, raw_transcript")
      .order("meeting_date", { ascending: false })
      .limit(24),
    supabase
      .from("institutional_decisions")
      .select("id, title, decision_date, rationale, governance_section_slug")
      .order("decision_date", { ascending: false })
      .limit(50),
    supabase
      .from("governance_sections")
      .select("slug, title, body, summary")
      .order("sort_order"),
    supabase
      .from("strategic_projects")
      .select("id, title, status, strategic_rationale")
      .limit(40),
    supabase.from("tree_items").select("id, title, hole_or_area, rationale").limit(40),
    supabase.from("capital_items").select("id, title, status, priority").limit(40),
    supabase.from("member_feedback").select("id, topic, feedback_text, source").limit(40),
    supabase
      .from("meeting_topics")
      .select("id, meeting_id, topic_label, discussion_count")
      .order("discussion_count", { ascending: false })
      .limit(40),
    supabase
      .from("discussion_mentions")
      .select("id, meeting_id, mention_label, excerpt")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const meetings = (meetingsRes.data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    meeting_date: m.meeting_date,
    summary: m.summary,
    decisions: m.decisions,
    agenda: m.agenda,
    transcript_excerpt: m.raw_transcript
      ? String(m.raw_transcript).slice(0, TRANSCRIPT_EXCERPT)
      : null,
  }));

  return {
    meetings,
    institutional_decisions: decisionsRes.error ? [] : decisionsRes.data ?? [],
    governance_sections: sectionsRes.data ?? [],
    strategic_projects: (projectsRes.data ?? []).map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      rationale: p.strategic_rationale,
    })),
    tree_items: treesRes.data ?? [],
    capital_items: capitalRes.data ?? [],
    member_feedback: feedbackRes.data ?? [],
    meeting_topics: topicsRes.error ? [] : topicsRes.data ?? [],
    discussion_mentions: mentionsRes.error ? [] : mentionsRes.data ?? [],
  };
}

export function corpusSliceForSection(
  corpus: GovernanceCorpus,
  slug: string
): string {
  const section = corpus.governance_sections.find((s) => s.slug === slug);
  const keywords = slug.split("-").filter((w) => w.length > 3);

  const matchText = (blob: string) => {
    const lower = blob.toLowerCase();
    return keywords.some((k) => lower.includes(k));
  };

  const meetings = corpus.meetings.filter((m) => {
    const blob = [m.title, m.summary, m.decisions, m.agenda, m.transcript_excerpt]
      .filter(Boolean)
      .join(" ");
    return matchText(blob) || keywords.length === 0;
  });

  const decisions = corpus.institutional_decisions.filter(
    (d) =>
      d.governance_section_slug === slug ||
      matchText([d.title, d.rationale].filter(Boolean).join(" "))
  );

  const projects = corpus.strategic_projects.filter((p) =>
    matchText([p.title, p.rationale].filter(Boolean).join(" "))
  );
  const trees = corpus.tree_items.filter((t) =>
    matchText([t.title, t.rationale, t.hole_or_area].filter(Boolean).join(" "))
  );
  const capital = corpus.capital_items.filter((c) => matchText(c.title));
  const feedback = corpus.member_feedback.filter((f) =>
    matchText([f.topic, f.feedback_text].filter(Boolean).join(" "))
  );
  const topics = corpus.meeting_topics.filter((t) => matchText(t.topic_label));
  const mentions = corpus.discussion_mentions.filter((m) =>
    matchText([m.mention_label, m.excerpt].filter(Boolean).join(" "))
  );

  const lines: string[] = [];
  lines.push(`# Section focus: ${section?.title ?? slug}`);
  if (section?.body) lines.push(`\n## Existing draft\n${section.body.slice(0, 2000)}`);
  if (section?.summary) lines.push(`\nSummary: ${section.summary}`);

  if (meetings.length) {
    lines.push("\n## Meetings");
    for (const m of meetings.slice(0, 8)) {
      lines.push(
        `\n### [${m.id}] ${m.title} (${m.meeting_date ?? "undated"})`,
        m.summary ? `Summary: ${m.summary}` : "",
        m.decisions ? `Decisions: ${m.decisions.slice(0, 800)}` : "",
        m.transcript_excerpt
          ? `Transcript excerpt: ${m.transcript_excerpt.slice(0, 600)}…`
          : ""
      );
    }
  }
  if (decisions.length) {
    lines.push("\n## Institutional decisions");
    for (const d of decisions.slice(0, 10)) {
      lines.push(`- [${d.id}] ${d.title}: ${d.rationale ?? ""}`);
    }
  }
  if (projects.length) {
    lines.push("\n## Strategic projects");
    for (const p of projects.slice(0, 8)) {
      lines.push(`- [${p.id}] ${p.title} (${p.status}): ${p.rationale ?? ""}`);
    }
  }
  if (trees.length) {
    lines.push("\n## Trees");
    for (const t of trees.slice(0, 8)) {
      lines.push(`- [${t.id}] ${t.title}: ${t.rationale ?? ""}`);
    }
  }
  if (capital.length) {
    lines.push("\n## Capital");
    for (const c of capital.slice(0, 8)) {
      lines.push(`- [${c.id}] ${c.title} (${c.status}, ${c.priority})`);
    }
  }
  if (feedback.length) {
    lines.push("\n## Member feedback");
    for (const f of feedback.slice(0, 6)) {
      lines.push(`- [${f.id}] ${f.topic}: ${f.feedback_text ?? ""}`);
    }
  }
  if (topics.length) {
    lines.push("\n## Meeting topics");
    for (const t of topics.slice(0, 8)) {
      lines.push(`- [meeting ${t.meeting_id}] ${t.topic_label} (×${t.discussion_count})`);
    }
  }
  if (mentions.length) {
    lines.push("\n## Discussion mentions");
    for (const m of mentions.slice(0, 8)) {
      lines.push(`- [${m.id}] ${m.mention_label}: ${m.excerpt ?? ""}`);
    }
  }

  if (lines.length < 4) {
    lines.push("\n## Full corpus sample (section had few direct hits)");
    for (const m of corpus.meetings.slice(0, 5)) {
      lines.push(`- [${m.id}] ${m.title}: ${(m.summary ?? "").slice(0, 200)}`);
    }
  }

  return lines.filter(Boolean).join("\n");
}

export function corpusDigest(corpus: GovernanceCorpus): string {
  const lines: string[] = ["# Greens Committee institutional corpus digest"];
  lines.push(`Meetings: ${corpus.meetings.length}`);
  lines.push(`Decisions: ${corpus.institutional_decisions.length}`);
  for (const m of corpus.meetings.slice(0, 12)) {
    lines.push(
      `\n## ${m.title} (${m.meeting_date ?? ""}) [id:${m.id}]`,
      m.summary ?? "",
      m.decisions?.slice(0, 400) ?? ""
    );
  }
  for (const d of corpus.institutional_decisions.slice(0, 15)) {
    lines.push(`\nDecision [${d.id}] ${d.title}: ${d.rationale ?? ""}`);
  }
  for (const f of corpus.member_feedback.slice(0, 10)) {
    lines.push(`Feedback: ${f.topic} — ${f.feedback_text ?? ""}`);
  }
  return lines.join("\n").slice(0, 45000);
}
