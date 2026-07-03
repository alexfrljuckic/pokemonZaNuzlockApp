# UX Overhaul Plan (from Alex's feedback, 2026-07-03)

Alex's verbatim goals: modern + "pokemon-y" feel; icon-based game selection
(no dropdown) with subsettings after selection; per-game signature color
themes switchable anytime (default dark stays); a "New Game / Continue"
title flow; a recent-events summary at the top of an open run; Areas renamed
to Routes with an interactive game map (per-area Pokémon + trainers with
teams/levels/items/IV-EV/moves), rolled out one game at a time; in-depth
editable team profiles (name, nickname, level, items, moves, natures) with
box Pokémon carrying the same data but sprite-only visuals in a PC-box-style
grid; faint flow with NO prompt (seamless moves); milestones as trainer
cards with Pokémon sprites + expandable team details instead of a long list;
rules UI restyled to match; stats made visual (graphs); Share tab
consolidated elsewhere.

## Standing constraints

- **IP caution (plan §10)**: no official artwork beyond community-standard
  sprites. Concretely: game "icons" are stylized color cards/pokeball motifs
  (not box art); route maps are schematic SVGs we draw (not ripped game map
  art); Pokémon sprites come from PokeAPI's sprite CDN
  (`raw.githubusercontent.com/PokeAPI/sprites/...` by species slug); trainer
  sprites, if used, from a community-standard source (decide in section C —
  fallback is styled initials/type-colored cards, zero IP risk).
- **Trainer IV/EV data**: largely undocumented for most story trainers.
  Ship levels/items/moves where Serebii documents them; IV/EV only where a
  source actually exists (some BDSP bosses have documented EVs). Never
  invent.
- **Engine purity**: editing team details needs a new audited event type
  (`pokemon_updated`), folded through `deriveState` like everything else.
  No derived-state storage.
- Every section = one PR, CI green, verified in the browser before opening.

## Sections (implement in order)

### A. `feat/ux-a-themes-title` — theme system + title flow  ✅ foundation
- Refactor `index.css` to CSS custom properties (design tokens).
- Themes: `default-dark` (current palette) + per-game signature palettes —
  plza (Lumiose red/dark), bdsp (Dialga blue / Palkia pink accents), lgpe
  (Pikachu yellow / warm brown), swsh (Sword cyan / Shield magenta).
  Persisted in localStorage, switchable anytime from a header control.
- Title screen: "New Game" / "Continue" choice before anything else.
  Continue → existing runs list; New Game → game picker.
- Game picker: clickable stylized game cards (game color + name + simple
  pokeball motif), replacing the dropdown. Version/preset/house-rules
  subsettings appear after a game is picked.
- Quick win folded in: remove the `window.prompt` faint dialog entirely —
  faint is one click, no cause/killer questions (drop the fields from the
  UI only; the event payload keeps supporting them for future use).

### B. `feat/ux-b-team-box` — team profiles + PC box
- Engine: add `pokemon_updated` event (payload: pokemonId + any of
  nickname/level/heldItem/moves[]/nature) + `PokemonInstance` gains
  heldItem/moves/nature fields; `deriveState` folds it; tests.
- Team cards: PokeAPI sprite + nickname, species, level, item, nature,
  moves; owner-only inline edit form emitting `pokemon_updated`.
- Box: PC-style sprite grid (6-wide, box-like framing); click a sprite →
  same detail/edit panel. Party/box moves stay one click.
- Spectator view renders the same detail data read-only.

### C. `feat/ux-c-summary-milestones` — run summary + milestone cards
- Summary strip at top of an open run: last ~5 major events (catches,
  faints, milestones, wipes) in plain language with sprites where relevant.
- Milestones tab: card grid — trainer name + their roster as sprite rows;
  click to expand full team details (levels + items/moves where the
  dataset's roster has them). Backfill SwSh rosters here (research already
  done once; re-fetch from serebii swordshield/gyms + hop + championcup).
- Fold in BACKLOG items 12 + 13 (both DECIDED): `countsForLevelCap` flag
  (rivals display-only for the cap) and BDSP aceLevel corrections with a
  validator drift guard — they touch the same milestone data/UI.

### D. `feat/ux-d-stats-share` — visual stats + share consolidation
- Stats: hand-rolled SVG charts (no heavy chart dep) — encounter outcome
  donut, deaths-over-time strip, survival-by-species bars, milestone
  progress bar. Keep the raw numbers as captions.
- Share: remove the tab; move link management into a small popover/menu in
  the run header (visible when signed in + sync on).

### E. `feat/ux-e-routes-map-bdsp` — Routes tab + interactive map (BDSP first)
- Rename Areas → Routes everywhere user-facing.
- Schematic interactive Sinnoh SVG map (drawn by us, IP-safe): clickable
  route/area nodes laid out geographically; clicking opens that area's
  encounter pool + trainers.
- Dataset expansion: per-route trainers for BDSP (name, class, team:
  species/levels + items/moves where documented; IV/EV only where sourced).
  Schema addition: optional `trainers` array on areas. Validator updated.
  This is the biggest data lift — one game only; LGPE/SwSh/Z-A maps follow
  as separate items once the pattern is proven.
- Rules tab gets its restyle pass here too (match the new visual language).

## Status

- [ ] A — themes + title flow (+ faint prompt removal)
- [ ] B — team profiles + PC box (+ `pokemon_updated` engine event)
- [ ] C — summary + milestone cards (+ items 12/13, SwSh roster backfill)
- [ ] D — stats charts + share consolidation
- [ ] E — Routes map for BDSP (+ per-route trainers dataset + rules restyle)
