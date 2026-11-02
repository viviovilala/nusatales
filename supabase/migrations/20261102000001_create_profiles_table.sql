-- Migration: 20261102000001_create_profiles_table.sql
-- Description: Core profiles table, auto-provision trigger on auth.users, and RLS policies

-- 1. Create public.profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text not null default 'Pengguna NusaTales'
    check (char_length(trim(display_name)) between 1 and 60),
  bio text check (bio is null or char_length(bio) <= 160),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (
    username is null
    or username ~ '^[a-z0-9_]{3,24}$'
  )
);

-- 2. Case-insensitive unique index for usernames
create unique index if not exists profiles_username_lower_unique
on public.profiles (lower(username))
where username is not null;

-- 3. Auto-provision profile trigger when a user signs up
create or replace function public.handle_new_nusatales_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 60), ''),
      'Pengguna NusaTales'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_nusatales on auth.users;

create trigger on_auth_user_created_nusatales
after insert on auth.users
for each row execute function public.handle_new_nusatales_user();

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 5. Public read policy
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
on public.profiles
for select
using (true);

-- 6. Self-update policy
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);
