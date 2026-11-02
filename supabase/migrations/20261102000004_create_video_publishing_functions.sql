-- Migration: 20261102000004_create_video_publishing_functions.sql
-- Description: RPC functions to publish and unpublish videos securely

-- 1. publish_video RPC
create or replace function public.publish_video(p_video_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid;
  v_video record;
begin
  -- Get authenticated user
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Autentikasi diperlukan untuk mempublikasikan video.';
  end if;

  -- Find video and check ownership
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

  if v_video.storage_path is null then
    raise exception 'Video belum memiliki berkas media yang diunggah.';
  end if;

  if v_video.duration_seconds is null or v_video.duration_seconds < 1 or v_video.duration_seconds > 180 then
    raise exception 'Durasi video tidak valid. Video harus antara 1 sampai 180 detik.';
  end if;

  -- Update status to published atomically
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

-- 2. unpublish_video RPC
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
  -- Get authenticated user
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Autentikasi diperlukan.';
  end if;

  -- Find video and check ownership
  select * into v_video
  from public.videos
  where id = p_video_id
    and deleted_at is null;

  if not found then
    raise exception 'Video tidak ditemukan.';
  end if;

  if v_video.creator_id <> v_user_id then
    raise exception 'Anda tidak memiliki hak untuk mengubah status video ini.';
  end if;

  -- Revert status to draft
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
