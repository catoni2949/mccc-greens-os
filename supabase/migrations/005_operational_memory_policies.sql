-- MVP authenticated CRUD for operational memory tables (tighten later).

alter table meeting_topics enable row level security;
alter table discussion_mentions enable row level security;
alter table entity_links enable row level security;

create policy "authenticated_select_meeting_topics"
on meeting_topics for select to authenticated using (true);

create policy "authenticated_insert_meeting_topics"
on meeting_topics for insert to authenticated with check (true);

create policy "authenticated_update_meeting_topics"
on meeting_topics for update to authenticated using (true) with check (true);

create policy "authenticated_delete_meeting_topics"
on meeting_topics for delete to authenticated using (true);

create policy "authenticated_select_discussion_mentions"
on discussion_mentions for select to authenticated using (true);

create policy "authenticated_insert_discussion_mentions"
on discussion_mentions for insert to authenticated with check (true);

create policy "authenticated_update_discussion_mentions"
on discussion_mentions for update to authenticated using (true) with check (true);

create policy "authenticated_delete_discussion_mentions"
on discussion_mentions for delete to authenticated using (true);

create policy "authenticated_select_entity_links"
on entity_links for select to authenticated using (true);

create policy "authenticated_insert_entity_links"
on entity_links for insert to authenticated with check (true);

create policy "authenticated_update_entity_links"
on entity_links for update to authenticated using (true) with check (true);

create policy "authenticated_delete_entity_links"
on entity_links for delete to authenticated using (true);
