# Backlog

Ordered, PR-sized. Each item lists acceptance criteria. Phases refer to
`docs/nuzlocke-tracker-plan.md`. Last reconciled with git history: 2026-07-05
(PRs #72-#76 merged) — when in doubt, trust `git log --oneline --merges
main` over this file's checkboxes; it has drifted before.

**Where to work:** the canonical checkout is now `C:\dev\nuzlocke-app`
(moved off OneDrive — its sync locks broke `git worktree`; see the
worktree-isolation memory note). The old OneDrive copy is deletable; run
`git pull` in the new checkout first.

## In flight right now

**victory-road-swsh artifact investigation** — running in its own session
(spawned task). SwSh has no Victory Road location (Route 10 goes straight to
Wyndon) and the area's cave encounter table matches no base-game location;
that session will trace its origin and open a rename-or-remove PR. Don't
touch swsh.json's victory-road-swsh area until it lands.

## Next up (no decision needed — pick one and go)

**18. Route maps for the remaining games.** The map system is cross-game
(`apps/web/src/lib/maps/` registry — adding a game = one map file + one
registry line + a backdrop image in `public/maps/`). BDSP (Sinnoh) and LGPE
(Kanto) are done. Remaining, each its own small PR once an IP-safe backdrop
exists: **SwSh (Galar — galar.jpg backdrop is now committed in
apps/web/public/maps, so this is unblocked)**, **SV (Paldea)**, **PLA
(Hisui)**, **Z-A (Lumiose)**. Node calibration lesson from Kanto: do a live
pass with the debug overlay (temporarily stroke the `.route-region` rects)
before opening the PR. Also pending: the same live pass on the LGPE nodes
added for routes 7-25 + Victory Road in #52 (first-pass banner reads), and
Sinnoh map nodes for the four areas added in #73 (they currently render
under "Other areas").

**21. SwSh missing areas: route-8 + Galar Mine No. 2.** Surfaced by the #75
trainer pass. Add each area with its BDSP-style encounter table (Serebii
Galar Pokéarth), then attach trainers: Route 8's five battles are already
researched and parked in `docs/SWSH-TRAINER-NOTES.md`; Galar Mine No. 2's
(~4 + a Team Yell multi) still need research. One dataset PR per area or
both in one, either is fine.

**22. Showdown sprite alias for darmanitan-galar-standard.** PokeAPI's only
valid slug for Galarian Darmanitan is `darmanitan-galar-standard` (shipped
in #75 on Gentleman Glenn, Route 10), but Showdown's CDN keys the sprite as
`darmanitan-galar`, so he renders spriteless. Add a species→sprite-key alias
map in `lib/sprites.ts` (same pattern as TRAINER_ALIAS) + test. Tiny PR.

## Deferred / low priority (unchanged)

- **Z-A movepools**: PokeAPI has no move-learn data for `legends-za` /
  `mega-dimension` at all, so Z-A uses the union-fallback pool (documented in
  `speciesData.ts`). Only fixable by hand-curating movepools — skip unless it
  actually bothers someone mid-run.
- **Engine event-schema gaps**: no event type for editing `houseRules`
  mid-run (locked at run creation); wipe "reset" has no dedicated status
  transition (UI emits `run_ended(abandoned)` alongside
  `wipe_decision(reset)` as a workaround — documented in WipeScreen.tsx).
- **Sync seq-collision edge case**: two devices appending to the same run
  while both offline and never-synced can collide on `seq` (documented in
  `apps/web/src/lib/db.ts`). Full CRDT-style resolution deliberately out of
  MVP scope.

## Later phases (need a scoping conversation with Alex first)

Metrics dashboard + timeline; genlocke campaigns (champion export/import,
availability fallbacks); profiles + follows; variants (soul link, monolocke,
wedlocke).

## Shipped — one line each, see git log for detail

Items 0-15 (species-lines #4, BDSP #5, LGPE #6, web shell/tracker #7-8,
Supabase/share/keep-alive #11-13/#21, trainer rosters #14, SwSh #16,
level-cap-flag + aceLevel fixes #24-25, UX overhaul A-E #18-31, starter +
starter-conditional rivals #39-40, type-effectiveness + click-to-expand #41);
UX polish pass + species-data repair + validator guard (#42); Giant's Cap
rebuild from real Serebii data (#43); **Legends Arceus dataset (#44)**;
**cross-game route map + LGPE Kanto map + starter version-scoping (#45)**.
GitHub Actions secrets: set and verified 2026-07-03 (keep-alive/backup
workflows green). `v1-import` dropped 2026-07-03.

2026-07-04/05 sweep (PRs #46-#68): Kanto calibration (#46); per-game
movepools (#47); docs reorg (#48); phantom-species audit (#49); consolidation
plan + hosting docs (#50); **Wave-1 data (#52-#56)** — LGPE 10 missing routes
+ Victory Road + map nodes, LGPE rosters (rosterByStarter champion), PLA
movesets + Kamado, SwSh roster moves+abilities, Z-A rosters (13/35
well-sourced); **F1-F3 app features (#57)** — end-run-anytime, 1060px desktop,
theme-follows-game; **validator guards (#58)** — roster-move slugs +
rostersRequired; **machinesByGame (#59)** — per-game TM/HM/TR tags;
**consolidation C1-C8 (#60, #63-#67)** — games/<id>.ts config modules,
spectator parity via shared read-only components, RoutesTab split + atoms,
engine selectors, web vitest harness (20 tests), data-driven trainerSprite;
**Scarlet/Violet (#61-#62)** — 6th game, 16 areas / 29 milestones, teraType,
version-split finale/titan via milestonesFor; **Wave-3 trainers foundation
(#68)**. Repo moved off OneDrive to C:\dev\nuzlocke-app (worktree locks).

2026-07-05 sweep (PRs #72-#76): **trainer-card UI (#72)** — TrainersHere
rows are expandable cards with Showdown class sprites (trainerKeyFromClass)
+ per-mon detail (weaknesses, per-game move tags, stat bars via shared
StatBars); **BDSP missing areas, was item 20 (#73)** — routes 207/208,
Ravaged Path, Wayward Cave with encounters + 23 trainers (Austin-Chimchar
confirmed); **Wave-3 trainer passes, was item 19 (#74-#76)** — LGPE 204/28,
SwSh 93/18 (version-gated gym missions), SV 208/15 (Dalizapa folded into
glaseado-mountain); species-data.json regenerated at each merge (835
species). Research provenance + parked Route 8 trainers:
docs/SWSH-TRAINER-NOTES.md. GitHub Pages disabled same day (v1 leftover
serving raw source with flaky deploys; Vercel is the host — see DEPLOY.md).

## Standing rules for every PR

- Tests + `validate:datasets` green in CI before merge.
- No feature that breaks when `VITE_SYNC_ENABLED=false`.
- Honor rules are displayed, never silently enforced or dropped.
- Dataset PRs cite their sources; lower-confidence data is flagged in the PR
  body, never silently shipped as fully-sourced.
- Generated files (`species-data.json`, `species-lines.json`) are never
  hand-merged — resolve conflicts by regenerating against the merged
  dataset state.
