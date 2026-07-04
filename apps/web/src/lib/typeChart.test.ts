import { describe, expect, it } from 'vitest';
import { effectiveness, weaknesses } from './typeChart';

describe('typeChart', () => {
  it('multiplies dual-type effectiveness (rock vs fire/flying = ×4)', () => {
    expect(effectiveness('rock', ['fire', 'flying'])).toBe(4);
    expect(effectiveness('electric', ['water', 'flying'])).toBe(4);
  });

  it('immunities zero the multiplier regardless of the other type', () => {
    expect(effectiveness('ground', ['electric', 'flying'])).toBe(0);
    expect(effectiveness('normal', ['ghost'])).toBe(0);
  });

  it('unknown/absent matchups are neutral ×1', () => {
    expect(effectiveness('fire', ['normal'])).toBe(1);
    expect(effectiveness('not-a-type', ['fire'])).toBe(1);
  });

  it('weaknesses returns only >1 multipliers, strongest first', () => {
    const weak = weaknesses(['grass', 'poison']); // e.g. bulbasaur
    const types = weak.map((w) => w.type);
    expect(types).toContain('fire');
    expect(types).toContain('psychic');
    expect(types).not.toContain('water'); // resisted
    // sorted: any ×4 entries come before ×2
    const xs = weak.map((w) => w.x);
    expect([...xs].sort((a, b) => b - a)).toEqual(xs);
    expect(weaknesses([])).toEqual([]);
  });
});
