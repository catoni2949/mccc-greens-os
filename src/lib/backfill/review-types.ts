export type BackfillDisposition = "create" | "link" | "skip";

export type ReviewRowBase = {
  clientKey: string;
  disposition: BackfillDisposition;
  linkToId?: string;
  included: boolean;
};

export type BackfillReviewSession = {
  sourceType: string;
  sourceLabel: string;
  rawSourceText: string;
  extractedAt: string;
  extractionMode: "openai";
  sourceSummary: string;
  meetings: (ReviewRowBase & {
    title: string;
    meeting_date: string | null;
    meeting_type: string | null;
    status: string | null;
    attendees: string | null;
    agenda: string | null;
    summary: string | null;
    decisions: string | null;
    notes: string | null;
    confidence: number;
  })[];
  actionItems: (ReviewRowBase & {
    title: string;
    owner: string | null;
    priority: string;
    category: string | null;
    due_date: string | null;
    hole_or_area: string | null;
    board_relevance: boolean;
    notes: string | null;
    confidence: number;
    meetingClientKey?: string | null;
  })[];
  strategicProjects: (ReviewRowBase & {
    title: string;
    hole_or_area: string | null;
    category: string | null;
    priority_tier: string | null;
    strategic_rationale: string | null;
    notes: string | null;
    confidence: number;
    meetingClientKey?: string | null;
  })[];
  treeItems: (ReviewRowBase & {
    title: string;
    hole_or_area: string | null;
    tree_type: string | null;
    rationale: string | null;
    permit_status: string | null;
    committee_status: string | null;
    board_status: string | null;
    target_season: string | null;
    notes: string | null;
    confidence: number;
  })[];
  capitalItems: (ReviewRowBase & {
    title: string;
    item_type: string | null;
    estimated_cost: number | null;
    target_year: number | null;
    priority: string;
    status: string | null;
    notes: string | null;
    confidence: number;
  })[];
  memberFeedback: (ReviewRowBase & {
    topic: string;
    category: string | null;
    feedback_text: string | null;
    source: string | null;
    status: string | null;
    owner: string | null;
    notes: string | null;
    confidence: number;
  })[];
  committeeMembers: (ReviewRowBase & {
    full_name: string;
    role: string | null;
    status: string | null;
    email: string | null;
    notes: string | null;
    confidence: number;
  })[];
  governanceSections: (ReviewRowBase & {
    slug: string;
    title: string;
    category: string | null;
    summary: string | null;
    body: string | null;
    confidence: number;
  })[];
  institutionalDecisions: (ReviewRowBase & {
    title: string;
    decision_date: string | null;
    category: string | null;
    rationale: string | null;
    implementation_notes: string | null;
    governance_section_slug: string | null;
    confidence: number;
    meetingClientKey?: string | null;
  })[];
  meetingTopics: (ReviewRowBase & {
    topic_label: string;
    category: string | null;
    hole_number: number | null;
    board_relevant: boolean;
    notes: string | null;
    confidence: number;
    meetingClientKey?: string | null;
  })[];
  discussionMentions: (ReviewRowBase & {
    mention_label: string;
    entity_type: string | null;
    excerpt: string | null;
    board_relevant: boolean;
    confidence: number;
    meetingClientKey?: string | null;
  })[];
  entityLinks: (ReviewRowBase & {
    source_label: string;
    target_label: string;
    link_type: string | null;
    confidence: number;
  })[];
  duplicateHints: Record<string, DuplicateHint[]>;
};

export type DuplicateHint = {
  id: string;
  title: string;
  score: number;
  href: string;
};

export type BackfillApplyPayload = {
  sourceLabel: string;
  rawSourceText?: string;
  defaultMeetingId?: string | null;
  meetings: BackfillReviewSession["meetings"];
  actionItems: BackfillReviewSession["actionItems"];
  strategicProjects: BackfillReviewSession["strategicProjects"];
  treeItems: BackfillReviewSession["treeItems"];
  capitalItems: BackfillReviewSession["capitalItems"];
  memberFeedback: BackfillReviewSession["memberFeedback"];
  committeeMembers: BackfillReviewSession["committeeMembers"];
  governanceSections: BackfillReviewSession["governanceSections"];
  institutionalDecisions: BackfillReviewSession["institutionalDecisions"];
  meetingTopics: BackfillReviewSession["meetingTopics"];
  discussionMentions: BackfillReviewSession["discussionMentions"];
  entityLinks: BackfillReviewSession["entityLinks"];
};
