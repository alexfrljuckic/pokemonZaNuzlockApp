-- Security hardening (from the 2026-07-05 security audit, docs/SECURITY-AUDIT.md)
--
-- 1. search_profiles [audit M1]: ILIKE pattern metacharacters (%, _) in the
--    user-supplied query were live, so the two-character query "%%" matched
--    every profile — an anonymous full-table scrape defeating the function's
--    own "no list-everyone surface" intent. Escape \, % and _ in the input and
--    match with an explicit ESCAPE clause so the query is always a literal
--    prefix. The >=2 length guard stays measured against the raw trimmed input.
--
-- 2. run_events RLS [audit L3]: the original "run_events are owner-only"
--    policy was FOR ALL, which silently granted the owner UPDATE and DELETE —
--    contradicting the init migration's stated append-only design and letting
--    an owner rewrite history that spectators/followers are shown as a
--    faithful log. Split into SELECT + INSERT only. Safe because:
--    - sync pushes events with ignoreDuplicates (ON CONFLICT DO NOTHING — no
--      UPDATE ever issued), and
--    - run deletion cascades from `runs` via the FK (cascades are not blocked
--      by the absence of a DELETE policy here).
--    `runs` deliberately keeps FOR ALL: pushRun really upserts the summary row
--    (needs UPDATE) and run deletion needs DELETE on `runs`.

create or replace function public.search_profiles(p_query text, p_limit int default 10)
returns table (
  handle text,
  display_name text
)
language sql
security definer
set search_path = public
as $$
  with q as (
    select
      btrim(p_query) as raw,
      replace(replace(replace(btrim(p_query), '\', '\\'), '%', '\%'), '_', '\_') as pat
  )
  select p.handle, p.display_name
  from profiles p, q
  where length(q.raw) >= 2
    and (
      p.handle ilike q.pat || '%' escape '\'
      or p.display_name ilike q.pat || '%' escape '\'
    )
  order by
    (p.handle ilike q.pat || '%' escape '\') desc,
    p.handle
  limit least(greatest(p_limit, 1), 25);
$$;

grant execute on function public.search_profiles(text, int) to anon, authenticated;

-- Append-only event log, now enforced at the database layer.
drop policy if exists "run_events are owner-only" on public.run_events;

drop policy if exists "run_events owner select" on public.run_events;
create policy "run_events owner select"
  on public.run_events
  for select
  using (exists (select 1 from public.runs r where r.id = run_id and r.user_id = auth.uid()));

drop policy if exists "run_events owner insert" on public.run_events;
create policy "run_events owner insert"
  on public.run_events
  for insert
  with check (exists (select 1 from public.runs r where r.id = run_id and r.user_id = auth.uid()));
