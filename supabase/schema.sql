-- StackUp Phase 1 schema
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query) after
-- creating your project.

-- ---------------------------------------------------------------------------
-- profiles: one row per user, created client-side right after sign-up
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  school text not null,
  xp integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Any signed-in user can read the leaderboard-relevant columns of any profile.
-- This is a small class pilot with no sensitive data in this table (no email,
-- no PII beyond a display name), so a broad SELECT policy keeps the
-- leaderboard/admin pages simple without needing a service-role key in the client.
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- lesson_completions: one row per (user, lesson). Re-completing a lesson
-- updates the score but does not grant additional XP (XP is granted once,
-- application-side, on first completion).
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  score integer not null,
  xp_earned integer not null,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

alter table public.lesson_completions enable row level security;

create policy "lesson completions are readable by authenticated users"
  on public.lesson_completions for select
  to authenticated
  using (true);

create policy "users can insert their own lesson completions"
  on public.lesson_completions for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own lesson completions"
  on public.lesson_completions for update
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- analytics_events: append-only event log for pilot metrics (see /admin, Phase 5)
-- ---------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

create policy "analytics events are readable by authenticated users"
  on public.analytics_events for select
  to authenticated
  using (true);

create policy "users can insert their own analytics events"
  on public.analytics_events for insert
  to authenticated
  with check (auth.uid() = user_id or user_id is null);

create index if not exists analytics_events_type_idx on public.analytics_events (event_type);
create index if not exists analytics_events_user_idx on public.analytics_events (user_id);

-- ---------------------------------------------------------------------------
-- Table-level grants. RLS policies above only take effect once the
-- `authenticated` role has base privileges on these tables — without this,
-- every query fails with "permission denied for table ..." before RLS is
-- even evaluated.
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.lesson_completions to authenticated;
grant select, insert on public.analytics_events to authenticated;
