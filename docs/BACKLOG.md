# Backlog

Ordered, PR-sized. Each item lists acceptance criteria. Phases refer to
`docs/nuzlocke-tracker-plan.md`.

## Shipped (items 0-15) — for history only, see git log for PR numbers

Push + first PR; species-lines evolution map (PR #4); BDSP dataset (#5); LGPE
dataset (#6); web-shell scaffold (#7); web-tracker five tabs (#8); Supabase
schema/RLS + share-links + keep-alive/backup Actions (#11-13, #21); trainer
rosters schema + data (#14); SwSh dataset (#16); level-cap-flag +
bdsp-ace-levels corrections (#24-25); UX overhaul sections A-E (#18, #19-20,
#24-27, #28, #31); starter + gifts/specials selection + starter-conditional
Barry rosters (#39-40); type-effectiveness + game-picker/team-box
click-to-expand UI (#41 and the two commits after it). `v1-import` was
dropped 2026-07-03 (v1 runs aren't carried forward).

## What's actually next

Nothing is currently DECIDED-but-unbuilt. Alex last confirmed (2026-07-04)
everything through the type-effectiveness + click-to-expand work is merged
and the tree is clean. Candidates for the next round, roughly in order of
likely value — pick one or ask Alex:

- **SV/PLA datasets** — deliberately deferred until after the UX round
  (now finished); the next full new-game dataset work.
- **Known gaps below** — small, well-scoped, no new decision needed.
- **Later phases** — bigger, needs scoping first (metrics dashboard/timeline,
  genlocke campaigns, profiles+follows, variants).

## UI ideas (2026-07-04, Alex — expand-on-click patterns) — DONE

- **Game picker → click-to-expand run settings**: done — PR merged
  (`game picker expands run settings in place`, commit 1187d4d).
  `apps/web/src/screens/RunPicker.tsx`.
- **Box/Team → click sprite to expand into edit mode**: done — PR merged
  (`click a team/box Pokémon to expand straight into edit`, commit f9d1a5b;
  unified team/box cards, commit d994a18). `TeamBoxTab.tsx`.

## Known gaps / follow-ups (no decision needed, just work)

- **Type display + matchups (2026-07-04)**: DONE — PR #41
  (`feat/type-effectiveness`, commit 3013904). Type badges + move-type dots
  now shown on collapsed milestone roster sprites, box-grid slots, and team/
  box detail; a static type-chart flags a boss's weaknesses and highlights
  super-effective moves against the next boss.

- **SwSh milestone rosters**: DONE — PR #27 backfilled gym/rival/champion
  rosters from Serebii.
- **Giant's Cap (SwSh) verification**: its Serebii Pokéarth page 404'd; the
  shipped encounter list was reconstructed from general knowledge, not a
  fetched table. Lower confidence than every other area — verify against
  Serebii/Bulbapedia and correct.
- **Faint dialog UX**: DONE — `window.prompt` removed; `TeamBoxTab.tsx` no
  longer asks for cause of death via a browser prompt (see UX section A).
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

UX overhaul round is complete (sections A-E all merged). Remaining, not yet
scoped: SV → PLA datasets, metrics dashboard + timeline, genlocke campaigns
(champion export/import, availability fallbacks), profiles + follows,
variants (soul link, monolocke, wedlocke).

## Standing rules for every PR

- Tests + `validate:datasets` green in CI before merge.
- No feature that breaks when `VITE_SYNC_ENABLED=false`.
- Honor rules are displayed, never silently enforced or dropped.
- Dataset PRs cite their sources.
