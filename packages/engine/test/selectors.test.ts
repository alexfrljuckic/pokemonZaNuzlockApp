import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  boxed,
  buildRuleset,
  deriveState,
  fallen,
  frontierAreas,
  isFrontier,
  party,
  type EngineContext,
  type GameDataset,
  type RunEvent,
} from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(
  readFileSync(join(here, '../../datasets/games/lgpe.json'), 'utf8'),
) as GameDataset;
const speciesToLine = JSON.parse(
  readFileSync(join(here, '../../datasets/generated/species-lines.json'), 'utf8'),
) as Record<string, string>;
const ctx: EngineContext = { dataset, speciesToLine };

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload } as RunEvent);

function stateWith(events: RunEvent[]) {
  return deriveState(
    [ev('run_started', { gameId: 'lgpe', version: 'lets-go-pikachu', ruleset: buildRuleset('standard', 'lgpe') }), ...events],
    ctx,
  );
}

describe('selectors', () => {
  it('party/boxed/fallen partition the owned Pokémon by status', () => {
    const state = stateWith([
      ev('encounter_resolved', { areaId: 'route-1', species: 'pidgey', outcome: 'caught', pokemonId: 'a', nickname: 'A', level: 4 }),
      ev('encounter_resolved', { areaId: 'route-2', species: 'caterpie', outcome: 'caught', pokemonId: 'b', nickname: 'B', level: 4 }),
      ev('moved', { pokemonId: 'b', to: 'box' }),
      ev('encounter_resolved', { areaId: 'route-3', species: 'spearow', outcome: 'caught', pokemonId: 'c', nickname: 'C', level: 5 }),
      ev('faint', { pokemonId: 'c' }),
    ]);
    expect(party(state).map((p) => p.id)).toEqual(['a']);
    expect(boxed(state).map((p) => p.id)).toEqual(['b']);
    expect(fallen(state).map((p) => p.id)).toEqual(['c']);
    // partition is exhaustive: every owned mon is in exactly one bucket
    expect(party(state).length + boxed(state).length + fallen(state).length).toBe(
      Object.keys(state.pokemon).length,
    );
  });

  it('frontierAreas: a sliding window over unresolved reachable areas that advances on resolves', () => {
    const fresh = stateWith([]);
    const first = frontierAreas(dataset.areas, fresh);
    // fresh run: the first 4 reachable areas in dataset order
    expect(first.size).toBe(4);
    expect(first.has('route-1')).toBe(true);
    expect(first.has('route-3')).toBe(false); // gated on gym-1-brock

    // resolving an area advances the window WITHOUT any milestone clearing —
    // the old rule went dark here
    const oneResolved = stateWith([
      ev('encounter_resolved', { areaId: 'route-1', species: 'pidgey', outcome: 'skipped' }),
    ]);
    const advanced = frontierAreas(dataset.areas, oneResolved);
    expect(advanced.has('route-1')).toBe(false);
    expect(advanced.size).toBe(4); // a new area was promoted into the window
    expect([...advanced].some((id) => !first.has(id))).toBe(true);

    // clearing a gate lets its areas enter the window once reached
    const afterBrock = stateWith([ev('milestone_cleared', { milestoneId: 'gym-1-brock' })]);
    const route3 = dataset.areas.find((a) => a.id === 'route-3')!;
    expect(isFrontier(route3, afterBrock, dataset.areas)).toBe(
      frontierAreas(dataset.areas, afterBrock).has('route-3'),
    );

    // a resolved area is never frontier
    const resolved = stateWith([
      ev('milestone_cleared', { milestoneId: 'gym-1-brock' }),
      ev('encounter_resolved', { areaId: 'route-3', species: 'spearow', outcome: 'skipped' }),
    ]);
    expect(frontierAreas(dataset.areas, resolved).has('route-3')).toBe(false);
  });
});
