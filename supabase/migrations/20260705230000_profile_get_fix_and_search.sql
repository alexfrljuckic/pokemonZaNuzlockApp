-- Profile fixes + discovery search (follow-up to 20260705220000_profiles_follows)
--
-- 1. get_profile() bug: a claimed profile 404'd ("PROFILE NOT FOUND") the moment
--    its owner had any run that wasn't currently shared. The old body left-joined
--    runs to the profile and then filtered `r.id is null OR st.token is not null`
--    in the WHERE — so when ALL of a user's runs were unshared, every row (incl.
--    the profile header) was filtered out and the function returned zero rows.
--    Fix: join only SHARED runs via a lateral subquery hung off the profile, so
--    the profile row is always present (with null run columns when nothing is
--    shared) and unshared runs simply produce no run rows.
--
-- 2. search_profiles(): handle/display-name prefix search so people can actually
--    find each other. The profiles table is owner-only RLS; this SECURITY DEFINER
--    function exposes ONLY the public (handle, display_name) pair, prefix-matched,
--    bounded, and empty-query-safe.

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
    sr.token,
    sr.game_id,
    sr.version,
    sr.run_created_at,
    sr.event_count
  from profiles p
  -- Only SHARED runs produce rows here; a profile with none yields a single
  -- row with null run columns (the header still appears).
  left join lateral (
    select
      st.token,
      r.game_id,
      r.version,
      r.created_at as run_created_at,
      (select count(*) from run_events e where e.run_id = r.id) as event_count
    from runs r
    join lateral (
      select t.token
      from share_tokens t
      where t.run_id = r.id and t.revoked = false
      order by t.created_at asc
      limit 1
    ) st on true
    where r.user_id = p.user_id
  ) sr on true
  where p.user_id = v_user;
end;
$$;

grant execute on function public.get_profile(text) to anon, authenticated;

-- Public profile discovery: prefix match on handle or display name. Empty/short
-- queries return nothing (no "list everyone" surface); results are bounded.
create or replace function public.search_profiles(p_query text, p_limit int default 10)
returns table (
  handle text,
  display_name text
)
language sql
security definer
set search_path = public
as $$
  select p.handle, p.display_name
  from profiles p
  where length(btrim(p_query)) >= 2
    and (p.handle ilike btrim(p_query) || '%' or p.display_name ilike btrim(p_query) || '%')
  order by
    -- exact/handle-prefix matches first, then by handle
    (p.handle ilike btrim(p_query) || '%') desc,
    p.handle
  limit least(greatest(p_limit, 1), 25);
$$;

grant execute on function public.search_profiles(text, int) to anon, authenticated;
