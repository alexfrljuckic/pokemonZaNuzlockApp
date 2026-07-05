import { describe, expect, it } from 'vitest';
import { deriveState, type EngineContext, type GameDataset, type RunEvent } from '../src/index.js';

const dataset: GameDataset = {
  schemaVersion: 1,
  gameId: 'bdsp',
  name: 'test',
  versions: ['brilliant-diamond'],
  areas: [
    {
      id: 'route-202',
      name: 'Route 202',
      unlockAfter: null,
      tags: ['route'],
      encounters: [{ species: 'starly', methods: ['walk'] }],
      trainers: [
        { name: 'Tristan', class: 'Youngster', team: [{ species: 'starly', level: 5 }] },
        { name: 'Natalie', class: 'Lass', team: [{ species: 'bidoof', level: 5 }] },
      ],
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

describe('trainer_battled / trainer_reset', () => {
  const start = ev('run_started', {
    gameId: 'bdsp',
    version: 'brilliant-diamond',
    ruleset: { presetId: 'standard', rules: {}, houseRules: [] },
  });

  it('marks a trainer battled by areaId#index, idempotently', () => {
    const events = [
      start,
      ev('trainer_battled', { areaId: 'route-202', trainerIndex: 0, name: 'Tristan' }),
      ev('trainer_battled', { areaId: 'route-202', trainerIndex: 0, name: 'Tristan' }),
      ev('trainer_battled', { areaId: 'route-202', trainerIndex: 1, name: 'Natalie' }),
    ];
    const state = deriveState(events, ctx);
    expect(state.trainersBattled).toEqual(['route-202#0', 'route-202#1']);
  });

  it('trainer_reset unmarks exactly that trainer', () => {
    const events = [
      start,
      ev('trainer_battled', { areaId: 'route-202', trainerIndex: 0 }),
      ev('trainer_battled', { areaId: 'route-202', trainerIndex: 1 }),
      ev('trainer_reset', { areaId: 'route-202', trainerIndex: 0 }),
    ];
    const state = deriveState(events, ctx);
    expect(state.trainersBattled).toEqual(['route-202#1']);
  });

  it('starts empty and tolerates resets for never-battled trainers', () => {
    const state = deriveState([start, ev('trainer_reset', { areaId: 'route-202', trainerIndex: 5 })], ctx);
    expect(state.trainersBattled).toEqual([]);
  });
});
