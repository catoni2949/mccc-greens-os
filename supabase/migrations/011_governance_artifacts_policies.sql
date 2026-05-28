alter table governance_artifacts enable row level security;

create policy "authenticated_select_governance_artifacts"
on governance_artifacts for select to authenticated using (true);
create policy "authenticated_insert_governance_artifacts"
on governance_artifacts for insert to authenticated with check (true);
create policy "authenticated_update_governance_artifacts"
on governance_artifacts for update to authenticated using (true) with check (true);
create policy "authenticated_delete_governance_artifacts"
on governance_artifacts for delete to authenticated using (true);
