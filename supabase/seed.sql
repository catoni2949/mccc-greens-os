-- MCCC Greens OS — demo seed data
-- Run after migrations: psql or Supabase SQL editor
-- Safe to re-run only on empty tables; truncate first if re-seeding.

-- Meetings
insert into meetings (title, meeting_type, meeting_date, status, attendees, agenda, raw_transcript, summary, decisions, notes)
values
  (
    'March Greens Committee',
    'Greens Committee',
    '2025-03-12',
    'Completed',
    'Ryan, Dwayne, Mike, Stacey',
    'Tree plan, bunker review, capital priorities',
    'Discussion on hole 7 oak removal and irrigation timing.',
    'Reviewed tree removals and spring aeration schedule.',
    'Approved conditional removal on hole 7 pending permit. Deferred bunker 12 until fall.',
    null
  ),
  (
    'April Strategic Planning',
    'Strategic Planning',
    '2025-04-08',
    'Completed',
    'Ryan, Dwayne, Committee',
    'Tier 1 projects, member feedback themes',
    null,
    'Aligned on three Tier 1 initiatives for 2025–26.',
    'Endorsed practice tee expansion concept for board packet.',
    null
  ),
  (
    'May Superintendent Sync',
    'Superintendent Sync',
    '2025-05-06',
    'Scheduled',
    'Ryan, Mike',
    'Moisture management, staff scheduling',
    null,
    null,
    null,
    null
  );

-- Strategic projects
insert into strategic_projects (title, hole_or_area, category, status, priority_tier, estimated_cost_class, strategic_rationale)
values
  (
    'Practice Tee Expansion',
    'Practice area',
    'Tee Complex',
    'Board Review',
    'Tier 1 Foundational',
    '$150k–$500k',
    'Improve warm-up experience and spread traffic off main tees.'
  ),
  (
    'Hole 7 Oak Removal',
    'Hole 7',
    'Tree Management',
    'In Progress',
    'Tier 2 High Member Visibility',
    '$10k–$50k',
    'Restore turf sunlight and shot corridor per committee walkthrough.'
  ),
  (
    'Bunker 12 Renovation',
    'Hole 12',
    'Bunker',
    'Concept',
    'Tier 3 Signature Transformational',
    '$50k–$150k',
    'Member visibility and championship presentation.'
  );

-- Link action items to first meeting and projects
insert into action_items (title, owner, status, priority, category, due_date, source_meeting_id, linked_project_id, board_relevance)
select
  'Submit tree permit application',
  'Ryan',
  'In Progress',
  'High',
  'Tree Management',
  '2025-04-30',
  m.id,
  p.id,
  true
from meetings m
cross join strategic_projects p
where m.title = 'March Greens Committee' and p.title = 'Hole 7 Oak Removal'
limit 1;

insert into action_items (title, owner, status, priority, category, due_date, source_meeting_id)
select
  'Draft board slide for practice tee',
  'Dwayne',
  'Open',
  'Medium',
  'Strategic Plan',
  '2025-05-15',
  m.id
from meetings m
where m.title = 'April Strategic Planning'
limit 1;

-- Tree items
insert into tree_items (title, hole_or_area, tree_type, issue, committee_status, permit_status, board_status, target_season, linked_project_id)
select
  'Hole 7 corridor oak',
  'Hole 7',
  'Oak',
  'Removal',
  'In Review',
  'Pending',
  'Pending',
  'Fall',
  p.id
from strategic_projects p
where p.title = 'Hole 7 Oak Removal'
limit 1;

-- Capital items
insert into capital_items (title, item_type, estimated_cost, target_year, priority, status, owner, funding_notes)
values
  (
    'Fairway mower replacement',
    'Equipment',
    85000,
    2025,
    'High',
    'Under Review',
    'Mike',
    'Replace aging unit; evaluate lease vs buy.'
  ),
  (
    'Irrigation controller upgrade',
    'Irrigation',
    42000,
    2026,
    'Medium',
    'Approved',
    'Ryan',
    null
  );

-- Committee members
insert into committee_members (full_name, role, status, email, start_date)
values
  ('Ryan Mitchell', 'Chair', 'Active', 'ryan@example.com', '2023-01-01'),
  ('Dwayne Carter', 'Vice Chair', 'Active', 'dwayne@example.com', '2023-01-01'),
  ('Mike Sullivan', 'Superintendent Liaison', 'Active', 'mike@example.com', '2022-06-01'),
  ('Stacey Nguyen', 'Communications', 'Active', 'stacey@example.com', '2024-03-15');

-- Member feedback
insert into member_feedback (topic, category, feedback_text, source, status, owner, linked_project_id)
select
  'Practice area crowding',
  'Pace of Play',
  'Members report backups on weekend mornings at practice tees.',
  'Member Survey',
  'Open',
  'Stacey',
  p.id
from strategic_projects p
where p.title = 'Practice Tee Expansion'
limit 1;

insert into member_feedback (topic, category, feedback_text, source, status, owner)
values
  (
    'Bunker consistency hole 12',
    'Bunkers',
    'Several comments on sand firmness and faces after rain.',
    'Email',
    'In Review',
    'Ryan'
  );
