# Backlog

Ordered, PR-sized. Each item lists acceptance criteria. Phases refer to
`docs/nuzlocke-tracker-plan.md`. Last reconciled with git history:
2026-07-05 session END (PRs #112–#137 merged; numbered backlog EMPTY) —
when in doubt, trust `git log --oneline --merges main` over this file.

## NEXT SESSION STARTS HERE (state as of 2026-07-06, UX P1 shipped)

**App is LIVE at https://nuzlocke-tracker-app.vercel.app.** Auth is
OAuth-only (Google + Discord, verified end-to-end; magic-link email
REMOVED — rate limit). All Supabase migrations through
**20260706000000** are APPLIED (verified live: profile-not-found fixed,
search scrape blocked). Security headers verified live. No open PRs.

**Shipped 2026-07-06 (#148–#151, the full UX-audit P1 stack, merged in
order + deployed):**
- **#148 mobile stylesheet**: sticky bottom tab bar ≤520px (compact
  labels), touch-first map preview (first tap = species/rate tip, second
  tap resolves; mouse/keyboard unchanged), route-tip clamped to the map,
  44px zoom controls under pointer:coarse, minmax(min(100%,280px)) fixes
  320px overflow.
- **#149 desktop layout**: stats 2×3 chart grid (+ cross-run screen),
  Rules 2-col, expanded-card span caps (milestone→2, mon→3), 820px
  tablet breakpoint (#root 960 + map cap lifted), active-tab ring +
  per-tab counts (Team & Box · n, Boss Fights c/t). Team/Box
  side-by-side was built then REVERTED — **Alex prefers those sections
  stacked vertically**; don't reintroduce.
- **#150 onboarding/copy**: title-screen "New to nuzlockes?" explainer
  (details/summary), Rules copy in plain English + enforced/honor
  legend (no backticks/event names), set-mode + dupes + headroom
  glosses. "frontier" is visual-only — map legend left for P2.
- **#151 keyboard a11y**: AreaList headers are real buttons w/
  aria-expanded; ProfileScreen run rows are real links; tabs are a full
  tablist (roving tabIndex + arrow keys, aria-selected); ONE global
  :focus-visible outline rule (outline so box-shadow:none overrides
  can't suppress it; out-specifies outline:none on map regions/boss
  cards); Combobox input ARIA (role/expanded/controls/activedescendant).

**Shipped 2026-07-05 late session (#139–#146, all merged + deployed):**
- **#139/#141/#142 auth**: Google+Discord OAuth (opt-in via
  `VITE_OAUTH_PROVIDERS`, REQUIRED for sign-in now); #141 hotfixed a
  TDZ prod crash (lesson: test env-gated code paths in their ENABLED
  state); #142 removed magic-link email.
- **#143 profiles**: get_profile not-found fix, landing-page trainer
  search (search_profiles RPC), self-service profile delete, back button
  on read-only routes. Account linking by verified email = intentional.
- **#140 + #144 UX**: docs/UX-AUDIT.md (4-dimension audit + follow-up
  assessment of the in-flight PRs) and fixes for every NF-* finding.
- **#145 security**: full-app audit CLEAN (report docs/SECURITY-AUDIT.md);
  hardened: LIKE-escape on search (M1), CSP/XFO/HSTS headers (M2),
  run_events now truly append-only (L3). L4 (realtime pings after share
  revocation) accepted + documented.
- **#146 P0 run robustness** (background-agent built, worktree recipe):
  ErrorBoundary + missing-dataset guard (the white-screen crash is FIXED),
  per-run Delete/Export on Continue (rows are real buttons w/ friendly
  names), confirm-on-destructive (Fainted / Reset route / Reset special)
  via shared ConfirmAction atom. Engine 90 / web 71 tests.

**Still on Alex (low priority):** custom SMTP if email ever returns;
review the landing-page social layout in person.

**CLI tooling:** Vercel CLI installed globally. Supabase CLI = `npx
supabase` (global npm install disabled on Windows).

## UX audit follow-ups remaining (docs/UX-AUDIT.md — P0, NF-* and ALL P1 are DONE)

Only **P2 polish** remains: color-only status glyphs, muted-text
contrast, silent level-input coercion (validate on blur + role=alert),
share-popover focus trap/restore, empty-state CTAs, reduced-motion for
looping keyframes (`animation: none`, not just duration 0),
UnevolveButton confirm-gating, graveyard duplicated across two tabs,
combobox reposition on mobile keyboard (visualViewport), map legend for
the frontier pulse. (Combobox ARIA: DONE in #151.)

Security follow-ups (docs/SECURITY-AUDIT.md): L4 realtime private
channels if ever adopted; dev-dependency major-bump pass (npm audit is
all dev-only).

Also still in the optional pool: catch-rate-by-zone / time-in-run stats
panels, code-splitting the 2.7 MB bundle (chunk warning in build), Z-A
movepool hand-curation, sync seq-collision (out of MVP).

## Shipped 2026-07-05 session, wave 2 (#121–#137)

Metrics item 33 complete (#128 timeline w/ filters, #129 headroom +
deaths-by-boss panels, #130 Your Stats cross-run screen); genlocke
designed then SHELVED (#123/#131/#132 — too few games; engine event
dormant); profiles + follows shipped (#134, design #123, migration
applied); engine warts fixed (#133 — house_rules_changed + 'wiped'
status, built by a parallel background agent); evolution feature
(#125–#127: branch choice, level bump, item-location hints, un-evolve;
nickname never changes; self-evos no-op); move pickers ordered
level→TM→TR→HM + columnar learnsets + un-evolve nets out of history
(#136); PLA per-zone maps from Alex's uploads (#124); docs #121/#122/
#135/#137.

## Shipped 2026-07-05 session, wave 1 (merge authorized mid-session)

- **#112 mobile map fix** — Alex reported the route map unusable on phones.
  RouteMap now fits the whole map to the screen and zooms/pans through the
  SVG viewBox (pinch, drag, +/−/reset). Mobile audit of all five tabs
  found no other overflow. Future nice-to-have: sticky mobile tab bar.
- **#113 item 25** — next-boss pick: `next_boss_set` event +
  `state.nextBossId`; `nextBoss()` prefers the pinned uncleared gating
  milestone, falls back to dataset order. "◎ next (your pick)" badge.
- **#116 item 26** (supersedes auto-closed #114) — per-game honor packs:
  PLA (use-only first catch, no crafted revives, no distortions,
  outbreak-shiny non-exemption on; noble two-attempt off), SV (raid +
  picnic-egg bans on; symmetric Tera off, hardcore enables it), Z-A
  (symmetric Mega off; `za-rogue-caps` enforced cap toggle).
- **#117 + #119 item 32 CLOSED** — LGPE X Defense rename; SwSh Ball Guy
  stadium gifts (8 — Spikemuth has no stadium lobby, Champion Cup rewards
  random/excluded); BDSP specialty-ball marts at ramanas-park + a new
  pokemon-league area.
- **#118 item 23 CLOSED** — `dlc-content` rule (swsh, default off; absent
  = legacy-visible): gates areas/milestones/specials + level cap;
  "Playing the DLC" checkbox at run creation. 9 IoA/CT milestones
  (post-champion tier; Klara=Sword/Avery=Shield; Mustard final G-Max
  Urshifu 75; Peony 70; Star Tournament excluded) + 31 specials
  (Kubfu, Diglett gifts, CT legendaries; Regigigas excluded —
  trade-locked raid). species-data 887.
- **#120 item 24 CLOSED** — PLA split into 81 areas / 942 slots (80 named
  sub-locations from Bulbapedia+Serebii per-location research, incl.
  Wayward Cave; arenas empty; distortion/outbreak-only species excluded;
  83 guaranteed alphas as `alpha`-method slots; statics re-anchored).
  New `alphas-count` rule (pla+plza, default off = alphas excluded).
  Hisui map zone nodes are now ZONE SELECTORS + chip row (the interim
  zone-switcher; per-zone backdrops still awaiting Alex's re-uploaded
  zone images). KNOWN BREAK: pre-split PLA runs reference dead zone ids.

**Where to work:** the canonical checkout is `C:\dev\nuzlocke-app` (moved
off OneDrive — its sync locks broke `git worktree`). Run `git pull` first.

## Alex's decisions on file (2026-07-06) — no need to re-ask

- **DLC: include everything** (bosses as milestones, legendaries as
  specials), gated per-run behind a "playing the DLC" toggle → item 23.
- **PLA: full 79-sub-location split** ("keep how people actually play it")
  → item 24. His five zone-map images from the 2026-07-05 session need
  RE-UPLOADING to apps/web/public/maps/ (chat images can't be saved by the
  assistant) before per-zone backdrops work; the dataset split can start
  from Serebii per-location spawn lists without them.
- **Z-A shops: skip for now.**
- **paldea.png: keep as-is.** Upscaling/SVG-converting can't add detail a
  678px source doesn't have (the browser already interpolates identically);
  a higher-res export is welcome whenever, drop-in, no recalibration.
- **Later phases: metrics dashboard + timeline, genlocke campaigns,
  profiles + follows are ALL wanted** (items 33-35). Variant modes
  (soul link etc.) are OUT OF SCOPE for now.

## Next up

**33. Metrics dashboard + timeline — SHIPPED 2026-07-05 (#128–#130).**
33a shared RunTimeline + tone filter chips (owner Stats section +
spectator parity); 33b Stats panels: level-cap headroom step-line
(headroomSeries prefix replay) + deaths-by-boss bars; 33c "Your Stats"
title-screen entry with cross-run aggregates via engine aggregateRuns
(abandoned runs counted but excluded, per Alex). Remaining design-doc
candidates (catch rate by zone, time-in-run) deliberately unshipped —
revisit on demand. Evolution feature (#125–#127, Alex's live request)
also landed this session: evolve/un-evolve with branch choice, level
bump, per-game item-location hints.

**34. Genlocke campaigns — SHELVED (Alex, 2026-07-05 late).** With only
six same-era games the champion-chain format doesn't have enough room;
revisit if/when the game roster grows. What exists stays: the design
(`docs/GENLOCKE.md`) and the merged `pokemon_imported` engine event
(#131 — harmless without UI, and useful for any future import feature).
Campaign store / import screen / campaign page: NOT built, on purpose.

**35. Profiles + follows — SHIPPED 2026-07-05 (#134).** Per PROFILES.md:
migration 20260705220000 (profiles + follows, owner-only RLS,
get_profile/get_feed SECURITY DEFINER RPCs — profile shows ONLY runs
with a live share token; revoke = vanish), #u/<handle> route, profile
setup chip, follow/unfollow, polled big-beats feed on the continue
screen. Migration APPLIED by Alex 2026-07-05 — profiles are live once the next web deploy ships.
Shipped in parallel with #133 (engine warts, background-agent built):
mid-run house-rules editing (`house_rules_changed`, audited) + proper
`wiped` status for wipe-reset (legacy logs still derive to abandoned).

**36. PLA per-zone map backdrops — SHIPPED 2026-07-05 (same session).**
Alex uploaded his six zone images (arc1–arc6) mid-session → renamed to
hisui-<zone>.webp/png, `zoneMaps` on GameAppConfig + ZONE_MAPS registry,
RoutesTab swaps the zone map in while a zone is active ("← All zones" to
return), 79 nodes calibrated to the printed in-game labels across the
five maps (wayward-cave stays list-only — the in-game map doesn't label
it; hisui-jubilife-village.png parked unused, the hub resolves from the
overview). Integrity test pins node ids ⊆ zone areas.

(Variant modes — soul link, wedlocke, monolocke — OUT OF SCOPE per Alex.)

**Sub-location names (now shipped as pla.json area ids in #120; kept here
only as the transcription of Alex's reference maps):**
- Obsidian Fieldlands: Aspiration Hill, Floaro Gardens, Horseshoe Plains,
  Grueling Grove, Worn Bridge, Deertrack Path, Deertrack Heights,
  Windswept Run, Nature's Pantry, Tidewater Dam, Obsidian Falls,
  Oreburrow Tunnel, Sandgem Flats, Ramanas Island, Lake Verity, The
  Heartwood, Grandtree Arena.
- Crimson Mirelands: Brava Arena, Shrouded Ruins, Cloudpool Ridge,
  Diamond Heath, Diamond Settlement, Lake Valor, Solaceon Ruins, Golden
  Lowlands, Bolderoll Slope, Scarlet Bog, Cottonsedge Prairie, Gapejaw
  Bog, Droning Meadow, Sludge Mound, Ursa's Ring, Holm of Trials.
- Cobalt Coastlands: Islespy Shore, Molten Arena, Firespit Island, Spring
  Path, Seagrass Haven, Windbreak Stand, Veilstone Cape, Castaway Shore,
  Lunker's Lair, Tranquility Cove, Ginkgo Landing, Crossing Slope, Sand's
  Reach, Aipom Hill, Deadwood Haunt, Bathers' Lagoon, Tombolo Walk,
  Hideaway Bay.
- Coronet Highlands: Temple of Sinnoh, Cloudcap Pass, Moonview Arena,
  Celestica Ruins, Sacred Plaza, Clamberclaw Cliffs, Stonetooth Rows,
  Primeval Grotto, Celestica Trail, Lonely Spring, Bolderoll Ravine,
  Sonorous Path, Ancient Quarry, Fabled Spring, Wayward Wood, Heavenward
  Lookout.
- Alabaster Icelands: Lake Acuity, Glacier Terrace, Snowfall Hot Spring,
  Pearl Settlement, Heart's Crag, Icepeak Arena, Avalugg's Legacy,
  Arena's Approach, Bonechill Wastes, Avalanche Slopes, Whiteout Valley,
  Icebound Falls.
- (Jubilife Village is the hub — items/vendors, no wild sub-areas.)

2026-07-05/06 feedback round (PRs #97-#98): **victory-road-swsh removed
(#97, supersedes #77)** — 58 SwSh areas; **items 27-30 (#98)** —
frontierAreas sliding-window selector (up-next highlighting advances on
every resolve; glow strengthened with fill pulse + halo), compact one-row
trainer cards, always-visible item chips with item_picked/item_reset
pickup tracking, picker titles drop the Pokémon prefix.

2026-07-05 challenge/UX round (PRs #89-#93): **level-up learnsets (#89)** —
levelUpMovesByGame generated data, learn-level badges in the move picker,
collapsible per-mon learnset section; **trainer battle tracking (#90)** —
trainer_battled/trainer_reset events, boss-fight-scale trainer cards with
documented-or-expected movesets (last four level-up moves at level, never
invented, labelled); **back button into run header (#91)**; **route items
(#92)** — items schema field + Items here panel + 1,033 sourced pickups
(BDSP 339 / LGPE 230 / SwSh base 193 / SV 271 TM-checklist-flavored);
**challenge-modes research (#93)** — docs/CHALLENGE-MODES.md: all three
unconventional games stay supported; spawned items 24-26.

Otherwise items 0-22 are all shipped (see below and git log). What's left
lives in "Deferred / low priority" (deliberate skips), "Later phases"
(needs a scoping conversation with Alex), and the in-flight PR #77. If any
region's original-SVG backdrop (Paldea/Hisui) ever gets replaced with
uploaded art (as Lumiose was in #87), keep the node ids and recalibrate
coordinates against the new image.

## Deferred / low priority

- **Z-A movepools**: PokeAPI has no move-learn data for `legends-za` /
  `mega-dimension` at all, so Z-A uses the union-fallback pool (documented in
  `speciesData.ts`). Only fixable by hand-curating movepools — skip unless it
  actually bothers someone mid-run.
- **Sync seq-collision edge case**: two devices appending to the same run
  while both offline and never-synced can collide on `seq` (documented in
  `apps/web/src/lib/db.ts`). Full CRDT-style resolution deliberately out of
  MVP scope.
- Small nice-to-haves: sticky mobile tab bar; remaining 33b panels
  (catch-rate-by-zone, time-in-run).
- (The old "engine event-schema gaps" entry SHIPPED in #133:
  house_rules_changed + the 'wiped' status.)

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

2026-07-05 late sweep (PRs #79-#84): **Galar map (#79)**, **Kanto
calibration (#80)**, **darmanitan sprite alias, was item 22 (#81)**,
**Paldea map w/ original SVG backdrop (#82)**, **SwSh missing areas, was
item 21 (#83)** — route-8 (31 slots incl. Steamdrift, + the 5 parked
trainers) and galar-mine-no-2 (12 slots, 5 trainers) with map nodes;
route-7 unlockAfter corrected gym-4 → gym-5-opal (reached after Ballonlea
per progression); **Hisui + Lumiose maps (#84)** — item 18 COMPLETE, all
six games have interactive maps. Original-SVG backdrop pattern for regions
without IP-safe art: hand-authored flat-color schematic in
public/maps/<region>.svg (paldea/hisui/lumiose); Lumiose is deliberately
schematic (zones ringed by number, hyperspace zones off-map on purpose);
**Sinnoh nodes for the #73 areas (#85)** — the last 18-leftover crumb;
**Lumiose real map (#87)** — Alex's uploaded city map replaced the
schematic SVG, 20 nodes recalibrated to actual badge positions via
pixel-luminance search; **SwSh DLC (#88)** — Isle of Armor (16 zones/317
slots) + Crown Tundra (14 zones/350 slots) with wild-area-convention
encounter tables (weather + version splits verified against official
exclusives lists), Galar map nodes on both insets, 859 species after
regen, five PokeAPI default-variety slug fixes (frillish-male etc.) + a
sprite-alias sweep for form-suffixed slugs.

## Standing rules for every PR

- Tests + `validate:datasets` green in CI before merge.
- No feature that breaks when `VITE_SYNC_ENABLED=false`.
- Honor rules are displayed, never silently enforced or dropped.
- Dataset PRs cite their sources; lower-confidence data is flagged in the PR
  body, never silently shipped as fully-sourced.
- Generated files (`species-data.json`, `species-lines.json`) are never
  hand-merged — resolve conflicts by regenerating against the merged
  dataset state.
