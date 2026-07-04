import { describe, expect, it } from 'vitest';
import type { EngineContext, RunEvent } from '@nuzlocke/engine';
import { describeEvent } from './describeEvent';

// Minimal stub ctx — describeEvent only reads areas/specials/milestones names.
const ctx = {
  dataset: {
    areas: [{ id: 'route-1', name: 'Route 1' }],
    specials: [{ id: 'starter-pikachu', type: 'gift' }],
    milestones: [{ id: 'gym-1', name: 'Brock (Pewter Gym)' }],
  },
  speciesToLine: {},
} as unknown as EngineContext;

const ev = (type: string, payload: unknown, seq = 1): RunEvent =>
  ({ seq, at: '2026-01-01T00:00:00Z', type, payload } as RunEvent);

describe('describeEvent', () => {
  it('describes catches with nickname + area, and skips non-catch outcomes', () => {
    const caught = describeEvent(
      ev('encounter_resolved', { areaId: 'route-1', species: 'pidgey', outcome: 'caught', nickname: 'Bird' }),
      ctx,
    );
    expect(caught?.text).toBe('Caught Bird the pidgey on Route 1');
    expect(caught?.species).toBe('pidgey');
    expect(caught?.tone).toBe('catch');

    expect(describeEvent(ev('encounter_resolved', { areaId: 'route-1', species: 'pidgey', outcome: 'failed' }), ctx)).toBeNull();
  });

  it('labels starter claims distinctly from other specials', () => {
    const starter = describeEvent(
      ev('special_claimed', { specialId: 'starter-pikachu', species: 'pikachu', nickname: 'pikachu' }),
      ctx,
    );
    expect(starter?.text).toBe('Chose pikachu as starter');
  });

  it('names the milestone on clears and resolves wipe/run-end tones', () => {
    expect(describeEvent(ev('milestone_cleared', { milestoneId: 'gym-1' }), ctx)?.text).toBe('Cleared: Brock (Pewter Gym)');
    expect(describeEvent(ev('wipe_decision', { decision: 'continue' }), ctx)?.tone).toBe('wipe');
    expect(describeEvent(ev('run_ended', { result: 'victory' }), ctx)?.text).toBe('Victory!');
    expect(describeEvent(ev('run_ended', { result: 'abandoned' }), ctx)?.tone).toBe('neutral');
  });

  it('returns null for bookkeeping events', () => {
    expect(describeEvent(ev('moved', { pokemonId: 'x', to: 'box' }), ctx)).toBeNull();
    expect(describeEvent(ev('pokemon_updated', { pokemonId: 'x' }), ctx)).toBeNull();
  });
});
