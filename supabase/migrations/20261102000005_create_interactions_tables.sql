-- Migration: 20261102000005_create_interactions_tables.sql
-- Description: Create video_likes and video_comments tables with strict RLS (No coin/point rewards)

-- 1. Create public.video_likes table
create table if not exists public.video_likes (
  video_id uuid not null
    references public.videos(id) on delete cascade,
  user_id uuid not null
    references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (video_id, user_id)
);

create index if not exists video_likes_video_idx
on public.video_likes (video_id);

alter table public.video_likes enable row level security;

-- Like policies: anyone can count/view likes, authenticated user can insert/delete own like
drop policy if exists "Likes are viewable by everyone" on public.video_likes;
create policy "Likes are viewable by everyone"
on public.video_likes for select
to anon, authenticated
using (true);

drop policy if exists "Users can like a video" on public.video_likes;
create policy "Users can like a video"
on public.video_likes for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

drop policy if exists "Users can unlike a video" on public.video_likes;
create policy "Users can unlike a video"
on public.video_likes for delete
to authenticated
using (
  (select auth.uid()) = user_id
);

-- 2. Create public.video_comments table
create table if not exists public.video_comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null
    references public.videos(id) on delete cascade,
  user_id uuid not null
    references public.profiles(id) on delete cascade,
  content text not null
    check (char_length(trim(content)) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists video_comments_video_idx
on public.video_comments (video_id, created_at desc);

alter table public.video_comments enable row level security;

-- Comment policies: anyone can read comments, author can insert and delete own comment
drop policy if exists "Comments are viewable by everyone" on public.video_comments;
create policy "Comments are viewable by everyone"
on public.video_comments for select
to anon, authenticated
using (true);

drop policy if exists "Authenticated users can post comments" on public.video_comments;
create policy "Authenticated users can post comments"
on public.video_comments for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

drop policy if exists "Users can delete their own comments" on public.video_comments;
create policy "Users can delete their own comments"
on public.video_comments for delete
to authenticated
using (
  (select auth.uid()) = user_id
);
