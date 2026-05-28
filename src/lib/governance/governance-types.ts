export type SupportingQuote = {
  quote: string;
  meeting_id?: string | null;
  meeting_title?: string | null;
  label?: string | null;
};

export type SourceGrounding = {
  meeting_ids?: string[];
  decision_ids?: string[];
  action_ids?: string[];
  project_ids?: string[];
  mention_ids?: string[];
};

export type GovernanceSectionSynthesis = {
  slug: string;
  summary: string;
  synthesized_body: string;
  why_exists: string;
  historical_context: string;
  risks_if_ignored: string;
  history_examples: string;
  supporting_quotes: SupportingQuote[];
  supporting_meeting_ids: string[];
  supporting_decision_ids: string[];
  recurring_themes: string[];
};

export type DecisionRationaleSynthesis = {
  decision_id: string;
  rationale_summary: string;
  alternatives_considered: string;
  historical_context: string;
  expected_outcome: string;
  downstream_implications: string;
  lessons_learned: string;
  related_meeting_ids: string[];
};

export type GovernanceCorpus = {
  meetings: {
    id: string;
    title: string;
    meeting_date: string | null;
    summary: string | null;
    decisions: string | null;
    agenda: string | null;
    transcript_excerpt: string | null;
  }[];
  institutional_decisions: {
    id: string;
    title: string;
    decision_date: string | null;
    rationale: string | null;
    governance_section_slug: string | null;
  }[];
  governance_sections: {
    slug: string;
    title: string;
    body: string | null;
    summary: string | null;
  }[];
  strategic_projects: { id: string; title: string; status: string; rationale: string | null }[];
  tree_items: { id: string; title: string; hole_or_area: string | null; rationale: string | null }[];
  capital_items: { id: string; title: string; status: string; priority: string }[];
  member_feedback: { id: string; topic: string; feedback_text: string | null; source: string | null }[];
  meeting_topics: {
    id: string;
    meeting_id: string;
    topic_label: string;
    discussion_count: number;
  }[];
  discussion_mentions: {
    id: string;
    meeting_id: string;
    mention_label: string;
    excerpt: string | null;
  }[];
};
