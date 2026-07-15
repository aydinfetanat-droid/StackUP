-- StackUp schema v2 — rank/promotion system, simulator, assessments, review engine,
-- engaged-time tracking. Run this AFTER schema.sql (and its grant patch) in the
-- Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- profiles: internal-only engaged-time counter (never shown in student UI)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists engaged_seconds integer not null default 0;

create or replace function public.increment_engaged_seconds(p_seconds integer)
returns void
language sql
security invoker
as $$
  update public.profiles set engaged_seconds = engaged_seconds + p_seconds where id = auth.uid();
$$;

grant execute on function public.increment_engaged_seconds(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- promotion_exam_attempts
-- ---------------------------------------------------------------------------
create table if not exists public.promotion_exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rank_id integer not null,
  score integer not null,
  passed boolean not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now()
);

alter table public.promotion_exam_attempts enable row level security;

create policy "promotion exam attempts are readable by authenticated users"
  on public.promotion_exam_attempts for select
  to authenticated
  using (true);

create policy "users can insert their own promotion exam attempts"
  on public.promotion_exam_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.promotion_exam_attempts to authenticated;

create index if not exists promotion_exam_attempts_user_rank_idx
  on public.promotion_exam_attempts (user_id, rank_id);

-- ---------------------------------------------------------------------------
-- placement_test_attempts
-- ---------------------------------------------------------------------------
create table if not exists public.placement_test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  score integer not null,
  passed boolean not null,
  attempt_number integer not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz not null default now()
);

alter table public.placement_test_attempts enable row level security;

create policy "placement test attempts are readable by authenticated users"
  on public.placement_test_attempts for select
  to authenticated
  using (true);

create policy "users can insert their own placement test attempts"
  on public.placement_test_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.placement_test_attempts to authenticated;

create index if not exists placement_test_attempts_user_idx
  on public.placement_test_attempts (user_id);

-- ---------------------------------------------------------------------------
-- assessment_attempts (pre/post financial literacy quiz)
-- ---------------------------------------------------------------------------
create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phase text not null check (phase in ('pre', 'post')),
  score integer not null,
  completed_at timestamptz not null default now(),
  unique (user_id, phase)
);

alter table public.assessment_attempts enable row level security;

create policy "assessment attempts are readable by authenticated users"
  on public.assessment_attempts for select
  to authenticated
  using (true);

create policy "users can insert their own assessment attempts"
  on public.assessment_attempts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own assessment attempts"
  on public.assessment_attempts for update
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update on public.assessment_attempts to authenticated;

-- ---------------------------------------------------------------------------
-- simulator_accounts / holdings / trades — the investing simulator, "stacks" currency
-- ---------------------------------------------------------------------------
create table if not exists public.simulator_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cash_balance_stacks numeric not null default 10,
  created_at timestamptz not null default now()
);

alter table public.simulator_accounts enable row level security;

create policy "simulator accounts are readable by authenticated users"
  on public.simulator_accounts for select
  to authenticated
  using (true);

create policy "users can insert their own simulator account"
  on public.simulator_accounts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own simulator account"
  on public.simulator_accounts for update
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update on public.simulator_accounts to authenticated;

create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ticker text not null,
  shares numeric not null default 0,
  avg_cost_stacks numeric not null default 0,
  unique (user_id, ticker)
);

alter table public.holdings enable row level security;

create policy "holdings are readable by authenticated users"
  on public.holdings for select
  to authenticated
  using (true);

create policy "users can insert their own holdings"
  on public.holdings for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can update their own holdings"
  on public.holdings for update
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update on public.holdings to authenticated;

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ticker text not null,
  side text not null check (side in ('buy', 'sell')),
  shares numeric not null,
  price_stacks numeric not null,
  executed_at timestamptz not null default now()
);

alter table public.trades enable row level security;

create policy "trades are readable by authenticated users"
  on public.trades for select
  to authenticated
  using (true);

create policy "users can insert their own trades"
  on public.trades for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.trades to authenticated;

create index if not exists trades_user_idx on public.trades (user_id);

-- ---------------------------------------------------------------------------
-- stack_grants — weekly streak bonus ledger (idempotent per user+week_number)
-- ---------------------------------------------------------------------------
create table if not exists public.stack_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_number integer not null,
  amount_stacks numeric not null,
  granted_at timestamptz not null default now(),
  unique (user_id, week_number)
);

alter table public.stack_grants enable row level security;

create policy "stack grants are readable by authenticated users"
  on public.stack_grants for select
  to authenticated
  using (true);

create policy "users can insert their own stack grants"
  on public.stack_grants for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.stack_grants to authenticated;

-- ---------------------------------------------------------------------------
-- missed_card_answers — powers the review-session engine
-- ---------------------------------------------------------------------------
create table if not exists public.missed_card_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  card_index integer not null,
  correct boolean not null,
  answered_at timestamptz not null default now()
);

alter table public.missed_card_answers enable row level security;

create policy "missed card answers are readable by authenticated users"
  on public.missed_card_answers for select
  to authenticated
  using (true);

create policy "users can insert their own card answers"
  on public.missed_card_answers for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.missed_card_answers to authenticated;

create index if not exists missed_card_answers_user_idx on public.missed_card_answers (user_id, lesson_id);
