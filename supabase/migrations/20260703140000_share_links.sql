-- BACKLOG item 8 (feat/share-links): read-only share links.
--
-- Security design (read this before touching this file):
--
-- A naive RLS policy of the form "allow SELECT on runs/run_events if a
-- non-revoked share_tokens row exists for this run_id" is a real trap: it
-- checks whether the run is *shared at all*, not whether the requesting
-- client actually knows the secret token. That would let anyone read every
-- shared run on the whole project, token or no token.
--
-- Instead: `runs` and `run_events` keep their existing owner-only RLS from
-- 20260703120000_init_runs_and_events.sql, completely unchanged — there is
-- still no public read path into those tables directly. The ONLY public
-- read path is get_shared_run(token), a SECURITY DEFINER function that
-- takes the token as an explicit parameter, looks up a matching non-revoked
-- share_tokens row itself, and only then returns data. Guessing a random
-- uuid token is infeasible; there is nothing to brute-force against because
-- an invalid token yields an empty result, not an error that reveals
-- anything.

create table if not exists public.share_tokens (
  token uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs (id) on delete cascade,
  created_at timestamptz not null default now(),
  revoked boolean not null default false
);

create index if not exists share_tokens_run_id_idx on public.share_tokens (run_id);

alter table public.share_tokens enable row level security;

-- Owner-only: only the run's owner can create/list/revoke tokens for it.
-- No SELECT policy here is granted to anon/authenticated at large — the
-- RPC function below is what spectators actually use, and it runs with
-- definer privileges, bypassing this table's RLS internally in a
-- controlled, token-checked way.
drop policy if exists "share_tokens owner-only" on public.share_tokens;
create policy "share_tokens owner-only"
  on public.share_tokens
  for all
  using (exists (select 1 from public.runs r where r.id = run_id and r.user_id = auth.uid()))
  with check (exists (select 1 from public.runs r where r.id = run_id and r.user_id = auth.uid()));

create or replace function public.get_shared_run(p_token uuid)
returns table (
  run_id uuid,
  game_id text,
  version text,
  created_at timestamptz,
  events jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
begin
  select st.run_id into v_run_id
  from share_tokens st
  where st.token = p_token and st.revoked = false;

  if v_run_id is null then
    return; -- invalid or revoked token: empty result, not an error
  end if;

  return query
  select
    r.id,
    r.game_id,
    r.version,
    r.created_at,
    coalesce(
      (select jsonb_agg(jsonb_build_object('seq', e.seq, 'at', e.at, 'type', e.type, 'payload', e.payload) order by e.seq)
       from run_events e where e.run_id = r.id),
      '[]'::jsonb
    )
  from runs r
  where r.id = v_run_id;
end;
$$;

-- Anyone can CALL this function — the token parameter is the gate, not the
-- caller's role. This is intentionally the only anon-reachable read path.
grant execute on function public.get_shared_run(uuid) to anon, authenticated;
