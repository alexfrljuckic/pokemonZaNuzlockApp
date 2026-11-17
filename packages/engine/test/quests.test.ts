import { describe, expect, it } from 'vitest';
import {
  buildRuleset,
  deriveState,
  questRewardStatus,
  type EngineContext,
  type GameDataset,
  type RunEvent,
} from '../src/index.js';

const dataset: GameDataset = {
  schemaVersion: 1,
  gameId: 'pla',
  name: 'Test PLA',
  versions: ['legends-arceus'],
  areas: [
    { id: 'jubilife-village', name: 'Jubilife Village', unlockAfter: null, tags: [], encounters: [{ species: 'bidoof', methods: ['walk'], rate: 100 }] },
  ],
  specials: [],
  milestones: [],
  quests: [
    { id: 'request-20', number: 20, name: 'Will-o-the-Wisp', area: 'jubilife-village', location: 'Canala Avenue', unlock: 'Defeat Irida', rewards: ['Chimchar'], rewardPokemon: ['chimchar'] },
  ],
  mechanics: {} as GameDataset['mechanics'],
};
const ctx: EngineContext = { dataset, speciesToLine: {} };
const quest = dataset.quests![0];

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload }) as RunEvent;
const start = (mode?: string) => {
  const ruleset = buildRuleset('standard', 'pla');
  if (mode) ruleset.rules['quest-reward-pokemon'] = { enabled: true, params: { mode } };
  return ev('run_started', { gameId: 'pla', version: 'legends-arceus', ruleset });
};
const claim = (areaId?: string) =>
  ev('special_claimed', { specialId: 'request-20-0-chimchar', species: 'chimchar', pokemonId: 'p1', ...(areaId ? { areaId } : {}) });

describe('quests', () => {
  it('quest_completed / quest_reset toggle completion', () => {
    const done = deriveState([start(), ev('quest_completed', { questId: 'request-20' })], ctx);
    expect(done.questsCompleted).toEqual(['request-20']);
    const undone = deriveState(
      [start(), ev('quest_completed', { questId: 'request-20' }), ev('quest_reset', { questId: 'request-20' })],
      ctx,
    );
    expect(undone.questsCompleted).toEqual([]);
  });

  it('defaults to area-encounter for PLA only', () => {
    expect(buildRuleset('standard', 'pla').rules['quest-reward-pokemon']).toEqual({ enabled: true, params: { mode: 'area-encounter' } });
    expect(buildRuleset('standard', 'bdsp').rules['quest-reward-pokemon']).toBeUndefined();
  });

  it('area-encounter: claiming uses up the area; reset gives it back', () => {
    const before = deriveState([start()], ctx);
    expect(questRewardStatus(before, quest)).toEqual({ mode: 'area-encounter', allowed: true, areaId: 'jubilife-village' });
    const after = deriveState([start(), claim('jubilife-village')], ctx);
    expect(after.encounterOutcomes['jubilife-village']).toBe('caught');
    expect(after.pokemon.p1.status).toBe('party');
    const reset = deriveState([start(), claim('jubilife-village'), ev('special_reset', { specialId: 'request-20-0-chimchar' })], ctx);
    expect(reset.encounterOutcomes['jubilife-village']).toBeUndefined();
    expect(reset.pokemon.p1).toBeUndefined();
  });

  it('area-encounter: blocked once the area encounter is used', () => {
    const state = deriveState(
      [start(), ev('encounter_resolved', { areaId: 'jubilife-village', species: 'bidoof', outcome: 'failed' })],
      ctx,
    );
    expect(questRewardStatus(state, quest).allowed).toBe(false);
  });

  it('free and banned modes', () => {
    const used = ev('encounter_resolved', { areaId: 'jubilife-village', species: 'bidoof', outcome: 'failed' });
    expect(questRewardStatus(deriveState([start('free'), used], ctx), quest)).toEqual({ mode: 'free', allowed: true });
    expect(questRewardStatus(deriveState([start('banned')], ctx), quest).allowed).toBe(false);
  });

  it('a free claim never touches the area outcome', () => {
    const state = deriveState([start('free'), claim()], ctx);
    expect(state.encounterOutcomes['jubilife-village']).toBeUndefined();
    expect(state.pokemon.p1.species).toBe('chimchar');
  });
});
