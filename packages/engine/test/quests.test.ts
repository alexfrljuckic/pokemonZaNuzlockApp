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
    { id: 'horseshoe-plains', name: 'Horseshoe Plains', unlockAfter: null, tags: [], encounters: [{ species: 'starly', methods: ['walk'], rate: 100 }] },
  ],
  specials: [],
  milestones: [],
  quests: [
    { id: 'request-20', number: 20, name: 'Will-o-the-Wisp', area: 'jubilife-village', location: 'Canala Avenue', unlock: 'Defeat Irida', rewards: ['Chimchar'], rewardPokemon: [{ species: 'chimchar', how: 'catch' }] },
    { id: 'request-19', number: 19, name: 'Peculiar Ponyta', area: 'jubilife-village', location: 'Galaxy Hall', unlock: 'Defeat Irida', rewards: ['Shiny Ponyta'], rewardPokemon: [{ species: 'ponyta', how: 'catch', area: 'horseshoe-plains', shiny: true }] },
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

  it('a reward caught elsewhere uses that area, not the quest area', () => {
    const ponyta = dataset.quests![1];
    const reward = ponyta.rewardPokemon![0];
    const noShinyClause = (() => {
      const e = start();
      (e.payload as { ruleset: { rules: Record<string, { enabled: boolean }> } }).ruleset.rules['shiny-clause'].enabled = false;
      return e;
    })();
    expect(questRewardStatus(deriveState([noShinyClause], ctx), ponyta, reward)).toEqual({
      mode: 'area-encounter',
      allowed: true,
      areaId: 'horseshoe-plains',
    });
    const usedPlains = ev('encounter_resolved', { areaId: 'horseshoe-plains', species: 'starly', outcome: 'failed' });
    expect(questRewardStatus(deriveState([noShinyClause, usedPlains], ctx), ponyta, reward).allowed).toBe(false);
  });

  it('a guaranteed shiny is free under the Shiny Clause', () => {
    const ponyta = dataset.quests![1];
    const usedPlains = ev('encounter_resolved', { areaId: 'horseshoe-plains', species: 'starly', outcome: 'failed' });
    expect(questRewardStatus(deriveState([start(), usedPlains], ctx), ponyta, ponyta.rewardPokemon![0])).toEqual({
      mode: 'area-encounter',
      allowed: true,
    });
  });
});
