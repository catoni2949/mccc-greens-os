alter table institutional_decisions enable row level security;
alter table governance_section_snapshots enable row level security;

create policy "authenticated_select_institutional_decisions"
on institutional_decisions for select to authenticated using (true);
create policy "authenticated_insert_institutional_decisions"
on institutional_decisions for insert to authenticated with check (true);
create policy "authenticated_update_institutional_decisions"
on institutional_decisions for update to authenticated using (true) with check (true);
create policy "authenticated_delete_institutional_decisions"
on institutional_decisions for delete to authenticated using (true);

create policy "authenticated_select_governance_section_snapshots"
on governance_section_snapshots for select to authenticated using (true);
create policy "authenticated_insert_governance_section_snapshots"
on governance_section_snapshots for insert to authenticated with check (true);
create policy "authenticated_update_governance_section_snapshots"
on governance_section_snapshots for update to authenticated using (true) with check (true);
create policy "authenticated_delete_governance_section_snapshots"
on governance_section_snapshots for delete to authenticated using (true);
