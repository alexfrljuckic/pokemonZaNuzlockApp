import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { difficultyForPreset, milestoneRoster } from '../src/index.js';
import type { GameDataset, Milestone } from '../src/index.js';

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
    // Gym/E4/Champion rosters now ship (rosterByDifficulty Normal + Hardcore),
    // but rivals / Rocket admins are not yet curated, so the flag stays false —
    // the validator must not demand rosters on milestones we haven't added yet.
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

  it('adds the post-Clair Elite Four + Champion as milestones (13 total, ace 85)', () => {
    const late = ['e4-lorelei', 'e4-bruno', 'e4-agatha', 'e4-lance', 'champion-terry'];
    for (const id of late) {
      const m = dataset.milestones.find((x) => x.id === id);
      expect(m, `milestone ${id} missing`).toBeTruthy();
      expect(m!.aceLevel).toBe(85);
    }
    expect(dataset.milestones.length).toBe(13);
    expect(dataset.milestones.find((m) => m.id === 'champion-terry')!.type).toBe('champion');
  });

  it('every milestone carries a rosterByDifficulty with a normal + hardcore variant', () => {
    for (const m of dataset.milestones) {
      const rbd = (m as Milestone).rosterByDifficulty;
      expect(rbd, `milestone ${m.id} missing rosterByDifficulty`).toBeTruthy();
      expect(rbd!.normal?.length ?? 0).toBeGreaterThan(0);
      expect(rbd!.hardcore?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('Normal variant caps at aceLevel; Hardcore stays in aceLevel..aceLevel+3', () => {
    for (const m of dataset.milestones) {
      const rbd = (m as Milestone).rosterByDifficulty!;
      const nMax = Math.max(...rbd.normal.map((p) => p.level));
      const hMax = Math.max(...rbd.hardcore.map((p) => p.level));
      expect(nMax, `${m.id} normal ace`).toBe(m.aceLevel);
      expect(hMax, `${m.id} hardcore >= aceLevel`).toBeGreaterThanOrEqual(m.aceLevel!);
      expect(hMax, `${m.id} hardcore <= aceLevel+3`).toBeLessThanOrEqual((m.aceLevel as number) + 3);
    }
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
});
