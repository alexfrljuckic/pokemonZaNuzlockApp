import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { GameDataset } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const dataset = JSON.parse(
  readFileSync(join(here, '../../datasets/games/sv.json'), 'utf8'),
) as GameDataset;

// Milestones may carry a version condition (Area Zero finale, Quaking Earth
// Titan) — the engine type doesn't model it yet, so read it structurally.
type MilestoneRaw = GameDataset['milestones'][number] & {
  conditions?: { version?: string[] };
  roster?: Array<{ species: string; level: number; teraType?: string }>;
};

describe('SV dataset', () => {
  it('has the expected shape (both versions, DLC version groups, rosters required)', () => {
    expect(dataset.gameId).toBe('sv');
    expect(dataset.versions).toEqual(['scarlet', 'violet']);
    expect((dataset as { pokeapiVersionGroups: string[] }).pokeapiVersionGroups).toEqual([
      'scarlet-violet',
      'the-teal-mask',
      'the-indigo-disk',
    ]);
    expect((dataset as { rostersRequired?: boolean }).rostersRequired).toBe(true);
    const orders = dataset.milestones.map((m) => m.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('gives every milestone a roster with ace == max level', () => {
    for (const m of dataset.milestones) {
      expect(m.roster, `milestone "${m.id}" should have a roster`).toBeTruthy();
      const all = [...(m.roster ?? []), ...Object.values(m.rosterByStarter ?? {}).flat()];
      expect(Math.max(...all.map((p) => p.level)), `${m.id} ace mismatch`).toBe(m.aceLevel);
    }
  });

  it('version-splits the Area Zero finale and Quaking Earth Titan by run version', () => {
    const ms = dataset.milestones as MilestoneRaw[];
    const sada = ms.find((m) => m.id === 'finale-professor-sada')!;
    const turo = ms.find((m) => m.id === 'finale-professor-turo')!;
    expect(sada.conditions?.version).toEqual(['scarlet']);
    expect(turo.conditions?.version).toEqual(['violet']);
    // the mascot legendary is the finale ace on each side
    expect(sada.roster!.some((p) => p.species === 'koraidon')).toBe(true);
    expect(turo.roster!.some((p) => p.species === 'miraidon')).toBe(true);
    expect(ms.find((m) => m.id === 'quaking-earth-titan-scarlet')!.conditions?.version).toEqual(['scarlet']);
    expect(ms.find((m) => m.id === 'quaking-earth-titan-violet')!.conditions?.version).toEqual(['violet']);
  });

  it('records tera types on gym/E4/champion aces (SV Terastallization)', () => {
    const ms = dataset.milestones as MilestoneRaw[];
    const ace = (id: string) => {
      const r = ms.find((m) => m.id === id)!.roster!;
      return r.reduce((a, b) => (b.level > a.level ? b : a));
    };
    expect(ace('gym-8-grusha').teraType).toBe('ice');
    expect(ace('champion-geeta').teraType).toBe('rock');
    expect(ace('e4-poppy').teraType).toBe('steel');
  });

  it('models Nemona as starter-conditional (ace = final evo of the player-weak starter)', () => {
    const nemona = dataset.milestones.find((m) => m.id === 'nemona-final')!;
    expect(Object.keys(nemona.rosterByStarter!).sort()).toEqual(['fuecoco', 'quaxly', 'sprigatito']);
    const aceFor = (starter: string) => {
      const r = nemona.rosterByStarter![starter];
      return r.reduce((a, b) => (b.level > a.level ? b : a)).species;
    };
    expect(aceFor('sprigatito')).toBe('quaquaval'); // grass starter → water ace
    expect(aceFor('fuecoco')).toBe('meowscarada'); // fire starter → grass ace
    expect(aceFor('quaxly')).toBe('skeledirge'); // water starter → fire ace
  });
});
