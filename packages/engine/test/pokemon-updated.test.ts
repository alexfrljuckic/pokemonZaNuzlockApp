import { describe, expect, it } from 'vitest';
import { buildRuleset, deriveState, type EngineContext, type GameDataset, type RunEvent } from '../src/index.js';

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
      encounters: [{ species: 'starly', methods: ['walk'] }],
    },
  ],
  specials: [],
  milestones: [{ id: 'gym-1', name: 'Gym 1', type: 'gym', order: 1, aceLevel: 14 }],
  mechanics: { heldItems: true, wildBattles: true, setModeOption: true, raids: false, overworldAggro: false },
};

const ctx: EngineContext = { dataset, speciesToLine: {} };

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload } as RunEvent);

describe('pokemon_updated event', () => {
  const base: RunEvent[] = [
    ev('run_started', { gameId: 'bdsp', version: 'brilliant-diamond', ruleset: buildRuleset('standard', 'bdsp') }),
    ev('encounter_resolved', { areaId: 'route-201', species: 'starly', outcome: 'caught', pokemonId: 'p1', nickname: 'Jet', level: 3 }),
  ];

  it('applies partial edits: only provided fields change', () => {
    const events = [
      ...base,
      ev('pokemon_updated', { pokemonId: 'p1', heldItem: 'oran-berry', nature: 'jolly', moves: ['tackle', 'growl'] }),
      ev('pokemon_updated', { pokemonId: 'p1', nickname: 'Ace', level: 10 }),
    ];
    const p = deriveState(events, ctx).pokemon['p1'];
    expect(p.nickname).toBe('Ace');
    expect(p.level).toBe(10);
    expect(p.heldItem).toBe('oran-berry'); // untouched by the second edit
    expect(p.nature).toBe('jolly');
    expect(p.moves).toEqual(['tackle', 'growl']);
  });

  it('null clears an optional field; unknown pokemonId is a no-op', () => {
    const events = [
      ...base,
      ev('pokemon_updated', { pokemonId: 'p1', heldItem: 'oran-berry' }),
      ev('pokemon_updated', { pokemonId: 'p1', heldItem: null }),
      ev('pokemon_updated', { pokemonId: 'ghost', nickname: 'nope' }),
    ];
    const state = deriveState(events, ctx);
    expect(state.pokemon['p1'].heldItem).toBeUndefined();
    expect(state.pokemon['ghost']).toBeUndefined();
  });

  it('stays order-independent under seq sort (sync-merge safety)', () => {
    const events = [...base, ev('pokemon_updated', { pokemonId: 'p1', level: 12 })];
    expect(deriveState([...events].reverse(), ctx)).toEqual(deriveState(events, ctx));
  });
});
