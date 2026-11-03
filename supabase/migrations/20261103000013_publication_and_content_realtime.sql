-- Apply after 000012, before deploying the matching client.
-- Publishing a work means that another account can actually watch it.
begin;

-- PostgREST computed field: public lists explicitly filter this even when the
-- requester owns private records and therefore has wider Studio SELECT access.
create function public.video_is_public(p_video public.videos) returns boolean
language sql stable set search_path='' as $$
  select public.is_video_public(p_video.id)
$$;
revoke all on function public.video_is_public(public.videos) from public;
grant execute on function public.video_is_public(public.videos) to anon,authenticated;

-- The older publish_video RPC remains available for staging an episode under
-- a draft title. The app's public action uses this atomic boundary instead.
create function public.publish_work(p_video_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  v public.videos;
  a public.animations;
  v_animation_id uuid;
  v_result jsonb;
begin
  if auth.uid() is null then raise exception using errcode='42501',message='Autentikasi diperlukan.'; end if;
  select * into v from public.videos where id=p_video_id and creator_id=auth.uid() and deleted_at is null;
  if not found then raise exception using errcode='42501',message='Video tidak ditemukan atau akses ditolak.'; end if;
  if v.content_type='animation' then
    select animation_id into v_animation_id from public.animation_episodes where video_id=v.id;
    -- Lock the parent before the media, matching episode creation/moves.
    select * into a from public.animations where id=v_animation_id and creator_id=auth.uid() and deleted_at is null for update;
    if not found then raise exception using errcode='23514',message='Tayangan harus memiliki animasi yang aktif.'; end if;
  end if;
  select * into v from public.videos where id=p_video_id and creator_id=auth.uid() and deleted_at is null for update;
  if not found then raise exception using errcode='42501',message='Video tidak ditemukan atau akses ditolak.'; end if;
  -- A concurrent move must not publish a different parent than the one locked.
  if v.content_type='animation' and not exists(select 1 from public.animation_episodes where video_id=v.id and animation_id=a.id) then
    raise exception using errcode='40001',message='Relasi tayangan berubah. Coba publikasikan kembali.';
  end if;
  v_result:=public.publish_video(p_video_id);
  if v.content_type='animation' and a.status<>'published' then
    perform public.set_animation_status(a.id,'publish');
  end if;
  if not public.is_video_public(p_video_id) then
    raise exception using errcode='23514',message='Publikasi belum dapat diakses penonton. Periksa detail animasi.';
  end if;
  return v_result || jsonb_build_object('publicly_available',true,'animation_id',v_animation_id);
end;
$$;
revoke all on function public.publish_work(uuid) from public,anon;
grant execute on function public.publish_work(uuid) to authenticated;

-- Only a revision is public. Never replicate private video rows, paths, titles
-- or creator IDs merely to invalidate a visitor's list. Unpublish/delete still
-- send a visible invalidation even though the changed content is now hidden.
create table public.public_content_revision (
  id boolean primary key default true check(id),
  revision bigint not null default 0,
  updated_at timestamptz not null default now()
);
insert into public.public_content_revision(id) values(true);
alter table public.public_content_revision enable row level security;
revoke all on public.public_content_revision from public,anon,authenticated;
grant select on public.public_content_revision to anon,authenticated;
create policy public_content_revision_read on public.public_content_revision
  for select to anon,authenticated using(true);

create function public.bump_public_content_revision() returns void
language sql security definer set search_path='' as $$
  update public.public_content_revision set revision=revision+1,updated_at=clock_timestamp() where id=true
$$;
revoke all on function public.bump_public_content_revision() from public,anon,authenticated;

create function public.trg_video_public_revision() returns trigger
language plpgsql security definer set search_path='' as $$
declare v_was_public boolean:=false; v_is_public boolean:=false;
begin
  if tg_op<>'INSERT' then
    v_was_public:=old.status='published' and old.deleted_at is null and (
      old.content_type='reel' or exists(select 1 from public.animation_episodes e join public.animations a on a.id=e.animation_id
        where e.video_id=old.id and a.status='published' and a.deleted_at is null));
  end if;
  if tg_op<>'DELETE' then v_is_public:=public.is_video_public(new.id); end if;
  if v_was_public or v_is_public then perform public.bump_public_content_revision(); end if;
  return null;
end;
$$;
create function public.trg_animation_public_revision() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if tg_op<>'INSERT' and old.status='published' and old.deleted_at is null then
    perform public.bump_public_content_revision();
  elsif tg_op<>'DELETE' and new.status='published' and new.deleted_at is null then
    perform public.bump_public_content_revision();
  end if;
  return null;
end;
$$;
create function public.trg_episode_public_revision() returns trigger
language plpgsql security definer set search_path='' as $$
declare v_parent uuid; v_video uuid; v_visible boolean:=false;
begin
  if tg_op<>'INSERT' then
    v_parent:=old.animation_id; v_video:=old.video_id;
    v_visible:=exists(select 1 from public.animations a join public.videos v on v.id=v_video
      where a.id=v_parent and a.status='published' and a.deleted_at is null and v.status='published' and v.deleted_at is null);
  end if;
  if tg_op<>'DELETE' then v_visible:=v_visible or public.is_video_public(new.video_id); end if;
  if v_visible then perform public.bump_public_content_revision(); end if;
  return null;
end;
$$;
revoke all on function public.trg_video_public_revision(),public.trg_animation_public_revision(),public.trg_episode_public_revision() from public,anon,authenticated;
create trigger video_public_revision after insert or update or delete on public.videos for each row execute function public.trg_video_public_revision();
create trigger animation_public_revision after insert or update or delete on public.animations for each row execute function public.trg_animation_public_revision();
create trigger episode_public_revision after insert or update or delete on public.animation_episodes for each row execute function public.trg_episode_public_revision();

do $$
begin
  if not exists(select 1 from pg_publication where pubname='supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='public_content_revision') then
    alter publication supabase_realtime add table public.public_content_revision;
  end if;
end;
$$;
notify pgrst,'reload schema';
commit;
