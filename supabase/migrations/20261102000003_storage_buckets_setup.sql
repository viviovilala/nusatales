-- Migration: 20261102000003_storage_buckets_setup.sql
-- Description: Provision storage buckets and access policies for avatars, thumbnails, and videos

-- 1. Create buckets if they do not exist
-- 'thumbnails' is public for avatars & video covers
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thumbnails',
  'thumbnails',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- 'videos' is private for video media files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  false,
  104857600, -- 100 MB
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 104857600,
  allowed_mime_types = array['video/mp4', 'video/webm', 'video/quicktime'];

-- 2. Storage Policies for 'thumbnails' bucket (Public view, owner write)
drop policy if exists "Public thumbnails read" on storage.objects;
create policy "Public thumbnails read"
on storage.objects for select
using (bucket_id = 'thumbnails');

drop policy if exists "Authenticated users can upload own thumbnails/avatars" on storage.objects;
create policy "Authenticated users can upload own thumbnails/avatars"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'thumbnails'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update their own thumbnails/avatars" on storage.objects;
create policy "Users can update their own thumbnails/avatars"
on storage.objects for update
to authenticated
using (
  bucket_id = 'thumbnails'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete their own thumbnails/avatars" on storage.objects;
create policy "Users can delete their own thumbnails/avatars"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'thumbnails'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Storage Policies for 'videos' bucket (Private, owner upload/manage, signed URL read)
drop policy if exists "Authenticated users can upload own videos" on storage.objects;
create policy "Authenticated users can upload own videos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners can view own video objects" on storage.objects;
create policy "Owners can view own video objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners can update own video objects" on storage.objects;
create policy "Owners can update own video objects"
on storage.objects for update
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Owners can delete own video objects" on storage.objects;
create policy "Owners can delete own video objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
