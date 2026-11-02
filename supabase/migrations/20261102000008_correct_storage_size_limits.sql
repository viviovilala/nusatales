-- Migration: 20261102000008_correct_storage_size_limits.sql
-- Description: Enforce conservative 50 MB maximum upload limit for videos bucket (aligned with Supabase Free Tier),
-- maintain 5 MB thumbnail limit, and document project-level constraints.

-- 1. Update bucket 'videos' to 50 MB (50,000,000 bytes)
update storage.buckets
set
  file_size_limit = 50000000, -- 50 MB
  allowed_mime_types = array['video/mp4', 'video/webm', 'video/quicktime'],
  public = false
where id = 'videos';

-- Ensure bucket exists with 50 MB limit if not already created
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  false,
  50000000,
  array['video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update set
  file_size_limit = 50000000,
  allowed_mime_types = array['video/mp4', 'video/webm', 'video/quicktime'],
  public = false;

-- 2. Update bucket 'thumbnails' for covers & avatars (5 MB)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thumbnails',
  'thumbnails',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'],
  public = true;

-- Note for existing files:
-- Any pre-existing objects in storage will remain intact and readable according to RLS policies.
-- However, all incoming uploads through Storage API / TUS exceeding 50 MB will be rejected with:
-- 400 Bad Request: "The object exceeded the maximum allowed size".
