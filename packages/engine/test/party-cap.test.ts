import { describe, expect, it } from 'vitest';
import { buildRuleset, deriveState, type EngineContext, type GameDataset, type RunEvent } from '../src/index.js';

// A caught (or claimed) Pokémon joins the party only when there's room — once
// the party is full (6), it overflows to the box, like the games.

const dataset: GameDataset = {
  schemaVersion: 1,
  gameId: 'bdsp',
  name: 'test',
  versions: ['brilliant-diamond'],
  areas: [{ id: 'route-201', name: 'Route 201', unlockAfter: null, tags: ['route'], encounters: [{ species: 'bidoof', methods: ['walk'] }] }],
  specials: [],
  milestones: [{ id: 'gym-1', name: 'Gym 1', type: 'gym', order: 1, aceLevel: 14 }],
  mechanics: { heldItems: true, wildBattles: true, setModeOption: true, raids: false, overworldAggro: false },
};
const ctx: EngineContext = { dataset, speciesToLine: {} };

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload } as RunEvent);
const start = ev('run_started', { gameId: 'bdsp', version: 'brilliant-diamond', ruleset: buildRuleset('standard', 'bdsp') });

const catchEv = (i: number) =>
  ev('encounter_resolved', { areaId: `route-${i}`, species: 'bidoof', outcome: 'caught', pokemonId: `c${i}`, level: 5 });

describe('full-party auto-box', () => {
  it('a caught mon overflows to the box once the party has 6', () => {
    const state = deriveState([start, ...Array.from({ length: 7 }, (_, i) => catchEv(i))], ctx);
    expect(Object.values(state.pokemon).filter((p) => p.status === 'party')).toHaveLength(6);
    expect(state.pokemon['c0'].status).toBe('party'); // first six join the party
    expect(state.pokemon['c5'].status).toBe('party');
    expect(state.pokemon['c6'].status).toBe('box'); // the seventh boxes
  });

  it('a claimed special (gift/starter/static) also boxes when the party is full', () => {
    const state = deriveState(
      [start, ...Array.from({ length: 6 }, (_, i) => catchEv(i)), ev('special_claimed', { specialId: 'gift-1', species: 'eevee', pokemonId: 's1', level: 5 })],
      ctx,
    );
    expect(state.pokemon['s1'].status).toBe('box');
  });

  it('stays order-independent under seq sort (sync-merge safety)', () => {
    const events = [start, ...Array.from({ length: 7 }, (_, i) => catchEv(i))];
    expect(deriveState([...events].reverse(), ctx)).toEqual(deriveState(events, ctx));
  });
});
