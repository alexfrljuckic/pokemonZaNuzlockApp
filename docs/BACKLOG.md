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

**6. `feat/v1-import` — migrate pokemonZaNuzlockApp saves**
Importer for v1 localStorage/JSONBin JSON -> event log (synthesize events from
v1 state; imported runs flagged). Acceptance: a real v1 save round-trips into
a working run.

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

## Later phases

Remaining datasets (SwSh -> SV -> PLA), metrics dashboard + timeline, genlocke
campaigns (champion export/import, availability fallbacks), profiles +
follows, variants (soul link, monolocke, wedlocke).

## Standing rules for every PR

- Tests + `validate:datasets` green in CI before merge.
- No feature that breaks when `VITE_SYNC_ENABLED=false`.
- Honor rules are displayed, never silently enforced or dropped.
- Dataset PRs cite their sources.
