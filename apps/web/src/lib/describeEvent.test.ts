import { describe, expect, it } from 'vitest';
import type { EngineContext, RunEvent } from '@nuzlocke/engine';
import { describeEvent } from './describeEvent';

// Minimal stub ctx — describeEvent only reads areas/specials/milestones names.
const ctx = {
  dataset: {
    areas: [
      {
        id: 'route-1',
        name: 'Route 1',
        trainers: [{ name: 'Tristan', class: 'Youngster', team: [{ species: 'pidgey', level: 5 }] }],
      },
    ],
    specials: [{ id: 'starter-pikachu', type: 'gift' }],
    milestones: [{ id: 'gym-1', name: 'Brock (Pewter Gym)', trainerSprite: 'brock' }],
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

  it('describes house-rule edits with the new rule count', () => {
    const edited = describeEvent(ev('house_rules_changed', { before: [], after: ['a', 'b', 'c'] }), ctx);
    expect(edited?.text).toBe('House rules updated (3 rules)');
    expect(edited?.tone).toBe('neutral');
    expect(describeEvent(ev('house_rules_changed', { before: ['a'], after: ['a'] }), ctx)?.text).toBe(
      'House rules updated (1 rule)',
    );
  });

  it('returns null for bookkeeping events', () => {
    expect(describeEvent(ev('moved', { pokemonId: 'x', to: 'box' }), ctx)).toBeNull();
    expect(describeEvent(ev('pokemon_updated', { pokemonId: 'x' }), ctx)).toBeNull();
    expect(describeEvent(ev('trainer_reset', { areaId: 'route-1', trainerIndex: 0 }), ctx)).toBeNull();
  });

  it('names the faint victim (with sprite) when the pokemon map is provided', () => {
    const pokemon = {
      p1: { id: 'p1', species: 'pidgey', nickname: 'Bird', level: 10, status: 'dead', origin: {} },
    } as never;
    const named = describeEvent(ev('faint', { pokemonId: 'p1', killer: 'Geodude' }), ctx, pokemon);
    expect(named?.text).toBe('Bird the pidgey fainted to Geodude');
    expect(named?.species).toBe('pidgey');
    // without the map it degrades to the old generic wording
    expect(describeEvent(ev('faint', { pokemonId: 'p1' }), ctx)?.text).toBe('A Pokémon fainted');
  });

  it('describes trainer defeats with the class sprite key', () => {
    const item = describeEvent(ev('trainer_battled', { areaId: 'route-1', trainerIndex: 0 }), ctx);
    expect(item?.text).toBe('Defeated Youngster Tristan on Route 1');
    expect(item?.trainerKey).toBe('youngster');
    expect(item?.tone).toBe('milestone');
  });

  it('gives milestone clears the boss trainer sprite key', () => {
    expect(describeEvent(ev('milestone_cleared', { milestoneId: 'gym-1' }), ctx)?.trainerKey).toBe('brock');
  });

  it('describes next-boss picks and reverts (SV out-of-order affordance)', () => {
    const picked = describeEvent(ev('next_boss_set', { milestoneId: 'gym-1' }), ctx);
    expect(picked?.text).toBe('Next boss: Brock (Pewter Gym)');
    expect(picked?.trainerKey).toBe('brock');
    expect(describeEvent(ev('next_boss_set', { milestoneId: null }), ctx)?.text).toBe(
      'Next boss: back to suggested order',
    );
  });
});
