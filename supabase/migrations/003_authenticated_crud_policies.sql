-- MVP: broad authenticated CRUD on operational tables.
-- Tighten per-role / per-committee policies before production.

-- meetings
create policy "authenticated_insert_meetings"
on meetings for insert to authenticated with check (true);

create policy "authenticated_update_meetings"
on meetings for update to authenticated using (true) with check (true);

create policy "authenticated_delete_meetings"
on meetings for delete to authenticated using (true);

-- action_items
create policy "authenticated_insert_action_items"
on action_items for insert to authenticated with check (true);

create policy "authenticated_update_action_items"
on action_items for update to authenticated using (true) with check (true);

create policy "authenticated_delete_action_items"
on action_items for delete to authenticated using (true);

-- strategic_projects
create policy "authenticated_insert_strategic_projects"
on strategic_projects for insert to authenticated with check (true);

create policy "authenticated_update_strategic_projects"
on strategic_projects for update to authenticated using (true) with check (true);

create policy "authenticated_delete_strategic_projects"
on strategic_projects for delete to authenticated using (true);

-- tree_items
create policy "authenticated_insert_tree_items"
on tree_items for insert to authenticated with check (true);

create policy "authenticated_update_tree_items"
on tree_items for update to authenticated using (true) with check (true);

create policy "authenticated_delete_tree_items"
on tree_items for delete to authenticated using (true);

-- capital_items
create policy "authenticated_insert_capital_items"
on capital_items for insert to authenticated with check (true);

create policy "authenticated_update_capital_items"
on capital_items for update to authenticated using (true) with check (true);

create policy "authenticated_delete_capital_items"
on capital_items for delete to authenticated using (true);

-- committee_members
create policy "authenticated_insert_committee_members"
on committee_members for insert to authenticated with check (true);

create policy "authenticated_update_committee_members"
on committee_members for update to authenticated using (true) with check (true);

create policy "authenticated_delete_committee_members"
on committee_members for delete to authenticated using (true);

-- member_feedback
create policy "authenticated_insert_member_feedback"
on member_feedback for insert to authenticated with check (true);

create policy "authenticated_update_member_feedback"
on member_feedback for update to authenticated using (true) with check (true);

create policy "authenticated_delete_member_feedback"
on member_feedback for delete to authenticated using (true);

-- files
create policy "authenticated_insert_files"
on files for insert to authenticated with check (true);

create policy "authenticated_update_files"
on files for update to authenticated using (true) with check (true);

create policy "authenticated_delete_files"
on files for delete to authenticated using (true);
