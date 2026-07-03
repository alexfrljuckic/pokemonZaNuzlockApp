# Nuzlocke Tracker (working title)

Multi-game nuzlocke tracker for the mainline Switch-era Pokémon games. Successor to
[pokemonZaNuzlockApp](https://github.com/alexfrljuckic/pokemonZaNuzlockApp).
Full product plan lives in `docs/` (see nuzlocke-tracker-plan.md); cost policy in `docs/COSTS.md`.

## Layout

```
packages/
  engine/     Pure TypeScript rules engine. No DOM, no network. State is derived
              by folding an append-only event log (see src/state.ts). Rules are
              data (src/rules/index.ts) interpreted through fixed hooks.
  datasets/   Per-game JSON content + JSON Schema + validator. Content, not code:
              fixing an encounter table never requires touching the app.
apps/
  web/        (Phase 1) React PWA consuming engine + datasets.
docs/         Plan + cost runbook.
```

## Commands

```
npm install --workspaces --include-workspace-root
npm test                  # engine unit tests (vitest)
npm run validate:datasets # JSON Schema + referential integrity for every game file
```

## Status

Phase 0 complete: engine core (first-encounter, dupes clause by evolution line,
level caps, revive tokens, wipe detection with continue-for-fun, mid-run rule
change auditing) replays a synthetic run under test. BDSP dataset started
(early-game slice + full milestone list); Z-A port from v1 and LGPE are next.

## Data authoring notes

- Species use PokeAPI slugs; evolution-line mapping for the dupes clause is built
  from PokeAPI evolution chains at build time.
- Encounter tables for Switch games are hand-curated from Serebii/Bulbapedia —
  PokeAPI has no encounter data past Gen 7.
- Every dataset must pass `npm run validate:datasets` in CI.
