import { describe, expect, it } from 'vitest';
import type { EngineContext } from '@nuzlocke/engine';
import { groupAvgLevel, groupLevelLabel, trainerGroups } from './TrainersTab';

// Minimal ctx: trainerGroups only reads ctx.dataset.areas[].trainers[].team[].level
// (and optional conditions.version).
const mkCtx = (areas: unknown[]) => ({ dataset: { areas } }) as unknown as EngineContext;
const trainer = (levels: number[], extra: Record<string, unknown> = {}) => ({
  name: 't',
  team: levels.map((level) => ({ species: 'bidoof', level })),
  ...extra,
});
const entry = (levels: number[]) => ({ t: trainer(levels), index: 0 }) as never;

describe('trainerGroups ordering', () => {
  it('orders areas by average team level, not dataset order, dropping empty areas', () => {
    const ctx = mkCtx([
      { id: 'late', name: 'Late', trainers: [trainer([40, 42])] }, // avg 41 — listed first in data
      { id: 'early', name: 'Early', trainers: [trainer([5, 7])] }, // avg 6
      { id: 'mid', name: 'Mid', trainers: [trainer([20])] }, // avg 20
      { id: 'none', name: 'None', trainers: [] },
    ]);
    expect(trainerGroups(ctx, 'x').map((g) => g.area.id)).toEqual(['early', 'mid', 'late']);
  });

  it('only counts version-applicable trainers when averaging', () => {
    const ctx = mkCtx([
      {
        id: 'a',
        name: 'A',
        trainers: [
          trainer([50], { conditions: { version: ['shield'] } }),
          trainer([10]),
        ],
      },
    ]);
    // In 'sword' the shield-only lv50 trainer is excluded → avg is 10.
    expect(groupAvgLevel(trainerGroups(ctx, 'sword')[0].trainers)).toBe(10);
  });
});

describe('groupLevelLabel', () => {
  it('formats a range, a single level, or empty', () => {
    expect(groupLevelLabel([entry([5, 9])])).toBe('Lv 5–9');
    expect(groupLevelLabel([entry([7])])).toBe('Lv 7');
    expect(groupLevelLabel([])).toBe('');
  });
});
