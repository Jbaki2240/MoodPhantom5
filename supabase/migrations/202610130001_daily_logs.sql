-- Run in the Supabase SQL Editor for the project in .env.local.
-- The transaction rolls back if an existing table has conflicting data.
begin;

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  hours_slept numeric not null check (hours_slept between 0 and 24),
  sleep_quality integer check (sleep_quality between 0 and 4),
  breakfast_eaten boolean not null default false,
  lunch_eaten boolean not null default false,
  dinner_eaten boolean not null default false,
  meals_logged integer not null default 0 check (meals_logged between 0 and 3),
  steps integer not null check (steps >= 0),
  exercise_type text not null default 'None',
  stress_level integer not null check (stress_level between 1 and 10),
  created_at timestamptz not null default now()
);

-- Add any missing fields to a table created during earlier development.
-- Existing rows and values are preserved.
alter table public.daily_logs
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists log_date date,
  add column if not exists hours_slept numeric check (hours_slept between 0 and 24),
  add column if not exists sleep_quality integer check (sleep_quality between 0 and 4),
  add column if not exists breakfast_eaten boolean not null default false,
  add column if not exists lunch_eaten boolean not null default false,
  add column if not exists dinner_eaten boolean not null default false,
  add column if not exists meals_logged integer not null default 0 check (meals_logged between 0 and 3),
  add column if not exists steps integer check (steps >= 0),
  add column if not exists exercise_type text not null default 'None',
  add column if not exists stress_level integer check (stress_level between 1 and 10);

-- Sleep quality is optional in the form.
alter table public.daily_logs alter column sleep_quality drop not null;

-- Required by upsert(..., { onConflict: 'user_id,log_date' }).
-- If duplicate entries already exist, this fails without deleting any records.
create unique index if not exists daily_logs_user_date_unique
  on public.daily_logs (user_id, log_date);

alter table public.daily_logs enable row level security;

-- A restrictive policy also prevents an older, broader policy from granting
-- access to another person's logs. Anonymous requests cannot match auth.uid().
drop policy if exists daily_logs_owner_guard on public.daily_logs;
create policy daily_logs_owner_guard on public.daily_logs
  as restrictive for all to public
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists daily_logs_select_own on public.daily_logs;
create policy daily_logs_select_own on public.daily_logs
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists daily_logs_insert_own on public.daily_logs;
create policy daily_logs_insert_own on public.daily_logs
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists daily_logs_update_own on public.daily_logs;
create policy daily_logs_update_own on public.daily_logs
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.daily_logs to authenticated;

-- Refresh the Data API's schema after the new columns and index are committed.
notify pgrst, 'reload schema';

commit;
