-- Governance & Continuity — institutional layer (Committee Bible, transitions, onboarding)

create table governance_sections (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  category text not null,
  summary text,
  body text not null default '',
  sort_order integer not null default 0,
  version_label text default '1.0',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index governance_sections_category_idx on governance_sections(category, sort_order);

create table chair_transitions (
  id uuid primary key default uuid_generate_v4(),
  outgoing_chair text,
  incoming_chair text not null,
  effective_date date,
  handoff_summary text,
  handoff_notes text,
  source_meeting_id uuid references meetings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table governance_checklist_items (
  id uuid primary key default uuid_generate_v4(),
  checklist_type text not null,
  title text not null,
  description text,
  sort_order integer not null default 0,
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger handle_updated_at before update on governance_sections
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on chair_transitions
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on governance_checklist_items
  for each row execute procedure moddatetime(updated_at);

comment on table governance_sections is 'Greens Committee Bible — standards, procedures, continuity chapters';
comment on table chair_transitions is 'Chair succession and handoff record';
comment on table governance_checklist_items is 'Onboarding/offboarding/transition checklists';
