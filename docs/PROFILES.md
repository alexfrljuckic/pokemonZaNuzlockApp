# Profiles + follows — design (backlog 35)

Status: DESIGN AGREED with Alex 2026-07-05 (feed scope below is his pick).
Implementation not started. Builds on the share-link/Supabase layer; must
stay degrade-to-free (docs/COSTS.md) — with `VITE_SYNC_ENABLED=false` none
of this renders and nothing breaks.

## Decisions (Alex, 2026-07-05)

- **Feed v1 = big beats only**: boss clears, deaths, wipes, victories from
  followed users' shared runs. Catches/items/trainers stay out (noise +
  read volume). `DescribedEvent.tone` already classifies these
  (`milestone`, `faint`, `wipe`) — the filter is the same mechanism as the
  33a timeline filters.

## Privacy model (unchanged from share links)

A profile aggregates ONLY runs the user explicitly shared. Runs stay
private by default; revoking a share removes the run from the profile and
the feed. No new data leaves the device beyond what sharing already
pushes.

## Data model (Supabase)

- `profiles`: `{ user_id PK, handle UNIQUE (lowercase, [a-z0-9-]),
  display_name, created_at }` — created on first "set up my profile";
  no auto-provisioning.
- `follows`: `{ follower_id, followee_id, created_at, PK (follower,
  followee) }` — RLS: insert/delete own follower rows; select where
  follower_id = auth.uid() (private follow lists v1).
- Profile page reads via a SECURITY DEFINER RPC like the spectator one
  (token-less but handle-scoped): returns the profile row + its shared
  runs' summaries (game, version, status, counts) — same pattern and the
  same caution comments as the existing spectator RPC migration.
- Feed: RPC `feed_for(user)` that unions the last N big-beat events from
  followed users' shared runs (server-side filter on event type:
  milestone_cleared / faint / wipe_decision / run_ended). Poll on open —
  NO realtime subscription for feeds (realtime stays spectator-only, per
  COSTS.md metering).

## Pages

- `/u/<handle>`: display name, shared-run cards (status chips, game
  logos), aggregate strip (victories, active runs). Follow button when
  logged in.
- Feed: a section on the run-picker screen ("From people you follow"),
  not a separate tab — cheap entry point, no new nav.

## Cost guardrails

Reads are RPC-bounded (LIMIT on feed, summary-only profile queries);
no fan-out writes; no realtime; profile pages are anonymous-readable but
only expose already-shared data. Free-tier keep-alive unaffected.

## Out of scope v1

Public follower lists / counts, discovery directory, notifications,
avatars (Dicebear-style generated initials only), blocking (revoke-share
covers the abuse surface at this scale).

## Test plan

Web: profile/feed components render from fixture RPC payloads; sync-off
renders nothing. RLS: migration comments + manual matrix like the
share-link one (owner/anon/other-user reads).
