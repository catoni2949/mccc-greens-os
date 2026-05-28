-- Run after 006/007. Seeds Greens Committee Bible outline (edit body in app or SQL).

insert into governance_sections (slug, title, category, summary, body, sort_order) values
('mission', 'Committee mission & scope', 'standards',
 'Why the Greens Committee exists at MCCC.',
 E'## Mission\nThe Greens Committee advises the Board and management on course conditioning, agronomy, capital priorities, and member-facing course experience.\n\n## Scope\n- Course maintenance standards\n- Strategic plan alignment\n- Tree, turf, and infrastructure policy\n- Member communication on course work', 10),

('decision-rights', 'Decision rights & board interface', 'standards',
 'What the committee decides vs. recommends vs. escalates.',
 E'## Committee authority\nDocument what requires Board awareness, Board approval, or operational committee decision only.\n\n## Escalation\n- Tree removals with material impact\n- Capital above threshold\n- Strategic plan changes affecting dues or major disruption', 20),

('meeting-cadence', 'Meeting governance', 'meeting_governance',
 'How meetings are run and documented.',
 E'## Cadence\nMonthly committee meetings; annual strategic review with Board.\n\n## Artifacts\nEvery meeting produces: summary, decisions, action items, and board-relevant flags in MCCC Greens OS.', 30),

('documentation-standard', 'Documentation standard', 'procedures',
 'How records must be captured in Greens OS.',
 E'## Minimum record quality\n- Transcript or detailed notes within 7 days\n- Extraction review before bulk record creation\n- Related history checked for duplicates\n- Board packet generated before Board presentations', 40),

('onboarding-member', 'New member onboarding', 'onboarding',
 'What every new committee member receives.',
 E'## First 30 days\n- Read mission & decision rights\n- Tour agronomy priorities with Chair\n- Access Greens OS and review open actions\n- Attend one meeting as observer, one as participant', 50),

('offboarding-member', 'Member offboarding', 'offboarding',
 'Continuity when a member steps down.',
 E'## Handoff\n- Reassign owned actions\n- Archive personal notes into meeting records\n- Brief successor on in-flight topics', 60),

('chair-transition', 'Chair transition', 'transition',
 'Succession when the chair role changes.',
 E'## Chair handoff\n- Register transition in Greens OS\n- Chair command center walkthrough with successor\n- Open board-prep items briefing\n- Strategic plan status review', 70),

('strategic-continuity', 'Strategic plan continuity', 'strategic_continuity',
 'How multi-year plan survives leadership change.',
 E'## Principles\nStrategic projects live in Greens OS, not personal files.\nTier priorities and board status must stay current.\nEach chair affirms plan status at transition.', 80),

('historical-archive', 'Historical archive & timeline', 'archive',
 'Institutional memory beyond any single meeting.',
 E'## Archive\nUse **Timeline** for chronological history.\nUse **Related History** on records for topic continuity.\nMajor decisions remain in meeting `decisions` fields permanently.', 90)
on conflict (slug) do nothing;

insert into governance_checklist_items (checklist_type, title, description, sort_order, is_required) values
('incoming_member', 'Greens OS account & login', 'Confirm authenticated access to MCCC Greens OS.', 10, true),
('incoming_member', 'Read Committee Bible — mission & decision rights', 'Review governance sections in Standards category.', 20, true),
('incoming_member', 'Review open actions & board-relevant items', 'Use Chair center and Actions list.', 30, true),
('incoming_chair', 'Chair command center review', 'Walk through overdue, board prep, and stale topics.', 10, true),
('incoming_chair', 'Record chair transition', 'Log effective date and handoff notes.', 20, true),
('incoming_chair', 'Strategic plan & capital watchlists', 'Review strategic projects and capital under review.', 30, true),
('outgoing_chair', 'Handoff meeting scheduled', 'Dedicated transition meeting with incoming chair.', 10, true),
('outgoing_chair', 'Board-prep items documented', 'All pending board items have owners and dates.', 20, true),
('outgoing_chair', 'Transition entry completed', 'Create chair_transitions record in Greens OS.', 30, true);
