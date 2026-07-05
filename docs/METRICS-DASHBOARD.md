# Metrics dashboard + timeline — design (backlog 33)

Status: DESIGN, awaiting Alex's review. Written 2026-07-05. Item 33 is
"WANTED" per Alex; the backlog asks for a short design pass before code.

## Goals

1. Give owners the same readable, sprite-annotated **timeline** spectators
   already get, filterable.
2. Grow the Stats tab into a **per-run dashboard** beyond the current four
   strips.
3. Add **cross-run aggregates** (deaths by species/area, win rate) — the
   first feature that reads across runs.

## Constraints (standing)

- Everything derivable from the event log — no new event types, no derived
  state stored as truth. `deriveState` + `describeEvent` already carry
  almost all of this.
- Local-first: cross-run reads come from IndexedDB (`lib/db.ts` run list +
  per-run event logs). Zero Supabase dependency; works with
  `VITE_SYNC_ENABLED=false`.
- No chart library — the four existing hand-rolled chart components
  (donut, strips, bars) set the pattern; new charts follow it.
- Engine stays pure: any new selectors (e.g. `deathsByArea(state)`) land in
  `packages/engine/src/selectors.ts` with tests.

## Phases (each is one PR)

### 33a — Owner timeline (smallest, highest value)

SpectatorView already builds `timeline = events → describeEvent → list`.
Extract that into `components/RunTimeline.tsx` (shared read-only component,
same pattern as the C2 spectator-parity extraction) and render it for
owners — either a collapsible section at the bottom of Stats or a sixth
tab (**decision for Alex**; recommendation: section in Stats, tab count is
already 5 and mobile wraps the tab bar at 2 rows).

Filters: chip row over the list — All / Catches / Deaths / Bosses / Rules —
mapping to `DescribedEvent.tone` (`catch | faint | milestone | wipe |
neutral`). Client-side filter, no engine work.

### 33b — Per-run dashboard extensions

Candidate panels, all fold-derivable; pick during implementation review:

- **Catch rate by zone/area group** (bar per zone; PLA zones and SwSh DLC
  tags make natural groups; classic games group by unlockAfter bands).
- **Level-cap headroom** (party max level vs current cap over event seq —
  line strip; reuses `nextBoss` history by replaying prefixes; cheap at
  our event-log sizes).
- **Deaths by boss/milestone** (faint events carry `milestoneId`).
- **Time-in-run** (first/last event timestamps per status).

### 33c — Cross-run aggregates

New screen (entry from RunPicker: "Your stats") that loads all local runs'
event logs, derives each, and aggregates:

- Win rate (victory / abandoned / wiped-continuing counts).
- Deaths by species and by area across runs.
- Most-used species (party appearances), average run length.

Implementation notes:

- `lib/db.ts` already lists runs; add a `loadAllRuns()` that maps
  `loadEvents` + `deriveState` per run — dozens of runs × hundreds of
  events is fine synchronously; if it ever isn't, chunk with
  `requestIdleCallback`.
- Aggregation helpers live in the engine (pure, tested):
  `aggregateRuns(states: RunState[]): CrossRunStats`.
- Spectator parity: cross-run stats are owner-only (share links expose one
  run); no RLS/anon-exposure surface. Degrade-to-free by construction.

## Out of scope (per earlier decisions)

Variant modes; anything requiring new event types; server-side aggregation.

## Open questions for Alex

1. Timeline placement: Stats section (recommended) or sixth tab?
2. Which 33b panels are actually wanted vs. noise?
3. Should cross-run stats include abandoned runs by default?
