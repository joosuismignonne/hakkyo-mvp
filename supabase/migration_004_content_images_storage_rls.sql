-- Fix content-images Storage RLS (anon + authenticated + public role)

insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do update set public = true;

-- Replace role-specific policies with public role (all Supabase API roles)
drop policy if exists "content images public read" on storage.objects;
drop policy if exists "content images anon insert" on storage.objects;
drop policy if exists "content images anon update" on storage.objects;
drop policy if exists "content images anon delete" on storage.objects;
drop policy if exists "content images authenticated insert" on storage.objects;
drop policy if exists "content images authenticated update" on storage.objects;
drop policy if exists "content images authenticated delete" on storage.objects;
drop policy if exists "content images public insert" on storage.objects;
drop policy if exists "content images public update" on storage.objects;
drop policy if exists "content images public delete" on storage.objects;

create policy "content images public read"
  on storage.objects for select
  to public
  using (bucket_id = 'content-images');

create policy "content images public insert"
  on storage.objects for insert
  to public
  with check (bucket_id = 'content-images');

create policy "content images public update"
  on storage.objects for update
  to public
  using (bucket_id = 'content-images')
  with check (bucket_id = 'content-images');

create policy "content images public delete"
  on storage.objects for delete
  to public
  using (bucket_id = 'content-images');
