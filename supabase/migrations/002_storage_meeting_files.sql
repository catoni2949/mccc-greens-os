-- Meeting file uploads (Supabase Storage)
insert into storage.buckets (id, name, public)
values ('meeting-files', 'meeting-files', true)
on conflict (id) do nothing;

create policy "meeting_files_select"
on storage.objects for select
to authenticated
using (bucket_id = 'meeting-files');

create policy "meeting_files_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'meeting-files');

create policy "meeting_files_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'meeting-files');
