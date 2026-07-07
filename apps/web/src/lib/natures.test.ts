import { describe, expect, it } from 'vitest';
import { natureEffect } from './natures';

describe('natureEffect', () => {
  it('maps non-neutral natures to the right raised/lowered stat', () => {
    expect(natureEffect('adamant')).toEqual({ raised: 'attack', lowered: 'special-attack' });
    expect(natureEffect('modest')).toEqual({ raised: 'special-attack', lowered: 'attack' });
    expect(natureEffect('jolly')).toEqual({ raised: 'speed', lowered: 'special-attack' });
    expect(natureEffect('timid')).toEqual({ raised: 'speed', lowered: 'attack' });
    expect(natureEffect('bold')).toEqual({ raised: 'defense', lowered: 'attack' });
    expect(natureEffect('calm')).toEqual({ raised: 'special-defense', lowered: 'attack' });
  });

  it('is case-insensitive (natures are stored either way)', () => {
    expect(natureEffect('Modest')).toEqual({ raised: 'special-attack', lowered: 'attack' });
    expect(natureEffect('ADAMANT')).toEqual({ raised: 'attack', lowered: 'special-attack' });
  });

  it('returns no effect for the five neutral natures', () => {
    for (const n of ['hardy', 'docile', 'serious', 'bashful', 'quirky']) {
      expect(natureEffect(n)).toEqual({});
    }
  });

  it('returns no effect for undefined, null, empty, or unknown natures', () => {
    expect(natureEffect(undefined)).toEqual({});
    expect(natureEffect(null)).toEqual({});
    expect(natureEffect('')).toEqual({});
    expect(natureEffect('not-a-nature')).toEqual({});
  });

  it('never raises or lowers HP, and every non-neutral nature raises AND lowers', () => {
    const all = [
      'lonely', 'brave', 'adamant', 'naughty', 'bold', 'relaxed', 'impish', 'lax',
      'timid', 'hasty', 'jolly', 'naive', 'modest', 'mild', 'quiet', 'rash',
      'calm', 'gentle', 'sassy', 'careful',
    ];
    for (const n of all) {
      const e = natureEffect(n);
      expect(e.raised).toBeTruthy();
      expect(e.lowered).toBeTruthy();
      expect(e.raised).not.toBe(e.lowered);
      expect(e.raised).not.toBe('hp');
      expect(e.lowered).not.toBe('hp');
    }
  });
});
