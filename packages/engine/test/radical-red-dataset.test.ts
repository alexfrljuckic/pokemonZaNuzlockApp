import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildRuleset, deriveState, difficultyForPreset, milestoneRoster, nextBoss } from '../src/index.js';
import type { GameDataset, Milestone, RunEvent } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(
  readFileSync(join(here, '../../datasets/games/radical-red.json'), 'utf8'),
) as GameDataset;

describe('Radical Red dataset', () => {
  it('has the expected shape (single version, NO PokeAPI version group, rosters not required yet)', () => {
    expect(dataset.gameId).toBe('radical-red');
    expect(dataset.versions).toEqual(['radical-red']);
    // Radical Red is a ROM hack with no PokeAPI version group — move learn-levels
    // degrade to "unknown", which the app handles.
    expect((dataset as { pokeapiVersionGroups: string[] }).pokeapiVersionGroups).toEqual([]);
    // Gym/E4/Champion ship both tiers; the non-gym story bosses (rivals + Rocket)
    // now ship too, but several are Normal-only (Hardcore levels aren't cleanly
    // sourceable from the base-RR gists), so the flag stays false — the validator
    // must not demand a hardcore variant on every milestone.
    expect((dataset as { rostersRequired?: boolean }).rostersRequired).toBe(false);
  });

  it('has wild encounters across many areas with valid method tags', () => {
    expect(dataset.areas.length).toBeGreaterThan(40);
    const methods = new Set(dataset.areas.flatMap((a) => a.encounters.flatMap((e) => e.methods)));
    for (const m of methods) expect(['grass', 'surf', 'fish']).toContain(m);
    // Route 1 is the opener and must have wild mons.
    const route1 = dataset.areas.find((a) => a.id === 'route-1');
    expect(route1?.encounters.length ?? 0).toBeGreaterThan(0);
  });

  it('models the 8 gyms in cap order with strictly ascending level caps', () => {
    const gyms = dataset.milestones.filter((m) => m.type === 'gym').sort((a, b) => a.order - b.order);
    expect(gyms.length).toBe(8);
    const caps = gyms.map((g) => g.aceLevel as number);
    expect(caps).toEqual([14, 27, 34, 44, 59, 68, 76, 81]);
    for (let i = 1; i < caps.length; i++) expect(caps[i]).toBeGreaterThan(caps[i - 1]);
  });

  it('every milestone order is unique', () => {
    const orders = dataset.milestones.map((m) => m.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('adds the post-Clair Elite Four + Champion as milestones (ace 85)', () => {
    const late = ['e4-lorelei', 'e4-bruno', 'e4-agatha', 'e4-lance', 'champion-terry'];
    for (const id of late) {
      const m = dataset.milestones.find((x) => x.id === id);
      expect(m, `milestone ${id} missing`).toBeTruthy();
      expect(m!.aceLevel).toBe(85);
    }
    // 8 gyms + 4 E4 + champion + 9 non-gym story bosses (rivals + Rocket) = 22.
    expect(dataset.milestones.length).toBe(22);
    expect(dataset.milestones.find((m) => m.id === 'champion-terry')!.type).toBe('champion');
  });

  it('adds the 9 non-gym story bosses (rivals + Rocket), all non-cap-gating', () => {
    const nonGym = [
      'rival-terry-route22', 'rival-terry-cerulean', 'rival-terry-silph',
      'rival-brendan-ss-anne', 'rival-brendan-route-23',
      'rocket-giovanni-hideout', 'rocket-giovanni-silph',
      'rocket-admins-silph', 'rocket-admins-cerulean-cave',
    ];
    for (const id of nonGym) {
      const m = dataset.milestones.find((x) => x.id === id);
      expect(m, `milestone ${id} missing`).toBeTruthy();
      // Non-gym bosses never gate the level cap (like BDSP/SV rivals).
      expect(m!.countsForLevelCap, `${id} must be countsForLevelCap:false`).toBe(false);
      expect(['rival', 'rocket']).toContain(m!.type);
    }
    expect(dataset.milestones.filter((m) => m.type === 'rival')).toHaveLength(3 + 2);
    expect(dataset.milestones.filter((m) => m.type === 'rocket')).toHaveLength(2 + 2);
  });

  it('every gym/E4/champion carries a rosterByDifficulty with a normal + hardcore variant', () => {
    const gating = dataset.milestones.filter((m) => m.countsForLevelCap !== false);
    for (const m of gating) {
      const rbd = (m as Milestone).rosterByDifficulty;
      expect(rbd, `milestone ${m.id} missing rosterByDifficulty`).toBeTruthy();
      expect(rbd!.normal?.length ?? 0).toBeGreaterThan(0);
      expect(rbd!.hardcore?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('every milestone Normal variant caps at aceLevel; present Hardcore stays in aceLevel..aceLevel+3', () => {
    // Walk BOTH rosterByDifficulty and rosterByDifficultyAndStarter (rivals);
    // every normal variant must hit aceLevel; hardcore (where present) stays in
    // [aceLevel, aceLevel+3]. Non-gym bosses may ship Normal-only (Hardcore
    // levels unsourceable from the base-RR gists — the relative-level blocks).
    for (const m of dataset.milestones) {
      const ace = m.aceLevel as number;
      const normalVariants: number[][] = [];
      const hardVariants: number[][] = [];
      const rbd = (m as Milestone).rosterByDifficulty;
      if (rbd?.normal) normalVariants.push(rbd.normal.map((p) => p.level));
      if (rbd?.hardcore) hardVariants.push(rbd.hardcore.map((p) => p.level));
      const rbds = (m as Milestone).rosterByDifficultyAndStarter;
      for (const v of Object.values(rbds?.normal ?? {})) normalVariants.push(v.map((p) => p.level));
      for (const v of Object.values(rbds?.hardcore ?? {})) hardVariants.push(v.map((p) => p.level));

      for (const levels of normalVariants)
        expect(Math.max(...levels), `${m.id} normal ace`).toBe(ace);
      for (const levels of hardVariants) {
        const hMax = Math.max(...levels);
        expect(hMax, `${m.id} hardcore >= aceLevel`).toBeGreaterThanOrEqual(ace);
        expect(hMax, `${m.id} hardcore <= aceLevel+3`).toBeLessThanOrEqual(ace + 3);
      }
    }
  });

  it('the new non-gym bosses never become the level-cap target (next boss stays a gym/E4)', () => {
    // Re-derive the run and confirm nextBoss picks a cap-gating milestone, never
    // a rival/Rocket boss — even the earliest one (Terry @ Route 22, order 5).
    const events: RunEvent[] = [
      {
        seq: 0,
        at: '2026-07-07T00:00:00.000Z',
        type: 'run_started',
        payload: {
          gameId: 'radical-red',
          version: 'radical-red',
          ruleset: buildRuleset('rr-normal', 'radical-red'),
        },
      },
    ];
    const ctx = { dataset, speciesToLine: {} };
    const state = deriveState(events, ctx);
    const boss = nextBoss(state, ctx);
    expect(boss?.id).toBe('gym-1-brock'); // the first GATING milestone, not Terry@Route22
    expect(boss?.countsForLevelCap).not.toBe(false);
  });
});

describe('milestoneRoster difficulty selection', () => {
  it('maps RR presetIds to difficulty keys, everything else to null', () => {
    expect(difficultyForPreset('rr-normal')).toBe('normal');
    expect(difficultyForPreset('rr-hardcore')).toBe('hardcore');
    expect(difficultyForPreset('standard')).toBeNull();
    expect(difficultyForPreset('hardcore')).toBeNull(); // generic tier, not RR's
    expect(difficultyForPreset(undefined)).toBeNull();
  });

  it('picks the Normal roster for rr-normal and the Hardcore roster for rr-hardcore', () => {
    const surge = dataset.milestones.find((m) => m.id === 'gym-3-surge')!;
    const normal = milestoneRoster(surge, null, difficultyForPreset('rr-normal'))!;
    const hardcore = milestoneRoster(surge, null, difficultyForPreset('rr-hardcore'))!;
    // RR Normal Surge is the verified Manectite team (max level 34 = cap);
    // Hardcore Surge is a different, higher team (max level 36).
    expect(normal).toBe(surge.rosterByDifficulty!.normal);
    expect(hardcore).toBe(surge.rosterByDifficulty!.hardcore);
    expect(Math.max(...normal.map((p) => p.level))).toBe(34);
    expect(Math.max(...hardcore.map((p) => p.level))).toBe(36);
    expect(normal).not.toBe(hardcore);
  });

  it('leaves mainline milestones (no rosterByDifficulty) exactly on their prior behavior', () => {
    // A milestone with only a plain roster: any difficulty (or null) returns it.
    const plain: Milestone = {
      id: 'gym-x',
      name: 'X',
      type: 'gym',
      order: 1,
      aceLevel: 20,
      roster: [{ species: 'onix', level: 20 }],
    };
    expect(milestoneRoster(plain, null, 'hardcore')).toBe(plain.roster);
    expect(milestoneRoster(plain, null, 'normal')).toBe(plain.roster);
    expect(milestoneRoster(plain, null, null)).toBe(plain.roster);

    // rosterByStarter still wins when there's no matching difficulty variant,
    // and the new difficulty arg defaults to null (old two-arg call unchanged).
    const rival: Milestone = {
      id: 'rival',
      name: 'Rival',
      type: 'rival',
      order: 2,
      aceLevel: 30,
      roster: [{ species: 'raticate', level: 30 }],
      rosterByStarter: { bulbasaur: [{ species: 'charmeleon', level: 30 }] },
    };
    expect(milestoneRoster(rival, 'bulbasaur')).toBe(rival.rosterByStarter!.bulbasaur);
    expect(milestoneRoster(rival, 'bulbasaur', 'hardcore')).toBe(rival.rosterByStarter!.bulbasaur);
    expect(milestoneRoster(rival, null)).toBe(rival.roster);
  });

  it('rosterByDifficultyAndStarter wins when BOTH difficulty and starter match', () => {
    const cerulean = dataset.milestones.find((m) => m.id === 'rival-terry-cerulean')!;
    const rbds = (cerulean as Milestone).rosterByDifficultyAndStarter!;
    // The Cerulean rival brings the type-advantaged starter: player Bulbasaur ->
    // rival Charmeleon; player Charmander -> Wartortle; player Squirtle -> Ivysaur.
    const forBulba = milestoneRoster(cerulean, 'bulbasaur', 'normal')!;
    expect(forBulba).toBe(rbds.normal.bulbasaur);
    expect(forBulba.some((p) => p.species === 'charmeleon')).toBe(true);
    const forSquirtle = milestoneRoster(cerulean, 'squirtle', 'normal')!;
    expect(forSquirtle.some((p) => p.species === 'ivysaur')).toBe(true);
    // hardcore Cerulean is the same team in the gist — the hardcore axis resolves too.
    expect(milestoneRoster(cerulean, 'charmander', 'hardcore')!).toBe(rbds.hardcore.charmander);
    expect(milestoneRoster(cerulean, 'charmander', 'hardcore')!.some((p) => p.species === 'wartortle')).toBe(true);
  });

  it('falls back correctly when only ONE of difficulty/starter is set', () => {
    const cerulean = dataset.milestones.find((m) => m.id === 'rival-terry-cerulean')!;
    const rbd = (cerulean as Milestone).rosterByDifficulty!;
    // Starter unknown (the RR run flow, no starter special): fall to rosterByDifficulty.
    expect(milestoneRoster(cerulean, null, 'normal')).toBe(rbd.normal);
    expect(milestoneRoster(cerulean, null, 'hardcore')).toBe(rbd.hardcore);
    // Difficulty unknown but starter set: no rosterByStarter here, so fall to roster
    // (undefined for this milestone) — never a rosterByDifficultyAndStarter half-match.
    expect(milestoneRoster(cerulean, 'bulbasaur', null)).toBe((cerulean as Milestone).roster);
    // A milestone that ships Normal-only (Silph rival): hardcore falls back to its
    // rosterByDifficulty.normal being absent -> roster (undefined), never crashes.
    const silph = dataset.milestones.find((m) => m.id === 'rival-terry-silph')!;
    expect(milestoneRoster(silph, 'bulbasaur', 'normal')).toBe(
      (silph as Milestone).rosterByDifficultyAndStarter!.normal.bulbasaur,
    );
  });
});
