-- Governance intelligence synthesis layer

alter table governance_sections
  add column if not exists synthesized_body text,
  add column if not exists source_count integer not null default 0,
  add column if not exists supporting_meeting_ids jsonb not null default '[]'::jsonb,
  add column if not exists supporting_decision_ids jsonb not null default '[]'::jsonb,
  add column if not exists supporting_quotes jsonb not null default '[]'::jsonb,
  add column if not exists source_grounding jsonb not null default '{}'::jsonb,
  add column if not exists last_synthesized_at timestamptz,
  add column if not exists why_exists text,
  add column if not exists historical_context text,
  add column if not exists risks_if_ignored text,
  add column if not exists history_examples text;

alter table institutional_decisions
  add column if not exists rationale_summary text,
  add column if not exists alternatives_considered text,
  add column if not exists historical_context text,
  add column if not exists expected_outcome text,
  add column if not exists downstream_implications text,
  add column if not exists lessons_learned text,
  add column if not exists related_meeting_ids jsonb not null default '[]'::jsonb,
  add column if not exists last_synthesized_at timestamptz;

create table governance_artifacts (
  artifact_key text primary key,
  title text not null,
  body_markdown text,
  body_json jsonb not null default '{}'::jsonb,
  source_grounding jsonb not null default '{}'::jsonb,
  last_synthesized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger handle_updated_at before update on governance_artifacts
  for each row execute procedure moddatetime(updated_at);

comment on column governance_sections.synthesized_body is 'AI-synthesized institutional doctrine';
comment on table governance_artifacts is 'Committee evolution, chair brief, intelligence snapshots';
