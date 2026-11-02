-- Migration: 20261102000002_create_videos_table.sql
-- Description: Create public.videos table, status check constraints, indexes, and Row Level Security policies

-- 1. Create public.videos table
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null
    references public.profiles(id) on delete cascade,
  title text not null
    check (char_length(trim(title)) between 1 and 120),
  description text
    check (description is null or char_length(description) <= 2200),
  storage_path text,
  thumbnail_path text,
  duration_seconds integer
    check (duration_seconds is null or duration_seconds between 1 and 180),
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  deleted_at timestamptz,
  constraint published_requires_media check (
    status <> 'published'
    or (
      storage_path is not null
      and duration_seconds between 1 and 180
      and published_at is not null
    )
  )
);

-- 2. Indexes for fast feed retrieval and studio queries
create index if not exists videos_feed_idx
on public.videos (published_at desc, id desc)
where status = 'published' and deleted_at is null;

create index if not exists videos_studio_idx
on public.videos (creator_id, created_at desc);

create index if not exists videos_creator_published_idx
on public.videos (creator_id, published_at desc)
where status = 'published' and deleted_at is null;

-- 3. Enable Row Level Security
alter table public.videos enable row level security;

-- 4. RLS Policies
-- A. Public & Authenticated users can view published, non-deleted videos
drop policy if exists published_videos_public_read on public.videos;
create policy published_videos_public_read
on public.videos for select
to anon, authenticated
using (status = 'published' and deleted_at is null);

-- B. Creators can view all their own videos (including drafts and soft-deleted)
drop policy if exists owners_read_own_videos on public.videos;
create policy owners_read_own_videos
on public.videos for select
to authenticated
using (creator_id = (select auth.uid()));

-- C. Creators can insert initial drafts with their own creator_id
drop policy if exists owners_create_draft on public.videos;
create policy owners_create_draft
on public.videos for insert
to authenticated
with check (
  creator_id = (select auth.uid())
  and status = 'draft'
  and storage_path is null
  and deleted_at is null
);

-- D. Creators can update their own non-deleted videos
drop policy if exists owners_update_own_video on public.videos;
create policy owners_update_own_video
on public.videos for update
to authenticated
using (
  creator_id = (select auth.uid())
  and deleted_at is null
)
with check (
  creator_id = (select auth.uid())
  and deleted_at is null
);
