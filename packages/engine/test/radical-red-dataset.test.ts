import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { GameDataset } from '../src/index.js';

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
    // rosters are a follow-up (boss curation) — flag must stay false so the
    // validator doesn't demand rosters we haven't shipped.
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
});
