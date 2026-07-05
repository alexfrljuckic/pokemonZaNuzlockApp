import { describe, expect, it } from 'vitest';
import { buildRuleset, type EngineContext, type GameDataset, type RunEvent } from '@nuzlocke/engine';
import { headroomSeries } from './LevelCapHeadroom';

const dataset: GameDataset = {
  schemaVersion: 1,
  gameId: 'bdsp',
  name: 'test',
  versions: ['brilliant-diamond'],
  areas: [{ id: 'route-201', name: 'Route 201', unlockAfter: null, tags: ['route'], encounters: [{ species: 'starly', methods: ['walk'] }] }],
  specials: [],
  milestones: [
    { id: 'gym-1', name: 'Roark', type: 'gym', order: 1, aceLevel: 14 },
    { id: 'gym-2', name: 'Gardenia', type: 'gym', order: 2, aceLevel: 22 },
  ],
  mechanics: { heldItems: true, wildBattles: true, setModeOption: true, raids: false, overworldAggro: false },
};
const ctx: EngineContext = { dataset, speciesToLine: {} };

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload } as RunEvent);

describe('headroomSeries', () => {
  it('tracks party max level and the cap ladder as the run progresses', () => {
    const events = [
      ev('run_started', { gameId: 'bdsp', version: 'brilliant-diamond', ruleset: buildRuleset('standard', 'bdsp') }),
      ev('encounter_resolved', { areaId: 'route-201', species: 'starly', outcome: 'caught', pokemonId: 'p1', nickname: 'Jet', level: 5 }),
      ev('level_up', { pokemonId: 'p1', level: 15 }),
      ev('milestone_cleared', { milestoneId: 'gym-1' }),
    ];
    const pts = headroomSeries(events, ctx);
    // starts with no party, cap = Roark 14
    expect(pts[0]).toMatchObject({ partyMax: null, cap: 14 });
    // catch → party max 5; level up → 15 (over the 14 cap); clear → cap 22
    expect(pts.map((p) => [p.partyMax, p.cap])).toEqual([
      [null, 14],
      [5, 14],
      [15, 14],
      [15, 22],
    ]);
  });

  it('collapses consecutive identical points and handles empty logs', () => {
    expect(headroomSeries([], ctx)).toEqual([]);
    const events = [
      ev('run_started', { gameId: 'bdsp', version: 'brilliant-diamond', ruleset: buildRuleset('standard', 'bdsp') }),
      ev('note', { text: 'hi' }), // irrelevant type — never sampled
      ev('encounter_resolved', { areaId: 'route-201', species: 'starly', outcome: 'skipped' }),
    ];
    const pts = headroomSeries(events, ctx);
    expect(pts).toHaveLength(1); // skip changes neither party nor cap
  });
});
