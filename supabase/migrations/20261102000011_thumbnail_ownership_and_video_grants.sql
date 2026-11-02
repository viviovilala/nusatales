-- Apply AFTER 000010, in the same deployment as the signed-image client.
-- Existing invalid references are not rewritten: the read policies below fail
-- closed, and subsequent writes must satisfy the ownership constraints.
begin;

alter table public.videos
  add constraint videos_media_owned_path check (
    storage_path is null or storage_path ~
      ('^' || creator_id::text || '/' || id::text || '/[^/]+$')
  ) not valid,
  add constraint videos_thumbnail_owned_path check (
    thumbnail_path is null or thumbnail_path ~
      ('^' || creator_id::text || '/' || id::text || '/[^/]+$')
  ) not valid;

create or replace function public.trg_enforce_video_security()
returns trigger language plpgsql security definer
set search_path = public, auth, storage, pg_temp
as $$
declare
  v_workflow boolean := coalesce(current_setting('nusatales.in_publish_workflow', true), '') = 'true';
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' or new.published_at is not null or new.deleted_at is not null then
      raise exception using errcode = '42501', message = 'Video baru harus berupa draf.';
    end if;
  else
    if new.id is distinct from old.id or new.creator_id is distinct from old.creator_id
       or new.content_type is distinct from old.content_type
       or new.created_at is distinct from old.created_at then
      raise exception using errcode = '42501', message = 'Identitas dan tipe video tidak dapat diubah.';
    end if;
    if not v_workflow and (
      new.status is distinct from old.status
      or new.published_at is distinct from old.published_at
      or new.deleted_at is distinct from old.deleted_at
    ) then
      raise exception using errcode = '42501', message = 'Gunakan fungsi resmi untuk publikasi dan penghapusan.';
    end if;
    if old.deleted_at is not null then
      raise exception using errcode = '42501', message = 'Video yang dihapus tidak dapat diubah.';
    end if;
    if old.status = 'published' and (
      new.storage_path is distinct from old.storage_path
      or new.duration_seconds is distinct from old.duration_seconds
    ) then
      raise exception using errcode = '42501', message = 'Tarik video ke draf sebelum mengubah media atau durasi.';
    end if;
  end if;

  if new.storage_path is not null and new.storage_path !~
     ('^' || new.creator_id::text || '/' || new.id::text || '/[^/]+$') then
    raise exception using errcode = '42501', message = 'Jalur media bukan milik kreator dan video ini.';
  end if;
  if new.thumbnail_path is not null then
    if new.thumbnail_path !~ ('^' || new.creator_id::text || '/' || new.id::text || '/[^/]+$') then
      raise exception using errcode = '42501', message = 'Jalur thumbnail bukan milik kreator dan video ini.';
    end if;
    if tg_op = 'INSERT' or new.thumbnail_path is distinct from old.thumbnail_path
       or (new.status = 'published' and old.status is distinct from 'published') then
      if not exists (select 1 from storage.objects o
        where o.bucket_id = 'thumbnails' and o.name = new.thumbnail_path) then
        raise exception using errcode = '23514', message = 'Unggah thumbnail sebelum menyimpan referensinya.';
      end if;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_video_security_check on public.videos;
create trigger trg_video_security_check before insert or update on public.videos
for each row execute function public.trg_enforce_video_security();

-- The RPC remains the only deletion boundary; table DELETE is not granted.
create or replace function public.soft_delete_video(p_video_id uuid)
returns jsonb language plpgsql security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_video public.videos%rowtype;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Autentikasi diperlukan.';
  end if;
  select * into v_video from public.videos
    where id = p_video_id and creator_id = auth.uid() for update;
  if not found then
    raise exception using errcode = '42501', message = 'Video tidak ditemukan atau akses ditolak.';
  end if;
  if v_video.deleted_at is null then
    perform set_config('nusatales.in_publish_workflow', 'true', true);
    update public.videos set deleted_at = now() where id = p_video_id;
    perform set_config('nusatales.in_publish_workflow', 'false', true);
  end if;
  return jsonb_build_object('success', true, 'id', p_video_id, 'deleted', true);
end;
$$;
revoke all on function public.soft_delete_video(uuid) from public, anon;
grant execute on function public.soft_delete_video(uuid) to authenticated;

-- Remove table-wide AND any previously granted column privileges. An UPDATE
-- grant on the whole table would otherwise override a restricted column list.
revoke all on public.videos from public, anon, authenticated;
do $$
declare v_columns text;
begin
  select string_agg(quote_ident(column_name), ', ') into v_columns
    from information_schema.columns where table_schema = 'public' and table_name = 'videos';
  execute format('revoke insert (%s), update (%s), references (%s) on public.videos from public, anon, authenticated',
    v_columns, v_columns, v_columns);
end;
$$;
grant select on public.videos to anon, authenticated;
grant insert (id, creator_id, title, description, content_type) on public.videos to authenticated;
grant update (title, description, storage_path, thumbnail_path, duration_seconds)
  on public.videos to authenticated;

-- Defense in depth: a forged/legacy reference never makes another owner's
-- thumbnail public, even before an invalid row has been corrected.
drop policy if exists "Public thumbnails read" on storage.objects;
drop policy if exists "Public and authenticated can read allowed thumbnails" on storage.objects;
create policy "Public and authenticated can read allowed thumbnails"
on storage.objects for select to anon, authenticated using (
  bucket_id = 'thumbnails' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or name ~ '^[0-9a-f-]{36}/avatar-[^/]+$'
    or exists (
      select 1 from public.videos v where v.thumbnail_path = name
        and name ~ ('^' || v.creator_id::text || '/' || v.id::text || '/[^/]+$')
        and v.status = 'published' and v.deleted_at is null
    )
  )
);

-- Apply the same ownership check to video media references.
drop policy if exists "Public and authenticated can read published video media" on storage.objects;
create policy "Public and authenticated can read published video media"
on storage.objects for select to anon, authenticated using (
  bucket_id = 'videos' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (
      select 1 from public.videos v where v.storage_path = name
        and name ~ ('^' || v.creator_id::text || '/' || v.id::text || '/[^/]+$')
        and v.status = 'published' and v.deleted_at is null
    )
  )
);

-- Explicit destination checks prevent moving objects into another user's folder.
alter policy "Users can update their own thumbnails/avatars" on storage.objects
  with check (bucket_id = 'thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);
alter policy "Owners can update own video objects" on storage.objects
  with check (bucket_id = 'videos' and (storage.foldername(name))[1] = auth.uid()::text);

notify pgrst, 'reload schema';
commit;
