-- BACKLOG item 35 (feat/profiles): public profiles + follows + big-beats feed.
-- Design: docs/PROFILES.md (agreed 2026-07-05).
--
-- Security design (same philosophy as 20260703140000_share_links.sql — read
-- that file's header before touching this one):
--
-- * A profile aggregates ONLY runs that already have a non-revoked share
--   token. Sharing remains the single privacy switch: revoke the token and
--   the run vanishes from the profile page and the feed. No new read path
--   into runs/run_events is opened here — both RPCs only ever surface runs
--   through their existing share tokens, and hand the token back so clients
--   read full runs via the already-audited get_shared_run(token).
-- * profiles/follows tables keep owner-only RLS; the ONLY public read path
--   is get_profile(handle), a SECURITY DEFINER function gated on the handle
--   being explicitly claimed. Follow lists are private in v1 (a follower can
--   read only their own follow rows).
-- * The feed is authenticated-only, LIMITed, filtered server-side to the
--   four "big beat" event types, and polled — no realtime fan-out (COSTS.md).

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9][a-z0-9-]{2,23}$'),
  display_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Owner-only table access: the setup UI inserts/updates the caller's own row.
-- Public reads happen exclusively through get_profile() below.
drop policy if exists "profiles owner-only" on public.profiles;
create policy "profiles owner-only"
  on public.profiles
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table if not exists public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  followee_id uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists follows_followee_idx on public.follows (followee_id);

alter table public.follows enable row level security;

-- A user manages (and sees) only the follows THEY created. Follower lists
-- and counts are deliberately not exposed in v1.
drop policy if exists "follows follower-only" on public.follows;
create policy "follows follower-only"
  on public.follows
  for all
  using (follower_id = auth.uid())
  with check (follower_id = auth.uid());

-- Public profile page: the handle is the gate (it only exists because its
-- owner claimed it). Returns the profile plus one row per SHARED run — the
-- share token is included so the client links straight into the existing
-- spectator view; a run with no live token simply doesn't appear.
create or replace function public.get_profile(p_handle text)
returns table (
  user_id uuid,
  handle text,
  display_name text,
  created_at timestamptz,
  run_token uuid,
  run_game_id text,
  run_version text,
  run_created_at timestamptz,
  run_event_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
begin
  select p.user_id into v_user from profiles p where p.handle = p_handle;
  if v_user is null then
    return; -- unknown handle: empty result, not an error
  end if;

  return query
  select
    p.user_id,
    p.handle,
    p.display_name,
    p.created_at,
    st.token,
    r.game_id,
    r.version,
    r.created_at,
    (select count(*) from run_events e where e.run_id = r.id)
  from profiles p
  left join runs r on r.user_id = p.user_id
  left join lateral (
    select t.token
    from share_tokens t
    where t.run_id = r.id and t.revoked = false
    order by t.created_at asc
    limit 1
  ) st on true
  where p.user_id = v_user
    and (r.id is null or st.token is not null); -- unshared runs never appear
end;
$$;

grant execute on function public.get_profile(text) to anon, authenticated;

-- Big-beats feed for the signed-in caller: latest boss clears / deaths /
-- wipes / endings from followed users' SHARED runs, newest first. Bounded,
-- polled, authenticated-only.
create or replace function public.get_feed(p_limit int default 30)
returns table (
  handle text,
  display_name text,
  run_token uuid,
  game_id text,
  version text,
  seq integer,
  at timestamptz,
  type text,
  payload jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    p.handle,
    p.display_name,
    st.token,
    r.game_id,
    r.version,
    e.seq,
    e.at,
    e.type,
    e.payload
  from follows f
  join profiles p on p.user_id = f.followee_id
  join runs r on r.user_id = f.followee_id
  join lateral (
    select t.token
    from share_tokens t
    where t.run_id = r.id and t.revoked = false
    order by t.created_at asc
    limit 1
  ) st on true
  join run_events e on e.run_id = r.id
  where f.follower_id = auth.uid()
    and e.type in ('milestone_cleared', 'faint', 'wipe_decision', 'run_ended')
  order by e.at desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100);
$$;

grant execute on function public.get_feed(int) to authenticated;
