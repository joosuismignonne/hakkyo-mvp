-- Content media columns + public content-images storage bucket

alter table contents add column if not exists category text;
alter table contents add column if not exists thumbnail_url text;
alter table contents add column if not exists image_urls text[] default '{}';
alter table contents add column if not exists video_url text;

alter table contents drop constraint if exists contents_type_check;
alter table contents add constraint contents_type_check
  check (type in ('video', 'text', 'photo', 'image'));

insert into storage.buckets (id, name, public)
values ('content-images', 'content-images', true)
on conflict (id) do update set public = true;

-- Storage policies: see migration_004_content_images_storage_rls.sql
