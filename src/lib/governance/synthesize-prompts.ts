export const GOVERNANCE_SYNTHESIS_SYSTEM = `You are the institutional governance synthesizer for Merion Cricket Club Greens Committee.

Your job is to produce operational doctrine — not meeting recaps, not transcript dumps, not generic corporate policy language.

Write like a seasoned committee chair briefing a successor: concrete norms, sequencing, board dynamics, superintendent coordination, member communication, capital/tree/strategic philosophy, continuity, and political sensitivities when evidenced in sources.

Ground every claim in provided source material. When evidence is thin, state what is documented vs. what remains to be formalized.

Use clear markdown headings and bullet lists where appropriate. Be dense and useful.`;

export function sectionSynthesisUserPrompt(
  sectionTitle: string,
  sectionSlug: string,
  corpusSlice: string
): string {
  return `Synthesize institutional doctrine for Bible section:
Title: ${sectionTitle}
Slug: ${sectionSlug}

Identify from sources (when present):
- recurring governance philosophy for this topic
- operational priorities and committee norms
- board relationship expectations
- superintendent coordination patterns (if relevant)
- member communication expectations
- prioritization / sequencing principles
- restoration or agronomic philosophy (if relevant)
- continuity expectations
- recurring unresolved concerns
- political sensitivities (only if clearly evidenced)

Source material:
---
${corpusSlice}
---

Return structured JSON. synthesized_body must be standalone doctrine a new chair could operate from.`;
}

export const INTELLIGENCE_SYNTHESIS_USER = `From this committee corpus digest, produce governance intelligence (not a meeting summary).

Identify:
- recurring themes (5-10)
- unresolved strategic topics
- board-sensitive issues
- repeated member concerns
- recurring operational risks
- governance gaps (missing formal doctrine)
- stale or weakly documented decisions
- heavily discussed topics
- upcoming continuity risks

Be specific to MCCC Greens context when sources allow.`;

export const EVOLUTION_SYNTHESIS_USER = `Write a "Committee evolution" timeline narrative from this corpus:

Cover where evidenced:
- committee evolution and governance maturity
- strategic plan progression
- operational improvements
- philosophy shifts (restoration, trees, tees, bunkers, communication)
- major turning points

Format as markdown with dated or sequenced sections. Operational tone.`;

export const CHAIR_BRIEF_SYNTHESIS_USER = `Produce an "Outgoing Chair Intelligence Brief" from operational data and corpus.

Include sections:
1. Operational state (what is in flight)
2. Political landscape (board, membership sensitivities — only if evidenced)
3. Unresolved risks
4. Important relationships (superintendent, board liaison, minutes, committee members)
5. Active tensions or recurring conflicts in discussion
6. Implementation sequencing (what must happen in what order)
7. Committee personalities / dynamics (high level, respectful)
8. Strategic momentum
9. Recommended priorities for incoming chair

NOT a data export. Synthesize judgment and continuity.`;

export const DECISION_RATIONALE_USER = (title: string, corpusHints: string) =>
  `Synthesize institutional decision rationale for: "${title}"

Use sources only. Produce:
- rationale_summary (why the committee landed here)
- alternatives_considered (if any evidence; else "Not documented in sources")
- historical_context
- expected_outcome
- downstream_implications
- lessons_learned
- related_meeting_ids (array of UUIDs from bracketed [id] in sources)

Sources:
---
${corpusHints}
---`;
