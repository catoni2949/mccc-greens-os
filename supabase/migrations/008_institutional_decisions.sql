create table institutional_decisions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  decision_date date,
  category text,
  rationale text,
  implementation_notes text,
  board_status text,
  source_meeting_id uuid references meetings(id) on delete set null,
  governance_section_slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index institutional_decisions_slug_idx on institutional_decisions(governance_section_slug);
create index institutional_decisions_date_idx on institutional_decisions(decision_date desc nulls last);

create table governance_section_snapshots (
  id uuid primary key default uuid_generate_v4(),
  section_slug text not null,
  title text not null,
  body_markdown text not null,
  generated_from text,
  created_at timestamptz not null default now()
);

create trigger handle_updated_at before update on institutional_decisions
  for each row execute procedure moddatetime(updated_at);

comment on table institutional_decisions is 'Long-lived committee decisions with rationale';
comment on table governance_section_snapshots is 'Point-in-time Bible content from generate/import';
