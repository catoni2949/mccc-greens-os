alter table governance_sections enable row level security;
alter table chair_transitions enable row level security;
alter table governance_checklist_items enable row level security;

create policy "authenticated_select_governance_sections"
on governance_sections for select to authenticated using (true);
create policy "authenticated_insert_governance_sections"
on governance_sections for insert to authenticated with check (true);
create policy "authenticated_update_governance_sections"
on governance_sections for update to authenticated using (true) with check (true);
create policy "authenticated_delete_governance_sections"
on governance_sections for delete to authenticated using (true);

create policy "authenticated_select_chair_transitions"
on chair_transitions for select to authenticated using (true);
create policy "authenticated_insert_chair_transitions"
on chair_transitions for insert to authenticated with check (true);
create policy "authenticated_update_chair_transitions"
on chair_transitions for update to authenticated using (true) with check (true);
create policy "authenticated_delete_chair_transitions"
on chair_transitions for delete to authenticated using (true);

create policy "authenticated_select_governance_checklist_items"
on governance_checklist_items for select to authenticated using (true);
create policy "authenticated_insert_governance_checklist_items"
on governance_checklist_items for insert to authenticated with check (true);
create policy "authenticated_update_governance_checklist_items"
on governance_checklist_items for update to authenticated using (true) with check (true);
create policy "authenticated_delete_governance_checklist_items"
on governance_checklist_items for delete to authenticated using (true);
