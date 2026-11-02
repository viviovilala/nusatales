-- Migration: 20261102000007_add_content_type_and_dual_format_support.sql
-- Description: Add dual-format content support ('animation' and 'reel'), conditional duration constraints,
-- backfill strategy for legacy videos, indexes for animation catalog, and updated publish_video RPC.

-- ============================================================================
-- 1. ADD content_type COLUMN & VALIDATION
-- ============================================================================

-- Add content_type column with default 'reel'
alter table public.videos
add column if not exists content_type text not null default 'reel';

-- Add check constraint for valid content types
alter table public.videos
drop constraint if exists video_content_type_check;

alter table public.videos
add constraint video_content_type_check
check (content_type in ('animation', 'reel'));

-- ============================================================================
-- 2. BACKFILL STRATEGY FOR EXISTING VIDEOS
-- Evidence: All existing test records in database have duration 15-16s uploaded
-- during the Reels MVP slice testing phase.
-- ============================================================================

update public.videos
set content_type = 'reel'
where content_type is null or content_type not in ('animation', 'reel');

-- ============================================================================
-- 3. CONDITIONAL DURATION CONSTRAINTS
-- Reels: 1 - 180 seconds
-- Animations: >= 1 second (no 180s limitation, supports long films/episodes)
-- ============================================================================

-- Drop old static 180s duration check constraint
alter table public.videos
drop constraint if exists videos_duration_seconds_check;

alter table public.videos
drop constraint if exists valid_content_duration;

alter table public.videos
add constraint valid_content_duration check (
  duration_seconds is null
  or (content_type = 'reel' and duration_seconds between 1 and 180)
  or (content_type = 'animation' and duration_seconds >= 1)
);

-- Drop and replace published_requires_media constraint
alter table public.videos
drop constraint if exists published_requires_media;

alter table public.videos
add constraint published_requires_media check (
  status <> 'published'
  or (
    storage_path is not null
    and published_at is not null
    and (
      (content_type = 'reel' and duration_seconds between 1 and 180)
      or (content_type = 'animation' and duration_seconds >= 1)
    )
  )
);

-- ============================================================================
-- 4. OPTIMIZED INDEXES FOR DUAL-FORMAT CONTENT
-- ============================================================================

-- Animation catalog index
create index if not exists videos_animation_catalog_idx
on public.videos (published_at desc, id desc)
where status = 'published' and content_type = 'animation' and deleted_at is null;

-- Reels feed index
drop index if exists videos_feed_idx;
create index videos_feed_idx
on public.videos (published_at desc, id desc)
where status = 'published' and content_type = 'reel' and deleted_at is null;

-- Studio multi-format index
create index if not exists videos_studio_content_type_idx
on public.videos (creator_id, content_type, created_at desc);

-- ============================================================================
-- 5. UPDATE publish_video RPC TO RESPECT DUAL-FORMAT CONSTRAINTS
-- ============================================================================

create or replace function public.publish_video(p_video_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, storage, pg_temp
as $$
declare
  v_user_id uuid;
  v_video record;
  v_expected_prefix text;
  v_file_exists boolean;
begin
  -- 1. Ensure user is authenticated
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Autentikasi diperlukan untuk mempublikasikan video.';
  end if;

  -- 2. Find video and verify ownership
  select * into v_video
  from public.videos
  where id = p_video_id
    and deleted_at is null;

  if not found then
    raise exception 'Video tidak ditemukan atau telah dihapus.';
  end if;

  if v_video.creator_id <> v_user_id then
    raise exception 'Anda tidak memiliki hak untuk mempublikasikan video ini.';
  end if;

  -- 3. Idempotent: return success if already published
  if v_video.status = 'published' then
    return jsonb_build_object(
      'success', true,
      'id', p_video_id,
      'status', 'published',
      'content_type', v_video.content_type,
      'message', 'Video sudah terpublikasi.'
    );
  end if;

  -- 4. Check storage_path presence & prefix pattern
  if v_video.storage_path is null or length(trim(v_video.storage_path)) = 0 then
    raise exception 'Video belum memiliki berkas media yang diunggah.';
  end if;

  v_expected_prefix := v_user_id::text || '/' || p_video_id::text || '/';
  if not (v_video.storage_path like v_expected_prefix || '%') then
    raise exception 'Jalur penyimpanan berkas media tidak valid atau bukan milik kreator.';
  end if;

  -- 5. Verify physical media object exists in Supabase Storage 'videos' bucket
  select exists (
    select 1 from storage.objects
    where bucket_id = 'videos'
      and name = v_video.storage_path
  ) into v_file_exists;

  if not v_file_exists then
    raise exception 'Berkas media video belum terunggah ke penyimpanan cloud.';
  end if;

  -- 6. Validate duration according to content_type
  if v_video.content_type = 'reel' then
    if v_video.duration_seconds is null or v_video.duration_seconds < 1 or v_video.duration_seconds > 180 then
      raise exception 'Durasi Reel tidak valid. Video pendek harus antara 1 sampai 180 detik.';
    end if;
  elsif v_video.content_type = 'animation' then
    if v_video.duration_seconds is null or v_video.duration_seconds < 1 then
      raise exception 'Durasi Animasi tidak valid. Durasi minimal adalah 1 detik.';
    end if;
  end if;

  -- 7. Atomically set status to published with workflow flag
  perform set_config('nusatales.in_publish_workflow', 'true', true);

  update public.videos
  set
    status = 'published',
    published_at = coalesce(published_at, now()),
    updated_at = now()
  where id = p_video_id;

  return jsonb_build_object(
    'success', true,
    'id', p_video_id,
    'status', 'published',
    'content_type', v_video.content_type
  );
end;
$$;

revoke all on function public.publish_video(uuid) from public;
grant execute on function public.publish_video(uuid) to authenticated;
