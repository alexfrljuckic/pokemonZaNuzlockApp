# Genlocke campaigns — design (backlog 34)

Status: DESIGN AGREED with Alex 2026-07-05 (import scope, fallback policy
and rule interactions below are his picks). Implementation not started.

## Concept

A campaign chains runs across games in sequence; the champion team
"graduates" into the next game. Event-sourced end to end — a campaign is
linked run ids plus import events, nothing else.

## Decisions (Alex, 2026-07-05)

1. **Import scope: surviving party only.** Up to 6 alive party members at
   the moment of victory graduate. Box and graveyard stay behind.
2. **Unavailable species: retire + free replacement pick.** If an imported
   mon's evolution line doesn't exist in the next game, it is shown as
   "retired" on the campaign page, and the player may nominate any species
   obtainable in the new game as its legacy successor (honor-level pick,
   recorded as part of the import).
3. **Rule interaction: free extras, lines block dupes.** Imports never
   consume an area's encounter, but their evolution lines count as owned
   for the dupes clause — you can't re-catch your imported line.

## Data model

- `campaigns` (local IndexedDB first, sync later): `{ id, name, runIds:
  string[] }` — order matters; a run belongs to at most one campaign.
- New event type in the RECEIVING run's log:
  `pokemon_imported { pokemonId, species, nickname, level, fromRunId,
  retiredSpecies? }` — folds like a catch but with
  `origin: { imported: true }` (the origin flag already exists in
  `PokemonInstance`). `retiredSpecies` set when this import is a legacy
  successor standing in for a retired mon.
- Availability check = species-lines + per-game species coverage we
  already generate (a line is "available" if any member appears in the
  target game's dataset or generated per-game data).
- deriveState: imported mons join the party (or box if party full);
  dupes-clause `ownedLines` already picks them up via state.pokemon —
  decision 3 falls out for free. `filterEncounterPool` needs no change.

## Flow

1. Run reaches `victory` → RunView offers "Continue the campaign →" (or
   RunPicker: "New campaign run from this victory").
2. Game picker opens as usual; after starter claim, an **import screen**
   lists the previous run's surviving party: available mons import
   directly; unavailable ones show "retired" with an optional
   successor picker (species combobox filtered to the new game).
3. Campaign page: runs in order with status chips, the lineage of each
   slot (Braviary → retired → successor Talonflame …), cross-campaign
   deaths/victories.

## Out of scope for v1

Cross-device campaign sync (campaigns reference local run ids first;
sync follows the same push/pull the runs already use); importing INTO a
run that's already started; multi-branch campaigns.

## Test plan

Engine: `pokemon_imported` fold (party/box placement, imported flag,
level preserved), dupes-blocking via imported lines, replay
order-independence. Datasets untouched.
