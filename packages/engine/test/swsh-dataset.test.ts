import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  areasFor,
  areasForVersion,
  buildRuleset,
  deriveState,
  filterEncounterPool,
  isVersionDeadArea,
  milestonesFor,
  specialAppliesToVersion,
  type Area,
  type EngineContext,
  type GameDataset,
  type RunEvent,
} from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(
  readFileSync(join(here, '../../datasets/games/swsh.json'), 'utf8'),
) as GameDataset;

const speciesToLine = JSON.parse(
  readFileSync(join(here, '../../datasets/generated/species-lines.json'), 'utf8'),
) as Record<string, string>;

const ctx: EngineContext = { dataset, speciesToLine };

let seq = 0;
const ev = (type: RunEvent['type'], payload: unknown): RunEvent =>
  ({ seq: ++seq, at: new Date(1700000000000 + seq * 60000).toISOString(), type, payload } as RunEvent);

describe('SwSh dataset', () => {
  it('validates against the schema shape used by the engine (areas, milestones present)', () => {
    expect(dataset.gameId).toBe('swsh');
    expect(dataset.versions).toEqual(['sword', 'shield']);
    expect(dataset.areas.length).toBeGreaterThanOrEqual(20);
    // 62 = 28 base-game wilds + 4 towns + 16 Isle of Armor + 14 Crown
    // Tundra DLC zones. Sanity bound, not an exact pin — raise it when
    // areas are added deliberately.
    expect(dataset.areas.length).toBeLessThanOrEqual(80);
    expect(dataset.milestones.length).toBeGreaterThan(0);
  });

  it('has exactly two Hop rival milestones: an early first battle and a final battle', () => {
    const rivalMilestones = dataset.milestones.filter((m) => m.type === 'rival');
    expect(rivalMilestones).toHaveLength(2);
    const ids = rivalMilestones.map((m) => m.id).sort();
    expect(ids).toEqual(['rival-hop-1', 'rival-hop-final']);
    const first = dataset.milestones.find((m) => m.id === 'rival-hop-1')!;
    const last = dataset.milestones.find((m) => m.id === 'rival-hop-final')!;
    expect(first.order).toBeLessThan(last.order);
  });

  it('has 8 gym milestones and a champion milestone', () => {
    const gyms = dataset.milestones.filter((m) => m.type === 'gym');
    expect(gyms).toHaveLength(8);
    const champion = dataset.milestones.filter((m) => m.type === 'champion');
    expect(champion.length).toBeGreaterThanOrEqual(1);
  });

  it('lists all three starters as separate gift specials at the starting town', () => {
    const starters = dataset.specials.filter((s) => s.id.startsWith('starter-'));
    expect(starters).toHaveLength(3);
    const species = starters.map((s) => s.species).sort();
    expect(species).toEqual(['grookey', 'scorbunny', 'sobble']);
    for (const s of starters) {
      expect(s.type).toBe('gift');
      expect(s.area).toBe('postwick');
    }
  });

  it('carries weather conditions on a Wild Area encounter slot: Dusty Bowl Electrike is thunderstorm-gated', () => {
    const dustyBowl = dataset.areas.find((a) => a.id === 'dusty-bowl')!;
    const electrikeThunderstorm = dustyBowl.encounters.find(
      (e) => e.species === 'electrike' && e.conditions?.weather?.includes('thunderstorm'),
    );
    expect(electrikeThunderstorm).toBeDefined();
    expect(electrikeThunderstorm?.conditions?.weather).toEqual(['thunderstorm']);

    // weather is authored data for the app/UI layer; filterEncounterPool does not
    // filter on weather today, so the slot still appears in the raw pool.
    const events: RunEvent[] = [
      ev('run_started', {
        gameId: 'swsh',
        version: 'sword',
        ruleset: buildRuleset('standard', 'swsh'),
      }),
    ];
    const state = deriveState(events, ctx);
    const pool = filterEncounterPool(state, dustyBowl, ctx);
    expect(pool.map((s) => s.species)).toContain('electrike');
  });

  it('tags Max Raid Den encounters with methods: ["max-raid"] in Wild Area zones', () => {
    const bridgeField = dataset.areas.find((a) => a.id === 'bridge-field')!;
    const raidSlots = bridgeField.encounters.filter((e) => e.methods.includes('max-raid'));
    expect(raidSlots.length).toBeGreaterThan(0);
    expect(raidSlots.map((s) => s.species)).toContain('golett');

    const lakeOfOutrage = dataset.areas.find((a) => a.id === 'lake-of-outrage')!;
    const outrageRaidSlots = lakeOfOutrage.encounters.filter((e) => e.methods.includes('max-raid'));
    expect(outrageRaidSlots.map((s) => s.species)).toContain('dreepy');
  });

  it('gives every roster Pokémon a moveset and an ability (SwSh has abilities)', () => {
    for (const m of dataset.milestones) {
      expect(m.roster, `milestone "${m.id}" should have a roster`).toBeTruthy();
      const maxLevel = Math.max(...m.roster!.map((p) => p.level));
      expect(maxLevel, `milestone "${m.id}" ace mismatch`).toBe(m.aceLevel);
      for (const p of m.roster!) {
        expect(p.moves?.length, `${m.id}/${p.species} should have moves`).toBeGreaterThan(0);
        expect(p.ability, `${m.id}/${p.species} should have an ability`).toBeTruthy();
      }
    }
  });

  it('gates areas behind gym milestones via unlockAfter', () => {
    const route3 = dataset.areas.find((a) => a.id === 'route-3')!;
    expect(route3.unlockAfter).toBe('gym-1-milo');
    const milestoneIds = new Set(dataset.milestones.map((m) => m.id));
    for (const area of dataset.areas) {
      if (area.unlockAfter) expect(milestoneIds.has(area.unlockAfter)).toBe(true);
    }
  });

  it('gates all DLC bosses and specials behind the dlc-content rule (backlog 23)', () => {
    const base = buildRuleset('standard', 'swsh'); // dlc-content off by default
    const withDlc = buildRuleset('standard', 'swsh');
    withDlc.rules['dlc-content'] = { enabled: true, params: {} };

    // every dlc-prefixed milestone is conditions.dlc-gated; base runs never see them
    const dlcMilestones = dataset.milestones.filter((m) => m.id.startsWith('dlc-'));
    expect(dlcMilestones).toHaveLength(9);
    for (const m of dlcMilestones) expect(m.conditions?.dlc, `${m.id} missing conditions.dlc`).toBe(true);
    const baseIds = milestonesFor(dataset, 'sword', base).map((m) => m.id);
    expect(baseIds.some((id) => id.startsWith('dlc-'))).toBe(false);
    expect(baseIds).toHaveLength(12); // the original base-game ladder, untouched

    // Klara is Sword's dojo rival, Avery Shield's — never both in one run
    const swordIds = milestonesFor(dataset, 'sword', withDlc).map((m) => m.id);
    const shieldIds = milestonesFor(dataset, 'shield', withDlc).map((m) => m.id);
    expect(swordIds).toContain('dlc-klara-3');
    expect(swordIds).not.toContain('dlc-avery-3');
    expect(shieldIds).toContain('dlc-avery-3');
    expect(shieldIds).not.toContain('dlc-klara-3');
    expect(swordIds).toContain('dlc-mustard-final');
    expect(shieldIds).toContain('dlc-mustard-final');

    // specials: all dlc-gated, incl. Zapdos anchored in the base-game Wild Area
    const dlcSpecials = dataset.specials.filter((s) => s.id.startsWith('dlc-'));
    expect(dlcSpecials.length).toBeGreaterThanOrEqual(30);
    for (const s of dlcSpecials) {
      expect(s.conditions?.dlc, `${s.id} missing conditions.dlc`).toBe(true);
      expect(specialAppliesToVersion(s, 'sword', base)).toBe(false);
      expect(specialAppliesToVersion(s, 'sword', withDlc)).toBe(true);
    }
    const zapdos = dataset.specials.find((s) => s.id === 'dlc-static-zapdos-galar')!;
    expect(dataset.areas.find((a) => a.id === zapdos.area)!.tags.some((t) => t.startsWith('dlc:'))).toBe(false);

    // area filtering: 43 base areas (Giant's Mirror + the added Wild Area
    // sub-zones) vs 73 with DLC
    expect(areasFor(dataset, base)).toHaveLength(43);
    expect(areasFor(dataset, withDlc)).toHaveLength(73);
  });

  it('flags an area as version-dead only when every documented slot is locked to the other version', () => {
    // Tested on synthetic areas so it does not depend on dataset content, which
    // changes as encounter tables get fleshed out. `isVersionDeadArea` only
    // reads `area.encounters`, so a partial cast is sufficient.
    const area = (encounters: unknown[]) => ({ id: 'fixture', name: 'Fixture', encounters }) as unknown as Area;

    // every slot Shield-locked → dead for Sword, live for Shield
    const shieldOnly = area([{ species: 'corsola-galar', method: 'walk', conditions: { version: ['shield'] } }]);
    expect(isVersionDeadArea(shieldOnly, 'sword')).toBe(true);
    expect(isVersionDeadArea(shieldOnly, 'shield')).toBe(false);

    // at least one slot valid for this version → NOT dead
    const mixed = area([
      { species: 'woobat', method: 'walk' },
      { species: 'corsola-galar', method: 'walk', conditions: { version: ['shield'] } },
    ]);
    expect(isVersionDeadArea(mixed, 'sword')).toBe(false);

    // no documented encounters at all → NOT dead (towns/item stops stay visible)
    expect(isVersionDeadArea(area([]), 'sword')).toBe(false);
  });

  it("keeps Giant's Mirror visible in both versions now that its table spans both", () => {
    // Its encounter table was fleshed out (#185) with cross-version spawns, so
    // it is no longer a Sword dead end — both versions can resolve it.
    const giantsMirror = dataset.areas.find((a) => a.id === 'giants-mirror')!;
    expect(isVersionDeadArea(giantsMirror, 'sword')).toBe(false);
    expect(isVersionDeadArea(giantsMirror, 'shield')).toBe(false);

    const base = buildRuleset('standard', 'swsh');
    expect(areasForVersion(dataset, 'sword', base).map((a) => a.id)).toContain('giants-mirror');
    expect(areasForVersion(dataset, 'shield', base).map((a) => a.id)).toContain('giants-mirror');
  });

  it('does not hide towns/item-only stops or version-shared wild areas', () => {
    const base = buildRuleset('standard', 'swsh');
    const swordIds = areasForVersion(dataset, 'sword', base).map((a) => a.id);

    // a starting town has no documented wild encounters — it must stay (items,
    // trainers, the starter special all live on it), it is NOT a dead end
    const postwick = dataset.areas.find((a) => a.id === 'postwick')!;
    expect(postwick.encounters).toHaveLength(0);
    expect(isVersionDeadArea(postwick, 'sword')).toBe(false);
    expect(swordIds).toContain('postwick');

    // giants-cap has version-agnostic wild encounters — visible in both versions
    const giantsCap = dataset.areas.find((a) => a.id === 'giants-cap')!;
    expect(isVersionDeadArea(giantsCap, 'sword')).toBe(false);
    expect(isVersionDeadArea(giantsCap, 'shield')).toBe(false);
    expect(swordIds).toContain('giants-cap');
  });
});
