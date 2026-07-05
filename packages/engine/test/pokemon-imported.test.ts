import { describe, expect, it } from 'vitest';
import {
  buildRuleset,
  deriveState,
  filterEncounterPool,
  type EngineContext,
  type GameDataset,
  type RunEvent,
} from '../src/index.js';

// Genlocke imports (backlog 34, docs/GENLOCKE.md): free extras that never
// consume an encounter but whose evolution lines still block dupes.

const dataset: GameDataset = {
  schemaVersion: 1,
  gameId: 'bdsp',
  name: 'test',
  versions: ['brilliant-diamond'],
  areas: [
    {
      id: 'route-201',
      name: 'Route 201',
      unlockAfter: null,
      tags: ['route'],
      encounters: [
        { species: 'starly', methods: ['walk'] },
        { species: 'bidoof', methods: ['walk'] },
      ],
    },
  ],
  specials: [],
  milestones: [{ id: 'gym-1', name: 'Gym 1', type: 'gym', order: 1, aceLevel: 14 }],
  mechanics: { heldItems: true, wildBattles: true, setModeOption: true, raids: false, overworldAggro: false },
};
const ctx: EngineContext = { dataset, speciesToLine: { starly: 'starly', staravia: 'starly', bidoof: 'bidoof' } };

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload } as RunEvent);

const start = ev('run_started', { gameId: 'bdsp', version: 'brilliant-diamond', ruleset: buildRuleset('standard', 'bdsp') });

describe('pokemon_imported (genlocke graduation)', () => {
  it('creates the mon with an imported origin, in the party when there is room', () => {
    const state = deriveState(
      [start, ev('pokemon_imported', { pokemonId: 'g1', species: 'staravia', nickname: 'Jet', level: 40, fromRunId: 'run-a' })],
      ctx,
    );
    const p = state.pokemon['g1'];
    expect(p.species).toBe('staravia');
    expect(p.nickname).toBe('Jet');
    expect(p.level).toBe(40);
    expect(p.status).toBe('party');
    expect(p.origin).toEqual({ imported: true });
  });

  it('overflows to the box when the party is full', () => {
    const fillers = Array.from({ length: 6 }, (_, i) =>
      ev('pokemon_imported', { pokemonId: `f${i}`, species: 'bidoof', level: 10, fromRunId: 'run-a' }),
    );
    const state = deriveState(
      [start, ...fillers, ev('pokemon_imported', { pokemonId: 'g7', species: 'staravia', level: 40, fromRunId: 'run-a' })],
      ctx,
    );
    expect(Object.values(state.pokemon).filter((p) => p.status === 'party')).toHaveLength(6);
    expect(state.pokemon['g7'].status).toBe('box');
  });

  it('never consumes an encounter, but its line blocks dupes', () => {
    const state = deriveState(
      [start, ev('pokemon_imported', { pokemonId: 'g1', species: 'staravia', level: 40, fromRunId: 'run-a' })],
      ctx,
    );
    const pool = filterEncounterPool(state, dataset.areas[0], ctx);
    // route-201 is still unresolved (imports don't touch encounterOutcomes)…
    expect(state.encounterOutcomes['route-201']).toBeUndefined();
    // …but staravia's line (starly) is owned, so starly is out of the pool
    expect(pool.map((s) => s.species)).toEqual(['bidoof']);
  });

  it('records legacy successors without special fold behavior', () => {
    const state = deriveState(
      [start, ev('pokemon_imported', { pokemonId: 'g1', species: 'bidoof', level: 30, fromRunId: 'run-a', retiredSpecies: 'growlithe-hisui' })],
      ctx,
    );
    expect(state.pokemon['g1'].species).toBe('bidoof'); // the successor is a normal mon
  });
});
