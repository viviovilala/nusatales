-- Migration: 20261102000010_private_video_thumbnails.sql
-- Description: Make 'thumbnails' bucket private to protect unpublished draft covers from public enumeration.
-- Implement granular RLS on storage.objects allowing:
-- 1) Creator access to their own draft thumbnails.
-- 2) Public read access for profile avatars.
-- 3) Public read access for video thumbnails only if referenced by a published, non-deleted video.

-- ============================================================================
-- 1. SET BUCKET TO PRIVATE
-- ============================================================================

update storage.buckets
set public = false
where id = 'thumbnails';

-- In case bucket configuration is refreshed:
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thumbnails',
  'thumbnails',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- ============================================================================
-- 2. REVISE STORAGE RLS POLICIES FOR 'thumbnails' BUCKET
-- ============================================================================

-- Drop overly permissive public read policy from migration 000003
drop policy if exists "Public thumbnails read" on storage.objects;
drop policy if exists "Public and authenticated can read allowed thumbnails" on storage.objects;

-- Create granular selective read policy
create policy "Public and authenticated can read allowed thumbnails"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'thumbnails'
  and (
    -- A. The asset owner / creator can always view their own uploaded items (drafts, covers, avatars)
    (storage.foldername(name))[1] = auth.uid()::text

    -- B. Profile avatar images are public by design
    or name ~ ('^' || (storage.foldername(name))[1] || '/avatar-.*')

    -- C. Video thumbnail covers are public ONLY if referenced by an active, published video
    or exists (
      select 1 from public.videos v
      where v.thumbnail_path = name
        and v.status = 'published'
        and v.deleted_at is null
    )
  )
);
