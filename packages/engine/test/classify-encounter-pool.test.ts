import { describe, expect, it } from 'vitest';
import {
  buildRuleset,
  classifyEncounterPool,
  deriveState,
  filterEncounterPool,
  type Area,
  type EngineContext,
  type GameDataset,
  type RunEvent,
} from '../src/index.js';

// Minimal self-contained dataset: one area with four wild slots —
//  - caterpie: base-version, catchable
//  - weedle: base-version, catchable; shares its evolution line under scope tests
//  - kricketot: locked to the OTHER version (static exclusion — never returned)
//  - alpha-guaranteed slot (method 'alpha') — static exclusion when alphas off
const area: Area = {
  id: 'test-route',
  name: 'Test Route',
  unlockAfter: null,
  tags: ['route'],
  encounters: [
    { species: 'caterpie', methods: ['walk'], rate: 40 },
    { species: 'weedle', methods: ['walk'], rate: 40 },
    { species: 'kricketot', methods: ['walk'], rate: 10, conditions: { version: ['shining-pearl'] } },
    { species: 'ponyta', methods: ['alpha'], rate: 5 },
  ],
};

const dataset: GameDataset = {
  schemaVersion: 1,
  gameId: 'bdsp',
  name: 'Test',
  versions: ['brilliant-diamond', 'shining-pearl'],
  areas: [area],
  specials: [],
  milestones: [],
  mechanics: {} as GameDataset['mechanics'],
};

// Evolution-line map: caterpie/metapod/butterfree share a line; weedle its own.
const speciesToLine: Record<string, string> = {
  caterpie: 'caterpie',
  metapod: 'caterpie',
  butterfree: 'caterpie',
  weedle: 'weedle',
  kricketot: 'kricketot',
  ponyta: 'ponyta',
};

const ctx: EngineContext = { dataset, speciesToLine };

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload } as RunEvent);

const start = (extraRules: Partial<Record<string, { enabled: boolean; params: Record<string, unknown> }>> = {}) => {
  const ruleset = buildRuleset('standard', 'bdsp');
  // alphas-count is not a bdsp rule; force the alpha slot out via 'alphas-count'
  // presence only in the tests that need it. Merge caller overrides.
  Object.assign(ruleset.rules, extraRules);
  return ev('run_started', { gameId: 'bdsp', version: 'brilliant-diamond', ruleset });
};

const speciesOf = (c: ReturnType<typeof classifyEncounterPool>) => c.map((e) => e.slot.species);
const excluded = (c: ReturnType<typeof classifyEncounterPool>) =>
  c.filter((e) => !e.available).map((e) => e.slot.species);

describe('classifyEncounterPool', () => {
  it('tags an owned evolution line unavailable (reason dupes-clause) while others stay available', () => {
    // metapod (caterpie's line) is owned → caterpie slot dimmed; weedle available.
    const state = deriveState(
      [
        start(),
        ev('encounter_resolved', {
          areaId: 'other-route',
          species: 'metapod',
          outcome: 'caught',
          pokemonId: 'p1',
          nickname: 'Pod',
          level: 8,
        }),
      ],
      ctx,
    );
    const classified = classifyEncounterPool(state, area, ctx);
    const caterpie = classified.find((e) => e.slot.species === 'caterpie')!;
    const weedle = classified.find((e) => e.slot.species === 'weedle')!;
    expect(caterpie.available).toBe(false);
    expect(caterpie.reason).toBe('dupes-clause');
    expect(weedle.available).toBe(true);
    expect(weedle.reason).toBeUndefined();
  });

  it('species scope only dims the exact owned species, not its line', () => {
    // Own metapod under SPECIES scope → caterpie (different species, same line)
    // stays available.
    const state = deriveState(
      [
        start({ 'dupes-clause': { enabled: true, params: { scope: 'species' } } }),
        ev('encounter_resolved', {
          areaId: 'other-route',
          species: 'metapod',
          outcome: 'caught',
          pokemonId: 'p1',
          nickname: 'Pod',
          level: 8,
        }),
      ],
      ctx,
    );
    const classified = classifyEncounterPool(state, area, ctx);
    expect(excluded(classified)).not.toContain('caterpie');
    // Owning caterpie itself under species scope dims caterpie.
    const state2 = deriveState(
      [
        start({ 'dupes-clause': { enabled: true, params: { scope: 'species' } } }),
        ev('encounter_resolved', {
          areaId: 'other-route',
          species: 'caterpie',
          outcome: 'caught',
          pokemonId: 'p2',
          nickname: 'Cat',
          level: 6,
        }),
      ],
      ctx,
    );
    expect(excluded(classifyEncounterPool(state2, area, ctx))).toContain('caterpie');
  });

  it('never returns static (version / alpha) exclusions — they are absent, not dimmed', () => {
    // alphas-count present + off drops the alpha slot; the other-version slot is
    // filtered by version. Neither appears as a dimmed entry.
    const state = deriveState(
      [start({ 'alphas-count': { enabled: false, params: {} } })],
      ctx,
    );
    const classified = classifyEncounterPool(state, area, ctx);
    expect(speciesOf(classified)).not.toContain('kricketot'); // other-version
    expect(speciesOf(classified)).not.toContain('ponyta'); // alpha, toggle off
    expect(speciesOf(classified).sort()).toEqual(['caterpie', 'weedle']);
    // all available (nothing owned yet)
    expect(excluded(classified)).toEqual([]);
  });

  it('returns [] for a resolved area under first-encounter (area done, not dimmed)', () => {
    const state = deriveState(
      [
        start(),
        ev('encounter_resolved', {
          areaId: 'test-route',
          species: 'caterpie',
          outcome: 'caught',
          pokemonId: 'p1',
          nickname: 'Cat',
          level: 5,
        }),
      ],
      ctx,
    );
    expect(classifyEncounterPool(state, area, ctx)).toEqual([]);
  });

  it('filterEncounterPool is exactly the available subset of the classified pool', () => {
    const state = deriveState(
      [
        start(),
        ev('encounter_resolved', {
          areaId: 'other-route',
          species: 'metapod',
          outcome: 'caught',
          pokemonId: 'p1',
          nickname: 'Pod',
          level: 8,
        }),
      ],
      ctx,
    );
    const classified = classifyEncounterPool(state, area, ctx);
    const legal = filterEncounterPool(state, area, ctx);
    expect(legal).toEqual(classified.filter((e) => e.available).map((e) => e.slot));
    // and caterpie (dimmed) is absent from the legal pool
    expect(legal.map((s) => s.species)).not.toContain('caterpie');
    expect(legal.map((s) => s.species)).toContain('weedle');
  });
});
