-- Migration: 20261102000009_multi_layered_video_security_and_locking.sql
-- Description: Multi-layered security: row locking in publish_video to prevent race conditions,
-- immutable content_type, strict storage_path locking post-publish, one-way soft-delete, and trusted soft_delete_video RPC.

-- ============================================================================
-- 1. HARDENED TRIGGER: IMMUTABLE CONTENT_TYPE & MULTI-LAYER INTEGRITY
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
  -- A. Prevent alteration of video owner (creator_id is immutable)
  if new.creator_id <> old.creator_id then
    raise exception 'Kolom creator_id tidak dapat diubah setelah dibuat.';
  end if;

  -- B. Immutable content_type: Once draft is created as 'animation' or 'reel', it cannot be mutated
  if new.content_type <> old.content_type then
    raise exception 'Tipe konten (animation/reel) bersifat permanen dan tidak dapat diubah setelah draf dibuat.';
  end if;

  -- Read trusted publish workflow flag
  v_in_workflow := nullif(current_setting('nusatales.in_publish_workflow', true), '');

  -- C. Prevent direct manipulation of status outside trusted RPCs
  if new.status <> old.status and (v_in_workflow is null or v_in_workflow <> 'true') then
    raise exception 'Status publikasi video hanya dapat diubah melalui fungsi resmi publish_video atau unpublish_video.';
  end if;

  -- D. Prevent direct manipulation of published_at outside trusted RPCs
  if (new.published_at is distinct from old.published_at) and (v_in_workflow is null or v_in_workflow <> 'true') then
    raise exception 'Kolom published_at dikendalikan oleh sistem publikasi.';
  end if;

  -- E. Storage path integrity:
  -- Cannot change storage_path once video is already published
  if old.status = 'published' and new.storage_path is distinct from old.storage_path then
    raise exception 'Berkas media video yang telah dipublikasikan tidak dapat diubah.';
  end if;

  -- Format validation: must match {creator_id}/{video_id}/%
  if new.storage_path is not null then
    if not (new.storage_path like (old.creator_id::text || '/' || old.id::text || '/%')) then
      raise exception 'Format storage_path harus diawali dengan {creator_id}/{video_id}/';
    end if;
  end if;

  -- F. One-way soft delete: once deleted_at is set, client cannot unset it via direct update
  if old.deleted_at is not null and new.deleted_at is null then
    raise exception 'Video yang telah dihapus tidak dapat dipulihkan melalui pembaruan langsung.';
  end if;

  -- Auto-update timestamp
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
-- 2. HARDENED publish_video RPC WITH FOR UPDATE ROW LOCKING
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

  -- 2. Find video and acquire row-level lock (FOR UPDATE) to prevent concurrent publish races
  select * into v_video
  from public.videos
  where id = p_video_id
    and deleted_at is null
  for update;

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
  else
    raise exception 'Tipe konten video tidak valid.';
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

-- ============================================================================
-- 3. TRUSTED RPC: soft_delete_video
-- ============================================================================

create or replace function public.soft_delete_video(p_video_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Autentikasi diperlukan.';
  end if;

  update public.videos
  set
    deleted_at = now(),
    updated_at = now()
  where id = p_video_id
    and creator_id = v_user_id
    and deleted_at is null;

  if not found then
    raise exception 'Video tidak ditemukan atau Anda tidak memiliki akses.';
  end if;

  return jsonb_build_object(
    'success', true,
    'id', p_video_id,
    'deleted', true
  );
end;
$$;

revoke all on function public.soft_delete_video(uuid) from public;
grant execute on function public.soft_delete_video(uuid) to authenticated;
