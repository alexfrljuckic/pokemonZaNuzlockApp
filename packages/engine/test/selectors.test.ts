import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  boxed,
  buildRuleset,
  deriveState,
  fallen,
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

  it('isFrontier: start-unlocked areas are frontier until a milestone is cleared, then its unlocks are', () => {
    const fresh = stateWith([]);
    const route1 = dataset.areas.find((a) => a.id === 'route-1')!; // unlockAfter: null
    const route3 = dataset.areas.find((a) => a.id === 'route-3')!; // unlockAfter: gym-1-brock
    expect(isFrontier(route1, fresh)).toBe(true);
    expect(isFrontier(route3, fresh)).toBe(false);

    const afterBrock = stateWith([ev('milestone_cleared', { milestoneId: 'gym-1-brock' })]);
    expect(isFrontier(route1, afterBrock)).toBe(false); // no longer the frontier
    expect(isFrontier(route3, afterBrock)).toBe(true); // just opened up

    // a resolved area is never frontier, even if its gate was just cleared
    const resolved = stateWith([
      ev('milestone_cleared', { milestoneId: 'gym-1-brock' }),
      ev('encounter_resolved', { areaId: 'route-3', species: 'spearow', outcome: 'skipped' }),
    ]);
    expect(isFrontier(route3, resolved)).toBe(false);
  });
});
