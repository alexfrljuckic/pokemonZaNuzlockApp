# Backlog

Ordered, PR-sized. Each item lists acceptance criteria. Phases refer to
`docs/nuzlocke-tracker-plan.md`.

## Immediate

**0. Push + first PR** — push `main` and `feat/plza-dataset` to GitHub, open the
PR, confirm CI green, merge.

**1. `feat/species-lines` — evolution-line map from PokeAPI**
Build-time script `packages/datasets/scripts/build-species-lines.mjs` that walks
PokeAPI `/evolution-chain` and emits `packages/datasets/generated/species-lines.json`
(`{ "bunnelby": "chain-someid", "diggersby": "chain-someid", ... }`). Cache
responses to disk so re-runs don't hammer the API; commit the generated file.
Acceptance: engine tests import the real map instead of hand-written stubs;
regional forms map to their own line where PokeAPI says so.

**2. `feat/bdsp-encounters` — complete BDSP dataset**
Author all BDSP areas/encounters from Serebii (routes, caves, lakes, surf/fish
methods, time-of-day conditions, version exclusives), plus specials (fossils,
gift Eevee, Togepi egg, honey trees as a tagged method) and the Grand
Underground rooms as sub-tagged entries. Add `unlockAfter` gating where clear.
Acceptance: validator green; spot-check 5 routes against Serebii in the PR
description; engine test for a version-exclusive filter and a time condition.

**3. `feat/lgpe-dataset` — Let's Go Pikachu/Eevee**
Small dex, catch-only encounters. Mechanics flags: `wildBattles: false`,
`heldItems: false`. Milestones: Kanto gyms + rival fights with ace levels.
Acceptance: validator green; a rules note that "first encounter" = first catch
opportunity (engine already supports it — encounters just resolve as
caught/failed/skipped).

## Phase 1 — the web app

**4. `feat/web-shell` — Vite + React + TS PWA scaffold in `apps/web`**
Workspace wiring to `@nuzlocke/engine` and datasets; IndexedDB event store
(idb); run create/select screen (game + version + preset picker); PWA manifest
+ service worker. `VITE_SYNC_ENABLED` respected from day one (default false —
there is no backend yet). Acceptance: `npm run dev` works; creating a run
persists events across reload; engine remains the only source of derived state.

**5. `feat/web-tracker` — the five tabs**
Areas (encounter pool per area under active rules, resolve caught/failed/
skipped), Team & Box (party of 6, box, graveyard with cause of death), Bosses/
Milestones (level caps shown, clear button, token grants), Rules (preset +
toggles + params + house rules; mid-run changes emit `rule_changed`), Stats
(from the event log). Wipe screen when `pendingWipeDecision(state)`.
Acceptance: full Z-A and BDSP runs trackable end to end offline.

**6. ~~`feat/v1-import` — migrate pokemonZaNuzlockApp saves~~ — Dropped**
(2026-07-03) — not needed; v1 runs aren't being carried forward.

## Phase 2 — accounts, sync, sharing (needs Supabase project)

**7. `feat/supabase` — schema migrations + RLS** (tables per plan §6), auth,
background event sync (union-merge by seq/timestamp), `VITE_SYNC_ENABLED`
gate verified. **8. `feat/share-links`** — share tokens, read-only RLS,
realtime spectator view, wipe + rule-change audit visible. **9. keep-alive +
nightly pg_dump GitHub Actions** per `docs/COSTS.md`.

**10. `feat/trainer-rosters` — track full battle rosters, not just ace level (TODO, needs scoping)**
Gap noticed while building the tracker: `Milestone` (`packages/datasets/schema/game.schema.json`)
only carries a single `aceLevel` number per boss. Two things are missing for
real nuzlocke play:
  - *Which battles count as milestones at all.* Datasets currently only
    model gym/noble/promotion + Elite Four + champion fights. Depending on
    ruleset, rival battles, evil-team boss fights, and other notable story
    battles are also commonly tracked (some rulesets key level caps or
    "boss battle" honor rules off them) — needs a per-game curation pass to
    decide which non-gym/E4/champion battles become milestones, cited like
    any other dataset content.
  - *Full team rosters, not just the ace.* Players plan around a boss's
    whole team (species, level, moves, ability, held item), not just the
    ace's level. `aceLevel` should stay as-is (the level-cap rule already
    keys off it — don't change its meaning), but milestones need an
    additional optional `roster` field (array of
    `{ species, level, moves?, ability?, heldItem? }`) for informational
    display in the Milestones tab.
Acceptance: schema + validator updated (roster optional, backward
compatible — existing datasets validate unchanged); at least one game's
milestones re-authored with full rosters + sources cited; Milestones tab
shows the roster when present; level-cap math still reads only `aceLevel`.

**11. `feat/swsh-dataset` — Sword/Shield**
Author SwSh routes + a representative slice of the Wild Area (weather-
dependent spawns via the existing `conditions.weather` field — no schema
change needed) from Serebii. Raid dens tagged `methods: ["max-raid"]` on the
relevant Wild Area sub-zone entries (optional encounter source per the
product plan — no dedicated raid concept in the schema yet, this is
deliberately a lightweight fit rather than a new abstraction). Milestones:
8 gyms + Champion Cup (semi-final + final) + a couple of Hop rival battles,
mirroring the BDSP dataset's rival-milestone approach from item 10.
Mechanics: `wildBattles: true, heldItems: true, setModeOption: true,
raids: true, overworldAggro: false`. Acceptance: validator green; ≥5 routes
+ Wild Area zones cited in the PR description; a rule note or engine test
covering weather-conditioned encounters (the `conditions.weather` field
exists in the schema but no dataset has exercised it yet).

## Decided 2026-07-03, not yet implemented (do these next)

**12. `feat/level-cap-flag` — rival battles are display-only for the cap. DECIDED.**
Alex decided (2026-07-03): rival battles should NOT gate the enforced level
cap. Implement after PR #14 (feat/trainer-rosters) merges: add optional
`countsForLevelCap?: boolean` (default true) to the milestone schema +
`Milestone` type; set it `false` on the 3 BDSP `rival-*-barry` milestones
and SwSh's 2 `rival-hop-*` milestones (after PR #16 merges); filter on it in
`nextBoss()` (`packages/engine/src/rules/index.ts`). Acceptance: engine test
proving a fresh hardcore BDSP run's `nextBoss()` returns Roark (14), not
Barry (9); rivals still render with rosters in the Milestones tab.

**13. `fix/bdsp-ace-levels` — correct aceLevel to match Serebii rosters. DECIDED.**
Alex decided (2026-07-03): `aceLevel` must equal the boss's actual
highest-level Pokémon per the Serebii-sourced rosters (PR #14 found
mismatches, e.g. Maylene aceLevel 32 vs her real ace Lucario Lv 30). After
PR #14 merges, sweep every BDSP milestone: set `aceLevel` =
max(roster[].level). Do the same check for SwSh after PR #16. Acceptance:
a validator or test rule asserting `aceLevel === max(roster level)` whenever
both exist, so future datasets can't drift.

## Known gaps / follow-ups (no decision needed, just work)

- **SwSh milestone rosters**: PR #16 shipped without them (`roster` field
  didn't exist on its base branch). The research was done — gym/rival/
  champion teams were gathered from Serebii in that session but not
  persisted. Re-fetch from `serebii.net/swordshield/gyms.shtml`,
  `.../hop.shtml`, `.../championcup.shtml` and add rosters after #14 + #16
  both merge.
- **Giant's Cap (SwSh) verification**: its Serebii Pokéarth page 404'd; the
  shipped encounter list was reconstructed from general knowledge, not a
  fetched table. Lower confidence than every other area — verify against
  Serebii/Bulbapedia and correct.
- **Faint dialog UX**: `TeamBoxTab.tsx` uses `window.prompt("Cause of death
  (optional)")` — a real user typed the literal word "optional" into it.
  Replace with an inline form. (Alex's real run has a Bidoof killed by
  "optional" as evidence.)
- **Engine event-schema gaps** (deferred, low priority): no event type for
  editing `houseRules` mid-run (locked at run creation); wipe "reset" has no
  dedicated status transition (UI emits `run_ended(abandoned)` alongside
  `wipe_decision(reset)` as a workaround — documented in WipeScreen.tsx).
- **Sync seq-collision edge case**: two devices appending to the same run
  while both offline and never-synced can collide on `seq` (documented in
  `apps/web/src/lib/db.ts`). Full CRDT-style resolution deliberately out of
  MVP scope.
- **GitHub Actions secrets** (Alex-only): add `SUPABASE_URL`,
  `SUPABASE_ANON_KEY`, `SUPABASE_DB_URL` at repo Settings → Secrets →
  Actions, then manually run both workflows once from the Actions tab
  (instructions in `supabase/README.md`). Until then, merged PR #13's
  keep-alive/backup workflows fail silently on schedule.

## Later phases

**UX/UI feedback round (NEXT — Alex is evaluating now, 2026-07-03).**
Remaining datasets (SV -> PLA — deliberately deferred until after the UX
round), metrics dashboard + timeline, genlocke campaigns (champion
export/import, availability fallbacks), profiles + follows, variants
(soul link, monolocke, wedlocke).

## Standing rules for every PR

- Tests + `validate:datasets` green in CI before merge.
- No feature that breaks when `VITE_SYNC_ENABLED=false`.
- Honor rules are displayed, never silently enforced or dropped.
- Dataset PRs cite their sources.
