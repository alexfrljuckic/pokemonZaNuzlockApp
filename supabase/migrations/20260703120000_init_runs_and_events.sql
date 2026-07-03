-- BACKLOG item 7 (feat/supabase): sync tables for the single-run tracker.
-- Scope is deliberately just `runs` + `run_events` — campaigns/share_tokens/
-- profiles land with their own backlog items (genlocke and share-links
-- aren't built yet, so their schema would be speculative).
--
-- Apply via the Supabase Dashboard SQL Editor, or `supabase db push` if you
-- use the CLI. Safe to re-run: every statement is idempotent.

create table if not exists public.runs (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null,
  version text not null,
  created_at timestamptz not null default now()
);

-- The event log is append-only client-side (see packages/engine's core
-- invariant); Postgres enforces that here too — no update policy is
-- defined below, and deletes are only permitted via cascade from `runs`.
create table if not exists public.run_events (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.runs (id) on delete cascade,
  seq integer not null,
  at timestamptz not null,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (run_id, seq)
);

create index if not exists run_events_run_id_idx on public.run_events (run_id);

alter table public.runs enable row level security;
alter table public.run_events enable row level security;

-- Owner-only access. Read-only share links (BACKLOG item 8) will add a
-- separate policy keyed on a share_tokens table once that's built — this
-- migration does not grant any public/anonymous read access.
drop policy if exists "runs are owner-only" on public.runs;
create policy "runs are owner-only"
  on public.runs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "run_events are owner-only" on public.run_events;
create policy "run_events are owner-only"
  on public.run_events
  for all
  using (exists (select 1 from public.runs r where r.id = run_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.runs r where r.id = run_id and r.user_id = auth.uid()));
