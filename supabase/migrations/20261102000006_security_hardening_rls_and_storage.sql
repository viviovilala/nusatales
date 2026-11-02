-- Migration: 20261102000006_security_hardening_rls_and_storage.sql
-- Description: Security hardening for videos table RLS, column protection, trusted publish/unpublish RPCs,
-- storage playback policies for anonymous/public users, and interaction constraints.

-- ============================================================================
-- 1. DATABASE TRIGGER: COLUMN INTEGRITY ON public.videos
-- Protect sensitive columns (status, creator_id, published_at, storage_path)
-- ============================================================================

create or replace function public.trg_enforce_video_security()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_in_workflow text;
begin
  -- A. Prevent alteration of video owner
  if new.creator_id <> old.creator_id then
    raise exception 'Kolom creator_id tidak dapat diubah setelah dibuat.';
  end if;

  -- Read trusted publish workflow flag
  v_in_workflow := nullif(current_setting('nusatales.in_publish_workflow', true), '');

  -- B. Prevent direct manipulation of status outside trusted RPCs
  if new.status <> old.status and (v_in_workflow is null or v_in_workflow <> 'true') then
    raise exception 'Status publikasi video hanya dapat diubah melalui fungsi resmi publish_video atau unpublish_video.';
  end if;

  -- C. Prevent direct manipulation of published_at outside trusted RPCs
  if (new.published_at is distinct from old.published_at) and (v_in_workflow is null or v_in_workflow <> 'true') then
    raise exception 'Kolom published_at dikendalikan oleh sistem publikasi.';
  end if;

  -- D. Validate storage_path format if provided or changed
  if new.storage_path is not null then
    if not (new.storage_path like (old.creator_id::text || '/' || old.id::text || '/%')) then
      raise exception 'Format storage_path harus diawali dengan {creator_id}/{video_id}/';
    end if;
  end if;

  -- E. Auto-update timestamp
  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists trg_video_security_check on public.videos;
create trigger trg_video_security_check
before update on public.videos
for each row
execute function public.trg_enforce_video_security();

-- ============================================================================
-- 2. HARDENED RPC: publish_video
-- Verifies auth, ownership, storage object presence, path structure, and duration.
-- Idempotent and atomic.
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

  -- 6. Validate duration (1 - 180 seconds)
  if v_video.duration_seconds is null or v_video.duration_seconds < 1 or v_video.duration_seconds > 180 then
    raise exception 'Durasi video tidak valid. Video harus antara 1 sampai 180 detik.';
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
    'status', 'published'
  );
end;
$$;

revoke all on function public.publish_video(uuid) from public;
grant execute on function public.publish_video(uuid) to authenticated;

-- ============================================================================
-- 3. HARDENED RPC: unpublish_video
-- Idempotent, ownership-verified reversal to draft.
-- ============================================================================

create or replace function public.unpublish_video(p_video_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid;
  v_video record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Autentikasi diperlukan.';
  end if;

  select * into v_video
  from public.videos
  where id = p_video_id
    and deleted_at is null;

  if not found then
    raise exception 'Video tidak ditemukan atau telah dihapus.';
  end if;

  if v_video.creator_id <> v_user_id then
    raise exception 'Anda tidak memiliki hak untuk mengubah status video ini.';
  end if;

  if v_video.status = 'draft' then
    return jsonb_build_object(
      'success', true,
      'id', p_video_id,
      'status', 'draft',
      'message', 'Video sudah dalam status draf.'
    );
  end if;

  perform set_config('nusatales.in_publish_workflow', 'true', true);

  update public.videos
  set
    status = 'draft',
    published_at = null,
    updated_at = now()
  where id = p_video_id;

  return jsonb_build_object(
    'success', true,
    'id', p_video_id,
    'status', 'draft'
  );
end;
$$;

revoke all on function public.unpublish_video(uuid) from public;
grant execute on function public.unpublish_video(uuid) to authenticated;

-- ============================================================================
-- 4. STORAGE ACCESS POLICY FOR 'videos' BUCKET
-- Allow anonymous & authenticated read for published non-deleted videos,
-- while retaining owner read/write for drafts and uploads.
-- ============================================================================

-- Drop restrictive owner-only view policy
drop policy if exists "Owners can view own video objects" on storage.objects;
drop policy if exists "Public and authenticated can read published video media" on storage.objects;

create policy "Public and authenticated can read published video media"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'videos'
  and (
    -- Video creator can always view their own uploaded objects
    (storage.foldername(name))[1] = auth.uid()::text
    -- OR any viewer can view media referenced by a published, non-deleted video
    or exists (
      select 1 from public.videos v
      where v.storage_path = name
        and v.status = 'published'
        and v.deleted_at is null
    )
  )
);

-- ============================================================================
-- 5. INTERACTIONS HARDENING: LIKES & COMMENTS ONLY FOR PUBLISHED VIDEOS
-- ============================================================================

-- Like insertion policy
drop policy if exists "Users can like a video" on public.video_likes;
create policy "Users can like a video"
on public.video_likes for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.videos v
    where v.id = video_id
      and v.status = 'published'
      and v.deleted_at is null
  )
);

-- Comment insertion policy
drop policy if exists "Authenticated users can post comments" on public.video_comments;
create policy "Authenticated users can post comments"
on public.video_comments for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.videos v
    where v.id = video_id
      and v.status = 'published'
      and v.deleted_at is null
  )
);
