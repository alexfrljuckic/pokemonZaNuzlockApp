import { describe, expect, it } from 'vitest';
import type { EngineContext, RunEvent } from '@nuzlocke/engine';
import { buildTimeline } from './RunTimeline';

const ctx = {
  dataset: {
    areas: [{ id: 'route-1', name: 'Route 1' }],
    specials: [],
    milestones: [{ id: 'gym-1', name: 'Brock' }],
  },
  speciesToLine: {},
} as unknown as EngineContext;

let seq = 0;
const ev = (type: string, payload: unknown): RunEvent =>
  ({ seq: ++seq, at: `2026-01-01T00:0${seq}:00Z`, type, payload } as RunEvent);

describe('buildTimeline', () => {
  it('orders newest first and drops bookkeeping events', () => {
    const events = [
      ev('encounter_resolved', { areaId: 'route-1', species: 'pidgey', outcome: 'caught', nickname: 'pidgey' }),
      ev('moved', { pokemonId: 'x', to: 'box' }), // bookkeeping — dropped
      ev('milestone_cleared', { milestoneId: 'gym-1' }),
    ];
    const tl = buildTimeline(events, ctx);
    expect(tl.map(({ item }) => item.tone)).toEqual(['milestone', 'catch']);
    expect(tl[0].item.text).toBe('Cleared: Brock');
  });

  it('exposes tones the filter chips group by', () => {
    const events = [
      ev('encounter_resolved', { areaId: 'route-1', species: 'pidgey', outcome: 'caught', nickname: 'pidgey' }),
      ev('faint', { pokemonId: 'x' }),
      ev('wipe_decision', { decision: 'continue' }),
      ev('next_boss_set', { milestoneId: 'gym-1' }),
    ];
    const tones = buildTimeline(events, ctx).map(({ item }) => item.tone);
    expect(tones).toContain('catch');
    expect(tones).toContain('faint');
    expect(tones).toContain('wipe');
    expect(tones).toContain('neutral');
  });
});
