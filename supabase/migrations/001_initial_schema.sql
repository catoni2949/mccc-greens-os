-- Enable uuid and moddatetime extensions
create extension if not exists "uuid-ossp";
create extension if not exists moddatetime;

-- PROFILES
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  email text,
  role text not null default 'committee',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- MEETINGS
create table meetings (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  meeting_type text not null default 'Greens Committee',
  meeting_date date,
  start_time time,
  status text not null default 'Scheduled',
  attendees text,
  agenda text,
  raw_transcript text,
  summary text,
  decisions text,
  notes text,
  next_meeting_date date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- STRATEGIC PROJECTS (before action_items — FK dependency)
create table strategic_projects (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  hole_or_area text,
  category text,
  status text not null default 'Concept',
  priority_tier text,
  strategic_rationale text,
  estimated_cost_class text,
  labor_type text,
  disruption_level text,
  member_visibility text,
  board_status text,
  membership_status text,
  dependencies text,
  source_meeting_id uuid references meetings(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ACTION ITEMS
create table action_items (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  owner text,
  status text not null default 'Open',
  priority text not null default 'Medium',
  category text,
  due_date date,
  hole_or_area text,
  source_meeting_id uuid references meetings(id) on delete set null,
  linked_project_id uuid references strategic_projects(id) on delete set null,
  board_relevance boolean not null default false,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- TREE ITEMS
create table tree_items (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  hole_or_area text,
  tree_type text,
  issue text,
  rationale text,
  turf_impact text,
  tree_health_impact text,
  safety_impact text,
  shot_value_impact text,
  permit_status text not null default 'Not Required',
  committee_status text not null default 'Open',
  board_status text not null default 'Not Required',
  target_season text,
  linked_project_id uuid references strategic_projects(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CAPITAL ITEMS
create table capital_items (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  item_type text,
  estimated_cost numeric,
  target_year integer,
  target_season text,
  priority text not null default 'Medium',
  status text not null default 'Under Review',
  owner text,
  funding_notes text,
  board_status text,
  linked_project_id uuid references strategic_projects(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- FILES (polymorphic — MVP: linked_type always 'meeting')
create table files (
  id uuid primary key default uuid_generate_v4(),
  file_name text not null,
  file_url text not null,
  file_type text,
  bucket_path text,
  linked_type text not null default 'meeting',
  linked_id uuid,
  notes text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- COMMITTEE MEMBERS
create table committee_members (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  role text,
  status text not null default 'Active',
  email text,
  phone text,
  notes text,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- MEMBER FEEDBACK
create table member_feedback (
  id uuid primary key default uuid_generate_v4(),
  topic text not null,
  category text,
  feedback_text text,
  source text,
  status text not null default 'Open',
  owner text,
  linked_project_id uuid references strategic_projects(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- UPDATED_AT TRIGGERS
create trigger handle_updated_at before update on profiles
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on meetings
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on action_items
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on strategic_projects
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on tree_items
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on capital_items
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on files
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on committee_members
  for each row execute procedure moddatetime(updated_at);

create trigger handle_updated_at before update on member_feedback
  for each row execute procedure moddatetime(updated_at);

-- PROFILE AUTO-CREATE on auth signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
