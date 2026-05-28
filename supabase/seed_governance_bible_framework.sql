-- Institutional Bible framework + known MCCC facts (run after 006/007; upserts by slug).

insert into governance_sections (slug, title, category, summary, body, sort_order) values
('committee-mission-operating-philosophy', 'Committee Mission and Operating Philosophy', 'standards',
 'Advisory role, restoration philosophy, member experience.',
 E'## Mission\nSympathetic restoration of the original Ted Robinson design while modernizing strategy, shot value, playability, maintenance, and sustainability (2025 master plan).\n\n## Operating philosophy\n- Advise Board and management on conditioning, agronomy, capital, and member-facing course work\n- Prefer documented decisions in Greens OS over informal memory', 10),

('chair-role-expectations', 'Chair Role and Expectations', 'standards',
 'Chair responsibilities and cadence.',
 E'## Chair\nRyan became Greens Committee Chair in May 2026.\n\n## Expectations\n- Run meeting agenda and follow-ups\n- Coordinate board liaison updates (Stacey: ~5-minute board update each meeting)\n- Maintain strategic plan and capital watchlists in Greens OS\n- Formalize onboarding, offboarding, and succession', 20),

('meeting-cadence-agenda-structure', 'Meeting Cadence and Agenda Structure', 'meeting_governance',
 'Monthly structure and May 2026 example.',
 E'## Cadence\nRegular Greens Committee meetings; document within Greens OS.\n\n## Typical agenda (May 2026)\n1. Chair update\n2. Minutes (Mike Zehr continues as minutes taker)\n3. Board update (~5 min, Stacey)\n4. Superintendent update\n5. Strategic planning\n6. Family tees\n7. Trees behind #8\n8. Member recommendations\n9. Open discussion\n\n## Scheduling\nJune 2026 meeting moved from June 17 to June 24 (chair work conflict).', 30),

('board-liaison-update-process', 'Board Liaison and Board Update Process', 'procedures',
 'How committee interfaces with the Board.',
 E'## Board updates\nStacey provides a five-minute board update at each Greens Committee meeting.\n\n## Escalation\nItems requiring Board awareness or approval must be flagged in meeting records and board prep.', 40),

('superintendent-coordination', 'Superintendent Coordination', 'procedures',
 'Working with course leadership.',
 E'## Standing item\nSuperintendent update on each agenda.\n\n## Committee role\nTranslate agronomic priorities into strategic, capital, and tree programs; document follow-ups as actions.', 50),

('strategic-plan-governance', 'Strategic Plan Governance', 'strategic_continuity',
 'Approval path and town halls.',
 E'## 2026 process\nPresent plan to Greens Committee, collect notes, return to strategic planning committee, Board approval in fall, town halls before annual meeting.\n\n## Governance\nTier priorities and status live in Greens OS; chair affirms at transitions.', 60),

('ted-robinson-design-restoration', 'Ted Robinson Design Intent and Restoration Philosophy', 'standards',
 'Design intent for all projects.',
 E'## Design intent\nSympathetic restoration of original Ted Robinson character while improving strategy, shot value, playability, maintenance, and sustainability.\n\n## USGA alignment (2019)\nSupports forward tees, pace/fun, bunker sand testing, irrigation upgrades, green surrounds, OM testing, fairway vertical mowing.', 70),

('tree-management-philosophy', 'Tree Management Philosophy', 'standards',
 'Removal criteria and approvals.',
 E'## Program goals\nIdentify trees that are dead, impact airflow, impact sunlight, or warrant replacement/replanting.\n\n## Approvals\nNon-dead removals go through Greens Committee with Board awareness/approval as appropriate.\n\n## Example topics\nTrees behind #8; corridor and shade impacts per hole.', 80),

('forward-family-tee-philosophy', 'Forward/Family Tee Philosophy', 'standards',
 'Forward tees, kids markers, pace, fun.',
 E'## Goals\nSupport juniors, aging players, pace of play, and fun (USGA 2019 supports forward tees).\n\n## Scorecard\nScorecard viewed as chaotic — review for clarity.\n\n## Flags\nRed/gray tournament flags difficult to see — avoid during member play.', 90),

('capital-equipment-planning', 'Capital and Equipment Planning', 'procedures',
 'Equipment and multi-year capital.',
 E'## Planning\nCapital items tracked in Greens OS with board status and priority.\n\n## USGA themes\nIrrigation upgrades, maintenance equipment, testing programs as justified.', 100),

('bunker-program-sand-strategy', 'Bunker Program and Sand Strategy', 'procedures',
 'Recurring sand quality and specific bunkers.',
 E'## Concern\nBunker sand is a recurring member and playability topic.\n\n## Specific mentions\n#10 fairway bunker; left greenside bunker on #2.\n\n## Process\nSand testing and USGA-informed bunker program.', 110),

('irrigation-water-management', 'Irrigation and Water Management Constraints', 'procedures',
 'Water use and system upgrades.',
 E'## Constraints\nDocument irrigation limitations and upgrade scope from USGA review and superintendent input.\n\n## Upgrades\nAlign capital planning with irrigation improvement recommendations.', 120),

('member-communication-standards', 'Member Communication Standards', 'procedures',
 'Education, newsletter, course care.',
 E'## Education topics\nBall marks, cup damage, bunker raking, general course care.\n\n## Channels\nSocial and newsletter communication; town halls before annual meeting on strategic plan.\n\n## Tone\nClear, factual updates on work in progress.', 130),

('committee-member-onboarding', 'Committee Member Onboarding', 'onboarding',
 'Formal onboarding for new members.',
 E'## Committee direction\nFormalize onboarding (Lucinda departure created open seat; Ally expressed interest and was generally supported).\n\n## New member\nRead Bible sections, review open actions, attend meetings, Greens OS access.', 140),

('committee-member-offboarding', 'Committee Member Offboarding', 'offboarding',
 'Handoff when members step down.',
 E'## Process\nReassign actions, archive notes into meetings, brief successor on open topics.', 150),

('chair-succession-plan', 'Chair Succession Plan', 'transition',
 'Chair transition and handoff.',
 E'## Direction\nFormalize chair succession alongside member onboarding/offboarding.\n\n## Record\nUse Chair transition in Greens OS with handoff summary and open board items.', 160),

('annual-planning-calendar', 'Annual Planning Calendar', 'strategic_continuity',
 'Year rhythm for committee and Board.',
 E'## Fall\nBoard approval target for strategic plan; town halls before annual meeting.\n\n## Ongoing\nMonthly committee meetings; annual strategic review with Board.', 170),

('historical-decisions-rationale', 'Historical Decisions and Rationale', 'archive',
 'Why decisions were made.',
 E'## Archive\nStore institutional decisions with rationale and links to meetings.\n\n## Use\nTimeline and Related History for topic continuity; this section summarizes enduring policy choices.', 180)
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  summary = excluded.summary,
  body = excluded.body,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into institutional_decisions (title, decision_date, category, rationale, governance_section_slug) values
('Ryan chair effective May 2026', '2026-05-01', 'governance', 'Ryan became Greens Committee Chair.', 'chair-role-expectations'),
('Mike Zehr continues meeting minutes', '2026-05-01', 'operations', 'Mike Zehr agreed to continue taking meeting minutes.', 'meeting-cadence-agenda-structure'),
('Stacey five-minute board update each meeting', '2026-05-01', 'board', 'Stacey agreed to provide a 5-minute board update at each meeting.', 'board-liaison-update-process'),
('June meeting rescheduled to June 24', '2026-06-24', 'scheduling', 'Next meeting moved from June 17 to June 24 due to Ryan work conflict.', 'meeting-cadence-agenda-structure'),
('Formalize onboarding offboarding succession', '2026-05-01', 'governance', 'Committee should formalize onboarding/offboarding and chair succession.', 'chair-succession-plan'),
('Open seat after Lucinda; Ally supported', '2026-05-01', 'membership', 'Lucinda departed; Ally expressed interest and was generally supported for committee participation.', 'committee-member-onboarding')
;
