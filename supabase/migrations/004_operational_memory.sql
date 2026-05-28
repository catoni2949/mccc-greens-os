-- Operational memory: topics, mentions, cross-entity links
-- MVP broad access; tighten in production.

create table meeting_topics (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  topic_key text not null,
  topic_label text not null,
  hole_number integer,
  category text,
  board_relevant boolean not null default false,
  resolution_status text not null default 'open',
  first_discussed_at timestamptz not null default now(),
  last_discussed_at timestamptz not null default now(),
  discussion_count integer not null default 1,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (meeting_id, topic_key)
);

create table discussion_mentions (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  mention_key text not null,
  mention_label text not null,
  excerpt text,
  board_relevant boolean not null default false,
  created_at timestamptz not null default now()
);

create index discussion_mentions_meeting_id_idx on discussion_mentions(meeting_id);
create index discussion_mentions_mention_key_idx on discussion_mentions(mention_key);
create index discussion_mentions_entity_idx on discussion_mentions(entity_type, entity_id);

create table entity_links (
  id uuid primary key default uuid_generate_v4(),
  source_type text not null,
  source_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  link_type text not null default 'related',
  strength numeric not null default 0.5,
  created_at timestamptz not null default now()
);

create index entity_links_source_idx on entity_links(source_type, source_id);
create index entity_links_target_idx on entity_links(target_type, target_id);

create trigger handle_updated_at before update on meeting_topics
  for each row execute procedure moddatetime(updated_at);

comment on table meeting_topics is 'Topics/themes discussed per meeting for continuity tracking';
comment on table discussion_mentions is 'Links meeting discussion to entities or search keys';
comment on table entity_links is 'Graph edges between operational records';
