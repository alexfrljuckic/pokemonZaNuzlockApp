import { describe, expect, it } from 'vitest';
import {
  buildRuleset,
  classifyEncounterPool,
  deriveState,
  encounterRollInfo,
  rollEncounterSpecies,
  type Area,
  type EngineContext,
  type GameDataset,
  type RunEvent,
} from '../src/index.js';

// One open-world area with three species (bidoof listed twice, two methods).
const area: Area = {
  id: 'horseshoe-plains',
  name: 'Horseshoe Plains',
  unlockAfter: null,
  tags: ['named-location'],
  encounters: [
    { species: 'bidoof', methods: ['walk'], rate: 40 },
    { species: 'bidoof', methods: ['tree'], rate: 10 },
    { species: 'starly', methods: ['walk'], rate: 30 },
    { species: 'shinx', methods: ['walk'], rate: 20 },
  ],
};
const other: Area = { ...area, id: 'floaro-gardens', name: 'Floaro Gardens' };
const dataset: GameDataset = {
  schemaVersion: 1,
  gameId: 'pla',
  name: 'Test PLA',
  versions: ['legends-arceus'],
  areas: [area, other],
  specials: [],
  milestones: [],
  mechanics: {} as GameDataset['mechanics'],
};
const ctx: EngineContext = {
  dataset,
  speciesToLine: { bidoof: 'bidoof', bibarel: 'bidoof', starly: 'starly', shinx: 'shinx' },
};

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload }) as RunEvent;
const start = (rerolls?: number, enabled = true) => {
  const ruleset = buildRuleset('standard', 'pla');
  ruleset.rules['random-encounter-roll'] = { enabled, params: { rerolls: rerolls ?? 1 } };
  return ev('run_started', { gameId: 'pla', version: 'legends-arceus', ruleset });
};
const available = (events: RunEvent[], a: Area = area) =>
  [...new Set(classifyEncounterPool(deriveState(events, ctx), a, ctx).filter((e) => e.available).map((e) => e.slot.species))];

describe('random-encounter-roll', () => {
  it('is on by default for PLA and Z-A only, with one reroll', () => {
    expect(buildRuleset('standard', 'pla').rules['random-encounter-roll']).toEqual({ enabled: true, params: { rerolls: 1 } });
    expect(buildRuleset('standard', 'plza').rules['random-encounter-roll']?.enabled).toBe(true);
    expect(buildRuleset('standard', 'bdsp').rules['random-encounter-roll']).toBeUndefined();
  });

  it('before a roll: offers each distinct legal species once, nothing restricted yet', () => {
    const state = deriveState([start()], ctx);
    const info = encounterRollInfo(state, area, ctx);
    expect(info).toEqual({ enabled: true, target: null, rerollsLeft: 1, candidates: ['bidoof', 'starly', 'shinx'] });
    expect(available([start()])).toEqual(['bidoof', 'starly', 'shinx']);
  });

  it('after a roll only the rolled species is catchable; the rest are "not-rolled"', () => {
    const events = [start(), ev('encounter_rolled', { areaId: area.id, species: 'starly' })];
    expect(available(events)).toEqual(['starly']);
    const reasons = classifyEncounterPool(deriveState(events, ctx), area, ctx)
      .filter((e) => !e.available)
      .map((e) => e.reason);
    expect(new Set(reasons)).toEqual(new Set(['not-rolled']));
    // other areas are untouched
    expect(available(events, other)).toEqual(['bidoof', 'starly', 'shinx']);
  });

  it('counts rerolls and stops at the limit', () => {
    const events = [
      start(1),
      ev('encounter_rolled', { areaId: area.id, species: 'starly' }),
      ev('encounter_rolled', { areaId: area.id, species: 'shinx', reroll: true }),
    ];
    const info = encounterRollInfo(deriveState(events, ctx), area, ctx);
    expect(info.target).toBe('shinx');
    expect(info.rerollsLeft).toBe(0);
  });

  it('encounter_reset clears the roll and its rerolls', () => {
    const events = [
      start(),
      ev('encounter_rolled', { areaId: area.id, species: 'starly' }),
      ev('encounter_resolved', { areaId: area.id, species: 'starly', outcome: 'failed' }),
      ev('encounter_reset', { areaId: area.id }),
    ];
    const state = deriveState(events, ctx);
    expect(state.encounterRolls[area.id]).toBeUndefined();
    expect(encounterRollInfo(state, area, ctx).rerollsLeft).toBe(1);
  });

  it('a roll that became a dupe is void: full pool shows again', () => {
    const events = [
      start(),
      ev('encounter_rolled', { areaId: area.id, species: 'bidoof' }),
      // caught a Bibarel elsewhere first → bidoof is now a dupe here
      ev('encounter_resolved', { areaId: other.id, species: 'bibarel', outcome: 'caught', pokemonId: 'p1' }),
    ];
    const info = encounterRollInfo(deriveState(events, ctx), area, ctx);
    expect(info.target).toBeNull();
    expect(info.candidates).toEqual(['starly', 'shinx']);
    expect(available(events)).toEqual(['starly', 'shinx']);
  });

  it('switched off, rolls are ignored', () => {
    const events = [start(1, false), ev('encounter_rolled', { areaId: area.id, species: 'starly' })];
    expect(available(events)).toEqual(['bidoof', 'starly', 'shinx']);
    expect(encounterRollInfo(deriveState(events, ctx), area, ctx).enabled).toBe(false);
  });

  it('rollEncounterSpecies picks uniformly and avoids the current target on a reroll', () => {
    expect(rollEncounterSpecies(['a', 'b', 'c'], null, () => 0)).toBe('a');
    expect(rollEncounterSpecies(['a', 'b', 'c'], null, () => 0.99)).toBe('c');
    expect(rollEncounterSpecies(['a', 'b'], 'a', () => 0)).toBe('b');
    expect(rollEncounterSpecies(['a'], 'a', () => 0)).toBe('a');
    expect(rollEncounterSpecies([], null)).toBeNull();
  });
});
