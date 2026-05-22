export type Meeting = {
  id: string;
  title: string;
  meeting_type: string;
  meeting_date: string | null;
  start_time: string | null;
  status: string;
  attendees: string | null;
  agenda: string | null;
  raw_transcript: string | null;
  summary: string | null;
  decisions: string | null;
  notes: string | null;
  next_meeting_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ActionItem = {
  id: string;
  title: string;
  owner: string | null;
  status: string;
  priority: string;
  category: string | null;
  due_date: string | null;
  hole_or_area: string | null;
  source_meeting_id: string | null;
  linked_project_id: string | null;
  board_relevance: boolean;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StrategicProject = {
  id: string;
  title: string;
  hole_or_area: string | null;
  category: string | null;
  status: string;
  priority_tier: string | null;
  strategic_rationale: string | null;
  estimated_cost_class: string | null;
  labor_type: string | null;
  disruption_level: string | null;
  member_visibility: string | null;
  board_status: string | null;
  membership_status: string | null;
  dependencies: string | null;
  source_meeting_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type FileRecord = {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  bucket_path: string | null;
  linked_type: string;
  linked_id: string | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MeetingWithActionCount = Meeting & {
  action_items?: { count: number }[];
};

export type TreeItem = {
  id: string;
  title: string;
  hole_or_area: string | null;
  tree_type: string | null;
  issue: string | null;
  rationale: string | null;
  turf_impact: string | null;
  tree_health_impact: string | null;
  safety_impact: string | null;
  shot_value_impact: string | null;
  permit_status: string;
  committee_status: string;
  board_status: string;
  target_season: string | null;
  linked_project_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CapitalItem = {
  id: string;
  title: string;
  item_type: string | null;
  estimated_cost: number | null;
  target_year: number | null;
  target_season: string | null;
  priority: string;
  status: string;
  owner: string | null;
  funding_notes: string | null;
  board_status: string | null;
  linked_project_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CommitteeMember = {
  id: string;
  full_name: string;
  role: string | null;
  status: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
};

export type MemberFeedback = {
  id: string;
  topic: string;
  category: string | null;
  feedback_text: string | null;
  source: string | null;
  status: string;
  owner: string | null;
  linked_project_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
