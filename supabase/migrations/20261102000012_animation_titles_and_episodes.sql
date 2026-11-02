-- Animation titles own metadata; videos remain the media/interaction identity.
-- Deploy with the title/episode client. No media IDs or Storage objects move.
begin;

create table public.animations (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id),
  title text not null check (char_length(trim(title)) between 1 and 120),
  slug text not null unique,
  synopsis text check (char_length(synopsis) <= 2200),
  format text not null default 'series' check (format in ('film','series')),
  poster_path text,
  banner_path text,
  release_year integer check (release_year between 1900 and 2100),
  language text not null default 'Bahasa Indonesia' check (char_length(trim(language)) between 1 and 80),
  origin_region text check (char_length(origin_region) <= 120),
  age_guidance text not null default 'all' check (age_guidance in ('all','13+','17+')),
  story_status text not null default 'ongoing' check (story_status in ('ongoing','completed')),
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  deleted_at timestamptz
);
create table public.genres (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  slug text not null unique, sort_order integer not null default 0, active boolean not null default true
);
create table public.culture_tags (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  slug text not null unique, sort_order integer not null default 0, active boolean not null default true
);
insert into public.genres(name,slug,sort_order) values
  ('Petualangan','petualangan',1),('Fantasi','fantasi',2),('Drama','drama',3),('Komedi','komedi',4),
  ('Aksi','aksi',5),('Misteri','misteri',6),('Horor','horor',7),('Edukasi','edukasi',8);
insert into public.culture_tags(name,slug,sort_order) values
  ('Cerita rakyat','cerita-rakyat',1),('Wayang','wayang',2),('Tradisi','tradisi',3),
  ('Sejarah','sejarah',4),('Kehidupan Nusantara','kehidupan-nusantara',5);
create table public.animation_genres (
  animation_id uuid not null references public.animations(id) on delete cascade,
  genre_id uuid not null references public.genres(id), primary key(animation_id,genre_id)
);
create index animation_genres_filter_idx on public.animation_genres(genre_id,animation_id);
create table public.animation_culture_tags (
  animation_id uuid not null references public.animations(id) on delete cascade,
  culture_tag_id uuid not null references public.culture_tags(id), primary key(animation_id,culture_tag_id)
);
create table public.animation_episodes (
  video_id uuid primary key references public.videos(id),
  animation_id uuid not null references public.animations(id),
  season_number integer not null default 1 check (season_number between 1 and 999),
  episode_number integer not null check (episode_number between 1 and 99999),
  unique(animation_id,season_number,episode_number)
);
create index animations_studio_idx on public.animations(creator_id,created_at desc) where deleted_at is null;
create index animations_catalog_idx on public.animations(published_at desc,id desc) where status='published' and deleted_at is null;

-- Preserve legacy playback URLs, likes, comments and media paths. Never infer
-- a series from matching titles/owners. These titles can be regrouped explicitly.
insert into public.animations(id,creator_id,title,slug,synopsis,format,poster_path,story_status,status,created_at,published_at,deleted_at)
select id,creator_id,title,'animasi-'||id::text,description,'film',
  case when thumbnail_path ~ ('^'||creator_id::text||'/'||id::text||'/[^/]+$') then thumbnail_path else null end,
  'completed',status,created_at,published_at,deleted_at
from public.videos where content_type='animation';
insert into public.animation_episodes(video_id,animation_id,season_number,episode_number)
select id,id,1,1 from public.videos where content_type='animation';

-- Small definer predicates avoid recursive RLS between title, episode and video.
create function public.can_read_animation(p_id uuid) returns boolean
language sql stable security definer set search_path=public,auth,pg_temp as $$
  select exists(select 1 from public.animations a where a.id=p_id and a.deleted_at is null
    and (a.creator_id=auth.uid() or a.status='published'))
$$;
create function public.is_video_public(p_id uuid) returns boolean
language sql stable security definer set search_path=public,pg_temp as $$
  select exists(select 1 from public.videos v where v.id=p_id and v.status='published' and v.deleted_at is null
    and (v.content_type='reel' or exists(select 1 from public.animation_episodes e join public.animations a on a.id=e.animation_id
      where e.video_id=v.id and a.status='published' and a.deleted_at is null)))
$$;
create function public.can_read_episode(p_id uuid) returns boolean
language sql stable security definer set search_path=public,auth,pg_temp as $$
  select public.is_video_public(p_id) or exists(select 1 from public.videos v
    join public.animation_episodes e on e.video_id=v.id join public.animations a on a.id=e.animation_id
    where v.id=p_id and v.creator_id=auth.uid() and a.deleted_at is null and v.deleted_at is null)
$$;
revoke all on function public.can_read_animation(uuid),public.is_video_public(uuid),public.can_read_episode(uuid) from public;
grant execute on function public.can_read_animation(uuid),public.is_video_public(uuid),public.can_read_episode(uuid) to anon,authenticated;

alter table public.animations enable row level security;
alter table public.genres enable row level security;
alter table public.culture_tags enable row level security;
alter table public.animation_genres enable row level security;
alter table public.animation_culture_tags enable row level security;
alter table public.animation_episodes enable row level security;
create policy titles_read on public.animations for select to anon,authenticated using (public.can_read_animation(id));
create policy genres_read on public.genres for select to anon,authenticated using (true);
create policy cultures_read on public.culture_tags for select to anon,authenticated using (true);
create policy title_genres_read on public.animation_genres for select to anon,authenticated using (public.can_read_animation(animation_id));
create policy title_cultures_read on public.animation_culture_tags for select to anon,authenticated using (public.can_read_animation(animation_id));
create policy episodes_read on public.animation_episodes for select to anon,authenticated using (public.can_read_episode(video_id));
revoke all on public.animations,public.genres,public.culture_tags,public.animation_genres,public.animation_culture_tags,public.animation_episodes from public,anon,authenticated;
grant select on public.animations,public.genres,public.culture_tags,public.animation_genres,public.animation_culture_tags,public.animation_episodes to anon,authenticated;

create function public.save_animation(p_id uuid,p_input jsonb,p_genre_ids uuid[],p_culture_ids uuid[])
returns public.animations language plpgsql security definer set search_path=public,auth,storage,pg_temp as $$
declare a public.animations; v_id uuid:=coalesce(p_id,gen_random_uuid()); v_path text; v_kind text;
begin
  if auth.uid() is null then raise exception using errcode='42501',message='Autentikasi diperlukan.'; end if;
  if p_id is not null then
    select * into a from public.animations where id=p_id and creator_id=auth.uid() and deleted_at is null for update;
    if not found then raise exception using errcode='42501',message='Animasi tidak ditemukan atau akses ditolak.'; end if;
    if p_input->>'format' is distinct from a.format and exists(select 1 from public.animation_episodes where animation_id=p_id) then
      raise exception using errcode='23514',message='Format tidak dapat diubah setelah memiliki tayangan.';
    end if;
  end if;
  if cardinality(coalesce(p_genre_ids,'{}'))>3 or cardinality(coalesce(p_culture_ids,'{}'))>5 then
    raise exception using errcode='23514',message='Pilih maksimal 3 genre dan 5 tema budaya.';
  end if;
  if exists(select 1 from unnest(p_genre_ids) x where not exists(select 1 from public.genres g where g.id=x and g.active))
     or exists(select 1 from unnest(p_culture_ids) x where not exists(select 1 from public.culture_tags c where c.id=x and c.active)) then
    raise exception using errcode='23514',message='Pilihan genre atau tema budaya tidak valid.';
  end if;
  foreach v_kind in array array['poster_path','banner_path'] loop
    v_path:=nullif(p_input->>v_kind,'');
    if v_path is not null then
      if v_path !~ ('^'||auth.uid()::text||'/animations/'||v_id::text||'/[^/]+$')
         and not exists(select 1 from public.animation_episodes e join public.videos v on v.id=e.video_id
           where e.animation_id=v_id and v.creator_id=auth.uid() and v.thumbnail_path=v_path
             and v_path ~ ('^'||auth.uid()::text||'/'||v.id::text||'/[^/]+$')) then
        raise exception using errcode='42501',message='Sampul bukan milik animasi ini.';
      end if;
      if not exists(select 1 from storage.objects where bucket_id='thumbnails' and name=v_path) then
        raise exception using errcode='23514',message='Unggah sampul sebelum menyimpan.';
      end if;
    end if;
  end loop;
  -- Published titles cannot be edited into an incomplete state.
  if a.status='published' and (nullif(trim(p_input->>'synopsis'),'') is null or nullif(p_input->>'poster_path','') is null or coalesce(cardinality(p_genre_ids),0)=0) then
    raise exception using errcode='23514',message='Animasi terbit memerlukan sinopsis, poster, dan genre.';
  end if;
  insert into public.animations(id,creator_id,title,slug,synopsis,format,poster_path,banner_path,release_year,language,origin_region,age_guidance,story_status)
  values(v_id,auth.uid(),trim(p_input->>'title'),'animasi-'||v_id::text,nullif(trim(p_input->>'synopsis'),''),p_input->>'format',
    nullif(p_input->>'poster_path',''),nullif(p_input->>'banner_path',''),nullif(p_input->>'release_year','')::integer,
    trim(coalesce(p_input->>'language','Bahasa Indonesia')),nullif(trim(p_input->>'origin_region'),''),coalesce(p_input->>'age_guidance','all'),coalesce(p_input->>'story_status','ongoing'))
  on conflict(id) do update set title=excluded.title,synopsis=excluded.synopsis,format=excluded.format,
    poster_path=excluded.poster_path,banner_path=excluded.banner_path,release_year=excluded.release_year,language=excluded.language,
    origin_region=excluded.origin_region,age_guidance=excluded.age_guidance,story_status=excluded.story_status,updated_at=now()
  returning * into a;
  delete from public.animation_genres where animation_id=v_id;
  insert into public.animation_genres select v_id,x from (select distinct unnest(p_genre_ids) x) s;
  delete from public.animation_culture_tags where animation_id=v_id;
  insert into public.animation_culture_tags select v_id,x from (select distinct unnest(p_culture_ids) x) s;
  return a;
end;
$$;

-- Cross-table invariants are also enforced for privileged/batch callers.
create function public.trg_animation_episode_integrity() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare a public.animations; v public.videos;
begin
  select * into a from public.animations where id=new.animation_id for update;
  select * into v from public.videos where id=new.video_id for update;
  if a.id is null or v.id is null or a.deleted_at is not null or v.deleted_at is not null
     or v.content_type<>'animation' or a.creator_id<>v.creator_id then
    raise exception using errcode='23514',message='Tayangan harus berupa animasi milik kreator yang sama.';
  end if;
  if a.format='film' and (new.season_number<>1 or new.episode_number<>1 or exists(select 1 from public.animation_episodes e where e.animation_id=a.id and e.video_id<>v.id)) then
    raise exception using errcode='23514',message='Film hanya memiliki satu tayangan utama.';
  end if;
  return new;
end;
$$;
create trigger animation_episode_integrity before insert or update on public.animation_episodes for each row execute function public.trg_animation_episode_integrity();

create function public.create_animation_episode(p_animation_id uuid,p_title text,p_description text,p_season integer,p_episode integer)
returns public.videos language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare a public.animations; v public.videos;
begin
  select * into a from public.animations where id=p_animation_id and creator_id=auth.uid() and deleted_at is null for update;
  if auth.uid() is null or not found then raise exception using errcode='42501',message='Pilih animasi milikmu terlebih dahulu.'; end if;
  insert into public.videos(creator_id,title,description,content_type) values(auth.uid(),trim(p_title),p_description,'animation') returning * into v;
  -- Reuse the slot after a cancelled/deleted upload, retaining old video IDs.
  delete from public.animation_episodes e using public.videos old where e.video_id=old.id and old.deleted_at is not null and e.animation_id=a.id and e.season_number=p_season and e.episode_number=p_episode;
  insert into public.animation_episodes values(v.id,a.id,p_season,p_episode);
  return v;
end;
$$;
create function public.move_animation_episode(p_video_id uuid,p_animation_id uuid,p_season integer,p_episode integer)
returns void language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin
  -- Serialize parent operations in UUID order to avoid cross-move deadlocks.
  perform 1 from public.animations where id in (p_animation_id,(select animation_id from public.animation_episodes where video_id=p_video_id)) order by id for update;
  if not exists(select 1 from public.videos where id=p_video_id and creator_id=auth.uid() and content_type='animation' and status='draft' and deleted_at is null)
     or not exists(select 1 from public.animations where id=p_animation_id and creator_id=auth.uid() and deleted_at is null) then
    raise exception using errcode='42501',message='Hanya tayangan draf milikmu yang dapat dipindahkan.';
  end if;
  delete from public.animation_episodes e using public.videos old where e.video_id=old.id and old.deleted_at is not null and e.animation_id=p_animation_id and e.season_number=p_season and e.episode_number=p_episode;
  update public.animation_episodes set animation_id=p_animation_id,season_number=p_season,episode_number=p_episode where video_id=p_video_id;
  if not found then raise exception using errcode='23514',message='Relasi tayangan tidak ditemukan.'; end if;
end;
$$;
create function public.set_animation_status(p_id uuid,p_action text) returns public.animations
language plpgsql security definer set search_path=public,auth,storage,pg_temp as $$
declare a public.animations;
begin
  select * into a from public.animations where id=p_id and creator_id=auth.uid() and deleted_at is null for update;
  if auth.uid() is null or not found then raise exception using errcode='42501',message='Animasi tidak ditemukan atau akses ditolak.'; end if;
  if p_action not in ('publish','unpublish','delete') or p_action is null then raise exception using errcode='23514',message='Aksi tidak valid.'; end if;
  if p_action='publish' then
    if nullif(trim(a.synopsis),'') is null or a.poster_path is null or not exists(select 1 from storage.objects where bucket_id='thumbnails' and name=a.poster_path)
       or not exists(select 1 from public.animation_genres where animation_id=a.id)
       or not exists(select 1 from public.animation_episodes e join public.videos v on v.id=e.video_id where e.animation_id=a.id and v.status='published' and v.deleted_at is null) then
      raise exception using errcode='23514',message='Lengkapi sinopsis, poster, genre, dan minimal satu tayangan terbit sebelum menerbitkan animasi.';
    end if;
  end if;
  update public.animations set status=case when p_action='publish' then 'published' else 'draft' end,
    published_at=case when p_action='publish' then coalesce(published_at,now()) else published_at end,
    deleted_at=case when p_action='delete' then now() else null end,updated_at=now() where id=a.id returning * into a;
  return a;
end;
$$;
revoke all on function public.save_animation(uuid,jsonb,uuid[],uuid[]),public.create_animation_episode(uuid,text,text,integer,integer),public.move_animation_episode(uuid,uuid,integer,integer),public.set_animation_status(uuid,text) from public,anon;
grant execute on function public.save_animation(uuid,jsonb,uuid[],uuid[]),public.create_animation_episode(uuid,text,text,integer,integer),public.move_animation_episode(uuid,uuid,integer,integer),public.set_animation_status(uuid,text) to authenticated;

-- Direct video inserts are now Reels only. An animation draft + relation must
-- be created atomically by create_animation_episode, never in two HTTP writes.
alter policy owners_create_draft on public.videos with check (creator_id=auth.uid() and content_type='reel' and status='draft' and storage_path is null and deleted_at is null);
alter policy published_videos_public_read on public.videos using (public.is_video_public(id));

-- Gate publish_video through an additional trigger, preserving every existing
-- media/path/grant check in migration 11. Parent lock serializes with deletion.
create function public.trg_animation_publish_guard() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.content_type='animation' and new.status='published' and old.status is distinct from 'published' then
    perform 1 from public.animations a join public.animation_episodes e on e.animation_id=a.id where e.video_id=new.id and a.deleted_at is null and a.creator_id=new.creator_id for update of a;
    if not found then raise exception using errcode='23514',message='Tayangan harus memiliki animasi yang aktif.'; end if;
  end if;
  return new;
end;
$$;
create trigger animation_publish_guard before update on public.videos for each row execute function public.trg_animation_publish_guard();

drop policy if exists "Likes are viewable by everyone" on public.video_likes;
create policy "Likes are viewable by everyone" on public.video_likes for select to anon,authenticated using(public.is_video_public(video_id) or user_id=auth.uid());
drop policy if exists "Comments are viewable by everyone" on public.video_comments;
create policy "Comments are viewable by everyone" on public.video_comments for select to anon,authenticated using(public.is_video_public(video_id) or user_id=auth.uid());
alter policy "Users can like a video" on public.video_likes with check(user_id=auth.uid() and public.is_video_public(video_id));
alter policy "Authenticated users can post comments" on public.video_comments with check(user_id=auth.uid() and public.is_video_public(video_id));

create function public.is_animation_art_public(p_path text) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists(select 1 from public.animations a where a.status='published' and a.deleted_at is null and p_path in(a.poster_path,a.banner_path)
    and (p_path ~ ('^'||a.creator_id::text||'/animations/'||a.id::text||'/[^/]+$') or exists(
      select 1 from public.animation_episodes e join public.videos v on v.id=e.video_id where e.animation_id=a.id and v.creator_id=a.creator_id
        and v.thumbnail_path=p_path and p_path ~ ('^'||a.creator_id::text||'/'||v.id::text||'/[^/]+$'))))
$$;
revoke all on function public.is_animation_art_public(text) from public;
grant execute on function public.is_animation_art_public(text) to anon,authenticated;
alter policy "Public and authenticated can read allowed thumbnails" on storage.objects using (
  bucket_id='thumbnails' and ((storage.foldername(name))[1]=auth.uid()::text or name ~ '^[0-9a-f-]{36}/avatar-[^/]+$'
    or public.is_animation_art_public(name) or exists(select 1 from public.videos v where v.thumbnail_path=name
      and name ~ ('^'||v.creator_id::text||'/'||v.id::text||'/[^/]+$') and public.is_video_public(v.id)))
);
alter policy "Public and authenticated can read published video media" on storage.objects using (
  bucket_id='videos' and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.videos v where v.storage_path=name
    and name ~ ('^'||v.creator_id::text||'/'||v.id::text||'/[^/]+$') and public.is_video_public(v.id)))
);

-- One catalog row per title. The security-invoker view respects parent/video
-- RLS even for owners; only published playable episodes contribute to totals.
create view public.animation_catalog with (security_invoker=true) as
select a.id,a.creator_id,a.title,a.synopsis as description,a.poster_path as thumbnail_path,a.banner_path,
  a.format,a.status,a.published_at,a.release_year,a.language,a.origin_region,a.age_guidance,a.story_status,
  'animation'::text as content_type,null::timestamptz as deleted_at,
  jsonb_build_object('id',p.id,'display_name',p.display_name,'username',p.username,'avatar_path',p.avatar_path) as creator,
  (select array_agg(g.slug order by g.sort_order) from public.animation_genres ag join public.genres g on g.id=ag.genre_id where ag.animation_id=a.id) as genre_slugs,
  (select array_agg(g.name order by g.sort_order) from public.animation_genres ag join public.genres g on g.id=ag.genre_id where ag.animation_id=a.id) as genres,
  media.video_id as first_video_id,media.duration_seconds,media.episode_count
from public.animations a join public.profiles p on p.id=a.creator_id
cross join lateral (
  select (array_agg(v.id order by e.season_number,e.episode_number))[1] as video_id,
    sum(v.duration_seconds)::bigint as duration_seconds,count(*)::integer as episode_count
  from public.animation_episodes e join public.videos v on v.id=e.video_id
  where e.animation_id=a.id and v.status='published' and v.deleted_at is null
) media
where a.status='published' and a.deleted_at is null and media.episode_count>0;
revoke all on public.animation_catalog from public,anon,authenticated;
grant select on public.animation_catalog to anon,authenticated;

comment on column public.animations.age_guidance is 'Creator supplied audience guidance; not an official certification.';
notify pgrst,'reload schema';
commit;
