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

describe('pokemon_evolved event', () => {
  const base: RunEvent[] = [
    ev('run_started', { gameId: 'bdsp', version: 'brilliant-diamond', ruleset: buildRuleset('standard', 'bdsp') }),
    ev('encounter_resolved', { areaId: 'route-201', species: 'starly', outcome: 'caught', pokemonId: 'p1', nickname: 'starly', level: 14 }),
    ev('encounter_resolved', { areaId: 'route-201', species: 'starly', outcome: 'caught', pokemonId: 'p2', nickname: 'Jet', level: 14 }),
  ];

  it('changes the species; a default nickname follows, a real one stays', () => {
    const events = [
      ...base,
      ev('pokemon_evolved', { pokemonId: 'p1', toSpecies: 'staravia' }),
      ev('pokemon_evolved', { pokemonId: 'p2', toSpecies: 'staravia' }),
    ];
    const state = deriveState(events, ctx);
    expect(state.pokemon['p1'].species).toBe('staravia');
    expect(state.pokemon['p1'].nickname).toBe('staravia'); // default followed
    expect(state.pokemon['p2'].species).toBe('staravia');
    expect(state.pokemon['p2'].nickname).toBe('Jet'); // real nickname kept
  });

  it('no-ops on an unknown pokemonId and stays order-independent', () => {
    const events = [...base, ev('pokemon_evolved', { pokemonId: 'ghost', toSpecies: 'staravia' })];
    expect(deriveState(events, ctx).pokemon['p1'].species).toBe('starly');
    const evolved = [...base, ev('pokemon_evolved', { pokemonId: 'p1', toSpecies: 'staravia' })];
    expect(deriveState([...evolved].reverse(), ctx)).toEqual(deriveState(evolved, ctx));
  });

  it('evolved species counts for the dupes clause (same line map lookup)', () => {
    const lineCtx: EngineContext = { dataset, speciesToLine: { starly: 'starly', staravia: 'starly' } };
    const evolved = [...base, ev('pokemon_evolved', { pokemonId: 'p1', toSpecies: 'staravia' })];
    const state = deriveState(evolved, ctx);
    // staravia still maps to the starly line — owning it keeps blocking starly
    expect(lineCtx.speciesToLine[state.pokemon['p1'].species]).toBe('starly');
  });
});

describe('pokemon_evolved level bump', () => {
  const base: RunEvent[] = [
    ev('run_started', { gameId: 'bdsp', version: 'brilliant-diamond', ruleset: buildRuleset('standard', 'bdsp') }),
    ev('encounter_resolved', { areaId: 'route-201', species: 'starly', outcome: 'caught', pokemonId: 'p1', nickname: 'Jet', level: 5 }),
  ];

  it('raises the level to the requirement when provided, keeps it otherwise', () => {
    const bumped = deriveState([...base, ev('pokemon_evolved', { pokemonId: 'p1', toSpecies: 'staravia', level: 14 })], ctx);
    expect(bumped.pokemon['p1'].level).toBe(14);
    // no level in the payload = level untouched (already at/above requirement)
    const kept = deriveState([...base, ev('level_up', { pokemonId: 'p1', level: 20 }), ev('pokemon_evolved', { pokemonId: 'p1', toSpecies: 'staravia' })], ctx);
    expect(kept.pokemon['p1'].level).toBe(20);
  });
});

describe('pokemon_evolution_reverted (un-evolve)', () => {
  const base: RunEvent[] = [
    ev('run_started', { gameId: 'bdsp', version: 'brilliant-diamond', ruleset: buildRuleset('standard', 'bdsp') }),
    ev('encounter_resolved', { areaId: 'route-201', species: 'turtwig', outcome: 'caught', pokemonId: 'p1', nickname: 'turtwig', level: 5 }),
  ];

  it('restores species, level and a default nickname through multiple steps', () => {
    const chain = [
      ...base,
      ev('pokemon_evolved', { pokemonId: 'p1', toSpecies: 'grotle', level: 18 }),
      ev('pokemon_evolved', { pokemonId: 'p1', toSpecies: 'torterra', level: 32 }),
    ];
    const once = deriveState([...chain, ev('pokemon_evolution_reverted', { pokemonId: 'p1' })], ctx);
    expect(once.pokemon['p1'].species).toBe('grotle');
    expect(once.pokemon['p1'].level).toBe(18);
    expect(once.pokemon['p1'].nickname).toBe('grotle');

    const twice = deriveState(
      [...chain, ev('pokemon_evolution_reverted', { pokemonId: 'p1' }), ev('pokemon_evolution_reverted', { pokemonId: 'p1' })],
      ctx,
    );
    expect(twice.pokemon['p1'].species).toBe('turtwig');
    expect(twice.pokemon['p1'].level).toBe(5); // the evolve-time level bump is undone too
    expect(twice.pokemon['p1'].preEvolutions).toBeUndefined();
  });

  it('no-ops with nothing to revert; keeps a real nickname', () => {
    const noop = deriveState([...base, ev('pokemon_evolution_reverted', { pokemonId: 'p1' })], ctx);
    expect(noop.pokemon['p1'].species).toBe('turtwig');
    const named = deriveState(
      [
        ...base,
        ev('pokemon_updated', { pokemonId: 'p1', nickname: 'Tank' }),
        ev('pokemon_evolved', { pokemonId: 'p1', toSpecies: 'grotle', level: 18 }),
        ev('pokemon_evolution_reverted', { pokemonId: 'p1' }),
      ],
      ctx,
    );
    expect(named.pokemon['p1'].nickname).toBe('Tank');
    expect(named.pokemon['p1'].species).toBe('turtwig');
  });
});
