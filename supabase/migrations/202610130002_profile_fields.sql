-- Copy this complete script into your project's Supabase SQL Editor and Run.
-- These personal details belong in public.profiles.
begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  age integer check (age between 0 and 150),
  gender text,
  occupation text,
  food_habit text,
  updated_at timestamptz not null default now()
);

-- Existing accounts and profile rows are preserved; unset details remain null.
alter table public.profiles
  add column if not exists age integer check (age between 0 and 150),
  add column if not exists gender text,
  add column if not exists occupation text,
  add column if not exists food_habit text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles enable row level security;

-- Keep older, broader policies from exposing another person's profile.
drop policy if exists profiles_owner_guard on public.profiles;
create policy profiles_owner_guard on public.profiles
  as restrictive for all to public
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select, insert, update on public.profiles to authenticated;
notify pgrst, 'reload schema';

commit;
