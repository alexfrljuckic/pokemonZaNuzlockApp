# Consolidation plan — code assessment before the next game lands

Assessed 2026-07-04 (Alex's ask: before starting Scarlet/Violet, find what
should be consolidated/restructured so features are reused across game
entries instead of re-plumbed per game). The web app is ~2,900 lines across
~25 files — small enough that none of this is urgent, but the items below
are ordered so the ones that make adding SV cheaper come first.

Each item is one PR. Standing rules from BACKLOG.md apply.

## C1. Single per-game app-config module (do this before SV)

**Problem:** registering a game currently touches six scattered places, and
nothing enforces completeness — you find out about a missed spot when the UI
looks wrong:
1. `apps/web/src/lib/datasets.ts` — `DATASETS` registry (import + entry)
2. `apps/web/src/screens/RunPicker.tsx` — `VERSION_MASCOT` per version
3. `apps/web/src/lib/theme.ts` — `THEMES` list (per version)
4. `apps/web/src/index.css` — `[data-theme='...']` palette blocks **and**
   `.game-card-<gameId> { --card-color }` (6 occurrences)
5. `apps/web/src/lib/maps/index.ts` — `GAME_MAPS` (when a map exists)
6. `apps/web/src/lib/sprites.ts` — `TRAINER_ALIAS` for milestone trainer
   sprites (see C8 for the data-driven alternative)

**Fix:** one module per game, e.g. `apps/web/src/games/bdsp.ts`, exporting a
typed `GameAppConfig { dataset, versionMascots, themes: {id,name}[], map?,
machines? }`, plus `games/index.ts` as the single registry. `datasets.ts`,
`RunPicker`, `theme.ts`, and `lib/maps` all derive from it. CSS palette
blocks stay in `index.css` (they're theme design, not registration), but
`--card-color` moves to an inline style fed from the config.

**Acceptance:** adding a hypothetical new game = 1 new `games/<id>.ts` + 1
registry line + CSS palette block; `grep -rn "gameId ===" apps/web/src`
returns nothing game-specific outside `games/`; a `games/index.ts` unit
check (or validator step) asserts every dataset in `packages/datasets/games`
has a config and every config has a mascot per version.

## C2. Spectator view feature parity via component reuse

**Problem:** `SpectatorView.tsx` hand-rolls plain text lists and has silently
fallen behind every feature shipped since UX section B — no sprites, no type
badges, no boss-fight cards, no summary strip, no stats charts, and its
"Timeline" prints raw event type names. It's a parallel implementation, so
every future feature will miss it again by default.

**Fix:** make the shared components render read-only instead: `MonCard`
(team/box/graveyard), `MilestoneCard`, `RunSummaryStrip`, `StatsTab`, and the
active-rules chips already exist — give them a `readOnly` prop (hide
actions/edit form) and compose SpectatorView from them. Replace the raw
timeline with `RunSummaryStrip`'s `describe()` (extract it to a shared
`lib/describeEvent.ts`).

**Acceptance:** spectator page shows the same cards/sprites/badges the owner
sees, minus buttons; no `pokemon-card`/`milestone-row` legacy markup left;
adding a future tab feature requires zero spectator-specific work unless it's
interactive.

## C3. Split RoutesTab.tsx (393 lines) + delete dead code

`RoutesTab.tsx` accreted `CaughtHere`, `EncounterForm`, `AreaList`,
`SpecialsHere`, `AllFilteredOut`, plus the tab itself. Move the components to
`apps/web/src/components/routes/` unchanged. Delete the dead `isUnlocked()`
(hardcoded `true` since the always-interactable decision; the comment's
intent lives on in `isFrontier`). Pure mechanical move, no behavior change —
good candidate to batch with C4.

## C4. Shared form/detail atoms (dedup markup that's already drifted)

- **Nickname/level/shiny field cluster**: duplicated between `EncounterForm`
  (RoutesTab) and `ClaimForm` (SpecialsSection) — same fields, same
  semantics, slightly different markup. Extract `<CatchFields>`.
- **"Weak to" row**: duplicated between `MilestonesTab` detail and
  `TeamBoxTab` MonCard (same `.mrd-weak` classes, hand-copied JSX). Extract
  `<WeaknessRow types={...}>`.
- **Move chips** (chip + type dot + TM/HM tag): duplicated in `TeamBoxTab`
  and `MilestonesTab` roster detail. Extract `<MoveChips moves={...}>`.
- **Starter-step wrapper** (heading + `StarterPicker` + skip semantics):
  duplicated between `RunPicker`'s post-create step and `RoutesTab`'s
  fallback. Fold the heading/label logic into `StarterPicker` itself.

## C5. Engine selectors — move pure state logic out of the UI

- `isFrontier()` lives in `RouteMap.tsx` but is pure `RunState` logic —
  move to the engine (new `selectors` export or `rules/`), with a test.
- `Object.values(state.pokemon).filter(status === ...)` is repeated in
  `TeamBoxTab`, `SpectatorView`, `RunSummaryStrip`, and `StatsTab` — add
  `party(state)` / `boxed(state)` / `fallen(state)` selectors to the engine.
- Engine stays pure TS (no DOM/network) — these all qualify.

## C6. Per-game TM/HM machine labels (follows the movesByGame pattern)

`machineType()` reads `bdsp-machines.json` and labels moves TM/HM in **every**
game's UI — wrong outside BDSP (different games have different machine
lists; PLA has none at all). Either (a) extend `build-species-data.mjs` to
emit `machinesByGame` the same way `movesByGame` works, or (b) short-term:
only show the badge when `gameId === 'bdsp'`. Do (b) inside C1's config
(`machines?` per game) and upgrade to (a) when a second game's machine list
is actually curated.

## C7. Web-app test harness (currently zero app tests)

All 33 tests live in the engine; `apps/web/src/lib` (speciesData fallback
logic, typeChart, sync merge, theme migration) has none. Add vitest to the
web workspace and start with the pure lib modules — `movesFor` fallback
(per-game → union), `weaknesses()`, `mergeRemoteEvents`. Not a coverage
crusade; just stop the pure logic from being verifiable only by clicking.

## C8. Data-driven trainer sprites (do alongside SV, not before)

`trainerKeyFromMilestone()` guesses a Showdown sprite key from the milestone
id's last segment plus a hardcoded alias map (`wake → crasherwake`). Per the
"game content is JSON, not code" principle, add an optional
`trainerSprite` field to the milestone schema and let datasets own it; keep
the guess as fallback. Cheap to do when SV's milestones are authored.

## Suggested order

| # | Item | Why this order |
|---|---|---|
| 1 | C1 config module | Directly cheapens SV registration; touches the most files, so do it while no other PR is open |
| 2 | C2 spectator parity | Biggest user-visible gap; friends spectating (see DEPLOY.md) will hit it immediately |
| 3 | C3+C4 splits/atoms | Mechanical; one combined PR is fine |
| 4 | C5 engine selectors | Small, with tests |
| 5 | C7 web tests | Infrastructure; any time |
| 6 | C6, C8 | Defer until a second machine list / SV milestones exist |
